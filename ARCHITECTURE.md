# MARRONEX Technical Architecture Document

## Overview

MARRONEX is engineered with a clean layer-separated architecture:

```text
Presentation (React 18 + Tailwind Glassmorphism)
       ↓
REST API (Express TypeScript Controllers & Routes)
       ↓
Application Services (PricingService, ApprovalService, QuotationService, InvoiceService, etc.)
       ↓
Business Engines (Dynamic Pricing Priority, GST Calculation, Custom Fields, Audit)
       ↓
Data Access (Prisma ORM)
       ↓
Persistent Database (SQLite / PostgreSQL)
```

---

## Key Engines & Algorithms

### 1. Dynamic Pricing Engine (`PricingService`)
When a quotation line item is added or recalculated, the backend executes the priority-based resolution algorithm:

1. **Special Customer Negotiated Rate**: Checks for active `SPECIAL_CUSTOMER` rules assigned to the specific customer ID.
2. **Customer Group Rate**: Checks for `CUSTOMER_GROUP` rules assigned to the customer's group.
3. **Quantity Tier Rate**: Checks for `QUANTITY_TIER` rules matching the line item quantity.
4. **Price List Rate**: Checks for `PRICE_LIST` rates.
5. **Standard Product Base Price**: Fallback to product `sellingPrice`.

### 2. Approval Engine (`ApprovalService`)
Evaluates discount percentage threshold rules:
- `0 - 2%`: Auto approve.
- `2 - 5%`: Requires `SALES_MANAGER` role approval.
- `5 - 10%`: Requires `CLIENT_ADMIN` role approval.
- `> 10%`: Special approval required.

All decisions log immutable records into `ApprovalHistory` and `AuditLog`.

### 3. GST & Tax Engine (`InvoiceService`)
Determines intra-state vs inter-state tax breakdown automatically:
- Compares Branch/Company state with Customer state.
- **Intra-state**: Splitting tax into `CGST` (50%) + `SGST` (50%).
- **Inter-state**: Applying `IGST` (100%).

### 4. Custom Field Engine (`CustomFieldService`)
Enables dynamic attribute addition to entities (`CUSTOMER`, `PRODUCT`, `QUOTATION`, `INVOICE`) without code changes or database ALTER statements. Values are persisted in JSON format in `CustomFieldValue`.
