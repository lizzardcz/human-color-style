# Human Color Style

A web app for personal color and style reports.

## Features

- Upload portrait photos and run local skin / hair / lip / iris color analysis.
- Detect face regions with local MediaPipe FaceMesh.
- Match 12-season personal color types with deterministic color-coordinate logic.
- Generate dynamic user-specific palettes from extracted photo colors.
- Generate AI look images through the OpenAI-compatible Autocode API using `gpt-image-2`.
- Keep optional Replicate generation code as a disabled fallback for future cheaper models.
- Save reports, share report links, and export PNG / PDF cards.

## Project structure

- `apps/web` — Next.js app.
- `apps/api` — FastAPI API.
- `packages/palette` — shared 12-season palette data and loaders.
- `docs` — reference images.

## Environment

Copy `.env.example` to `.env` and fill the local-only secrets:

- `AUTOCODE_API_KEY` — Autocode API key.
- `AUTOCODE_BASE_URL=https://api.autocode.space`
- `AUTOCODE_IMAGE_MODEL=gpt-image-2`
- `AUTOCODE_IMAGE_SIZE=1728x2304`

Replicate fallback is disabled by default:

- `REPLICATE_FALLBACK_ENABLED=false`
- `REPLICATE_IMAGE_MODEL=`

## Backend setup

Use Python 3.12 for MediaPipe support.

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -U pip setuptools wheel
.\.venv\Scripts\python.exe -m pip install -r apps/api/requirements.txt
```

Run the API:

```powershell
.\.venv\Scripts\python.exe -m uvicorn apps.api.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend setup

```powershell
npm --prefix apps/web install
npm run dev:web
```

Open `http://localhost:3000/analyze`.

## Background dev startup

On Windows, the simplest way is to double-click:

- `start.cmd` — start backend and frontend in the background.
- `status.cmd` — check whether both services are running.
- `stop.cmd` — stop both services.

After startup, open `http://localhost:3000/analyze`.

The same commands can also be run from PowerShell:

```powershell
.\start.cmd
.\status.cmd
.\stop.cmd
```

If you do not want the CMD window to pause, pass `--no-pause`:

```powershell
.\start.cmd --no-pause
```

Start both the FastAPI backend and Next.js frontend in the background:

```powershell
npm run dev:bg
```

Check status:

```powershell
npm run status:bg
```

Stop both background processes:

```powershell
npm run stop:bg
```

Runtime PID files and logs are written under `.run/`, which is ignored by Git.

## Validation

```powershell
.\.venv\Scripts\python.exe -m compileall -q apps/api packages
.\.venv\Scripts\python.exe -m pip check
npm --prefix apps/web run build
```
