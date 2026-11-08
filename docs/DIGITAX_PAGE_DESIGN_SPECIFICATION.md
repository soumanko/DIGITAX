# DIGITAX — Page Design Specification

**Date:** Sat Nov 07 2026  
**Status:** IMPLEMENTING  
**Design References:** Linear (navigation restraint), Ramp (finance workflows), Stripe (financial analytics), Mercury (banking clarity), Vercel (workspace navigation)

---

## 1. Design Principles Applied

| Principle | Source | Application |
|-----------|--------|-------------|
| Muted navigation that doesn't compete with workspace | Linear | Sidebar uses subtle borders, compact icons, restrained active states |
| Consistent page headers with view controls | Linear/Vercel | PageHeader component with title, description, breadcrumbs, action |
| Compact, purposeful iconography | Linear | Lucide icons at 16px-20px, consistent stroke weight |
| Softer separators and restrained borders | Linear | 1px borders, subtle surface-tertiary backgrounds, no heavy shadows |
| Strong information hierarchy | Stripe | H1 page titles, section headings, descriptive body text |
| Information density without visual clutter | Linear/Ramp | Compact tables, chip-based filters, inline actions |
| Financial clarity: numbers as hero | Mercury | Tabular figures, large monetary values, +/- color coding |
| Workflow-oriented finance interfaces | Ramp | Status badges, contextual actions, review workflows |
| Reporting periods and filters | Stripe | Period selectors, filter chips, date ranges |
| Traceable AI responses | GNANI/Mercury | Source citations, confidence scores, confirmation-based actions |

---

## 2. Application Shell (AppShell)

### Sidebar Navigation
- **Left sidebar** (w-64, collapsible to icons-only)
- **Linear-inspired**: Muted active states, softer separators, compact icon sizes (h-4 w-4)
- **Navigation groups**: Core (Dashboard, Documents, Transactions, Reconciliation), Compliance (GST Workspace, AI Assistant, Review Center), Reports (Exports), Settings
- **Business selector** in sidebar footer with GSTIN display
- **Theme switcher** with theme icon

### Top Navigation
- **Sticky top bar** (h-14) with page context, theme switcher
- **Mobile hamburger** menu (lg:hidden)
- **Breadcrumbs** shown in PageHeader component, not top nav

### Theme Support
- Light theme: Cool off-white (#f8fafc), white surfaces, deep navy text (#0f172a)
- Dark theme: Midnight navy (#0a0f1a), charcoal surfaces (#111827), near-white text (#f8fafc)
- Electric teal accents (#14b8a6) for primary actions

---

## 3. Page-by-Page Design Mapping

### 3.1 Dashboard — Financial Command Centre
**References:** Stripe financial analytics + Mercury account clarity + original DIGITAX composition

```
┌─────────────────────────────────────────────────────────────┐
│ Page Header                                                 │
│  [Breadcrumbs: Dashboard]                                   │
│  [H1: Financial Command Centre] [Action: Upload Document]   │
├─────────────────────────────────────────────────────────────┤
│ Compliance Banner                                           │
│  [ShieldCheck] "Filing Review Mode — preparatory figures"   │
├─────────────────────────────────────────────────────────────┤
│ Hero KPI Cards (2 columns desktop, 1 mobile)               │
│  [Total Revenue] [Total Expenses]                           │
├─────────────────────────────────────────────────────────────┤
│ Secondary KPI Cards (4 columns)                             │
│  [Outstanding Receivables] [Outstanding Payables]           │
│  [Pending Review] [Unmatched Transactions]                  │
├─────────────────────────────────────────────────────────────┤
│ Main Grid (2 columns desktop)                               │
│ Left: Recent Invoices Table  | Right: GNANI Insights +     │
│                               | Quick Actions               │
└─────────────────────────────────────────────────────────────┘
```

**Key components:** StatCard (varied sizes), DataTable, GNANI insights widget, quick actions grid

### 3.2 Documents — Document Intelligence Workspace
**References:** Ramp document workflows

```
┌─────────────────────────────────────────────────────────────┐
│ Page Header                                                 │
│  [Breadcrumbs: Dashboard > Documents]                       │
│  [H1: Document Intelligence] [Upload Document button]       │
├─────────────────────────────────────────────────────────────┤
│ Filter Bar: Search + Status Chips + Type Chips + View Mode │
├─────────────────────────────────────────────────────────────┤
│ Document View (List or Grid toggle)                         │
│  List: Table with file icon, name, type, status badge,     │
│       size, date, actions (download, delete)                │
│  Grid: Cards with file icon, name, type, status, download  │
└─────────────────────────────────────────────────────────────┘
```

**Key components:** DocumentStatusBadge, DocumentTypeIcon, list/grid toggle, signed URL download

### 3.3 Transactions — Banking Transaction Ledger
**References:** Mercury financial ledger

```
┌─────────────────────────────────────────────────────────────┐
│ Page Header                                                 │
│  [Breadcrumbs: Dashboard > Transactions]                    │
│  [H1: Bank Transactions] [Import Statement button]          │
├─────────────────────────────────────────────────────────────┤
│ Balance Summary Strip (Mercury-inspired)                    │
│  [Available Balance: +₹X,XX,XXX.XX] [Credits +₹X] [Debits −₹X]│
├─────────────────────────────────────────────────────────────┤
│ Filter Bar: Search + Type Chips (All/Credit/Debit/Unmatched)│
├─────────────────────────────────────────────────────────────┤
│ Transaction Table                                           │
│  [Date] [Description] [Reference] [Direction Badge] [Amount]│
│  [Reconciliation Status] [View Details]                     │
└─────────────────────────────────────────────────────────────┘
```

**Key components:** DirectionBadge (credit green +, debit red −), ReconciliationStatusBadge, signed URL download

### 3.4 Reconciliation — Two-Panel Matching Interface
**References:** Purpose-built matching interface

```
┌─────────────────────────────────────────────────────────────┐
│ Page Header                                                 │
│  [Breadcrumbs: Dashboard > Reconciliation]                  │
│  [H1: Bank Reconciliation]                                  │
├─────────────────────────────────────────────────────────────┤
│ Summary Strip: [Matched Count] [Unmatched Count] [Match Rate]│
├─────────────────────────────────────────────────────────────┤
│ Match Suggestions (Split Panel)                             │
│  [Invoice Left | Transaction Right | Confidence % | Actions]│
│  [Confirm Button (green)] [Reject Button (red)]            │
├─────────────────────────────────────────────────────────────┤
│ Reconciliation History                                      │
│  [Date] [Transaction] [Invoice] [Amount] [Actor] [Status]  │
└─────────────────────────────────────────────────────────────┘
```

**Key components:** MatchCard (split panel), confidence score, confirm/reject actions

### 3.5 GST Workspace — Tax Operations
**References:** Stripe reporting clarity + original Indian tax

```
┌─────────────────────────────────────────────────────────────┐
│ Page Header                                                 │
│  [Breadcrumbs: Dashboard > GST]                             │
│  [H1: GST Workspace] [Save Summary button]                  │
├─────────────────────────────────────────────────────────────┤
│ Period Selector: [Year] [Month] [ITC Offset Badge]         │
├─────────────────────────────────────────────────────────────┤
│ KPI Cards (4): [Output Tax] [ITC] [Net GST Liability]      │
│                                    [Taxable Value]         │
├─────────────────────────────────────────────────────────────┤
│ Tabs: [GSTR-3B] [GSTR-1]                                    │
├─────────────────────────────────────────────────────────────┤
│ Tab Content: Metric rows with labels and values             │
│  [Outward Supplies] [Input Tax Credit] [Net Tax Payable]    │
├─────────────────────────────────────────────────────────────┤
│ Filing Status: [Human review notice] [Export buttons]      │
└─────────────────────────────────────────────────────────────┘
```

**Key components:** PeriodSelector, MetricRow, GSTR3BSummary, GSTR1Summary

### 3.6 GNANI AI Assistant — AI Financial Intelligence
**References:** Original AI workspace, Linear restraint

```
┌─────────────────────────────────────────────────────────────┐
│ Page Header                                                 │
│  [Breadcrumbs: Dashboard > AI Assistant]                    │
│  [H1: GNANI EVON V3.3] [Language Badge]                     │
├─────────────────────────────────────────────────────────────┤
│ Chat Messages (scrollable)                                  │
│  [User Bubble] [Assistant Bubble with Sparkles icon]        │
│  [Thinking State] [Error State]                             │
├─────────────────────────────────────────────────────────────┤
│ Input Area (sticky bottom)                                  │
│  [Language Select] [Text Input] [Send Button]               │
│  [Suggested Questions Chips]                                │
└─────────────────────────────────────────────────────────────┘
```

**Key components:** MessageBubble (user vs assistant styling), language selector, suggested questions, gradient background overlay

### 3.7 Exports — Reporting Centre
**References:** Stripe reporting

```
┌─────────────────────────────────────────────────────────────┐
│ Page Header                                                 │
│  [Breadcrumbs: Dashboard > Exports]                         │
│  [H1: Exports & Reports]                                    │
├─────────────────────────────────────────────────────────────┤
│ Info Banner: [ShieldCheck] "Export for Review, Not Filing"│
├─────────────────────────────────────────────────────────────┤
│ Export Grid (3 columns desktop)                             │
│  [Export Card: GSTR-3B Summary] [Export Card: GSTR-1 JSON] │
│  [Export Card: Sales Register] [Export Card: Purchase Register]│
│  [Export Card: Transaction Register] [Export Card: CA Audit Package]│
└─────────────────────────────────────────────────────────────┘
```

**Key components:** ExportCard (with period badge), compliance banner

### 3.8 Settings — Account & Business Configuration
**References:** Linear settings restraint

```
┌─────────────────────────────────────────────────────────────┐
│ Page Header                                                 │
│  [Breadcrumbs: Dashboard > Settings]                        │
├─────────────────────────────────────────────────────────────┤
│ Tabs: [Profile] [Business] [Security] [Language]            │
├─────────────────────────────────────────────────────────────┤
│ Tab Content                                                 │
│  [Form fields with labels, inputs, validation]              │
│  [Save button] [Reset button]                               │
└─────────────────────────────────────────────────────────────┘
```

**Key components:** Tab navigation, GSTIN with IN prefix, MFA management, language selection

### 3.9 Authentication Pages
**References:** Stripe auth patterns

```
Login: [DIGITAX Logo] [Sign in to your shop] [Register link]
       [Card: Email | Password (toggle) | Sign In button]
       [Divider: Or instant review access] [Demo Business button]
       [Footer: Secured with row-level security & audit trail]

Register: [DIGITAX Logo] [Create your business account]
          [Card: Business Name | GSTIN | Email | Password | Confirm]
          [Create Account button] [Already have account? Sign in]
```

**Key components:** Password toggle, GSTIN validation, demo session

---

## 4. Component Specifications

### StatCard
- Props: title, value, subtitle, trend (value, direction, label), icon, variant
- Variants: default, accent, success, warning, error
- Layout: title + icon top-left, value large mono font, trend indicator bottom

### DataTable
- Props: columns, data, className
- Features: header row, data rows, empty state, custom render functions
- Styling: text-sm, hover:bg-surface-secondary, divide-y

### Badge
- Variants: default, primary, secondary, success, warning, error, destructive, accent, outline
- Sizes: sm, md
- Use: status indicators, payment direction, reconciliation status

### EmptyState
- Props: icon, title, description, action
- Use: no data states with actionable CTAs

### Skeleton
- Props: variant (text, circle, rect), width, height
- Use: loading states for dashboards, tables

---

## 5. What Was NOT Changed (Backend Preservation)

| Component | Status |
|-----------|--------|
| Supabase Auth | Preserved |
| RLS / Tenant Isolation | Preserved |
| API Endpoints | Preserved |
| Business Switching | Preserved |
| decimal.js | Preserved |
| GST Engine | Preserved |
| Document Storage | Preserved |
| CSRF Protection | Preserved |
| Rate Limiting | Preserved |
| Audit Logging | Preserved |
| Database Migrations | Preserved |

---

## 6. Remaining Implementation Notes

- No mock financial data introduced
- No fake API responses
- No fabricated chart values
- No false filing/certification claims
- All data comes from real API layer
- Theme switching via ThemeProvider with localStorage persistence
- All pages use AppShell for consistent shell
