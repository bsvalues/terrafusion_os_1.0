# 🛠️ Terrafusion OS 1.0 - Manual Prerequisites Installation Guide

## 📋 Required Tools

The deployment failed because these tools are missing:
- ❌ **Terraform** - Infrastructure as Code tool
- ❌ **Azure CLI** - Azure command-line interface

## 🚀 Quick Installation (Automated)

**Option 1: Run the automated installer (Recommended)**

```powershell
# Run PowerShell as Administrator
.\Install-Prerequisites.ps1
```

## 🔧 Manual Installation (If automated fails)

### 1. Install Chocolatey (Package Manager)
```powershell
# Run in Administrator PowerShell
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### 2. Install Terraform
```powershell
# Using Chocolatey
choco install terraform -y

# OR download manually from: https://www.terraform.io/downloads
# Extract to C:\tools\terraform and add to PATH
```

### 3. Install Azure CLI
```powershell
# Using Chocolatey
choco install azure-cli -y

# OR download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-windows
```

### 4. Verify Installation
```powershell
# Check all tools are available
terraform --version
az --version
kubectl version --client
docker --version
node --version
dotnet --version
```

## 🔐 Azure Authentication

After installing the tools, authenticate with Azure:

```powershell
# Login to Azure
az login

# Set your subscription (if you have multiple)
az account set --subscription "Your-Subscription-Name"

# Verify authentication
az account show
```

## 🚀 Deploy Terrafusion OS 1.0

Once all prerequisites are installed:

```powershell
# Deploy to production
.\Deploy-Terrafusion.ps1 -Environment production

# OR force deployment (skip some checks)
.\Deploy-Terrafusion.ps1 -Environment production -Force

# OR test deployment (dry run)
.\Deploy-Terrafusion.ps1 -Environment production -DryRun
```

## 🆘 Alternative: Local Development Setup

If you want to test locally without cloud deployment:

```powershell
# Install and start local dependencies
docker-compose up -d

# Start backend
cd backend
dotnet run

# Start frontend (in new terminal)
cd frontend
npm install
npm start
```

## 📞 Need Help?

If you encounter issues:

1. **Check Windows version**: Windows 10/11 recommended
2. **Run as Administrator**: Most tools require admin privileges
3. **Restart PowerShell**: After installation to refresh PATH
4. **Check firewall**: May block downloads
5. **Use WSL**: If Windows has issues, try Windows Subsystem for Linux

## 🎯 Quick Commands Summary

```powershell
# 1. Install prerequisites (as Administrator)
.\Install-Prerequisites.ps1

# 2. Close and reopen PowerShell

# 3. Login to Azure
az login

# 4. Deploy Terrafusion
.\Deploy-Terrafusion.ps1 -Environment production
```

**That's it! After these steps, your 50,000+ AI agents will be deployed and ready! 🤖🚀**
