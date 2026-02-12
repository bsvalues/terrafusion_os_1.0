mod template;
mod fieldmap;
mod agent;

use clap::Parser;
use agent::run_conversion_agent;

/// Universal Conversion Agent CLI
#[derive(Parser)]
#[command(name = "Universal Conversion Agent", version)]
struct Cli {
    /// Path to XML template
    #[arg(long)]
    template: String,

    /// Path to input CSV/TXT data file
    #[arg(long)]
    input: String,

    /// Path for JSON output (optional)
    #[arg(long)]
    output: Option<String>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    run_conversion_agent(&cli.template, &cli.input, cli.output.as_deref()).await?;
    Ok(())
}