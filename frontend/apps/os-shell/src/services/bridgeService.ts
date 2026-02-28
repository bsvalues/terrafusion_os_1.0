import { getViteEnv } from '@/env/getViteEnv';
import { SovereignObject } from '../fs/types';

const env = getViteEnv();
const BRIDGE_URL = env.VITE_BRIDGE_URL || '';
const BRIDGE_KEY = env.VITE_TF_BRIDGE_KEY || 'dev-key';

export const bridgeService = {
  /**
   * Fetches a Parcel Node from the Sovereign Bridge (Python).
   * Returns null if not found or offline, preventing UI crashes.
   */
  async getParcel(parcelId: string): Promise<SovereignObject | null> {
    try {
      // The Sovereign Handshake
      const headers = {
        'Content-Type': 'application/json',
        'x-tf-bridge-key': BRIDGE_KEY,
      };

      console.log(`[Bridge] Hailing frequency open to ${BRIDGE_URL}/v1/parcels/${parcelId}`);

      const response = await fetch(`${BRIDGE_URL}/v1/parcels/${parcelId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404)
          console.warn(`[Bridge] Parcel ${parcelId} not found in Lattice.`);
        if (response.status === 401) console.error('[Bridge] Sovereignty Violation: Invalid Key.');
        return null;
      }

      const data = await response.json();
      return data as SovereignObject;
    } catch (error) {
      console.error('[Bridge] Link Offline:', error);
      return null;
    }
  },
};
