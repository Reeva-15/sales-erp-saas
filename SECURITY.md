# MARRONEX SaaS Security Architecture

## Multi-Tenant Isolation Enforcement

### Non-Negotiable Rule
**Never trust `tenant_id` sent from the frontend.**

### Security Resolution Model
1. **JWT Verification**: Each incoming API request passes through `authenticateToken` middleware.
2. **Backend User Inspection**: User context is fetched from database to verify active status.
3. **Tenant Scoping**: `req.tenantId` is populated strictly from `user.tenantId`.
4. **Database Query Isolation**: Service layer methods inject `where: { tenantId }` into all Prisma queries.

### Cross-Tenant Isolation Guarantee
An authenticated user from Tenant A attempting to access Tenant B resources (e.g. `/api/app/customers/:id` or `/api/app/quotations/:id`) will receive a `403 Forbidden` / `404 Not Found` response because queries require `tenantId: req.tenantId`.

---

## Authentication & Authorization
- Passwords stored using `bcryptjs` (salt round 10).
- JWT signed with secret key and 24h expiration.
- Scope-aware permissions (`OWN`, `TEAM`, `DEPARTMENT`, `BRANCH`, `COMPANY`, `TENANT`).
- Append-only audit log tracking all logins and operations.
