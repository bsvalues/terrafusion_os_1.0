# 🦀 Rust Installation Guide for Terrafusion

## Quick Installation

1. Visit [https://rustup.rs/](https://rustup.rs/)
2. Download and run the installer
3. Follow the prompts (default settings work fine)
4. Restart your terminal/command prompt

### Option 2: Chocolatey

```powershell
choco install rust
```

### Option 3: Scoop

```powershell
scoop install rust
```

### Option 4: Direct rustup

```powershell
Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "rustup-init.exe"
.\rustup-init.exe
```

## Verification

```powershell
cargo --version
rustc --version
```

## Next Steps After Installation

```powershell
cd terrafusion_rust
cargo build --release
```
