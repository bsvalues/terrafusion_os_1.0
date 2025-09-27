#!/bin/bash

echo "🚨 NUCLEAR RESET INITIATED 🚨"
echo "This will restore from last known good state"
echo ""
echo "Available recovery options:"
echo "1. Git reset to 10 commits ago"
echo "2. Restore from latest backup"
echo "3. Emergency backup restore"
echo "4. Cancel operation"
echo ""
read -p "Select option (1-4): " option

case $option in
    1)
        echo "💥 Performing git reset..."
        LAST_GOOD=$(git rev-parse HEAD~10)
        git reset --hard $LAST_GOOD
        
        # Reinstall dependencies
        rm -rf node_modules package-lock.json
        npm install
        
        # Rebuild structure
        bash scripts/organization/enforce-structure.sh
        echo "✅ Git reset complete"
        ;;
    2)
        echo "📦 Restoring from latest backup..."
        latest_backup=$(ls -t backup/before-enforcement-*.tar.gz 2>/dev/null | head -1)
        if [ -n "$latest_backup" ]; then
            echo "Restoring from: $latest_backup"
            tar -xzf "$latest_backup"
            echo "✅ Latest backup restored"
        else
            echo "❌ No backups found"
        fi
        ;;
    3)
        echo "🆘 Emergency backup restore..."
        latest_emergency=$(ls -t backup/emergency/*.tar.gz 2>/dev/null | head -1)
        if [ -n "$latest_emergency" ]; then
            echo "Restoring from: $latest_emergency"
            tar -xzf "$latest_emergency"
            echo "✅ Emergency backup restored"
        else
            echo "❌ No emergency backups found"
        fi
        ;;
    4)
        echo "❌ Operation cancelled"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo "💥 Nuclear reset complete. Review changes carefully."