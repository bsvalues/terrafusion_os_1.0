#!/usr/bin/env python3
"""
TerraFusion cOS Control Tool (tfctl) - repo-root copy
This is functionally the same as terrafusion-cos/tfctl.py but includes a small
import-path header so you can run it from anywhere.
"""
import os, sys, time, json, argparse, subprocess, threading, contextlib, importlib, inspect, asyncio, socket
from http.client import HTTPConnection
from pathlib import Path
from typing import List

# --- repo-root import-path header (ensures imports work regardless of cwd) ---
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
# if the repo keeps the code under a subdir 'terrafusion-cos', add that too
COS_DIR = ROOT / "terrafusion-cos"
if COS_DIR.exists() and str(COS_DIR) not in sys.path:
    sys.path.insert(0, str(COS_DIR))
# keep a string-compatible ROOT for existing code
ROOT = str(ROOT)

PY = sys.executable

"""
The remainder of the file is identical to the working tfctl copy (call_maybe_async,
ai_auto_fix, start_api, etc.). Keeping a single-file copy here keeps usage simple.
"""

# ---- Configuration (edit ports only if needed) -----------------------------------------
API_HOST = "127.0.0.1"
API_PORT = int(os.getenv("TF_API_PORT", "8090"))
WEB_URL  = f"http://localhost:{API_PORT}/"
HEALTH_PATHS = ["/health", "/api/health", "/status", "/api/status"]

def import_mod(names):
    for n in names:
        try:
            return importlib.import_module(n)
        except Exception:
            continue
    return None

mods = {
    "swarm": import_mod(["services.enhanced_ai_swarm_coordinator", "services.advanced_ai_swarm", "enhanced_ai_swarm_coordinator", "advanced_ai_swarm"]),
    "zerotrust": import_mod(["services.zero_trust", "zero_trust"]),
    "workflow": import_mod(["services.workflow_automation", "workflow_automation"]),
    "sync": import_mod(["services.enhanced_terrafusion_sync", "services.terrafusion_sync", "enhanced_terrafusion_sync", "terrafusion_sync"]),
    "flow": import_mod(["services.terra_flow", "terra_flow"]),
    "secmesh": import_mod(["services.security_mesh", "security_mesh"]),
    "gov_analytics": import_mod(["services.government_analytics", "government_analytics"]),
}

def sh(cmd, env=None, cwd=None, detach=False):
    if detach:
        return subprocess.Popen(cmd, cwd=cwd or ROOT, env=env or os.environ.copy(),
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    return subprocess.run(cmd, cwd=cwd or ROOT, env=env or os.environ.copy(), check=False)

def port_open(host, port, timeout=1.0):
    try:
        conn = HTTPConnection(host, port, timeout=timeout)
        conn.request("GET", "/")
        conn.getresponse()
        return True
    except Exception:
        return False

def wait_health(host, port, timeout=25):
    deadline = time.time() + timeout
    while time.time() < deadline:
        for p in HEALTH_PATHS:
            try:
                conn = HTTPConnection(host, port, timeout=1.5)
                conn.request("GET", p)
                r = conn.getresponse()
                if r.status == 200:
                    return True
            except Exception:
                pass
        time.sleep(0.3)
    return False

def open_browser(url, prefer=None):
    try:
        import webbrowser
        webbrowser.open(url)
    except Exception:
        print(f"[i] Please open: {url}")


def call_maybe_async(fn, *args, **kwargs):
    """Call a sync function or coroutine function safely, returning the result.

    - If fn is not callable, returns None.
    - If called from an existing running event loop, schedules the coroutine and
      returns the Task/Future.
    - Otherwise runs coroutine to completion using asyncio.run and returns result.
    """
    if not callable(fn):
        return None

    # If it's a coroutine function, produce a coroutine object and handle it.
    if inspect.iscoroutinefunction(fn) or inspect.isawaitable(fn):
        coro = fn(*args, **kwargs) if inspect.iscoroutinefunction(fn) else fn
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            # schedule on the running loop and return a Task
            return asyncio.ensure_future(coro)
        # No running loop – use asyncio.run to execute the coroutine
        return asyncio.run(coro)

    # fallback for synchronous callables
    return fn(*args, **kwargs)


# Boot profiling events
BOOT_EVENTS = []
def _mark(label: str):
    BOOT_EVENTS.append((time.time(), label))


def http_json(url: str, timeout=2.5):
    try:
        import urllib.request, json as _json
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return _json.loads(r.read().decode("utf-8", "ignore"))
    except Exception:
        return None


def _tail_file_lines(path: Path, max_lines: int, *, chunk_size: int = 8192) -> list:
    """Efficiently read the last `max_lines` of a text file without loading it all.

    UTF-8 best-effort decode. Graceful fallbacks for tiny/missing files.
    """
    try:
        with path.open("rb") as f:
            f.seek(0, 2)
            file_size = f.tell()
            if file_size <= 0:
                return []
            blocks: list[bytes] = []
            lines_found = 0
            pos = file_size
            while pos > 0 and lines_found <= max_lines:
                read_size = chunk_size if pos >= chunk_size else pos
                pos -= read_size
                f.seek(pos)
                data = f.read(read_size)
                blocks.append(data)
                lines_found += data.count(b"\n")
            buf = b"".join(reversed(blocks))
            text = buf.decode("utf-8", "ignore")
            return text.splitlines()[-max_lines:]
    except FileNotFoundError:
        return []
    except Exception:
        try:
            return path.read_text(encoding="utf-8", errors="ignore").splitlines()[-max_lines:]
        except Exception:
            return []


def _bundle_collect(*, max_lines: int = 2000, since: str | None = None, includes: List[str] | None = None) -> dict:
    """Collect bundle data into a dict for testing and zipping.

    Returns a dict with keys: diag (payload or None) and logs: {journalctl: str?, included: {name: str}}
    """
    bundle = {"diag": None, "logs": {"included": {}}, "meta": {"ts": time.time()}}
    # diag snapshot
    try:
        bundle["diag"] = cmd_diag()
    except Exception:
        bundle["diag"] = None

    # try to collect journalctl output (best-effort)
    try:
        from shutil import which
        if which('journalctl'):
            cmd = ['journalctl', '-n', str(max_lines), '-o', 'short']
            if since:
                cmd = ['journalctl', '--since', since, '-o', 'short']
            rc = subprocess.run(cmd, capture_output=True, text=True)
            lines = (rc.stdout or rc.stderr or '').splitlines()[-max_lines:]
            bundle['logs']['journalctl'] = '\n'.join(lines)
    except Exception:
        pass

    # included files
    for p in includes or []:
        try:
            pp = Path(p)
            bundle['logs']['included'][pp.name] = '\n'.join(_tail_file_lines(pp, max_lines))
        except Exception:
            bundle['logs']['included'][p] = ''

    return bundle


def load_dotenv_files():
    """Load .env and .env.{TF_ENV} if present and return dict (lower priority first).

    Precedence: .env -> .env.{TF_ENV} -> shell env
    """
    out = {}
    base = Path(ROOT)
    env_file = base / ".env"
    if env_file.exists():
        for ln in env_file.read_text().splitlines():
            ln = ln.strip()
            if not ln or ln.startswith("#") or "=" not in ln:
                continue
            k, v = ln.split("=", 1)
            out[k.strip()] = v.strip().strip('"').strip("'")
    tfenv = os.environ.get("TF_ENV")
    if tfenv:
        env2 = base / f".env.{tfenv}"
        if env2.exists():
            for ln in env2.read_text().splitlines():
                ln = ln.strip()
                if not ln or ln.startswith("#") or "=" not in ln:
                    continue
                k, v = ln.split("=", 1)
                out[k.strip()] = v.strip().strip('"').strip("'")
    # overlay shell env
    merged = dict(out)
    for k in ["TF_ENV", "TF_API_PORT", "TF_SWARM_BUS", "TF_MCP_URL"]:
        if os.environ.get(k) is not None:
            merged[k] = os.environ.get(k)
    return merged


def cmd_doctor():
    print("[doctor] checking python deps...")
    needed = ["fastapi", "uvicorn", "starlette", "requests"]
    missing = []
    for m in needed:
        try:
            __import__(m if m != "uvicorn" else "uvicorn")
        except Exception:
            missing.append(m)
    print(f"[doctor] missing: {missing or 'none'}")

    print(f"[doctor] probing {API_HOST}:{API_PORT} ...")
    print(f"[doctor] port open? {port_open(API_HOST, API_PORT)}")
    print(f"[doctor] health? {'ok' if wait_health(API_HOST, API_PORT, 2) else 'down'}")

    print("[doctor] modules detected:")
    for k, v in mods.items():
        print(f"  - {k}: {'yes' if v else 'no'}")

    print("[doctor] done.")
    return 0


def cmd_diag():
    base = WEB_URL.rstrip("/")
    payload = {
        "ts": time.time(),
        "api": {"status": "down"},
        "agents": None,
        "sync": None,
        "security": None,
        "workflows": None,
    }
    healthy = wait_health(API_HOST, API_PORT, timeout=2)
    payload["api"]["status"] = "up" if healthy else "down"
    payload["api"]["url"] = base
    payload["api"]["info"] = http_json(f"{base}/api/status") or http_json(f"{base}/status")
    payload["agents"] = http_json(f"{base}/agents/summary") or {"status": "disabled"}
    payload["sync"] = http_json(f"{base}/sync/status")
    payload["security"] = http_json(f"{base}/security/dashboard")
    payload["workflows"] = http_json(f"{base}/workflows/dashboard")
    return payload


def cmd_profile(outfile=""):
    if not BOOT_EVENTS:
        print("[profile] No events recorded yet. Run `tfctl launch` first in the same process.")
        return 1
    t0 = BOOT_EVENTS[0][0]
    timeline = [{"t": round(ts - t0, 3), "event": label} for ts, label in BOOT_EVENTS]
    data = {"ts": time.time(), "timeline": timeline}
    out = json.dumps(data, indent=2)
    if outfile:
        Path(outfile).write_text(out)
        print(f"[profile] wrote {outfile}")
    else:
        print(out)
    return 0


def cmd_bundle(outfile: str = "tfctl-diagnostic-bundle.zip", max_log_lines: int = 2000, since: str = None, includes: list | None = None, upload_s3: bool = False):
    """Create a zip bundle with diag.json, profile.json (if available), and recent logs.

    Uses _bundle_collect to gather content which makes unit testing easy.
    """
    import tempfile, zipfile

    td = tempfile.mkdtemp(prefix="tfctl-bundle-")
    files = []

    # Resolve includes: explicit CLI includes take precedence. Otherwise read TF_BUNDLE_INCLUDE env
    # (comma-separated) plus a .tfctl_bundle_include file in repo root (one per line).
    resolved_includes = []
    if includes:
        resolved_includes = includes
    else:
        env_inc = os.environ.get('TF_BUNDLE_INCLUDE')
        if env_inc:
            for p in env_inc.split(','):
                p = p.strip()
                if p:
                    resolved_includes.append(p)
        cfg = Path(ROOT) / '.tfctl_bundle_include'
        if cfg.exists():
            try:
                for ln in cfg.read_text().splitlines():
                    ln = ln.strip()
                    if ln and not ln.startswith('#'):
                        resolved_includes.append(ln)
            except Exception:
                pass

    # Deduplicate and keep only existing paths where possible
    final_includes = []
    seen = set()
    for p in resolved_includes:
        if p in seen:
            continue
        seen.add(p)
        final_includes.append(p)

    # Collect bundle data
    data = _bundle_collect(max_lines=max_log_lines, since=since, includes=final_includes)

    # diag
    try:
        diag_path = Path(td) / "diag.json"
        diag_path.write_text(json.dumps(data.get('diag') or {}, indent=2))
        files.append(str(diag_path))
    except Exception as e:
        print("[bundle] diag write failed:", e)

    # profile (old boot events preserved)
    try:
        if BOOT_EVENTS:
            t0 = BOOT_EVENTS[0][0]
            timeline = [{"t": round(ts - t0, 3), "event": label} for ts, label in BOOT_EVENTS]
            profile_path = Path(td) / "profile.json"
            profile_path.write_text(json.dumps({"ts": time.time(), "timeline": timeline}, indent=2))
            files.append(str(profile_path))
    except Exception as e:
        print("[bundle] profile failed:", e)

    # journalctl text
    try:
        jpath = Path(td) / "journalctl.txt"
        if data.get('logs', {}).get('journalctl') is not None:
            jpath.write_text(data['logs']['journalctl'])
            files.append(str(jpath))
    except Exception:
        pass

    # included files (write the truncated content into temp files)
    for name, contents in data.get('logs', {}).get('included', {}).items():
        try:
            p = Path(td) / name
            p.write_text(contents)
            files.append(str(p))
        except Exception:
            pass

    # collect small tails from subprocess pipes (non-blocking) - keep existing behavior
    try:
        import select
        for idx, p in enumerate(procs):
            try:
                if hasattr(p, 'stdout') and p.stdout:
                    fd = p.stdout.fileno()
                    collected = []
                    for _ in range(max_log_lines):
                        r, _, _ = select.select([fd], [], [], 0.05)
                        if not r:
                            break
                        line = p.stdout.readline()
                        if not line:
                            break
                        try:
                            if isinstance(line, bytes):
                                line = line.decode(errors='ignore')
                        except Exception:
                            pass
                        collected.append(line)
                    if collected:
                        lp = Path(td) / f"proc-{getattr(p, 'pid', idx)}.log"
                        lp.write_text(''.join(collected))
                        files.append(str(lp))
            except Exception:
                continue
    except Exception:
        pass

    # create zip
    try:
        with zipfile.ZipFile(outfile, 'w', compression=zipfile.ZIP_DEFLATED) as z:
            for f in files:
                z.write(f, arcname=Path(f).name)
        print(f"[bundle] wrote {outfile} (contains: {', '.join([Path(f).name for f in files])})")
    except Exception as e:
        print("[bundle] failed to write bundle:", e)
        return 2

    # optional upload to S3
    if upload_s3:
        try:
            import boto3
            s3_bucket = os.environ.get('TF_BUNDLE_S3_BUCKET')
            s3_prefix = os.environ.get('TF_BUNDLE_S3_PREFIX', '')
            if not s3_bucket:
                print('[bundle] TF_BUNDLE_S3_BUCKET not set; skipping upload')
                return 0
            s3 = boto3.client('s3')
            key = (s3_prefix.rstrip('/') + '/') if s3_prefix else ''
            key = f"{key}{Path(outfile).name}"
            s3.upload_file(outfile, s3_bucket, key)
            region = os.environ.get('AWS_REGION', 'us-east-1')
            s3_url = f"https://{s3_bucket}.s3.{region}.amazonaws.com/{key}"
            print(f"[bundle] uploaded to {s3_url}")
            return 0
        except Exception as e:
            print('[bundle] upload failed:', e)
            return 3

    return 0

def ai_auto_fix(reason: str):
    print(f"[fix] Attempting auto-fix for: {reason}")

    swarm = mods.get("swarm")
    if swarm:
        inst = getattr(swarm, 'ai_swarm_coordinator', None) or getattr(swarm, 'TerraFusionGovernmentAI', None)
        if inst:
            try:
                if callable(inst) and not isinstance(inst, object):
                    pass
            except Exception:
                pass
        if hasattr(swarm, 'get_swarm_status'):
            try:
                status = swarm.get_swarm_status() if callable(swarm.get_swarm_status) else None
                print("[fix] Swarm status:", getattr(status, '__repr__', lambda: status)())
            except Exception:
                pass

    sec = mods.get("secmesh")
    if sec:
        if hasattr(sec, 'start_security_mesh'):
            with contextlib.suppress(Exception):
                res = call_maybe_async(getattr(sec, 'start_security_mesh'))
                print("[fix] security_mesh.start_security_mesh ->", res)
        if hasattr(sec, 'reconcile_policies'):
            with contextlib.suppress(Exception):
                res = call_maybe_async(getattr(sec, 'reconcile_policies'))
                print("[fix] security_mesh.reconcile_policies ->", res)

    zt = mods.get("zerotrust")
    if zt and hasattr(zt, 'get_status'):
        with contextlib.suppress(Exception):
            res = call_maybe_async(getattr(zt, 'get_status'))
            print("[fix] zerotrust.get_status ->", res)

    sync = mods.get("sync")
    if sync:
        if hasattr(sync, 'heal_connectors'):
            with contextlib.suppress(Exception):
                res = call_maybe_async(getattr(sync, 'heal_connectors'))
                try:
                    printable = getattr(res, '__repr__', lambda: res)()
                except Exception:
                    printable = res
                print("[fix] sync.heal_connectors ->", printable)
        else:
            if hasattr(sync, '_initialize_harris_sources'):
                with contextlib.suppress(Exception): sync._initialize_harris_sources()

    flow = mods.get("flow")
    if flow:
        if hasattr(flow, 'rebuild_pipelines'):
            with contextlib.suppress(Exception):
                res = call_maybe_async(getattr(flow, 'rebuild_pipelines'))
                print("[fix] flow.rebuild_pipelines ->", res)
        elif hasattr(flow, 'start_workflow_service'):
            with contextlib.suppress(Exception):
                try:
                    t = threading.Thread(target=lambda: importlib.reload(flow) or None, daemon=True)
                    t.start()
                except Exception:
                    pass

    ga = mods.get("gov_analytics")
    if ga:
        if hasattr(ga, 'prime_caches'):
            with contextlib.suppress(Exception):
                res = call_maybe_async(getattr(ga, 'prime_caches'))
                print("[fix] gov_analytics.prime_caches -> (dashboard keys)", list(res.keys()) if isinstance(res, dict) else res)
        elif hasattr(ga, 'generate_executive_dashboard'):
            with contextlib.suppress(Exception):
                res = call_maybe_async(getattr(ga, 'generate_executive_dashboard'))
                print("[fix] gov_analytics.generate_executive_dashboard ->", res)

    print("[fix] Auto-fix attempts complete (best-effort).")

def ensure_deps():
    reqs = ["fastapi","uvicorn","requests","starlette"]
    missing = []
    for r in reqs:
        try: __import__(r if r!="uvicorn" else "uvicorn")
        except Exception: missing.append(r)
    if missing:
        print("[deps] Installing:", ", ".join(missing))
        sh([PY, "-m", "pip", "install", *missing])

procs = []

def start_api(fg: bool = False):
    # Socket-activation: if LISTEN_FDS=1 (fd=3), prefer running uvicorn on that FD.
    try:
        if int(os.environ.get("LISTEN_FDS", "0")) == 1 and os.environ.get("LISTEN_PID") == str(os.getpid()):
            print("[api] systemd socket detected (fd=3); launching uvicorn on inherited socket")
            p = sh([PY, "-m", "uvicorn", "api_server:app", "--fd", "3"], detach=True)
            procs.append(p)
            return p
    except Exception:
        pass
    try:
        api_mod = importlib.import_module('desktop.api_server')
        if hasattr(api_mod, 'TerraFusionAPI'):
            api = api_mod.TerraFusionAPI()
            t = threading.Thread(target=api.run, args=(API_HOST, API_PORT), daemon=not fg)
            t.start()
            return t
    except Exception:
        pass

    candidates = [
        [PY, "-m", "uvicorn", "desktop.api_server:app", "--host", API_HOST, "--port", str(API_PORT)],
        [PY, "-m", "uvicorn", "api_server:app", "--host", API_HOST, "--port", str(API_PORT)],
        [PY, os.path.join(ROOT, "desktop", "api_server.py")],
    ]
    for cmd in candidates:
        print("[api] launching:", " ".join(cmd))
        p = sh(cmd, detach=True)
        procs.append(p)
        time.sleep(0.5)
        if port_open(API_HOST, API_PORT):
            return p
    return None

def start_kernel():
    try:
        kmod = import_mod(['kernel.main','kernel_main','kernel'])
        if kmod and hasattr(kmod, 'TerraFusionKernel'):
            k = kmod.TerraFusionKernel()
            t = threading.Thread(target=k.start, daemon=True)
            t.start()
            return t
    except Exception:
        pass
    return None

def start_swarm():
    swarm = mods.get('swarm')
    if swarm:
        if hasattr(swarm, 'start_supervisor'):
            try:
                t = threading.Thread(target=swarm.start_supervisor, daemon=True)
                t.start()
                return t
            except Exception:
                pass
    return None

def start_shell(no_webview=False, prefer=None):
    ws = os.path.join(ROOT, "desktop", "web_shell.py")
    if os.path.exists(ws):
        cmd = [PY, ws]
        env = os.environ.copy()
        env['TF_API_PORT'] = str(API_PORT)
        p = sh(cmd, env=env, detach=True)
        procs.append(p)
        return p
    open_browser(WEB_URL, prefer=prefer)
    return None

def launch(open_ui=False, prefer=None, no_webview=False, fg: bool = False, profile_out: str = ""):
    _mark("launch:start")
    ensure_deps()
    _mark("deps:ok")
    print("== TerraFusion cOS :: LAUNCH ==")
    api_p = start_api(fg=fg)
    if not wait_health(API_HOST, API_PORT, timeout=25):
        print("[err] API health failed. Invoking auto-fix...")
        ai_auto_fix("api-health-failed")
        if not wait_health(API_HOST, API_PORT, timeout=20):
            print("[fatal] API still unhealthy.")
            return 2
    _mark("api:healthy")
    print(f"[ok] API healthy at {WEB_URL}")
    start_kernel(); _mark("kernel:started")
    start_swarm(); _mark("swarm:started")
    sync = mods.get('sync')
    if sync and hasattr(sync, 'TerraFusionSync'):
        try:
            inst = sync.TerraFusionSync()
            with contextlib.suppress(Exception): inst.get_sync_status()
        except Exception:
            pass
    if open_ui:
        start_shell(no_webview=no_webview, prefer=prefer)
        open_browser(WEB_URL, prefer=prefer)
        _mark("ui:opened")
    print("[ready] TerraFusion cOS is up. (Ctrl+C to stop here does not kill background processes)")
    if profile_out:
        if BOOT_EVENTS:
            t0 = BOOT_EVENTS[0][0]
            timeline = [{"t": round(ts - t0, 3), "event": label} for ts, label in BOOT_EVENTS]
            Path(profile_out).write_text(json.dumps({"ts": time.time(), "timeline": timeline}, indent=2))
            print(f"[profile] wrote {profile_out}")
        else:
            print("[profile] no boot events recorded")
    return 0

def cmd_status():
    ok = wait_health(API_HOST, API_PORT, timeout=1)
    payload = {
        "api": "up" if ok else "down",
        "url": WEB_URL,
        "ports": {"api": API_PORT},
        "modules": {k: bool(v) for k,v in mods.items()},
    }
    print(json.dumps(payload, indent=2))
    print(f"[status] api={payload['api']} url={payload['url']}")

def cmd_fix():
    ai_auto_fix("manual-invocation")
    print("[fix] Requested auto repairs.")

def cmd_logs():
    for p in procs:
        if hasattr(p, 'stdout') and p.stdout:
            try:
                for line in iter(p.stdout.readline, b""):
                    sys.stdout.write(line.decode(errors="ignore"))
            except Exception:
                pass
    print("[i] For persistent logs, run your process manager (pm2/honcho/tmux).")

def cmd_kill():
    killed = 0
    for p in procs:
        with contextlib.suppress(Exception):
            p.terminate(); killed += 1
    print(f"[kill] Terminated {killed} processes started by tfctl (this session).")

def main():
    ap = argparse.ArgumentParser(prog="tfctl", description="TerraFusion Control Tool")
    sub = ap.add_subparsers(dest="cmd", required=True)
    s_launch = sub.add_parser("launch", help="Launch full stack and open UI")
    s_launch.add_argument("--open", action="store_true", help="Open UI in browser")
    s_launch.add_argument("--prefer", choices=["chrome","firefox","edge","system"], default="system")
    s_launch.add_argument("--no-webview", action="store_true")
    s_launch.add_argument("--fg", action="store_true", help="Run API thread in foreground (attach logs)")
    s_launch.add_argument("--profile-out", default="", help="Write boot timeline JSON to file")
    sub.add_parser("env", help="Print resolved configuration (.env + TF_ENV + shell)")
    sub.add_parser("doctor", help="Quick diagnostics (deps, ports, health)")
    s_diag = sub.add_parser("diag", help="Merged health snapshot as JSON")
    s_diag.add_argument("--pretty", action="store_true", help="Pretty-print JSON")
    s_profile = sub.add_parser("profile", help="Profile boot timeline")
    s_profile.add_argument("--outfile", default="", help="Write JSON timeline to path")
    s_bundle = sub.add_parser("bundle", help="Create diagnostic bundle (zip)")
    s_bundle.add_argument("--outfile", default="tfctl-diagnostic-bundle.zip", help="Bundle output path")
    s_bundle.add_argument("--since", default=None, help="journalctl --since filter (e.g. '1 hour ago' or '2025-09-27')")
    s_bundle.add_argument("--include", action='append', help="Additional files to include (can be repeated)")
    s_bundle.add_argument("--upload-s3", action='store_true', help="Upload bundle to S3 using TF_BUNDLE_S3_BUCKET env var")
    s_bundle.add_argument("--max-lines", type=int, default=2000, help="Maximum number of lines to collect per process/stdout (default: 2000)")
    sub.add_parser("status", help="Show health and loaded modules")
    sub.add_parser("fix", help="Auto-repair")
    sub.add_parser("logs", help="Tail session logs (best-effort)")
    sub.add_parser("kill", help="Terminate processes started by this tfctl session")
    args = ap.parse_args()
    if args.cmd == "launch":
        return launch(open_ui=args.open,
                      prefer=None if args.prefer=="system" else args.prefer,
                      no_webview=args.no_webview,
                      fg=getattr(args, 'fg', False),
                      profile_out=getattr(args, 'profile_out', ""))
    elif args.cmd == "status":
        cmd_status()
    elif args.cmd == "fix":
        cmd_fix()
    elif args.cmd == "logs":
        cmd_logs()
    elif args.cmd == "kill":
        cmd_kill()
    elif args.cmd == "env":
        print(json.dumps(load_dotenv_files(), indent=2))
    elif args.cmd == "doctor":
        return cmd_doctor()
    elif args.cmd == "diag":
        payload = cmd_diag()
        print(json.dumps(payload, indent=2 if args.pretty else None))
    elif args.cmd == "profile":
        return cmd_profile(outfile=args.outfile)
    elif args.cmd == "bundle":
        return cmd_bundle(
            outfile=args.outfile,
            max_log_lines=getattr(args, 'max_lines', 500),
            since=getattr(args, 'since', None),
            includes=getattr(args, 'include', None),
            upload_s3=getattr(args, 'upload_s3', False),
        )
    return 0

if __name__ == "__main__":
    sys.exit(main())
