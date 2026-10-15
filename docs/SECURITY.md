# DIGITAX — Security

## Security Architecture

### Authentication
- Supabase Auth with email/password
- Server-side session verification on all protected routes
- JWT token validation via `@supabase/ssr`
- Secure cookie-based sessions

### Authorization
- Shop-level authorization via `shop_members` table
- Row Level Security (RLS) on all tenant tables
- Server-side authorization checks in every API route
- Client-supplied shop IDs are never trusted — always verified against session

### Tenant Isolation
- Every data record is associated with a `shop_id`
- RLS policies ensure users can only access shops they belong to
- Cross-tenant access is tested explicitly in the test suite
- Background jobs and assistant tools re-verify authorization

### Secret Management
- All secrets stored in environment variables
- Service-role keys used only server-side
- `NEXT_PUBLIC_` prefix only for genuinely public values (Supabase URL, anon key)
- `.env.example` contains only names and safe placeholders
- No secrets committed to version control

### API Security
- Input validation with Zod on every endpoint
- Rate limiting on authentication and expensive endpoints
- File upload size limits and MIME type validation
- CORS configuration
- Security headers (CSP, X-Content-Type-Options, etc.)
- Request correlation IDs for debugging
- Safe error messages (no stack traces, no internal IDs)

### File Security
- Private Supabase Storage buckets
- Content-type validation (not just extension)
- Safe file naming (no path traversal)
- Authorized access only via signed URLs

### AI Security
- Fixed tool allowlist for EVON assistant
- Every tool call validates user authentication and shop authorization
- No arbitrary SQL, shell, or filesystem access
- Financial changes require explicit user confirmation
- Prompt injection defenses for untrusted document content
- Tool call count and execution time limits

### Data Privacy
- Financial data minimized in logs
- No raw recording storage by default
- Documentation of data sent to external providers
- Account deletion workflow

## Security Headers (Production)
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co; media-src 'self' blob:;
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), geolocation=(), microphone=(self)
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Known Limitations
- Rate limiting is application-level (consider edge-level for production)
- File malware scanning not implemented in MVP
- CSRF protection relies on SameSite cookies + Supabase auth architecture
