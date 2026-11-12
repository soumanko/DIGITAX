# DIGITAX Product Showcase — Storyboard

**Project:** DIGITAX — Bookkeeping, GST compliance, banking, and reporting for modern Indian businesses  
**Video:** `DIGITAX-Product-Showcase.mp4`  
**Duration:** 90 seconds (5400 frames at 60 FPS)  
**Resolution:** 1920 × 1080 (16:9)  
**Codec:** H.264 video, AAC audio  
**Music:** "Upbeat Happy Corporate" by KornevMusic (Pixabay Content License)  
**Status:** Approved for production  

---

## Scene Breakdown

| Scene | Time | Content | Caption | Interaction |
|-------|------|---------|---------|-------------|
| 0 | 0–8s | **Title Card** — DIGITAX logo, tagline "Your books, finally in sync.", CTAs (Start Free Trial, Book a Demo) | "FINANCE, WITHOUT THE FRICTION" | None |
| 1 | 8–20s | **Login** — Premium login screen, email/password entry, sign-in button | "Sign in to your shop." | Click email field → type "sara@freshmart.in" → click password field → type password → click Sign in |
| 2 | 20–30s | **Dashboard** — Financial command center with KPI cards (Revenue ₹18,42,600, Expenses ₹11,26,340, GST Liability ₹2,84,760, Cash Balance ₹9,68,410), revenue vs expenses chart | "Your books, finally in sync." | None (cursor hovers over dashboard) |
| 3 | 30–40s | **GST Workspace** — GSTR-3B/GSTR-1 tabs, metric grid (Net Tax Payable, Outward Supplies, ITC, Due Date), GSTIN table with CGST/SGST breakdown | "File GSTR-3B in one click." | None (cursor hovers over GST metrics) |
| 4 | 40–50s | **Banking Transactions** — Balance strip, transaction table with matched/unmatched status | "Reconcile bank transactions with invoices." | None (cursor hovers over transaction list) |
| 5 | 50–60s | **Reconciliation** — Split-panel match cards showing bank transactions vs suggested invoices, confirm match button | "Match transactions to invoices in seconds." | None (cursor hovers over match cards) |
| 6 | 60–70s | **Invoice Management** — Invoice table with party, GSTIN, type, amount, status, actions | "Manage your invoices with ease." | None (cursor hovers over invoice rows) |
| 7 | 70–78s | **Settings** — Profile settings tab with Full Name, Email, Shop GSTIN, Language dropdown | "Manage your settings and preferences." | None (cursor hovers over settings form) |
| 8 | 78–86s | **GNANI EVON Assistant** — AI chat interface with sample conversation about GST liability | "GNANI EVON answers your bookkeeping questions." | None (cursor hovers over chat input) |
| 9 | 86–90s | **Outro** — DIGITAX brandmark, tagline "Financial clarity for ambitious teams.", CTAs | "DIGITAX — Financial clarity for ambitious teams." | None |

---

## Visual Style

- **Theme:** Dark mode (primary background: #0a0f1a, surface: #111827, border: #1f2937)
- **Primary color:** #2563eb (blue-600), accent: #14b8a6 (teal-500)
- **Typography:** Inter (headings/UI), JetBrains Mono (monetary values, GSTIN, labels)
- **Currency:** Indian Rupee (₹) with lakh/crore formatting (e.g., ₹18,42,600)
- **Components:** Cards with subtle shadows, status badges, segmented controls, filter chips, data tables, chat bubbles

---

## Authenticity Notes

Per AGENTS.md engineering instructions and Phase 2 (Authenticity) requirements:

- **Dashboard, GST, transactions, and reconciliation data is illustrative/mock data** — clearly presented as a product showcase, not live financial calculations.
- **GNANI EVON is not generating live responses** — the chat shows a pre-scripted example conversation because the `GNANI_EVON_API_KEY` is not configured.
- **Document upload is not represented as successful** — the Storage workflow is not actually tested in this demo.
- **No real customer data, credentials, or personal information** is used — all emails, GSTINs, and names are fictional examples.
- **No simulated successful authentication** using fabricated credentials — the login shows a demo flow without actual backend authentication.
- **GST returns are not claimed as filed** — the demo shows preparation only; GNANI never claims to file with GSTN.

---

## Camera & Motion

- Cinematic zooms on key UI elements (KPI cards, GST metrics, match cards)
- Smooth cross-fade transitions between scenes (0.4s ease)
- Synthetic cursor with ripple effect on clicks
- Caption pill at bottom center with step counter
- URL bar shows `app.digitax.in` with per-scene route simulation

---

## Audio

- Upbeat corporate music bed at -18 LUFS
- 1.5s fade-in, 2.5s fade-out
- No voiceover (music-only track)

---

## Quality Assurance Checklist

- [x] Duration verified at exactly 90 seconds via ffprobe
- [x] Resolution verified at 1920 × 1080 via ffprobe
- [x] Video codec: H.264 via ffprobe
- [x] Audio codec: AAC via ffprobe
- [x] Audio and video durations synchronized
- [x] All 10 scenes render without black frames
- [x] No broken layouts or missing fonts
- [x] No misleading product claims (mock data labeled as illustrative)
- [x] Music license verified (Pixabay Content License)
