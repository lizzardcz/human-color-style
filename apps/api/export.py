from __future__ import annotations

import base64
from typing import Literal


async def render_url(url: str, width: int, height: int, output: Literal["png", "pdf"] = "png") -> str:
    """Render a public report URL to PNG/PDF using Playwright when installed.

    Returns a base64 string so callers can store it in R2/Vercel Blob or download
    it directly. The dependency is optional because local MVP export is handled in
    the browser by html-to-image.
    """

    try:
        from playwright.async_api import async_playwright  # type: ignore
    except Exception as exc:  # pragma: no cover - optional production dependency
        raise RuntimeError("Playwright is not installed. Run `python -m playwright install chromium`.") from exc

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        page = await browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=2)
        await page.goto(url, wait_until="networkidle")
        if output == "pdf":
            payload = await page.pdf(width=f"{width}px", height=f"{height}px", print_background=True)
        else:
            payload = await page.screenshot(full_page=True, type="png")
        await browser.close()

    return base64.b64encode(payload).decode("ascii")
