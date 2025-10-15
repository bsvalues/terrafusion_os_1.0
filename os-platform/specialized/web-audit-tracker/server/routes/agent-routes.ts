import { Router, Request, Response } from 'express';

const router = Router();

router.get('/status', async (req: Request, res: Response) => {
  try {
    res.json({
      status: 'operational',
      agents: [],
      message: 'Agent system is running',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get agent status' });
  }
});

export default router;
