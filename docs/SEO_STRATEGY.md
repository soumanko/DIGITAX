# DIGITAX — SEO Strategy

## Overview
SEO is implemented for the public marketing website only. Authenticated dashboards, financial records, and user data are excluded from indexing.

## Technical SEO Checklist
- [x] Unique page titles and meta descriptions per page
- [x] Canonical URLs
- [x] Open Graph metadata
- [x] robots.txt
- [x] XML sitemap
- [x] Server-rendered public content
- [x] Semantic HTML
- [x] Mobile-responsive
- [x] noindex on auth pages, dashboard, private routes
- [ ] Core Web Vitals measurement (post-deployment)
- [ ] Google Search Console setup (post-deployment)

## Keyword-to-Page Map
| Target Keywords | Page |
|----------------|------|
| GST bookkeeping software small business India | Home |
| GST invoice management app | Features |
| how to organize GST bills kirana store | How It Works |
| UPI transaction reconciliation GST | Features (reconciliation) |
| GST filing preparation software | Home, Features |
| AI GST assistant India | Features (AI section) |
| input tax credit recordkeeping | How It Works |
| GST document checklist small retailer | FAQ |

## Structured Data
- `Organization` on all pages
- `WebSite` with search action on home
- `SoftwareApplication` on features
- `BreadcrumbList` on all pages
- `FAQPage` on FAQ

## Private Route Exclusions
All routes under `/(dashboard)/`, `/(auth)/`, and `/api/` are:
- Protected by authentication
- Marked with `noindex, nofollow` meta tags
- Excluded from sitemap
- Blocked in robots.txt

## Content Guidelines
- No fabricated testimonials or user counts
- No government affiliation claims
- Accurate feature descriptions only
- Publication dates on educational content
- Clear distinction between preparation and filing
