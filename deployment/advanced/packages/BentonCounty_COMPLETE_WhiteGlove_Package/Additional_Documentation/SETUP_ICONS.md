# Terrafusion Icon Setup Instructions

## Your Actual Icons

I can see your real Terrafusion icons at
`/mnt/e/TerraFusion_VM_Production/favicon/`:

- **The icon**: A layered/terraced geometric design in cyan (#00e5ff)
- **The text**: "TERRAFUSION" below the icon
- **The style**: Clean, modern, professional on dark background

## To Make Icons Work in Your Browser

### Option 1: Copy Files Manually (Recommended)

1. Copy these files from `E:\TerraFusion_VM_Production\favicon\`:
   - `favicon.ico`
   - `favicon-96x96.png`
   - `apple-touch-icon.png`
   - `web-app-manifest-192x192.png`
   - `web-app-manifest-512x512.png`

2. Paste them into `E:\TerraFusion_Tauri_Master_Workspace\championship\`

3. Then the HTML files can reference them with simple paths like:
   ```html
   <img src="./favicon-96x96.png" alt="Terrafusion Logo" />
   ```

### Option 2: Use Windows File Explorer

1. Open two File Explorer windows
2. Navigate to `E:\TerraFusion_VM_Production\favicon\` in one
3. Navigate to `E:\TerraFusion_Tauri_Master_Workspace\championship\` in the
   other
4. Drag and drop the icon files

### Option 3: Command Line (if you have access)

```powershell
# In PowerShell
Copy-Item "E:\TerraFusion_VM_Production\favicon\*.png" -Destination "E:\TerraFusion_Tauri_Master_Workspace\championship\"
Copy-Item "E:\TerraFusion_VM_Production\favicon\*.ico" -Destination "E:\TerraFusion_Tauri_Master_Workspace\championship\"
```

## Test It Works

Once copied, open `TEST_ICONS.html` in your browser. The "Test 4: Local Copy"
should show your icon.

## What It Should Look Like

- Cyan/teal layered icon (like topographical layers)
- "TERRAFUSION" text below
- Dark space background (#0a0f1c)
- Clean, professional, modern
