from __future__ import annotations

import asyncio
import base64
import binascii
from typing import Any

import httpx

from apps.api.config import Settings
from apps.api.schemas import GeneratedImage, GenerateRequest, GenerateResponse
from packages.palette import get_season


class ImageGenerationClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.replicate_base_url = "https://api.replicate.com/v1"

    @property
    def enabled(self) -> bool:
        return self._autocode_enabled or self._replicate_enabled

    @property
    def _autocode_enabled(self) -> bool:
        return bool(self.settings.autocode_api_key)

    @property
    def _replicate_enabled(self) -> bool:
        return bool(self.settings.replicate_api_token and self.settings.replicate_image_model)

    def _is_replicate_provider(self) -> bool:
        return self.settings.image_provider.strip().lower() == "replicate"

    def _replicate_fallback_enabled(self) -> bool:
        return bool(self.settings.replicate_fallback_enabled)

    def build_prompt(self, request: GenerateRequest) -> str:
        season = get_season(request.season_id)
        colors = ", ".join(season.get("bestColors", [])[:8])
        style = ", ".join(season.get("styleKeywords", [])[:4])
        return (
            f"{request.prompt}. Personal color season: {season['names']['en']} / {season['names']['zh-CN']}. "
            f"Use a refined palette of {colors}. Style keywords: {style}. "
            "Premium editorial portrait, realistic lighting, clean background, natural skin texture."
        )

    def _image_input(self, request: GenerateRequest) -> str | None:
        if request.image_data_url:
            return request.image_data_url
        if request.image_url:
            return str(request.image_url)
        return None

    def _is_autocode_provider(self) -> bool:
        return self.settings.image_provider.strip().lower() in {
            "autocode",
            "openai-compatible",
            "openai",
            "gpt-image-2",
        }

    def _build_prediction_payload(self, request: GenerateRequest, prompt: str) -> dict[str, Any]:
        image_input = self._image_input(request)
        payload: dict[str, Any] = {
            "input": {
                "prompt": prompt,
                "width": self.settings.replicate_image_width,
                "height": self.settings.replicate_image_height,
                "output_format": "png",
            }
        }
        if self.settings.replicate_supports_image_input and image_input:
            payload["input"]["image"] = image_input
        return payload

    async def generate(self, request: GenerateRequest) -> GenerateResponse:
        prompt = self.build_prompt(request)

        errors: list[str] = []
        if self._is_autocode_provider():
            if self._autocode_enabled:
                response = await self._try_autocode(request, prompt, errors)
                if response is not None:
                    return response
            else:
                errors.append("AUTOCODE_API_KEY is not configured.")

            if self._replicate_fallback_enabled():
                response = await self._try_replicate(request, prompt, errors)
                if response is not None:
                    return response

            return self._placeholder_response(prompt, " ".join(errors))

        if not self._is_replicate_provider():
            errors.append(f"Unknown image provider: {self.settings.image_provider}.")
            return self._placeholder_response(prompt, " ".join(errors))

        response = await self._try_replicate(request, prompt, errors)
        if response is not None:
            return response

        return self._placeholder_response(prompt, " ".join(errors))

    async def _try_autocode(self, request: GenerateRequest, prompt: str, errors: list[str]) -> GenerateResponse | None:
        try:
            response = await self._generate_autocode(request, prompt)
        except httpx.HTTPStatusError as exc:
            errors.append(self._format_http_error("Autocode GPT-image-2", exc))
            return None
        except (httpx.HTTPError, ValueError, binascii.Error) as exc:
            errors.append(f"Autocode GPT-image-2 generation failed: {exc}")
            return None

        if response.images:
            return response
        errors.append(response.message or "Autocode GPT-image-2 returned no images.")
        return None

    async def _generate_autocode(self, request: GenerateRequest, prompt: str) -> GenerateResponse:
        base_url = self.settings.autocode_base_url.rstrip("/")
        headers = {"Authorization": f"Bearer {self.settings.autocode_api_key}"}
        image_count = max(1, min(request.n, 4))

        async with httpx.AsyncClient(timeout=180) as client:
            image_file = await self._image_file(client, request)
            if image_file:
                file_name, image_bytes, mime_type = image_file
                response = await client.post(
                    f"{base_url}/v1/images/edits",
                    headers=headers,
                    data={
                        "model": self.settings.autocode_image_model,
                        "prompt": prompt,
                        "n": str(image_count),
                        "size": self.settings.autocode_image_size,
                    },
                    files={"image": (file_name, image_bytes, mime_type)},
                )
            else:
                response = await client.post(
                    f"{base_url}/v1/images/generations",
                    headers={**headers, "Content-Type": "application/json"},
                    json={
                        "model": self.settings.autocode_image_model,
                        "prompt": prompt,
                        "n": image_count,
                        "size": self.settings.autocode_image_size,
                    },
                )
            response.raise_for_status()
            payload = response.json()

        images = self._images_from_openai_payload(payload, prompt, "autocode")
        return GenerateResponse(
            images=images[: request.n],
            degraded=False,
            message="Generated with Autocode GPT-image-2.",
        )

    async def _image_file(self, client: httpx.AsyncClient, request: GenerateRequest) -> tuple[str, bytes, str] | None:
        if request.image_data_url:
            return self._decode_data_url(request.image_data_url)
        if request.image_url:
            response = await client.get(str(request.image_url))
            response.raise_for_status()
            mime_type = response.headers.get("content-type", "image/png").split(";", 1)[0]
            return "portrait.png", response.content, mime_type
        return None

    def _decode_data_url(self, data_url: str) -> tuple[str, bytes, str]:
        if not data_url.startswith("data:"):
            return "portrait.png", base64.b64decode(data_url), "image/png"
        header, encoded = data_url.split(",", 1)
        mime_type = header[5:].split(";", 1)[0] or "image/png"
        extension = mime_type.rsplit("/", 1)[-1].replace("jpeg", "jpg")
        return f"portrait.{extension}", base64.b64decode(encoded), mime_type

    def _images_from_openai_payload(self, payload: dict[str, Any], prompt: str, provider: str) -> list[GeneratedImage]:
        images: list[GeneratedImage] = []
        data = payload.get("data")
        if isinstance(data, list):
            for item in data:
                image_url = self._image_url_from_item(item)
                if image_url:
                    images.append(GeneratedImage(url=image_url, prompt=prompt, provider=provider))

        output = payload.get("output")
        if isinstance(output, list):
            for item in output:
                image_url = self._image_url_from_item(item)
                if image_url:
                    images.append(GeneratedImage(url=image_url, prompt=prompt, provider=provider))

        return images

    def _image_url_from_item(self, item: Any) -> str | None:
        if isinstance(item, dict):
            if isinstance(item.get("url"), str):
                return item["url"]
            if isinstance(item.get("b64_json"), str):
                return f"data:image/png;base64,{item['b64_json']}"
            if isinstance(item.get("base64"), str):
                return f"data:image/png;base64,{item['base64']}"
        if isinstance(item, str):
            if item.startswith(("http://", "https://", "data:")):
                return item
            return f"data:image/png;base64,{item}"
        return None

    async def _try_replicate(self, request: GenerateRequest, prompt: str, errors: list[str]) -> GenerateResponse | None:
        if not self._replicate_enabled:
            errors.append("Replicate fallback is enabled but REPLICATE_API_TOKEN or REPLICATE_IMAGE_MODEL is not configured.")
            return None

        try:
            response = await self._generate_replicate(request, prompt)
        except httpx.HTTPStatusError as exc:
            errors.append(self._format_http_error("Replicate", exc))
            return None
        except httpx.HTTPError as exc:
            errors.append(f"Replicate generation failed: {exc}")
            return None

        if response.images:
            if errors:
                response.degraded = True
                response.message = f"Primary provider failed; used Replicate fallback. {' '.join(errors)}"
            return response
        errors.append(response.message or "Replicate returned no images.")
        return None

    async def _generate_replicate(self, request: GenerateRequest, prompt: str) -> GenerateResponse:
        payload = self._build_prediction_payload(request, prompt)

        headers = {
            "Authorization": f"Bearer {self.settings.replicate_api_token}",
            "Content-Type": "application/json",
            "Prefer": "wait",
        }

        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{self.replicate_base_url}/models/{self.settings.replicate_image_model}/predictions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            prediction = response.json()

            if prediction.get("status") not in {"succeeded", "failed", "canceled"}:
                prediction = await self._poll_prediction(client, prediction, headers)

        if prediction.get("status") != "succeeded":
            return GenerateResponse(
                images=[],
                degraded=True,
                message=f"Replicate generation failed: {prediction.get('error') or prediction.get('status')}",
            )

        output = prediction.get("output")
        if isinstance(output, str):
            urls = [output]
        elif isinstance(output, list):
            urls = [str(item) for item in output]
        else:
            urls = []

        return GenerateResponse(
            images=[GeneratedImage(url=url, prompt=prompt, provider="replicate") for url in urls[: request.n]],
            message="Generated with Replicate.",
        )

    def _placeholder_response(self, prompt: str, message: str) -> GenerateResponse:
        return GenerateResponse(
            images=[
                GeneratedImage(
                    url=f"https://placehold.co/{self.settings.replicate_image_width}x{self.settings.replicate_image_height}/F3E5D0/3D2016.png?text=Image+API+Key+Required",
                    prompt=prompt,
                    provider="placeholder",
                )
            ],
            degraded=True,
            message=message or "No image generation API key is configured; returned a placeholder image.",
        )

    def _format_http_error(self, provider: str, exc: httpx.HTTPStatusError) -> str:
        detail = exc.response.text[:500]
        return f"{provider} returned HTTP {exc.response.status_code}: {detail}"

    async def _poll_prediction(self, client: httpx.AsyncClient, prediction: dict[str, Any], headers: dict[str, str]) -> dict[str, Any]:
        get_url = prediction.get("urls", {}).get("get")
        if not get_url:
            return prediction
        for _ in range(60):
            await asyncio.sleep(1)
            response = await client.get(get_url, headers=headers)
            response.raise_for_status()
            prediction = response.json()
            if prediction.get("status") in {"succeeded", "failed", "canceled"}:
                return prediction
        return prediction


ReplicateClient = ImageGenerationClient
