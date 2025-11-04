use tauri::{CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu};
use std::process::{Command, Stdio};
use std::sync::Mutex;
use std::collections::HashMap;
use tauri::State;

struct AppState {
    ports: Mutex<HashMap<String, u16>>,
}

#[tauri::command]
fn launch_app(app_name: String, state: State<AppState>) -> Result<String, String> {
    let base_path = "apps";

    let (command_executor, script_extension) = if cfg!(target_os = "windows") {
        ("cmd", ".bat")
    } else if cfg!(target_os = "macos") || cfg!(target_os = "linux") {
        ("sh", ".sh")
    } else {
        return Err("Unsupported operating system".into());
    };

    let script_path = format!("{}/{}/run{}", base_path, app_name, script_extension);

    let mut ports = state.ports.lock().unwrap();
    let port = find_free_port(8000, &ports)?;
    ports.insert(app_name.clone(), port);

    // Launch the script with assigned port
    let mut command = Command::new(command_executor);
    if cfg!(target_os = "windows") {
        command.args(["/C", &script_path]);
    } else {
        command.arg(&script_path);
    }

    match command
        .env("PORT", port.to_string())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn() {
        Ok(_) => Ok(format!("{} launched on port {}", app_name, port)),
        Err(e) => Err(format!("Failed to launch {}: {}", app_name, e)),
    }
}

fn find_free_port(start: u16, used_ports: &HashMap<String, u16>) -> Result<u16, String> {
    for port in start..9000 {
        if !used_ports.values().any(|&v| v == port) {
            return Ok(port);
        }
    }
    Err("No free ports available".into())
}

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("quit", "Quit"));

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .manage(AppState {
            ports: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![launch_app])
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| {
            if let SystemTrayEvent::MenuItemClick { id, .. } = event {
                if id.as_str() == "quit" {
                    std::process::exit(0);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 