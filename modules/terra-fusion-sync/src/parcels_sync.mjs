#!/usr/bin/env node

/**
 * Benton County Parcels Sync
 * TerraFusion OS v1.0 - Government AI Operating System
 * 
 * Synchronizes 89,247 parcels with AI optimization
 */

import { execSync } from 'child_process';

function syncParcels() {
    const parcels = 89247;
    
    try {
        console.log(`🗺️ Syncing ${parcels.toLocaleString()} Benton County Parcels...`);
        
        // Launch parcel sync with Harris PACS
        execSync('npm run start:parcel-sync', { 
            stdio: 'inherit',
            env: { 
                ...process.env,
                COUNTY: 'Benton County',
                PARCEL_COUNT: parcels.toString(),
                GIS_PROJECTION: 'EPSG:2927'
            }
        });
        
    } catch (error) {
        console.error('❌ Parcel sync failed:', error.message);
        process.exit(1);
    }
}

syncParcels();
