# DIGITAX — Architecture

## System Overview

DIGITAX is a modular monolith built with Next.js App Router, designed for Indian small businesses to organize GST bookkeeping and prepare filing data.

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  Next.js App Router │ React │ Tailwind │ shadcn/ui       │
├─────────────────────────────────────────────────────────┤
│                  Next.js Server                          │
│  Route Handlers │ Server Components │ Middleware          │
├─────────────────────────────────────────────────────────┤
│              Application Services                        │
│  Modules: shops│documents│invoices│transactions│          │
│  reconciliation│gst-engine│assistant│voice│exports        │
├─────────────────────────────────────────────────────────┤
│              External Providers                          │
│  Supabase │ GNANI EVON │ GNANI PRISMA │ GNANI TIMBRE │  │
│  OCR Provider │ Redis/BullMQ                             │
└─────────────────────────────────────────────────────────┘
```

## Dependency Direction

```
UI Components
    → Validated API Routes
        → Application Services
            → Domain Logic / Repositories
                → Database (Supabase PostgreSQL)
                → External Providers (GNANI, OCR)
```

## Directory Structure

```
src/
├── app/
│   ├── (marketing)/          # Public pages (SEO-optimized, server-rendered)
│   │   ├── page.tsx          # Home
│   │   ├── features/
│   │   ├── how-it-works/
│   │   ├── security/
│   │   ├── privacy/
│   │   ├── faq/
│   │   ├── contact/
│   │   └── terms/
│   ├── (auth)/               # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   └── reset-password/
│   ├── (dashboard)/          # Protected application routes
│   │   ├── dashboard/
│   │   ├── documents/
│   │   ├── transactions/
│   │   ├── reconciliation/
│   │   ├── gst/
│   │   ├── assistant/
│   │   ├── review/
│   │   ├── exports/
│   │   ├── settings/
│   │   └── onboarding/
│   ├── api/                  # API Route Handlers
│   │   ├── documents/
│   │   ├── imports/
│   │   ├── transactions/
│   │   ├── reconciliation/
│   │   ├── gst/
│   │   ├── assistant/
│   │   ├── voice/
│   │   └── exports/
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── error.tsx
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── layout/               # Header, sidebar, footer
│   ├── marketing/            # Landing page components
│   ├── dashboard/            # Dashboard widgets
│   ├── documents/            # Upload, review, preview
│   ├── transactions/         # Ledger, filters, import
│   ├── reconciliation/       # Match UI, allocation
│   ├── gst/                  # Summary, period selector
│   ├── assistant/            # Chat, tools display
│   └── voice/                # Push-to-talk, audio
├── lib/
│   ├── supabase/             # Client/server Supabase instances
│   ├── auth/                 # Auth helpers, middleware
│   ├── validation/           # Shared Zod schemas
│   ├── security/             # Rate limiting, sanitization
│   ├── logging/              # Structured logging
│   ├── seo/                  # Metadata, structured data helpers
│   └── decimal/              # decimal.js wrappers
├── modules/
│   ├── shops/                # Shop CRUD, membership
│   ├── documents/            # Upload, storage, processing
│   ├── invoices/             # Invoice domain logic
│   ├── transactions/         # Import, ledger, categories
│   ├── reconciliation/       # Matching engine
│   ├── gst-engine/           # Deterministic GST calculations
│   ├── filing-preparation/   # Period management, prep
│   ├── assistant/            # EVON integration, tools
│   ├── voice/                # PRISMA/TIMBRE integration
│   ├── exports/              # Report generation
│   └── audit/                # Audit trail service
├── workers/                  # Background job processors
├── types/                    # Shared TypeScript types
├── tests/                    # Test suites
├── supabase/
│   └── migrations/           # SQL migration files
└── docs/                     # Documentation
```

## Key Design Decisions

### 1. Modular Monolith
All domain logic resides in `src/modules/`. Each module has a defined interface and isolated dependencies. This allows future extraction to services without current microservice complexity.

### 2. Financial Precision
All monetary values use `decimal.js` in TypeScript and `NUMERIC` in PostgreSQL. JavaScript floating-point is never used for authoritative financial calculations.

### 3. GST Engine Isolation
The GST engine (`src/modules/gst-engine/`) is a pure domain module with no UI, network, or LLM dependencies. It takes structured inputs and produces deterministic outputs. All calculations are testable independently.

### 4. Provider Abstraction
External services (GNANI EVON, PRISMA, TIMBRE, OCR) are accessed through adapter interfaces. Each adapter handles vendor-specific authentication, request/response formats, error handling, and retry logic.

### 5. Row Level Security
PostgreSQL RLS enforces tenant isolation at the database level. Application-layer authorization is defense-in-depth, not the sole mechanism.

### 6. Audit Trail
Material financial changes, corrections, and reconciliation decisions are recorded in `audit_events` with actor, timestamp, before/after state, and reason.

## Data Flow Examples

### Invoice Upload
```
User Upload → API Validation → Private Storage → Document Record
  → Background Job → OCR Provider → Extraction → Schema Validation
  → Arithmetic Check → Duplicate Detection → Review UI
  → User Confirmation → Audit Event
```

### GST Summary
```
Filing Period Selection → Fetch Confirmed Invoices + Transactions
  → GST Engine (versioned rules) → Deterministic Calculation
  → Warnings + Review Issues → Period Snapshot → Summary UI
```

### AI Assistant
```
User Query → Authentication → EVON Provider
  → Tool Calls (authorized, scoped) → Data Retrieval
  → GST Engine (if calculation needed) → Grounded Response
  → Display with source links
```
