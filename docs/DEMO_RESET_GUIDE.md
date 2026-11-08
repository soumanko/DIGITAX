# DIGITAX Demo Reset Guide

**Date:** Sat Nov 07 2026  
**Status:** COMPLETE  
**Scope:** Procedures for resetting demo business data

---

## 1. Overview

This guide describes how to reset the demo business data to its original state. The reset process is idempotent and can be run safely multiple times without affecting production data.

---

## 2. Reset Architecture

The reset process follows this order:

1. Delete reconciliation matches (depends on invoices/transactions)
2. Delete invoice items (depends on invoices)
3. Delete invoices
4. Delete transactions
5. Delete documents
6. Delete GST summaries
7. Delete filing periods
8. Delete review issues
9. Delete audit events
10. Delete shop members
11. Delete shops

This order respects foreign key constraints and ensures no orphaned records.

---

## 3. Reset Methods

### Method 1: Master Seed Script (Recommended)

Run the master seed script with the `--reset` flag:

```bash
npx tsx scripts/seed-all-demo.ts --reset
```

This script:
1. Verifies database connectivity
2. Deletes all demo data for both shops
3. Prepares for fresh seeding

After reset, run the individual seed scripts in order:

```bash
# 1. Create shops and users
npx tsx scripts/seed-demo-businesses.ts

# 2. Seed customer data
npx tsx scripts/seed-customers.ts

# 3. Seed supplier data
npx tsx scripts/seed-suppliers.ts

# 4. Seed FreshMart invoices
npx tsx scripts/seed-invoices.ts

# 5. Seed GrandMart invoices
npx tsx scripts/seed-grandmart-invoices.ts

# 6. Seed transactions
npx tsx scripts/seed-transactions.ts

# 7. Seed documents
npx tsx scripts/seed-documents.ts

# 8. Seed reconciliation matches
npx tsx scripts/seed-reconciliation.ts

# 9. Seed GST summaries
npx tsx scripts/seed-gst-summaries.ts

# 10. Run validation
npx tsx scripts/validate-demo.ts
```

### Method 2: Individual Seed Scripts

Each seed script can be run independently:

```bash
# Reset only
npx tsx scripts/seed-all-demo.ts --reset

# Re-seed specific business
npx tsx scripts/seed-invoices.ts    # FreshMart
npx tsx scripts/seed-grandmart-invoices.ts  # GrandMart
```

### Method 3: Manual SQL Reset (Advanced)

For direct database access:

```sql
-- Delete in dependency order
DELETE FROM reconciliation_matches WHERE shop_id IN ('shop-freshmart-001', 'shop-grandmart-002');
DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE shop_id IN ('shop-freshmart-001', 'shop-grandmart-002'));
DELETE FROM invoices WHERE shop_id IN ('shop-freshmart-001', 'shop-grandmart-002');
DELETE FROM transactions WHERE shop_id IN ('shop-freshmart-001', 'shop-grandmart-002');
DELETE FROM documents WHERE shop_id IN ('shop-freshmart-001', 'shop-grandmart-002');
DELETE FROM gst_summaries WHERE shop_id IN ('shop-freshmart-001', 'shop-grandmart-002');
DELETE FROM filing_periods WHERE shop_id IN ('shop-freshmart-001', 'shop-grandmart-002');
DELETE FROM review_issues WHERE shop_id IN ('shop-freshmart-001', 'shop-grandmart-002');
DELETE FROM audit_events WHERE shop_id IN ('shop-freshmart-001', 'shop-grandmart-002');
DELETE FROM shop_members WHERE shop_id IN ('shop-freshmart-001', 'shop-grandmart-002');
DELETE FROM shops WHERE id IN ('shop-freshmart-001', 'shop-grandmart-002');
```

---

## 4. Safety Guards

### Production Protection

The reset script includes production guards:

```typescript
const isProd = process.env.NODE_ENV === 'production';
if (isProd && !isReset) {
  console.error('ERROR: Demo seeding is not allowed in production without --reset flag');
  process.exit(1);
}
```

This prevents accidental execution in production environments.

### Idempotency

The reset process is idempotent:
- Running reset multiple times produces the same result
- Deleting non-existent records is a no-op
- Seed scripts check for existing records before creating

### Data Safety

| Protection | Implementation |
|------------|---------------|
| Production data protection | Shop IDs are hardcoded to demo IDs only |
| No production shop deletion | Only `shop-freshmart-001` and `shop-grandmart-002` are affected |
| Audit event preservation | Demo audit events are deleted (they belong to demo shops) |
| Foreign key integrity | Deletion order respects FK constraints |

---

## 5. Reset Validation

After reset, verify the data is clean:

```bash
# Check shops are deleted
npx tsx -e "
import { createServiceClient } from '@/lib/supabase/server';
const supabase = createServiceClient();
const { data } = await supabase.from('shops').select('id, name');
console.log('Remaining shops:', data);
"
```

Expected output: Empty array or no demo shops.

---

## 6. Reset Frequency Recommendations

| Scenario | Frequency |
|----------|-----------|
| Demo usage testing | After each demo session |
| Automated testing | Before each test run |
| Data corruption | Immediate reset |
| Monthly maintenance | Monthly |
| Before production deploy | Never (demo data separate) |

---

## 7. Troubleshooting

### Issue: Reset fails with foreign key violation

**Cause:** Deletion order violated  
**Solution:** Use the master seed script which handles order correctly

### Issue: Shop not found after reset

**Cause:** Shop was deleted but auth user still exists  
**Solution:** Re-run seed-demo-businesses.ts to recreate

### Issue: Validation fails after reset

**Cause:** Seed scripts not run after reset  
**Solution:** Run all seed scripts in order

### Issue: Cannot connect to database

**Cause:** Supabase credentials not configured  
**Solution:** Set up `.env.local` with Supabase URL and keys

---

## 8. Reset Script Locations

| File | Path | Purpose |
|------|------|---------|
| Master Reset | `scripts/seed-all-demo.ts` | Orchestrates all seed scripts |
| Business Reset | `scripts/seed-demo-businesses.ts` | Creates/deletes shops |
| Validation | `scripts/validate-demo.ts` | Validates demo data integrity |

---

## 9. Safety Checklist

Before running reset:

- [ ] Confirm you are NOT in production environment
- [ ] Confirm you have Supabase credentials configured
- [ ] Confirm you understand demo data will be deleted
- [ ] Confirm no real business data uses these shop IDs

After reset:

- [ ] Run validation script
- [ ] Verify shop counts (should be 0 after reset, 2 after re-seed)
- [ ] Test business isolation
- [ ] Verify frontend pages load correctly

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 07 2026 | Initial reset guide |
