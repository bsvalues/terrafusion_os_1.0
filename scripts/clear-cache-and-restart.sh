#!/bin/bash

echo "🚀 TerraFusion OS - Cache Clear and Restart Script"
echo "================================================"
echo ""
echo "This script will:"
echo "1. Clear browser cache instructions"
echo "2. Stop any running development servers"
echo "3. Clear node modules cache"
echo "4. Restart the frontend with fresh modules"
echo ""

# Navigate to frontend directory
cd "$(dirname "$0")/../frontend" || exit 1

echo "📍 Working in: $(pwd)"
echo ""

# Stop any running processes on common ports
echo "🛑 Stopping any running development servers..."
echo "   Checking port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "   ✅ Stopped process on port 3000" || echo "   ℹ️  No process running on port 3000"

echo "   Checking port 5173 (Vite)..."
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "   ✅ Stopped process on port 5173" || echo "   ℹ️  No process running on port 5173"

echo ""

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force 2>/dev/null && echo "   ✅ NPM cache cleared" || echo "   ⚠️  Could not clear npm cache"

# Clear any Vite cache
echo "🧹 Clearing Vite cache..."
rm -rf node_modules/.vite 2>/dev/null && echo "   ✅ Vite cache cleared" || echo "   ℹ️  No Vite cache found"

echo ""
echo "🌐 BROWSER CACHE CLEARING INSTRUCTIONS:"
echo "======================================="
echo ""
echo "To see the updated modules, you MUST clear your browser cache:"
echo ""
echo "🔥 HARD REFRESH (Recommended):"
echo "   • Chrome/Firefox/Edge: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"
echo "   • Safari: Cmd+Option+R"
echo ""
echo "🔥 MANUAL CACHE CLEAR:"
echo "   • Chrome: F12 → Network tab → Right-click reload → 'Empty Cache and Hard Reload'"
echo "   • Firefox: Ctrl+Shift+Delete → Clear cache"
echo "   • Edge: Ctrl+Shift+Delete → Clear browsing data"
echo ""
echo "🔥 INCOGNITO/PRIVATE MODE:"
echo "   • Open localhost:3000 in incognito/private browsing mode"
echo ""

# Start the development server
echo "🚀 Starting TerraFusion OS frontend with fresh modules..."
echo "   Registry Version: 2.1.20250825"
echo "   Active Modules: 15 production-ready government modules"
echo ""
echo "📡 Starting development server..."
echo "   URL will be: http://localhost:3000"
echo "   Click 'Enter TerraFusion OS' to see the updated modules"
echo ""
echo "⚠️  IMPORTANT: After the server starts, you MUST do a hard refresh in your browser!"
echo ""

# Start the development server
npm run dev

echo ""
echo "✅ If you still see old/fake modules after hard refresh:"
echo "   1. Close browser completely"
echo "   2. Open new browser window"  
echo "   3. Go to localhost:3000 in private/incognito mode"
echo "   4. Click 'Enter TerraFusion OS'"
echo "   5. You should now see the 15 ACTIVE_MODULES.md registry modules"