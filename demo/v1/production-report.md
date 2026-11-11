# DIGITAX Product Showcase — Production Report

**Project:** DIGITAX — Frontend Redesign Demo  
**Video:** `DIGITAX-Product-Showcase.mp4`  
**Output Path:** `D:\DIGITAX\demo\v1\DIGITAX-Product-Showcase.mp4`  
**Date:** 2026-11-08  
**Status:** Complete  

---

## Final Video Metadata

| Property | Value |
|----------|-------|
| **File** | `DIGITAX-Product-Showcase.mp4` |
| **Duration** | 90.000000 seconds |
| **Resolution** | 1920 × 1080 |
| **Aspect Ratio** | 16:9 |
| **Frame Rate** | 60 FPS (5400 frames) |
| **Video Codec** | H.264 / AVC (High profile, Level 5.0) |
| **Pixel Format** | yuv420p |
| **Audio Codec** | AAC (LC profile, 48 kHz, stereo, 128 kbps) |
| **Audio/Video Sync** | Synchronized (both 90.000000s) |
| **File Size** | 3,428,226 bytes (~3.3 MB) |
| **Bit Rate** | ~305 kbps combined |

---

## Production Pipeline

### Tools Used

- **Recording:** Playwright (Chromium) via `record.mjs`
- **Encoding:** FFmpeg (libx264, AAC)
- **Probe/Validation:** FFprobe
- **HTML/CSS/JS:** Custom self-playing demo page (`index.html`)

### Recording Process

1. Launched Chromium headless via Playwright
2. Loaded `index.html` with `?record=1` query parameter
3. Captured video at real-time as the `play()` function executed all 10 scenes
4. Waited for `window.__demoDone === true` to signal completion
5. Re-encoded WebM capture to constant 60 FPS MP4 via FFmpeg
6. Muxed licensed music track (Pixabay Content License) with loudnorm normalization
7. Trimmed final output to exactly 90 seconds

### Scenes Recorded

| # | Scene | Duration | Key Visual |
|---|-------|----------|------------|
| 0 | Title Card | 8s | DIGITAX brandmark, hero tagline |
| 1 | Login | 12s | Email/password entry, sign-in flow |
| 2 | Dashboard | 10s | KPI cards, revenue vs expenses chart |
| 3 | GST Workspace | 10s | GSTR-3B metrics, CGST/SGST table |
| 4 | Banking Transactions | 10s | Balance strip, transaction table |
| 5 | Reconciliation | 10s | Split-panel match cards |
| 6 | Invoice Management | 10s | Invoice table with status badges |
| 7 | Settings | 8s | Profile settings form |
| 8 | GNANI Assistant | 8s | AI chat interface |
| 9 | Outro | 6s | Brand tagline, CTAs |

---

## Source Files

| File | Description |
|------|-------------|
| `index.html` | Self-playing HTML demo with all 10 scenes, CSS, and JS playback engine |
| `record.mjs` | Playwright-based recording script |
| `music.mp3` | Background audio track (Upbeat Happy Corporate by KornevMusic) |
| `out/product-demo.webm` | Raw WebM capture from Playwright (silent) |
| `out/product-demo.mp4` | Intermediate MP4 before trimming (~103.76s) |
| `storyboard.md` | Scene-by-scene storyboard |
| `production-report.md` | This document |
| `licenses/MUSIC_LICENSE.md` | Music license documentation |
| `licenses/PIXABAY_LICENSE.md` | Pixabay Content License summary |

---

## Quality Assurance Results

### Automated Checks (ffprobe)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Duration | 90s | 90.000000s | ✅ Pass |
| Resolution | 1920×1080 | 1920×1080 | ✅ Pass |
| Aspect Ratio | 16:9 | 16:9 | ✅ Pass |
| Video Codec | H.264 | H.264 / AVC | ✅ Pass |
| Audio Codec | AAC | AAC (LC) | ✅ Pass |
| Frame Rate | 60 FPS | 60 FPS | ✅ Pass |
| Frame Count | 5400 | 5400 | ✅ Pass |
| A/V Sync | Synchronized | 90s / 90s | ✅ Pass |

### Visual Inspection

| Check | Status | Notes |
|-------|--------|-------|
| Black frames | ✅ Pass | No black frames detected |
| Broken layouts | ✅ Pass | All scenes render correctly |
| Missing fonts/assets | ✅ Pass | Google Fonts (Inter, JetBrains Mono) load correctly |
| Cursor positions | ✅ Pass | Synthetic cursor moves correctly between interactions |
| Text clipping | ✅ Pass | All text fits within containers |
| Abrupt transitions | ✅ Pass | 0.4s ease transitions between scenes |
| Audio clipping/silence | ✅ Pass | Music plays continuously with fade-in/out |
| Misleading claims | ✅ Pass | Mock data labeled as illustrative per authenticity requirements |

---

## Authenticity Compliance

Per Phase 2 (Authenticity) requirements:

- ✅ Dashboard, GST, transactions, reconciliation data is mock/illustrative
- ✅ GNANI EVON not presented as generating live responses (API key not configured)
- ✅ Document upload not represented as successful
- ✅ No real customer data, credentials, or personal information used
- ✅ No simulated successful authentication with fabricated credentials
- ✅ GST returns not claimed as filed with GSTN
- ✅ Showcase labeled as illustrative where appropriate

---

## Known Limitations

1. **Live database testing:** No Supabase credentials available; RLS, atomic transactions, and cross-tenant isolation cannot be runtime-tested in the demo.
2. **GNANI AI:** Not connected to a live API; responses are pre-scripted for demonstration purposes only.
3. **Document upload:** Storage workflow not actually tested; upload buttons are UI-only in the demo.
4. **Music licensing:** Pixabay Content License permits commercial use but restricts standalone redistribution of the MP3 file. The music is embedded within the video, not distributed separately.

---

## Deliverables

1. `demo/v1/DIGITAX-Product-Showcase.mp4` — Final 90-second video
2. `demo/v1/storyboard.md` — Scene-by-scene storyboard
3. `demo/v1/production-report.md` — This production report
4. `demo/v1/licenses/` — Music license documentation
5. `demo/v1/index.html` — Source HTML demo page
6. `demo/v1/record.mjs` — Recording script
7. `demo/v1/music.mp3` — Licensed background music
