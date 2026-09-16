import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'marronex-super-secret-saas-jwt-key-2026',
  JWT_EXPIRES_IN: '24h',
  BRAND_NAME: 'MARRONEX',
  TAGLINE: 'Sell smarter. Operate beautifully.'
};
