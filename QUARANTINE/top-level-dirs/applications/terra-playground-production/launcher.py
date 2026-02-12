import os
import platform
import subprocess
import socket
import time

# Dictionary to keep track of launched app processes and their ports
launched_apps = {}

def find_free_port(start_port=8000):
    for port in range(start_port, 9000):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    raise Exception("No free ports available between {} and {}".format(start_port, 9000))

def launch_app(app_name):
    global launched_apps

    base_path = os.path.join("apps", app_name)
    current_platform = platform.system()

    script_path = None
    command_executor = None

    if current_platform == "Windows":
        script_path = os.path.join(base_path, "run.bat")
        command_executor = ["cmd", "/C"]
    elif current_platform in ["Darwin", "Linux"]:
        script_path = os.path.join(base_path, "run.sh")
        command_executor = ["sh"]
    else:
        return {"status": "error", "message": f"Unsupported operating system: {current_platform}"}

    if not os.path.exists(script_path):
        return {"status": "error", "message": f"Startup script not found for {app_name} at {script_path}"}

    try:
        port = find_free_port()
        env = os.environ.copy()
        env["PORT"] = str(port)

        # Use subprocess.Popen to launch the process in the background
        process = subprocess.Popen(command_executor + [script_path], env=env, 
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, 
                                   creationflags=subprocess.CREATE_NO_WINDOW if current_platform == "Windows" else 0)
        
        launched_apps[app_name] = {"process": process, "port": port, "status": "running"}
        return {"status": "success", "message": f"{app_name} launched on port {port}"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to launch {app_name}: {str(e)}"}

def get_app_status(app_name):
    if app_name in launched_apps:
        proc_info = launched_apps[app_name]
        if proc_info["process"].poll() is None:
            return {"status": "running", "port": proc_info["port"]}
        else:
            # Process has terminated
            exit_code = proc_info["process"].poll()
            launched_apps[app_name]["status"] = "exited"
            return {"status": "exited", "port": proc_info["port"], "exit_code": exit_code}
    return {"status": "not_launched"}

def stop_app(app_name):
    if app_name in launched_apps:
        proc_info = launched_apps[app_name]
        if proc_info["process"].poll() is None:
            proc_info["process"].terminate() # Try to terminate gracefully
            time.sleep(1)
            if proc_info["process"].poll() is None:
                proc_info["process"].kill() # Force kill if not terminated
            launched_apps[app_name]["status"] = "stopped"
            return {"status": "success", "message": f"{app_name} stopped."}
        else:
            return {"status": "not_running", "message": f"{app_name} is not running."}
    return {"status": "not_launched", "message": f"{app_name} was not launched."}

# Example of how these functions would be called (for internal testing/demonstration)
if __name__ == "__main__":
    # These would be called via a UI or API in the final product
    print(launch_app("TerraAgent"))
    print(launch_app("TerraFlow"))
    print(launch_app("TerraLevy"))

    # Simulate monitoring
    time.sleep(5)
    print("--- Status after 5 seconds ---")
    print(get_app_status("TerraAgent"))
    print(get_app_status("TerraFlow"))
    print(get_app_status("TerraLevy"))

    time.sleep(7) # Let the scripts finish (sleep 10 in run.bat/sh)
    print("--- Status after 12 seconds (should be exited) ---")
    print(get_app_status("TerraAgent"))
    print(get_app_status("TerraFlow"))
    print(get_app_status("TerraLevy"))

    print("--- Stopping TerraAgent ---")
    print(stop_app("TerraAgent"))
    print(get_app_status("TerraAgent")) 