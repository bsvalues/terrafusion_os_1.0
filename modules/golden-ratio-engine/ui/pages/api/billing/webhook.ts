import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../lib/rbac';

// Example events: subscription.created, subscription.renewed, usage.reported
export default async function handler(req: NextApiRequest, res: NextApiResponse){
  try{
    const auth = req.headers.authorization;
    await requireAuth(auth, ['CountyAdmin','EnterpriseAdmin']);
    const event = req.headers['x-terrafusion-event'] as string || 'unknown';
    const payload = req.body || {};
    // TODO: verify signature header x-terrafusion-signature
    // Idempotency and event persistence omitted for brevity
    // Handle events
    switch(event){
      case 'subscription.created':
      case 'subscription.renewed':
        // Activate features/quotas
        break;
      case 'usage.reported':
        // Persist usage summary
        break;
      default:
        break;
    }
    res.status(200).json({ok:true, event});
  }catch(e:any){
    res.status(401).json({ok:false, error:e.message});
  }
}
