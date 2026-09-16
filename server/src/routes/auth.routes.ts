import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }
    const result = await AuthService.login(username, password, req.ip, req.headers['user-agent']);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  res.json({ success: true, data: req.user });
});

export default router;
