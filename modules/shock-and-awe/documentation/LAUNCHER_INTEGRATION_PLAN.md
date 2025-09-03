# 🚀 TerraFusion Launcher Integration Plan

## Current State

We have:
1. **14 Individual Tauri Apps** - Each converted to native desktop apps
2. **launcher-v3** - The main TerraFusion IDE/Launcher (already built)
3. **No Integration** - The launcher doesn't know about the 14 apps!

## The Problem

The launcher-v3 at `/mnt/e/TerraFusion_Master_Workspace/launcher-v3/` is supposed to be the central hub that:
- Shows all TerraFusion applications
- Launches them with one click
- Monitors their health
- Manages updates
- Provides unified access

But currently it has hardcoded URLs pointing to web apps (localhost:3002, etc.) instead of launching the Tauri apps!

## Integration Strategy

### Option 1: Update Launcher to Launch Tauri Apps (Recommended)
- Modify launcher-v3 to use Tauri's `shell.open()` to launch the desktop apps
- Update the applications list to point to the Tauri executables
- Keep the launcher as the central control panel

### Option 2: Create App Registry
- Build an app registry that the launcher reads
- Each Tauri app registers itself
- Dynamic app discovery

### Option 3: Unified Workspace App
- Create one mega Tauri app with all 14 apps embedded
- Use the launcher as the main navigation
- Switch between apps within the same window

## Recommended Approach: Option 1

Update the existing launcher-v3 to properly launch the Tauri desktop applications:

```typescript
// Instead of:
url: "http://localhost:3002"

// Use:
command: "./apps/08-costforge-ai/src-tauri/target/release/costforge-ai"
```

The launcher would:
1. Show all 14 apps with their official branding
2. Launch them as separate desktop applications
3. Monitor if they're running
4. Provide unified access point

## Next Steps

1. Update launcher-v3's application registry
2. Implement Tauri shell commands to launch apps
3. Add app detection (is app installed/running)
4. Update the UI to show desktop app status
5. Test the integrated launcher

This way users have ONE launcher that opens all 14 TerraFusion desktop applications!