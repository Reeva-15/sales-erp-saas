import express from 'express';
import cors from 'cors';
import { CONFIG } from './config';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import salesRoutes from './routes/sales.routes';
import orgRoutes from './routes/organization.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    brand: CONFIG.BRAND_NAME,
    tagline: CONFIG.TAGLINE,
    time: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/app', salesRoutes);
app.use('/api/org', orgRoutes);

// Global Error Middleware
app.use(errorHandler);

app.listen(CONFIG.PORT, () => {
  console.log(`[MARRONEX Sales ERP Server] Running on http://localhost:${CONFIG.PORT}`);
});

export default app;
