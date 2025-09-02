use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct ModuleInfo {
    name: String,
    version: String,
    ready: bool,
}

fn main() {
    let info = ModuleInfo {
        name: env!("CARGO_PKG_NAME").to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        ready: true,
    };
    
    println!("Module {} v{} - OPERATIONAL", info.name, info.version);
    println!("Part of TerraFusion Championship Suite");
}
