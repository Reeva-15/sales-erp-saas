# MARRONEX Sales ERP SaaS

### *Sell smarter. Operate beautifully.*

**MARRONEX** is a production-ready, scalable, multi-tenant Sales ERP SaaS platform engineered with Apple/Linear-inspired glassmorphism UI and a clean TypeScript architecture.

---

## 🌟 Key Features

### 🏢 1. Strict Multi-Tenant Architecture
- Backend-authoritative tenant context resolution (`req.tenantId`).
- Automatic query scoping protecting cross-tenant data.
- Built-in tenant-isolation test suite (`npm run test:e2e`).

### 👑 2. SaaS Main Admin Portal
- Onboard client tenants with custom trial periods and initial credentials.
- Enable or disable ERP modules per customer configuration-driven.
- Platform-wide user metrics & usage analytics.

### 💼 3. Client Admin & Organization Setup
- Company, Branch, and Department configuration.
- Scope-aware Role-Based Access Control (`OWN`, `TEAM`, `DEPARTMENT`, `BRANCH`, `COMPANY`, `TENANT`).
- Configurable users & roles.

### 💰 4. Authoritative Dynamic Pricing Engine
- Configurable rule priorities:
  1. **Special Customer Negotiated Rate**
  2. **Customer Group Price**
  3. **Volume Quantity Tier**
  4. **Price List Rate**
  5. **Standard Product Price**
- Calculated authoritatively on backend APIs.

### 📜 5. Quotation & Approval Engine
- Commercial quotation creation with real-time pricing preview.
- Configurable approval rules based on discount thresholds (e.g. 0-2% Auto approve, 2-5% Sales Manager, >5% Client Admin).
- Full approval history trail.
- Inline PDF generation with client branding & logo.

### 🛒 6. Sales Pipeline (Order → Invoice → Payment)
- One-click conversion from approved Quotations to Sales Orders.
- Conversion from Sales Orders to Tax Invoices.
- GST Tax Engine calculating intra-state (CGST + SGST) vs inter-state (IGST) tax automatically based on Branch state vs Customer state.
- Recording customer payments & tracking outstanding balances.

### 📊 7. BI Analytics & Reports Suite
- Sales Summary, Customer-wise Revenue, Product Sales, and Outstanding Aging Bins (0-30, 31-60, 61-90, 90+ Days).
- Executive Sales Funnel & KPI cards.

### ⚙️ 8. Dynamic Custom Fields & Audit Logs
- Schema-free custom field creation per entity (`CUSTOMER`, `PRODUCT`, `QUOTATION`, `INVOICE`).
- Append-only audit logger tracking logins, approvals, pricing modifications, and document creations.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (Recommended v20+)
- **npm**: v9+

### Installation & Database Setup
```bash
# 1. Install root & server dependencies
npm install

# 2. Install client dependencies
npm install --prefix client

# 3. Generate Prisma Client & Sync Database
npx prisma generate
npx prisma db push

# 4. Seed Database with Default Main Admin & Demo Client (ABC Industries)
npm run prisma:seed
```

### Running Development Servers
```bash
# Run both Backend Server (port 5000) and React Client (port 3000) concurrently
npm run dev
```

### Running Comprehensive E2E & Security Test Suite
```bash
npm run test:e2e
```

---

## 🔑 Default Login Credentials

| Role | Username / Email | Password | Environment |
| :--- | :--- | :--- | :--- |
| **SaaS Main Admin** | `mainadmin` / `admin@marronex.com` | `Admin@123` | SaaS Main Admin Portal |
| **Client Admin** | `clientadmin` / `rahul@abcindustries.com` | `Client@123` | ABC Industries Tenant |
| **Sales Manager** | `salesmanager` / `vikram@abcindustries.com` | `Client@123` | ABC Industries Tenant |

---

## 📁 Repository Architecture

```text
d:\sales erp saas\
 ├── package.json               # Root monorepo scripts & dependencies
 ├── prisma/
 │    └── schema.prisma         # Multi-tenant relational Prisma schema
 ├── server/
 │    ├── src/
 │    │    ├── config/          # JWT & system configuration
 │    │    ├── middleware/      # Auth, tenant isolation & RBAC permission guards
 │    │    ├── services/        # Dynamic Pricing, Quotations, Invoices, Payments, PDF & Audit
 │    │    ├── routes/          # Express API route modules
 │    │    ├── seed.ts          # Database seed script
 │    │    └── tests/           # E2E Sales pipeline & tenant isolation test
 │    └── index.ts              # Express HTTP server
 └── client/
      ├── src/
      │    ├── components/      # Glassmorphic UI elements, DataTable, StatusBadge, PDFModal
      │    ├── pages/           # Main Admin, Client Dashboard, Masters, Sales Pipeline & Reports
      │    ├── services/        # Centralized API client with JWT headers
      │    └── App.tsx          # React router & protected layouts
```
