# 🚀 DESKTOP SHELL VISUAL VERIFICATION

## Purpose

We've written code and tests. Now we need to **actually see it work**.

---

## Quick Start

### Option A: Temporary Swap (Recommended)

1. **Backup current App.tsx:**
```powershell
cd C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src
Copy-Item App.tsx App.tsx.backup
```

2. **Edit App.tsx to use our test harness:**
```tsx
// Temporary change - swap the import
import DesktopShellTest from './DesktopShellTest';

function App() {
  return <DesktopShellTest />;
}

export default App;
```

3. **Run the dev server:**
```powershell
cd C:\Users\bsval\terrafusion_os_1.0\frontend
pnpm dev
```

4. **Open browser** (usually http://localhost:5173 or http://localhost:3000)

5. **Verify the Desktop Shell works:**
   - [ ] Desktop background renders
   - [ ] Taskbar appears at bottom
   - [ ] Start button is visible
   - [ ] Clicking Start opens menu
   - [ ] Apps are listed in Start Menu
   - [ ] Clicking an app opens a window
   - [ ] Window has title bar
   - [ ] Window can be dragged
   - [ ] Window can be resized
   - [ ] Window minimize/maximize/close work
   - [ ] Multiple windows can be opened
   - [ ] Clicking window brings it to front
   - [ ] Window appears in taskbar
   - [ ] System tray shows (clock, notifications)

6. **Restore original App.tsx when done:**
```powershell
cd C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src
Copy-Item App.tsx.backup App.tsx
```

---

### Option B: Use Existing View Mode

The Desktop Shell is already wired up in TerraFusionQuantumOS.tsx as the 'DESKTOP' view mode.

1. Run: `pnpm dev`
2. Open browser
3. In the left sidebar, look for navigation options
4. Find and click on a module that leads to DESKTOP view

---

## What We're Verifying

| Feature | How to Test | Expected Result |
|---------|-------------|-----------------|
| Desktop renders | Page loads | See background + taskbar |
| Start Menu | Click Start button | Menu opens with apps |
| Open Window | Click app in Start Menu | Window appears |
| Drag Window | Drag title bar | Window moves |
| Resize Window | Drag window edges | Window resizes |
| Close Window | Click X button | Window closes |
| Minimize | Click - button | Window hides |
| Maximize | Click □ button | Window fills screen |
| Focus Window | Click window | Comes to front |
| Taskbar | Open windows | Icons appear |
| System Tray | Look at right side | Clock, notifications |
| Error Boundary | (if error occurs) | Error message, not crash |
| Persistence | Refresh page | Windows restore |

---

## Document Results

After testing, document what happened:

```
VISUAL VERIFICATION RESULTS
===========================
Date: _______________
Tester: _______________

Desktop Renders:      [ ] YES  [ ] NO  [ ] PARTIAL
Start Menu Works:     [ ] YES  [ ] NO  [ ] PARTIAL
Windows Open:         [ ] YES  [ ] NO  [ ] PARTIAL
Windows Drag:         [ ] YES  [ ] NO  [ ] PARTIAL
Windows Resize:       [ ] YES  [ ] NO  [ ] PARTIAL
Window Controls:      [ ] YES  [ ] NO  [ ] PARTIAL
Taskbar Works:        [ ] YES  [ ] NO  [ ] PARTIAL
System Tray:          [ ] YES  [ ] NO  [ ] PARTIAL
Persistence:          [ ] YES  [ ] NO  [ ] PARTIAL

Issues Found:
1. _______________
2. _______________
3. _______________

Overall Status:       [ ] WORKS  [ ] PARTIALLY WORKS  [ ] BROKEN
```

---

## Next Steps Based on Results

**If it works:**
- Integrate Desktop Shell as primary/default view
- Create production entry point
- Celebrate 🎉

**If it partially works:**
- Document specific issues
- Fix issues one by one
- Re-test

**If it's broken:**
- Capture error messages
- Debug systematically
- Fix and re-test
