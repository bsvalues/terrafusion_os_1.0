#!/usr/bin/env python3
"""
TerraFusion cOS Control Tool (tfctl)
Tailored for this repository layout (desktop.api_server, services.*)

One command to launch, heal, and open the full stack.

Usage:
  python tfctl.py launch --open
  python tfctl.py status
  python tfctl.py fix
  python tfctl.py logs
  python tfctl.py kill
"""
import os, sys, time, json, argparse, subprocess, threading, contextlib, importlib, inspect, asyncio
from http.client import HTTPConnection

ROOT = os.path.abspath(os.path.dirname(__file__))
PY = sys.executable

# ---- Configuration (edit ports only if needed) -----------------------------------------
API_HOST = "127.0.0.1"
API_PORT = int(os.getenv("TF_API_PORT", "8090"))
WEB_URL  = f"http://localhost:{API_PORT}/"
HEALTH_PATHS = ["/health", "/api/health", "/status", "/api/status"]

# ---- Optional modules (auto-detected) --------------------------------------------------
def import_mod(names):
    """Try a list of possible import paths and return first successful module or None"""
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

# ---- Utilities -------------------------------------------------------------------------
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
    """Call a function that may be sync or async. Return the result or a Future when called from running loop.

    Safe for use from both sync and async contexts. Non-callable returns None.
    """
    if not callable(fn):
        return None
    if inspect.iscoroutinefunction(fn):
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop(); asyncio.set_event_loop(loop)
        # If loop is running, schedule and return the Task so caller can inspect it
        if loop.is_running():
            return asyncio.ensure_future(fn(*args, **kwargs))
        return loop.run_until_complete(fn(*args, **kwargs))
    return fn(*args, **kwargs)

# ---- Fixers (adapted to repo services) ------------------------------------------------
def ai_auto_fix(reason: str):
    print(f"[fix] Attempting auto-fix for: {reason}")

    # Swarm: try to query status or reinstantiate coordinator if global exists
    swarm = mods.get("swarm")
    if swarm:
        # Many swarm modules expose a global instance 'ai_swarm_coordinator'
        inst = getattr(swarm, 'ai_swarm_coordinator', None) or getattr(swarm, 'TerraFusionGovernmentAI', None)
        if inst:
            try:
                # If it's a class, instantiate a supervisor thread if available
                if callable(inst) and not isinstance(inst, object):
                    # nothing to do: skip instantiation heuristics
                    pass
            except Exception:
                pass

        # If module has a status method, call it to surface issues
        if hasattr(swarm, 'get_swarm_status'):
            try:
                status = swarm.get_swarm_status() if callable(swarm.get_swarm_status) else None
                print("[fix] Swarm status:", getattr(status, '__repr__', lambda: status)())
            except Exception:
                pass

    # Security mesh: try to (re)start or reconcile
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

    # Sync warmups
    sync = mods.get("sync")
    if sync:
        # call heal_connectors shim if present
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

    # Flow / workflow warmups
    flow = mods.get("flow")
    if flow:
        if hasattr(flow, 'rebuild_pipelines'):
            with contextlib.suppress(Exception):
                res = call_maybe_async(getattr(flow, 'rebuild_pipelines'))
                print("[fix] flow.rebuild_pipelines ->", res)
        elif hasattr(flow, 'start_workflow_service'):
            with contextlib.suppress(Exception):
                # may be async; try scheduling in thread
                try:
                    t = threading.Thread(target=lambda: importlib.reload(flow) or None, daemon=True)
                    t.start()
                except Exception:
                    pass

    # Gov analytics priming
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

# ---- Process Orchestration -------------------------------------------------------------
procs = []

def start_api(fg: bool = False):
    """
    Prefer `desktop.api_server.TerraFusionAPI` (this repo) or fall back to uvicorn
    """
    # Try desktop.api_server
    # Prefer running the repository's desktop.api_server.TerraFusionAPI in-process
    try:
        api_mod = importlib.import_module('desktop.api_server')
        if hasattr(api_mod, 'TerraFusionAPI'):
            api = api_mod.TerraFusionAPI()
            # Run in a background thread but keep it in-process so logs are shared.
            # If caller requested foreground behavior, use a non-daemon thread so it
            # keeps running and logs remain attached to the terminal.
            t = threading.Thread(target=api.run, args=(API_HOST, API_PORT), daemon=not fg)
            t.start()
            return t
    except Exception:
        pass

    # Fallbacks: try importable api_server or uvicorn
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
        # Some modules expose an instance; try to use a start method if present
        if hasattr(swarm, 'start_supervisor'):
            try:
                t = threading.Thread(target=swarm.start_supervisor, daemon=True)
                t.start()
                return t
            except Exception:
                pass
        # If there's a global coordinator with methods, don't start new process here
    return None

def start_shell(no_webview=False, prefer=None):
    ws = os.path.join(ROOT, "desktop", "web_shell.py")
    if os.path.exists(ws):
        cmd = [PY, ws]
        # web_shell.py expects env vars rather than CLI port; provide TF_API_PORT
        env = os.environ.copy()
        env['TF_API_PORT'] = str(API_PORT)
        p = sh(cmd, env=env, detach=True)
        procs.append(p)
        return p
    open_browser(WEB_URL, prefer=prefer)
    return None

def launch(open_ui=False, prefer=None, no_webview=False, fg: bool = False):
    ensure_deps()

    print("== TerraFusion cOS :: LAUNCH ==")
    api_p = start_api(fg=fg)
    if not wait_health(API_HOST, API_PORT, timeout=25):
        print("[err] API health failed. Invoking auto-fix...")
        ai_auto_fix("api-health-failed")
        if not wait_health(API_HOST, API_PORT, timeout=20):
            print("[fatal] API still unhealthy.")
            return 2
    # Explicit health OK message immediately after the health gate
    print(f"[ok] API healthy at {WEB_URL}")

    start_kernel()
    start_swarm()

    # Best-effort warmups
    sync = mods.get('sync')
    if sync and hasattr(sync, 'TerraFusionSync'):
        try:
            # If class exists, instantiate and call get_sync_status
            inst = sync.TerraFusionSync()
            with contextlib.suppress(Exception): inst.get_sync_status()
        except Exception:
            pass

    if open_ui:
        start_shell(no_webview=no_webview, prefer=prefer)
        open_browser(WEB_URL, prefer=prefer)

    print("[ready] TerraFusion cOS is up. (Ctrl+C to stop here does not kill background processes)")
    return 0

# ---- Commands --------------------------------------------------------------------------
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

    sub.add_parser("status", help="Show health and loaded modules")
    sub.add_parser("fix", help="Auto-repair")
    sub.add_parser("logs", help="Tail session logs (best-effort)")
    sub.add_parser("kill", help="Terminate processes started by this tfctl session")

    args = ap.parse_args()
    if args.cmd == "launch":
        return launch(open_ui=args.open, prefer=None if args.prefer=="system" else args.prefer, no_webview=args.no_webview, fg=getattr(args, 'fg', False))
    elif args.cmd == "status":
        cmd_status()
    elif args.cmd == "fix":
        cmd_fix()
    elif args.cmd == "logs":
        cmd_logs()
    elif args.cmd == "kill":
        cmd_kill()
    return 0

if __name__ == "__main__":
    sys.exit(main())
