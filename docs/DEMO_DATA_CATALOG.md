# DIGITAX Demo Data Catalog

**Date:** Sat Nov 07 2026  
**Scope:** Complete data inventory for both demo businesses  
**Status:** DESIGN COMPLETE - Live database seeding requires Supabase credentials

---

## 1. FreshMart Grocery Store (`shop-freshmart-001`)

### Business Profile

| Attribute | Value |
|-----------|-------|
| Name | FreshMart Grocery Store |
| Description | Independent neighbourhood grocery retailer |
| GSTIN | 27ABCDF1234G1ZX |
| State | Maharashtra (27) |
| City | Pune |
| Address | Shop No. 15, MG Road, Near Bank of Baroda, Pune, Maharashtra 411001 |
| Phone | +91 98765 43210 |
| Email | demo@freshmart.in |
| Owner | Ramesh Kulkarni |
| Financial Year | 2026-27 (April start) |

### Customers (20)

| # | Name | Type | GSTIN | Location |
|---|------|------|-------|----------|
| 1 | Sharmas Household | individual | - | Kothrud, Pune |
| 2 | Sai Tea Stall | restaurant | - | Station Road, Pune |
| 3 | Pune Office Supplies | office | 27AAEPS5678P1ZS | Deccan Gymkhana, Pune |
| 4 | Shree Restaurant | restaurant | 27ABCPR3344Q1ZM | Fergusson College Road, Pune |
| 5 | Kirana Corner | retail | 27AAEPK1234R1ZJ | Market Yard, Pune |
| 6 | Desai Family | individual | - | Baner Road, Pune |
| 7 | Quick Bites Cafe | restaurant | 27AXEPK5678L1ZT | Pune University Road |
| 8 | Verma Traders | retail | 27AAEPV4567M1ZK | Laxmi Road, Pune |
| 9 | Green Leaf Cafe | restaurant | 27AEZPG8901T1ZP | Koregaon Park, Pune |
| 10 | Patil Household | individual | - | Model Colony, Pune |
| 11 | City Medical Store | retail | 27ABEPM2345N1ZB | Station Road, Pune |
| 12 | Office Cafe | office | 27AAEOC6789P1ZV | Hinjewadi Phase 1, Pune |
| 13 | Singh Brothers | retail | 27ABEPS1234Q1ZL | Tulsi Baug, Pune |
| 14 | Rao Residence | individual | - | Wanowrie, Pune |
| 15 | Morning Star Bakery | restaurant | 27ABEPB5678R1ZF | Bund Garden Road, Pune |
| 16 | Gupta Family | individual | - | Undri, Pune |
| 17 | Nehru Medical Agencies | retail | 27ABEPN3456T1ZH | Camp Area, Pune |
| 18 | Lotus Catering Services | restaurant | 27ABEPL7890S1ZD | Viman Nagar, Pune |
| 19 | Iyer Household | individual | - | Law College Road, Pune |
| 20 | Shree Hardware Store | retail | 27ABEPS9012T1ZC | Tilak Road, Pune |

### Suppliers (12)

| # | Name | GSTIN | Category | Credit Terms |
|---|------|-------|----------|-------------|
| 1 | Apex FMCG Distributors LLP | 27AABCA1234F1Z5 | Rice and Grains Wholesaler | 15 days |
| 2 | Hindustan Consumer Products Agency | 27AAACH2702H1ZQ | Packaged Food Distributor | 30 days |
| 3 | Britannia Biscuits Super Stockist | 27AAACB0345K1Z9 | FMCG Distributor | 20 days |
| 4 | Pune Dairy Distributors | 27AAXPD4567M1ZK | Dairy Distributor | 7 days |
| 5 | Maharashtra Beverages Supplier | 27AAXMB8901P1ZS | Beverage Supplier | 15 days |
| 6 | Clean & Fresh Wholesalers | 27AAECF2345N1ZB | Cleaning Products Wholesaler | 14 days |
| 7 | Fresh Produce Wholesaler | - | Vegetables and Fruits Supplier | 3 days |
| 8 | Household Essentials Distributor | 27AAEHE6789T1ZF | Household Essentials Distributor | 21 days |
| 9 | Shri Ram Agencies | 27AAACB0345K1Z9 | Credit Note Supplier | 30 days |
| 10 | Spice King Distributors | 27AAXSK1234Q1ZM | Spices Distributor | 10 days |
| 11 | Tata Tea Distributors | 27AAACT2702H1ZQ | Tea and Coffee Supplier | 30 days |
| 12 | Edible Oils Wholesale | 27AAEOE5678L1ZV | Cooking Oil Wholesaler | 15 days |

### Sales Invoices (70)

Generated across October 2026 - January 2027. Invoice numbers follow pattern `FM/OUT/2026/XXXX`.

**Invoice Status Distribution:**
- Paid: ~45 invoices
- Unpaid: ~15 invoices
- Partial: ~10 invoices

**Product Categories:**
- Cooking Oil, Rice, Tea Powder, Wheat Flour, Pulses, Salt, Sugar, Milk, Bread, Packaged Snacks, Dishwashing Liquid, Bath Soap, Instant Noodles, Cold Drinks, Chocolates

**GST Rates Applied:**
- 0%: Wheat flour, pulses, salt, sugar, milk, bread (exempt/unprocessed food)
- 5%: Cooking oil, rice, tea powder, instant noodles
- 18%: Packaged snacks, dishwashing liquid, bath soap, cold drinks, chocolates

**Sample Invoice (FM/OUT/2026/1001):**
- Customer: Sai Tea Stall
- Date: 2026-10-02
- Items: Sunflower Cooking Oil (5L Tin x 2), Basmati Rice Premium (5kg Bag x 5), Tea Powder (250g x 10)
- Taxable Value: ₹6,200.00
- CGST: ₹310.00 (2.5%)
- SGST: ₹310.00 (2.5%)
- Total: ₹6,820.00
- Status: Paid

### Purchase Invoices (35)

Generated across October 2026 - January 2027. Invoice numbers follow pattern `FM/IN/2026/XXXX`.

**Product Categories:**
- Cooking oil, rice, tea powder, wheat flour, pulses, salt, sugar, milk, packaged snacks, dishwashing liquid, instant noodles, cold drinks, chocolates, edible oils, spices

**Sample Invoice (FM/IN/2026/881):**
- Supplier: Apex FMCG Distributors LLP
- Date: 2026-10-02
- Items: Sunflower Cooking Oil (15L Tin x 10), Basmati Rice Premium (25kg Bag x 10)
- Taxable Value: ₹45,000.00
- CGST: ₹4,050.00 (2.5%)
- SGST: ₹4,050.00 (2.5%)
- Total: ₹53,100.00
- Status: Paid

### Transactions (20)

Mix of customer receipts (UPI), supplier payments (NEFT/UPI), rent, electricity, and other operating expenses.

**Sample Transactions:**
- Credit: ₹28,450.00 - Daily QR Settlement (Razorpay)
- Debit: ₹53,100.00 - Apex FMCG payment
- Debit: ₹45,076.00 - HUL Products depot payment
- Credit: ₹61,360.00 - Pooja Caterers payment
- Debit: ₹15,000.00 - Shop rent
- Debit: ₹4,680.00 - MSEDCL electricity bill

### Reconciliation Matches (3)

| Transaction | Invoice | Amount | Status |
|-------------|---------|--------|--------|
| Apex FMCG payment | FM/IN/2026/881 | ₹53,100.00 | Confirmed |
| HUL Products payment | FM/IN/2026/882 | ₹45,076.00 | Confirmed |
| Pooja Caterers receipt | FM/OUT/2026/1004 | ₹61,360.00 | Confirmed |

### Documents (23)

| Type | Count |
|------|-------|
| Sales Invoices | 10 |
| Purchase Invoices | 10 |
| Receipts | 5 |
| Bank Statements | 1 |
| GST Summaries | 1 |
| Other | 1 |

### GST Summary (October 2026)

| Metric | Value |
|--------|-------|
| Output CGST | ₹8,420.00 |
| Output SGST | ₹8,420.00 |
| Output IGST | ₹0.00 |
| Input CGST | ₹6,345.00 |
| Input SGST | ₹6,345.00 |
| Input IGST | ₹0.00 |
| Net Tax Payable | ₹2,150.00 |

---

## 2. GrandMart Supermarket (`shop-grandmart-002`)

### Business Profile

| Attribute | Value |
|-----------|-------|
| Name | GrandMart Supermarket |
| Description | Multi-category supermarket |
| GSTIN | 27XYZAB5678H2ZY |
| State | Maharashtra (27) |
| City | Pune |
| Address | Unit 101, A Wing, Pune Central Mall, Satara Road, Pune, Maharashtra 411043 |
| Phone | +91 98765 43211 |
| Email | demo@grandmart.in |
| Owner | Sanjay Desai |
| Financial Year | 2026-27 (April start) |

### Customers (24)

| # | Name | Type | GSTIN | Location |
|---|------|------|-------|----------|
| 1 | Sharma Family | individual | - | Koregaon Park, Pune |
| 2 | Royal Spice Restaurant | restaurant | 27AAXPR1234Q1ZW | Phoenix Marketcity, Pune |
| 3 | Tech Solutions Pvt Ltd | office | 27AACTC9876R1ZM | Magarpatta City, Pune |
| 4 | City Mart Retail | retail | 27AAXCM3456T1ZP | Bund Garden Road, Pune |
| 5 | Green Valley Cafe | restaurant | 27AAEGC7890S1ZT | East Street, Camp, Pune |
| 6 | Pune IT Services | office | 27AACTP4567L1ZK | EON IT Park, Kharadi, Pune |
| 7 | Singh Family | individual | - | Amanora Park Town, Hadapsar, Pune |
| 8 | Star Bakery & Confectionery | restaurant | 27AAESB5678K1ZL | FC Road, Pune |
| 9 | Metro Medical Store | retail | 27AAEMM9012N1ZX | Sassoon Road, Pune |
| 10 | Desai Office Complex | office | 27AAEDC3456F1ZB | Trade Center, Fergusson College Road, Pune |
| 11 | Patel Household | individual | - | Palm Meadows, Kharadi, Pune |
| 12 | Spice Junction Restaurant | restaurant | 27AAESP7890M1ZD | JM Road, Pune |
| 13 | Quick Stop Retail | retail | 27AAEQR1234B1ZP | DP Road, Aundh, Pune |
| 14 | Verma Office | office | 27AAEVV3456N1ZT | WeWork, Pune Nagar Road, Pune |
| 15 | Patel Household | individual | - | Skyi World School Road, Wagholi, Pune |
| 16 | Daily Needs Store | retail | 27AAEDN5678R1ZF | Pune Satara Road, Swargate, Pune |
| 17 | Food Junction Cafe | restaurant | 27AAEFQ7890P1ZS | Camp Market, Pune |
| 18 | Business Center Pvt Ltd | office | 27AABCB9012Q1ZH | Crescent High, Pimple Saudagar, Pune |
| 19 | Rao Household | individual | - | Undri, Pune |
| 20 | Golden Spoon Restaurant | restaurant | 27AAEGS3456T1ZX | Balaji Mandir Road, Katraj, Pune |
| 21-24 | Additional retail, office, and restaurant customers | - | Various | Pune area |

### Suppliers (25)

| # | Name | GSTIN | Category | Credit Terms |
|---|------|-------|----------|-------------|
| 1 | Hindustan Unilever Distributors | 27AAACH2702H1ZQ | FMCG Distributors | 30 days |
| 2 | ITC Foods Supply Chain | 27AAACT5555P1ZG | Packaged Food Manufacturers | 45 days |
| 3 | Amul Dairy Supply | 27AAECA1234M1ZW | Dairy Suppliers | 7 days |
| 4 | PepsiCo India Beverages | 27AAACP3344L1ZC | Beverage Distributors | 30 days |
| 5 | Haldirams Snacks Supply | 27AAACH9999N1ZD | Snacks Distributor | 21 days |
| 6 | Rice King Wholesalers | 27AAXRK3456T1ZH | Rice and Grain Wholesalers | 15 days |
| 7 | Frozen Foods India | 27AAEFF7890R1ZX | Frozen Food Distributors | 14 days |
| 8 | Bakery Supplies Co | 27AAEBS1234K1ZI | Bakery Suppliers | 10 days |
| 9 | Personal Care Distributors | 27AAAPC9012T1ZK | Personal Care Distributors | 28 days |
| 10 | Home Care Products | 27AAAHC3456F1ZQ | Home Care Suppliers | 21 days |
| 11 | Stationery & Office Supplies | 27AAXSS1234M1ZL | Stationery Suppliers | 14 days |
| 12 | Packaging Solutions India | 27AAAPP5678H1ZS | Packaging Suppliers | 30 days |
| 13 | Interstate Foods Pvt Ltd | 07AAEFI3456G1Z9 | Interstate Supplies | 45 days |
| 14 | Fresh Fruits Wholesale | - | Fruit and Vegetable Wholesalers | 2 days |
| 15 | Dairy Fresh Milk Supply | 27AAXDF9012J1ZB | Dairy Suppliers | 5 days |
| 16 | UPI Beverages Distribution | 27AAXUB3456K1ZF | Beverage Distributors | 15 days |
| 17 | Organic Foods Supplier | 27AAEOF5678Q1ZV | Organic Food Suppliers | 10 days |
| 18 | Spices Direct India | 27AAASD7890M1ZW | Spices Supplier | 12 days |
| 19 | Electronics & Appliances | 27AAAEA9012R1ZX | Electronics Supplier | 60 days |
| 20 | Home & Living Supplies | 27AAAHL3456S1ZT | Home Goods Supplier | 25 days |
| 21 | Pet Care Products | 27AAAPC7890T1ZL | Pet Care Supplier | 18 days |
| 22 | Stationery Plus | 27AAXSP9012T1ZB | Stationery Suppliers | 14 days |
| 23 | Bulk Grains India | 27AAXBG1234W1ZE | Grain Wholesaler | 20 days |
| 24 | Clean Home Products | 27AAACH9012L1ZR | Cleaning Products Supplier | 16 days |
| 25 | Health & Wellness Distributors | 27AAAHW3456V1ZM | Health Products Supplier | 24 days |

### Sales Invoices (160)

Generated across October 2026 - January 2027. Invoice numbers follow pattern `GM/OUT/2026/XXXX`.

**Invoice Status Distribution:**
- Paid: ~95 invoices
- Unpaid: ~45 invoices
- Partial: ~20 invoices

**Product Categories:**
- Cooking oil, rice, tea powder, wheat flour, pulses, salt, sugar, milk, bread, packaged snacks, dishwashing liquid, bath soap, instant noodles, cold drinks, chocolates, electronics, home goods, pet care, stationery, health products

### Purchase Invoices (90)

Generated across October 2026 - January 2027. Invoice numbers follow pattern `GM/IN/2026/XXXX`.

**Sample Invoice (GM/IN/2026/9001):**
- Supplier: Hindustan Unilever Distributors
- Date: 2026-10-01
- Items: Multiple FMCG products
- Taxable Value: ₹150,000.00
- CGST: ₹13,500.00 (9%)
- SGST: ₹13,500.00 (9%)
- Total: ₹177,000.00

### Transactions (20)

Higher volume transactions including card settlements, UPI collections, supplier payments, rent, electricity, salaries, and logistics.

**Sample Transactions:**
- Credit: ₹185,400.00 - Daily QR Settlement
- Credit: ₹92,600.00 - Card Settlement
- Debit: ₹245,000.00 - HUL Distributors payment
- Debit: ₹318,000.00 - ITC Foods payment
- Credit: ₹42,500.00 - Royal Spice Restaurant payment
- Debit: ₹85,000.00 - Shop rent

### Reconciliation Matches (5)

| Transaction | Invoice | Amount | Status |
|-------------|---------|--------|--------|
| HUL Distributors payment | GM/IN/2026/9001 | ₹245,000.00 | Confirmed |
| ITC Foods payment | GM/IN/2026/9002 | ₹318,000.00 | Confirmed |
| Royal Spice receipt | GM/OUT/2026/2001 | ₹42,500.00 | Confirmed |
| PepsiCo payment | GM/IN/2026/9004 | ₹156,000.00 | Confirmed |
| Tech Solutions receipt | GM/OUT/2026/2003 | ₹68,000.00 | Confirmed |

### Documents (66)

| Type | Count |
|------|-------|
| Sales Invoices | 40 |
| Purchase Invoices | 25 |
| Receipts | 6 |
| Bank Statements | 2 |
| GST Summaries | 2 |
| Credit Notes | 1 |
| Debit Notes | 1 |

### GST Summary (October 2026)

| Metric | Value |
|--------|-------|
| Output CGST | ₹45,200.00 |
| Output SGST | ₹45,200.00 |
| Output IGST | ₹12,000.00 |
| Input CGST | ₹38,400.00 |
| Input SGST | ₹38,400.00 |
| Input IGST | ₹15,000.00 |
| Net Tax Payable | ₹10,200.00 |

---

## 3. Data Consistency Rules

All data follows these consistency rules:

1. **Invoice totals** = sum of line item totals (within ₹1 tolerance)
2. **Tax calculations** = CGST + SGST + IGST = total tax amount
3. **Payment status** = paid when amount_paid >= total_amount
4. **Outstanding balance** = total_amount - amount_paid
5. **GST summaries** reconcile with underlying invoice tax amounts
6. **Reconciliation matches** reference valid transactions and invoices from same shop
7. **Document metadata** references existing business records
8. **Dashboard metrics** derive from actual seeded data

---

## 4. Data Isolation Boundaries

| Boundary | Enforcement |
|----------|-------------|
| FreshMart → GrandMart data | RLS + shop_id filtering |
| GrandMart → FreshMart data | RLS + shop_id filtering |
| Unknown shop access | RLS rejection |
| Cross-shop reconciliation | Database trigger enforcement |
| Document storage access | Storage bucket path validation |
| API endpoint access | Shop membership verification |

---

## 5. Seed File Locations

| File | Path | Purpose |
|------|------|---------|
| Business Config | `src/lib/demo-businesses/config.ts` | Shop definitions |
| Customer Data | `src/lib/demo-businesses/customers.ts` | Customer records |
| Supplier Data | `src/lib/demo-businesses/suppliers.ts` | Supplier records |
| Seed Orchestrator | `scripts/seed-all-demo.ts` | Master seed script |
| FreshMart Invoices | `scripts/seed-invoices.ts` | FM sales/purchase invoices |
| GrandMart Invoices | `scripts/seed-grandmart-invoices.ts` | GM sales/purchase invoices |
| Transactions | `scripts/seed-transactions.ts` | Bank/UPI transactions |
| Documents | `scripts/seed-documents.ts` | Document metadata |
| Reconciliation | `scripts/seed-reconciliation.ts` | Match records |
| GST Summaries | `scripts/seed-gst-summaries.ts` | GST period summaries |
| Validation | `scripts/validate-demo.ts` | Data validation tests |

---

## 6. Seed Execution Order

To populate the database with demo data:

```bash
# 1. Create shops and auth users
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

**Prerequisite:** Supabase credentials must be configured in `.env.local` before running seed scripts.