import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { requireMainAdmin } from '../middleware/tenant.middleware';
import { TenantService } from '../services/tenant.service';
import { DashboardService } from '../services/dashboard.service';

const router = Router();

router.use(authenticateToken, requireMainAdmin);

router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const metrics = await DashboardService.getMainAdminMetrics();
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/clients', async (req: AuthRequest, res) => {
  try {
    const result = await TenantService.listTenants(req.query);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/clients', async (req: AuthRequest, res) => {
  try {
    const result = await TenantService.createTenant(req.body, req.user?.id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/clients/:id/features', async (req: AuthRequest, res) => {
  try {
    const { featureCodes } = req.body;
    const result = await TenantService.updateTenantFeatures(req.params.id, featureCodes);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/clients/:id/status', async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const result = await TenantService.updateStatus(req.params.id, status);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/clients/:id/subscription', async (req: AuthRequest, res) => {
  try {
    const result = await TenantService.updateSubscription(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/clients/:id', async (req: AuthRequest, res) => {
  try {
    const result = await TenantService.updateTenant(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
