"""Backend entrypoint: minimal FastAPI app with /health and /ws.

Scope intentionally small per agreed backend baseline:
- Loads .env (python-dotenv) for OPENAI_API_KEY etc.
- Provides /health endpoint.
- Provides /ws WebSocket: on connect sends system.hello event.
- Maintains in-memory connection set + simple broadcast helper.
- Defines minimal event factory with unique id + timestamp + version.
- Stubs for future agent/audio pipelines (no implementation yet).
"""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Any, Dict, Optional, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

try:  # optional; if missing we continue with env already present
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:  # pragma: no cover - best effort
    pass


# -----------------------------------------------------------------------------
# Basic logging
# -----------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
)
log = logging.getLogger("backend")


# -----------------------------------------------------------------------------
# FastAPI app
# -----------------------------------------------------------------------------
app = FastAPI(title="cyberfriend-backend", version="0.1.0")

# CORS (desktop/electron, keep permissive now)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------------
# Event + broadcast infrastructure (minimal, in-memory)
# -----------------------------------------------------------------------------
class ConnectionManager:
    def __init__(self) -> None:
        self._connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._connections.add(ws)
        log.info("WebSocket connected. total=%d", len(self._connections))

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(ws)
        log.info("WebSocket disconnected. total=%d", len(self._connections))

    async def broadcast(self, event: Dict[str, Any]) -> None:
        data = event  # already dict -> will be JSON encoded by send_json
        dead: list[WebSocket] = []
        async with self._lock:
            for ws in self._connections:
                try:
                    await ws.send_json(data)
                except Exception:
                    dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)


manager = ConnectionManager()

# Centralized event factory
from .typedef import make_event  # noqa: E402


# -----------------------------------------------------------------------------
# Health endpoint
# -----------------------------------------------------------------------------
@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse(
        {
            "status": "ok",
            "appVersion": app.version,
            "protocolVersion": 1,
        }
    )


# -----------------------------------------------------------------------------
# WebSocket endpoint
# -----------------------------------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await manager.connect(ws)
    try:
        # Send system.hello event once connected
        hello = make_event(
            "system.hello",
            {
                "message": "welcome",
                "capabilities": {"protocolVersion": 1},
            },
        )
        await ws.send_json(hello)

        # Passive loop: we currently ignore incoming frames (design: one-way output)
        while True:
            try:
                _ = await ws.receive_text()
                # Intentionally ignoring any client input for now
            except WebSocketDisconnect:
                break
            except Exception:
                # Ignore malformed frames; continue listening
                continue
    finally:
        await manager.disconnect(ws)


# -----------------------------------------------------------------------------
# Placeholder stubs for future features (agent, audio pipeline)
# -----------------------------------------------------------------------------
async def agent_process_text(text: str) -> Dict[str, Any]:  # pragma: no cover - stub
    """Stub: convert input text to reply & maybe action intent (future)."""
    return {"reply": text}


async def audio_pipeline_tick():  # pragma: no cover - stub
    """Stub loop placeholder for audio capture/ASR/TTS; not started yet."""
    await asyncio.sleep(0.1)


# -----------------------------------------------------------------------------
# Entrypoint helper
# -----------------------------------------------------------------------------
def main() -> None:  # pragma: no cover - manual start
    # Allow: python backend/main.py for local dev
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("RELOAD", "1") == "1",
        log_level="info",
    )


if __name__ == "__main__":  # pragma: no cover
    main()
