#!/usr/bin/env python3
"""
TerraFusion Build Launcher - Ensures proper directory and TerraFusionSync integration
Intelligence That Counties Envy
"""
import os
import sys
import subprocess
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Launch TerraFusion Build with proper environment setup"""
    
    # Change to DEPLOYED_APPLICATIONS directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    logger.info(f"🚀 TerraFusion Build Launcher")
    logger.info(f"📁 Working directory: {os.getcwd()}")
    
    # Check for TerraFusionSync database
    db_path = "terrafusionsync_real.db"
    if os.path.exists(db_path):
        db_size = os.path.getsize(db_path) / (1024 * 1024)  # MB
        logger.info(f"✅ TerraFusionSync database found: {db_size:.1f} MB")
    else:
        logger.error(f"❌ TerraFusionSync database not found: {db_path}")
        logger.info("Available database files:")
        for file in os.listdir("."):
            if file.endswith(".db"):
                logger.info(f"   - {file}")
        return
    
    # Launch the application
    logger.info("🔄 Starting TerraFusion Build...")
    logger.info("🌐 Application will be available at: http://localhost:\${{TF_API_PORT:-5000}}")
    logger.info("⚡ Intelligence That Counties Envy")
    
    try:
        subprocess.run([sys.executable, "terrafusion_build_complete.py"], check=True)
    except KeyboardInterrupt:
        logger.info("🛑 Application stopped by user")
    except Exception as e:
        logger.error(f"❌ Application error: {e}")

if __name__ == "__main__":
    main() 