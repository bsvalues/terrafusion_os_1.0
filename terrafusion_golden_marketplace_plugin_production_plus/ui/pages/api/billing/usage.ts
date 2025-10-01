import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../lib/rbac';

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  try{
    await requireAuth(req.headers.authorization, ['User','Assessor','CountyAdmin','EnterpriseAdmin']);
    // In a real system, you'd write usage to your meter; here we echo
    const { feature = 'graph_eigs', units = 1 } = req.body || {};
    res.status(200).json({ ok: true, feature, units, metered: true });
  }catch(e:any){
    res.status(401).json({ ok:false, error: e.message });
  }
}
