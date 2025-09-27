"""Hermetic integration test for tfctl.launch health-gating.

This spins a tiny FastAPI app with uvicorn in a background thread and verifies
that tfctl.wait_health sees it as healthy. The test avoids importing the
full TerraFusion stack so it remains hermetic.
"""
import time
import threading
import socket
from pathlib import Path
import requests
import pytest

from fastapi import FastAPI

import uvicorn

from tfctl import wait_health


def _find_free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    addr, port = s.getsockname()
    s.close()
    return port


@pytest.mark.parametrize("health_path", ["/status", "/api/status"]) 
def test_wait_health_with_hermetic_app(health_path):
    port = _find_free_port()
    app = FastAPI()

    @app.get(health_path)
    def status():
        return {"status": "ok"}

    config = uvicorn.Config(app, host="127.0.0.1", port=port, log_level="critical")
    server = uvicorn.Server(config)

    t = threading.Thread(target=server.run, daemon=True)
    t.start()

    # wait a bit for server to start
    deadline = time.time() + 5
    while time.time() < deadline:
        try:
            r = requests.get(f"http://127.0.0.1:{port}{health_path}", timeout=0.5)
            if r.status_code == 200:
                break
        except Exception:
            time.sleep(0.05)
    else:
        pytest.skip("uvicorn failed to start in CI environment")

    assert wait_health("127.0.0.1", port, timeout=3)

    # stop the server if possible
    try:
        server.should_exit = True
    except Exception:
        pass
