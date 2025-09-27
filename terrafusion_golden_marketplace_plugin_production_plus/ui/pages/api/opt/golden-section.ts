import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../lib/rbac';
import { goldenSection } from '../../lib/service';

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  try{
    await requireAuth(req.headers.authorization, ['Assessor','CountyAdmin','EnterpriseAdmin']);
    const result = await goldenSection(req.body);
    res.status(200).json(result);
  }catch(e:any){
    res.status(401).json({ ok:false, error: e.message });
  }
}
