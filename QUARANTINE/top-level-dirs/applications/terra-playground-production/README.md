# Terrafusion Playground

> **Enterprise Application Launcher & Development Environment**  
> *Intelligence That Counties Envy*

A modern, AI-powered enterprise application launcher that provides centralized access to the complete Terrafusion ecosystem. Built with cutting-edge web technologies and enterprise-grade branding.

## 🚀 Features

- 🎯 **Centralized Application Launcher** - One-click access to all Terrafusion applications
- 🧠 **AI-Powered Ecosystem** - Integrated with TerraAgent, TerraFlow, TerraSync, and more
- 📊 **Real-time Status Monitoring** - Live health checks and status updates
- 🗺️ **Interactive Dashboard** - Modern Bootstrap-based interface with Terrafusion branding
- 🔒 **Enterprise-grade Security** - Secure application launching and monitoring
- 🌙 **Premium UI/UX** - Dark mode support with cosmic blue and quantum teal theming
- 📱 **Responsive Design** - Works seamlessly across desktop and mobile devices

## 🏗️ Terrafusion Ecosystem

The playground provides access to the complete Terrafusion platform:

| Application | Port | Description |
|-------------|------|-------------|
| **TerraAgent** | 5003 | AI-powered assistant for property assessment and CAMA data analysis |
| **TerraFlow** | 5001 | Workflow management engine for data processing and automation |
| **TerraSync** | 5002 | Data synchronization hub for enterprise geospatial systems |
| **Terrafusion Build** | 5000 | Property assessment platform with AI valuation engine |
| **TerraMiner** | 5006 | Advanced data mining and analytics for property insights |
| **TerraLevy** | 5007 | Tax levy management system with advanced calculations |

## 🛠️ Tech Stack

- **Frontend**: HTML5, Bootstrap 5, Font Awesome, Terrafusion Brand System
- **Backend**: Python Flask, Flask-CORS
- **Launcher**: Python with subprocess management
- **Monitoring**: Real-time health checks and status updates
- **Branding**: Terrafusion Unified Brand System with cosmic blue (#0891b2) and quantum teal (#00d2ff)

## 📋 Prerequisites

- **Python 3.8+** (with pip)
- **Node.js 18.x** or later (optional, for advanced features)
- **Windows 10/11** or **Linux/macOS**
- **8GB RAM** minimum (16GB recommended for full ecosystem)

## 🚀 Quick Start

### Option 1: Windows Batch File (Recommended)
```batch
# Double-click to run
start_playground.bat
```

### Option 2: Python Direct
```bash
# Navigate to the playground directory
cd DEPLOYED_APPLICATIONS/TerraFusionPlayground_PRODUCTION

# Start the playground
python start_playground.py
```

### Option 3: NPM Scripts
```bash
# Install dependencies (first time only)
npm install

# Start the playground
npm run playground
```

## 🎮 Usage

1. **Launch the Playground**: Run `start_playground.bat` or `python start_playground.py`
2. **Access the Interface**: Browser opens automatically to `http://localhost:3000`
3. **Launch Applications**: Click on any application card to start that service
4. **Monitor Status**: Real-time status badges show application health
5. **Quick Actions**: Use "Launch All" to start the entire ecosystem

### Application Management

- **Individual Launch**: Click the "Launch [App]" button on each card
- **Bulk Launch**: Use the "Launch All" button in the footer
- **Status Monitoring**: Status badges update automatically every 30 seconds
- **Direct Access**: Click "Open Dashboard" to access running applications

## 🏗️ Architecture

```
Terrafusion Playground (Port 3000)
├── Frontend (index.html)
│   ├── Bootstrap 5 UI Framework
│   ├── Terrafusion Brand System
│   └── Real-time Status Updates
├── Backend (app_server.py)
│   ├── Flask Web Server
│   ├── Application Launcher
│   ├── Health Check Monitor
│   └── Process Management
└── Terrafusion Ecosystem
    ├── TerraAgent (Port 5003)
    ├── TerraFlow (Port 5001)
    ├── TerraSync (Port 5002)
    ├── Terrafusion Build (Port 5000)
    ├── TerraMiner (Port 5006)
    └── TerraLevy (Port 5007)
```

## 🎨 Branding

The playground implements the **Terrafusion Unified Brand System**:

- **Primary Colors**: Cosmic Blue (#0891b2), Quantum Teal (#00d2ff)
- **Typography**: Modern, clean fonts with gradient text effects
- **Components**: Consistent cards, buttons, and navigation across all applications
- **Icons**: Font Awesome 6 with custom Terrafusion iconography
- **Animations**: Smooth hover effects and loading states

## 🔧 Development

### Project Structure
```
TerraFusionPlayground_PRODUCTION/
├── index.html              # Main frontend interface
├── script.js               # Enhanced launcher JavaScript
├── style.css               # Custom styles
├── app_server.py           # Flask backend server
├── start_playground.py     # Startup script
├── start_playground.bat    # Windows batch launcher
├── shared_assets/          # Terrafusion brand assets
│   ├── terrafusion-unified-brand.css
│   └── terrafusion-brand-system.css
└── package.json           # NPM configuration
```

### API Endpoints

- `GET /` - Serve main interface
- `POST /api/launch` - Launch specific application
- `GET /api/status/<app>` - Get application status
- `GET /api/health` - Playground health check
- `GET /api/apps` - List all configured applications
- `POST /api/launch-all` - Launch all applications

### Adding New Applications

1. Update `TERRAFUSION_APPS` in `app_server.py`
2. Add application card to `index.html`
3. Update status monitoring in `script.js`
4. Test launch and status functionality

## 🚀 Deployment

### Local Development
```bash
python start_playground.py
```

### Production Deployment
```bash
# Install dependencies
pip install flask flask-cors

# Start production server
python app_server.py
```

### Docker Deployment
```bash
# Build container
docker build -t terrafusion-playground .

# Run container
docker run -p 3000:3000 terrafusion-playground
```

## 📊 Monitoring

The playground includes comprehensive monitoring:

- **Real-time Health Checks**: Automatic status updates every 30 seconds
- **Port Availability**: Checks if applications are listening on expected ports
- **Process Management**: Tracks launched processes and their status
- **Error Handling**: Graceful fallback when applications fail to start

## 🔍 Troubleshooting

### Common Issues

**Applications won't launch:**
- Verify Python dependencies are installed
- Check that ports aren't already in use
- Ensure application scripts exist in expected locations

**Status shows offline:**
- Applications may take 30-60 seconds to fully start
- Check application logs for startup errors
- Verify network connectivity to localhost

**Playground won't start:**
- Install Flask: `pip install flask flask-cors`
- Check Python version: `python --version` (requires 3.8+)
- Verify port 3000 is available

### Getting Help

1. Check the browser console for JavaScript errors
2. Review the Flask server logs in the terminal
3. Verify all Terrafusion applications are properly deployed
4. Ensure shared assets are properly copied

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Implement Terrafusion branding standards
4. Test with the complete ecosystem
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Terrafusion Excellence

*Building the infrastructure management platform that every county will need, want, and envy.*

**Contact & Support:**
- 🌐 **Playground**: http://localhost:3000
- 🤖 **TerraAgent**: http://localhost:5003
- 🌊 **TerraFlow**: http://localhost:5001
- 🔄 **TerraSync**: http://localhost:5002
- 🏢 **Terrafusion Build**: http://localhost:5000

---

*Terrafusion Playground - Where enterprise applications launch with excellence.* 🚀 