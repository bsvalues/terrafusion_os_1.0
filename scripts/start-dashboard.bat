@echo off
cd /d "c:\Users\bsval\terrafusion_os_1.0\src-enhanced\terrafusion-dashboard\TerraFusionDashboard"
set NODE_ENV=development
set PORT=\${{TF_FRONTEND_PORT:-3000}}
set DATABASE_URL=postgresql://user:pass@localhost:\${{TF_POSTGRES_PORT:-5432}}/terrafusion
echo Starting TerraFusion Dashboard...
npx tsx server/index.ts
pause
