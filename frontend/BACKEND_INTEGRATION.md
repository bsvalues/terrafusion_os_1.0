# TerraFusion Backend Integration Guide

## Architecture Overview

TerraFusion uses a 3-layer architecture:

```
┌─────────────────────────────────────┐
│   WPF Native Shell (Windows App)    │
│   - WebView2 component              │
│   - Windows authentication          │
│   - Certificate validation          │
│   - Security policies               │
└──────────────┬──────────────────────┘
               │ Navigates to
               │ http://localhost:5000 (Prod)
               │ http://localhost:5173 (Dev)
               ▼
┌─────────────────────────────────────┐
│   ASP.NET Core Backend              │
│   - Serves static files (React)     │
│   - REST APIs (/api/*)              │
│   - TF-Substrate coordination       │
└──────────────┬──────────────────────┘
               │ Serves
               │ /index.html
               │ /assets/*
               ▼
┌─────────────────────────────────────┐
│   React Frontend (This Repo)        │
│   - NativeShell (shell/)            │
│   - SuiteLauncher (shell/)          │
│   - Suite components (suites/)      │
│   - Design System V2 (styles/)      │
└─────────────────────────────────────┘
```

## ASP.NET Core Backend Configuration

### Program.cs (Minimal Setup)

```csharp
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("TerraFusionOS",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173") // Vite dev server
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
});

var app = builder.Build();

// Enable CORS for dev
if (app.Environment.IsDevelopment())
{
    app.UseCors("TerraFusionOS");
}

// Serve static files from wwwroot
app.UseStaticFiles();

// API routes
app.UseRouting();
app.MapControllers();

// Fallback to index.html for client-side routing
app.MapFallbackToFile("index.html");

app.Run();
```

### Static File Deployment

After building the React app, copy files to backend:

```bash
# Build React app
cd frontend
npm run build

# Copy to backend (adjust paths as needed)
cp -r dist/* ../backend/TerraFusion.API/wwwroot/
```

Or configure Vite to output directly to `wwwroot`:

```ts
// vite.config.ts
export default defineConfig({
  build: {
    outDir: "../backend/TerraFusion.API/wwwroot",
    emptyOutDir: true,
  },
});
```

## WPF Native Shell Integration

### MainWindow.xaml

```xml
<Window x:Class="TerraFusion.NativeShell.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:wv2="clr-namespace:Microsoft.Web.WebView2.Wpf;assembly=Microsoft.Web.WebView2.Wpf"
        Title="TerraFusion OS"
        Height="900"
        Width="1600"
        WindowState="Maximized">
    <Grid>
        <wv2:WebView2 x:Name="ShellWebView" />
    </Grid>
</Window>
```

### MainWindow.xaml.cs

```csharp
using System;
using System.Windows;
using Microsoft.Web.WebView2.Core;

namespace TerraFusion.NativeShell
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            Loaded += MainWindow_Loaded;
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            await ShellWebView.EnsureCoreWebView2Async();

            // Configure WebView2
            ConfigureWebView();

            // Navigate to appropriate URL
#if DEBUG
            var url = "http://localhost:5173"; // Vite dev server
#else
            var url = "http://localhost:5000"; // ASP.NET Core backend
#endif

            ShellWebView.CoreWebView2.Navigate(url);
        }

        private void ConfigureWebView()
        {
            var settings = ShellWebView.CoreWebView2.Settings;

            // Enable dev tools in debug
#if DEBUG
            settings.AreDevToolsEnabled = true;
#else
            settings.AreDevToolsEnabled = false;
#endif

            // Security settings
            settings.IsScriptEnabled = true;
            settings.AreDefaultContextMenusEnabled = true;
            settings.IsWebMessageEnabled = true;

            // Optional: Handle navigation events
            ShellWebView.CoreWebView2.NavigationCompleted += CoreWebView2_NavigationCompleted;
        }

        private void CoreWebView2_NavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            if (!e.IsSuccess)
            {
                MessageBox.Show(
                    $"Failed to load TerraFusion OS.\n\nError: {e.WebErrorStatus}",
                    "Navigation Error",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error);
            }
        }
    }
}
```

### .csproj Configuration

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0-windows</TargetFramework>
    <UseWPF>true</UseWPF>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.Web.WebView2" Version="1.0.2210.55" />
  </ItemGroup>
</Project>
```

## Development Workflow

### Option 1: Full Stack Dev (Recommended)

Terminal 1 - React dev server:
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

Terminal 2 - Backend API (optional, if needed for data):
```bash
cd backend
dotnet run --project TerraFusion.API
# Runs on http://localhost:5000
```

Terminal 3 - WPF Native Shell:
```bash
cd native-shell
dotnet run
# Opens window, navigates to http://localhost:5173
```

**Result**: See live React updates inside native shell window.

### Option 2: Production Build Testing

```bash
# Build React
cd frontend
npm run build

# Copy to backend
cp -r dist/* ../backend/TerraFusion.API/wwwroot/

# Run backend
cd ../backend
dotnet run --project TerraFusion.API

# Run WPF (will navigate to http://localhost:5000)
cd ../native-shell
dotnet run
```

## API Integration from React

React components can call backend APIs:

```typescript
// src/services/api.ts
const API_BASE = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "/api";

export async function getSuites() {
  const response = await fetch(`${API_BASE}/suites`);
  return response.json();
}

export async function launchSuite(suiteId: string) {
  const response = await fetch(`${API_BASE}/suites/${suiteId}/launch`, {
    method: "POST",
  });
  return response.json();
}
```

Usage in component:

```typescript
import { getSuites } from "../services/api";

const [suites, setSuites] = useState([]);

useEffect(() => {
  getSuites().then(setSuites);
}, []);
```

## Troubleshooting

### Issue: CORS errors in dev

**Solution**: Add CORS policy in backend `Program.cs` (see above).

### Issue: 404 on client routes

**Solution**: Ensure `MapFallbackToFile("index.html")` is configured.

### Issue: WebView2 not loading

**Solution**: Install WebView2 Runtime from https://go.microsoft.com/fwlink/p/?LinkId=2124703

### Issue: Static files not serving

**Solution**:
- Ensure `app.UseStaticFiles()` is before `MapControllers()`
- Check files are in `wwwroot/`
- Check build output path in vite.config.ts

## Production Deployment

1. Build React app: `npm run build`
2. Copy to backend: `cp -r dist/* ../backend/TerraFusion.API/wwwroot/`
3. Publish backend: `dotnet publish -c Release`
4. Publish WPF shell: `dotnet publish -c Release`
5. Deploy:
   - Backend service on IIS or Kestrel
   - WPF installer for county workstations
6. WPF navigates to backend URL (e.g., `http://terrafusion.local:5000`)

## Environment Variables

Backend can use environment-specific configs:

```json
// appsettings.Development.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  },
  "FrontendUrl": "http://localhost:5173"
}

// appsettings.Production.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning"
    }
  },
  "FrontendUrl": "http://terrafusion.local"
}
```

## Next Steps

After integration is working:

1. **Wire Suite Clicks**: Connect `onOpenSuite` in `SuiteLauncher.tsx` to actual app mounting
2. **Backend APIs**: Implement `/api/suites`, `/api/suites/{id}/launch` endpoints
3. **TF-Substrate**: Integrate Rust engine coordination
4. **AI Drawer**: Connect to AI agent APIs
5. **Window Manager**: If implementing desktop OS with dock/windows (future)

---

**Government. Transcended.**
