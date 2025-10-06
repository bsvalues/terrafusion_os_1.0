use clap::{Parser, Subcommand};
use notify::{Watcher, RecursiveMode, recommended_watcher};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::fs;
use anyhow::{Context, Result};

#[derive(Parser)]
#[command(name = "tf-designctl")]
#[command(about = "TerraFusion Design Token CLI - Sovereign governance", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Initialize design-sync output directory
    Init {
        #[arg(default_value = "design-sync")]
        output: PathBuf,
    },
    /// Validate tokens and generate all output formats
    Sync {
        #[arg(default_value = "design-sync")]
        output: PathBuf,
        #[arg(short, long, default_value = "design/tokens.json")]
        tokens: PathBuf,
    },
    /// Watch tokens.json and auto-sync on changes
    Watch {
        #[arg(default_value = "design-sync")]
        output: PathBuf,
        #[arg(short, long, default_value = "design/tokens.json")]
        tokens: PathBuf,
    },
    /// Validate tokens.json integrity
    Validate {
        #[arg(short, long, default_value = "design/tokens.json")]
        tokens: PathBuf,
    },
}

#[derive(Debug, Deserialize, Serialize)]
struct DesignTokens {
    colors: serde_json::Map<String, serde_json::Value>,
    #[serde(default)]
    gradients: Option<serde_json::Map<String, serde_json::Value>>,
    typography: Typography,
    geometry: Geometry,
    #[serde(default)]
    effects: Option<serde_json::Map<String, serde_json::Value>>,
    motion: Motion,
}

#[derive(Debug, Deserialize, Serialize)]
struct Typography {
    #[serde(rename = "fontFamily")]
    font_family: String,
    #[serde(default, rename = "fontMono")]
    font_mono: Option<String>,
    scale: serde_json::Map<String, serde_json::Value>,
    #[serde(default)]
    weight: Option<serde_json::Map<String, serde_json::Value>>,
    #[serde(default, rename = "letterSpacing")]
    letter_spacing: Option<serde_json::Map<String, serde_json::Value>>,
}

#[derive(Debug, Deserialize, Serialize)]
struct Geometry {
    #[serde(rename = "borderRadius")]
    border_radius: serde_json::Map<String, serde_json::Value>,
    #[serde(default)]
    spacing: Option<serde_json::Map<String, serde_json::Value>>,
}

#[derive(Debug, Deserialize, Serialize)]
struct Motion {
    #[serde(default)]
    easing: Option<serde_json::Map<String, serde_json::Value>>,
    duration: serde_json::Map<String, serde_json::Value>,
}

fn validate_tokens(token_path: &PathBuf) -> Result<DesignTokens> {
    let content = fs::read_to_string(token_path)
        .context("Failed to read tokens file")?;
    
    let tokens: DesignTokens = serde_json::from_str(&content)
        .context("Failed to parse tokens JSON")?;
    
    println!("✅ Token validation passed");
    Ok(tokens)
}

fn generate_css(tokens: &DesignTokens) -> String {
    let mut lines = vec![":root {".to_string()];
    
    // Colors
    for (key, value) in &tokens.colors {
        lines.push(format!("  --{}: {};", key, value.as_str().unwrap_or("")));
    }
    
    // Gradients
    if let Some(gradients) = &tokens.gradients {
        for (key, value) in gradients {
            lines.push(format!("  --gradient-{}: {};", key, value.as_str().unwrap_or("")));
        }
    }
    
    // Typography
    lines.push(format!("  --font-family: {};", tokens.typography.font_family));
    if let Some(mono) = &tokens.typography.font_mono {
        lines.push(format!("  --font-mono: {};", mono));
    }
    for (key, value) in &tokens.typography.scale {
        lines.push(format!("  --font-size-{}: {};", key, value.as_str().unwrap_or("")));
    }
    
    // Geometry
    for (key, value) in &tokens.geometry.border_radius {
        lines.push(format!("  --border-radius-{}: {};", key, value.as_str().unwrap_or("")));
    }
    if let Some(spacing) = &tokens.geometry.spacing {
        for (key, value) in spacing {
            lines.push(format!("  --spacing-{}: {};", key, value.as_str().unwrap_or("")));
        }
    }
    
    // Motion - easing
    if let Some(easing) = &tokens.motion.easing {
        for (key, value) in easing {
            lines.push(format!("  --ease-{}: {};", key, value.as_str().unwrap_or("")));
        }
    }
    
    // Motion - duration
    for (key, value) in &tokens.motion.duration {
        lines.push(format!("  --duration-{}: {};", key, value.as_str().unwrap_or("")));
    }
    
    lines.push("}".to_string());
    lines.join("\n")
}

fn sync_tokens(token_path: &PathBuf, output_dir: &PathBuf) -> Result<()> {
    println!("🔄 Syncing design tokens...");
    
    let tokens = validate_tokens(token_path)?;
    
    // Ensure output directory exists
    fs::create_dir_all(output_dir)?;
    
    // Generate CSS
    let css = generate_css(&tokens);
    let css_path = output_dir.join("tokens.css");
    fs::write(&css_path, css)?;
    println!("  ✓ Generated tokens.css");
    
    // Additional generators would go here (Tailwind, React, Figma)
    // For brevity, showing CSS only in Rust version
    
    println!("✅ Design sync complete");
    Ok(())
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    
    match cli.command {
        Commands::Init { output } => {
            fs::create_dir_all(&output)?;
            println!("✅ Initialized design-sync directory: {}", output.display());
        }
        Commands::Sync { output, tokens } => {
            sync_tokens(&tokens, &output)?;
        }
        Commands::Watch { output, tokens } => {
            println!("👁️  Watching {}...", tokens.display());
            
            let (tx, rx) = std::sync::mpsc::channel();
            let mut watcher = recommended_watcher(tx)?;
            watcher.watch(&tokens, RecursiveMode::NonRecursive)?;
            
            // Initial sync
            sync_tokens(&tokens, &output)?;
            
            for res in rx {
                match res {
                    Ok(_event) => {
                        println!("📝 Tokens changed, syncing...");
                        if let Err(e) = sync_tokens(&tokens, &output) {
                            eprintln!("❌ Sync failed: {}", e);
                        }
                    }
                    Err(e) => eprintln!("❌ Watch error: {}", e),
                }
            }
        }
        Commands::Validate { tokens } => {
            validate_tokens(&tokens)?;
        }
    }
    
    Ok(())
}
