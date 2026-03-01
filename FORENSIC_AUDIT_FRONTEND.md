# Frontend Forensic Code Audit Report

**Baseline commit:** `8add3579f811a53a6478c03d681f061951fa97e6` — "everything works, modified fesms"  
**Scope:** index.html, LoginForm.tsx, Sidebar.tsx, FEAssignmentModal.tsx, useTickets.tsx, validation.ts, SahayaLanding.tsx, TicketDetail.tsx, vercel.json  
**Repo:** field-ops-assist (git root)  
**No code was modified; analysis only.**

---

## 1. Complete List of Differences

### index.html

| # | Location | Category | Description |
|---|----------|----------|-------------|
| H1 | After meta author | Environment/config (CSP) | New `<meta http-equiv="Content-Security-Policy" content="...">` with default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https: wss:; font-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; |

### src/components/auth/LoginForm.tsx

| # | Location | Category | Description |
|---|----------|----------|-------------|
| L1 | Sign-in email | UI only (a11y) | Label gets htmlFor="signin-email"; Input gets id="signin-email", autoComplete="email" |
| L2 | Sign-in password | UI only (a11y) | Label gets htmlFor="signin-password"; Input gets id="signin-password", autoComplete="current-password" |
| L3 | Sign-up form structure | UI only (layout/labels) | Name/email/password wrapped in divs with Label + id; Inputs get id (signup-name, signup-email, signup-password), autoComplete (name, email, new-password) |
| L4 | Sign-up role | UI only (a11y) | Select wrapped in div with Label "Role"; SelectTrigger gets id="signup-role", aria-label="Select role" |

### src/components/layout/Sidebar.tsx

| # | Location | Category | Description |
|---|----------|----------|-------------|
| S1 | Imports | UI only | Removed Building2 import (unused after nav change) |
| S2 | superAdminNavigation | Control flow (nav entries) | Removed two items: "Organizations" (href /super-admin), "Global Users" (href /app/users). Only "Overview" (href /super-admin) remains. |

### src/components/tickets/FEAssignmentModal.tsx

| # | Location | Category | Description |
|---|----------|----------|-------------|
| F1 | handleConfirmAssign catch block | Error handling change | Old: Comment "Error is handled by the mutation's onError"; only setConfirmDialogOpen(false). New: setConfirmDialogOpen(false) plus toast({ variant: "destructive", title: "Assignment failed", description: message }) where message = error instanceof Error ? error.message : "Assignment failed". |

### src/hooks/useTickets.tsx (useAssignTicket)

| # | Location | Category | Description |
|---|----------|----------|-------------|
| U1 | fetch call | Error handling change | Old: Direct await fetch(...); no try/catch; res.json() then if (!res.ok) throw. New: try { res = await fetch(...) } catch (err) { throw new Error(network vs other message) }. |
| U2 | Network error message | Error handling change | On fetch throw (e.g. TypeError "Failed to fetch"): throw new Error("Cannot reach backend. If this app is deployed, set VITE_CRM_API_URL to your backend URL and ensure the backend is running."). |
| U3 | Response parsing | Error handling change | Old: const data = await res.json(); if (!res.ok) throw new Error(data?.error ?? "Assignment failed"). New: let data = {}; try { data = await res.json() } catch { /* non-JSON */ }; if (!res.ok) throw new Error(message) with message = data?.error ?? (404/502/504/generic). |
| U4 | Request payload / URL / method | None | Unchanged: POST, same URL pattern, same body { feId, override_reason }. |

### src/lib/validation.ts

| # | Location | Category | Description |
|---|----------|----------|-------------|
| V1 | New helpers | Validation change | New safeDisplayName: z.string().trim().min(1).max(100).refine(no <>"'\\ or control chars). New passwordComplexity: min(8), max(72), refine(lower, upper, digit, special). |
| V2 | SignUpSchema | Validation change | password: now passwordComplexity; name: now safeDisplayName. |
| V3 | CreateFESchema | Validation change | name: now safeDisplayName (same rules as SignUp name). |

### src/pages/SahayaLanding.tsx

| # | Location | Category | Description |
|---|----------|----------|-------------|
| A1 | OutlineButton | UI only + control flow | Component extended: new props asLink?, to?; when asLink && to return <Link to={to} ...> else button. No change to existing button usage except where explicitly passed asLink/to. |
| A2 | Nav link href (Header desktop) | UI only (fix) | replace(" ", "-") → replace(/\s+/g, "-") for anchor hashes (e.g. "Integrity Chain" → integrity-chain). |
| A3 | Nav link href (Header mobile) | UI only (fix) | Same replace change. |
| A4 | Hero "Request Demo" | Control flow / routing | Old: <OutlineButton dark> (no link). New: <OutlineButton dark asLink to="/login">. |
| A5 | Ticket card "View All" | Routing change | Old: <span ...>View All →</span>. New: <Link to="/login" ...>View All →</Link>. |
| A6 | Pricing CTAs | UI only (standardization) | Old: featured plan PrimaryButton (no to); non-featured raw <button> (no navigation). New: both use <PrimaryButton asLink to="/login" className="w-full justify-center">. |
| A7 | Footer id | UI only | <footer className="..."> → <footer id="documentation" ...>. |
| A8 | Footer nav href | UI only (fix) | href={`#${link.toLowerCase()}`} → href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}. |

### src/pages/TicketDetail.tsx

| # | Location | Category | Description |
|---|----------|----------|-------------|
| T1 | Assign card block | UI only (removal) | Removed the in-column Card that contained "Assign Field Executive" button (full-width Button calling setAssignModalOpen(true)). Header assign button and FEAssignmentModal usage unchanged. |

### vercel.json

| # | Location | Category | Description |
|---|----------|----------|-------------|
| VJ1 | Structure | Environment/config | rewrites unchanged (same SPA fallback); new "headers" array: source "/(.*)" with Content-Security-Policy (same value as index.html), X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN. |

---

## 2. Categorization Summary

- **UI only (layout/styling/a11y):** H1 (CSP is config); L1–L4; S1; A1 (component capability), A2, A3, A6, A7, A8; T1; VJ1 (security headers).
- **Validation change:** V1, V2, V3.
- **API call change:** None (same URL, method, body).
- **Error handling change:** F1; U1, U2, U3.
- **Control flow change:** S2 (fewer nav items); A4, A5 (links to /login).
- **Routing change:** A4, A5 (new navigation to /login); no route path changes for app routes.
- **Environment/config change:** H1 (CSP), VJ1 (headers + CSP).
- **Breaking change risk:** CSP connect-src (see below); validation (stricter signup/FE name/password); Sidebar (fewer links).

---

## 3. Per-Change: Old vs New, and Impact

### index.html — CSP (H1)

- **Old:** No CSP meta tag.
- **New:** CSP meta with connect-src 'self' https: wss: (no http:).
- **Affect assignment?** Yes, in one case: if the app is served from a different origin than the backend and the backend is **http** (e.g. local dev app at http://localhost:5173, API at http://localhost:3000), connect-src does not allow http: so the assign fetch can be **blocked** by CSP. If backend is https (e.g. production), no issue.
- **Email/SMS triggering?** No (backend-triggered).
- **API contract?** No change to request/response.
- **Break demo?** Only for **local** demo where backend is http://localhost:3000; assignment request may fail with CSP violation. Production (HTTPS backend) unaffected.

### LoginForm.tsx (L1–L4)

- **Old:** Labels without htmlFor; inputs without ids/autoComplete; role Select without label wrapper/aria.
- **New:** Proper label/input association, autoComplete, role labeled and aria-label.
- **Affect assignment?** No.
- **Email/SMS?** No.
- **API contract?** No.
- **Break demo?** No; improves a11y and form behavior.

### Sidebar.tsx (S1, S2)

- **Old:** Super Admin had Overview, Organizations (/super-admin), Global Users (/app/users).
- **New:** Super Admin has only Overview (/super-admin). Organizations and Global Users links removed.
- **Affect assignment?** No.
- **Email/SMS?** No.
- **API contract?** No.
- **Break demo?** No; fewer duplicate nav entries. Users can still reach /app/users via Administration if admin.

### FEAssignmentModal.tsx (F1)

- **Old:** On assign failure (catch): setConfirmDialogOpen(false); comment said error handled by mutation onError (but useAssignTicket has no onError).
- **New:** Same plus toast with title "Assignment failed" and description = error message.
- **Affect assignment?** No; assignment still attempted the same way; only error feedback improved.
- **Email/SMS?** No.
- **API contract?** No.
- **Break demo?** No; improves demo by showing clear failure message (e.g. backend unreachable).

### useTickets.tsx — useAssignTicket (U1–U4)

- **Old:** await fetch(...); data = await res.json(); if (!res.ok) throw new Error(data?.error ?? "Assignment failed"). No try/catch around fetch; non-JSON or network errors could surface as generic failures or unhandled rejections.
- **New:** try/catch around fetch; on network failure throw with "Cannot reach backend. If this app is deployed, set VITE_CRM_API_URL..."; try/catch around res.json() so non-JSON (e.g. 502 HTML) doesn’t throw; if (!res.ok) throw with data?.error or 404/502/504-specific message.
- **Affect assignment?** Same endpoint, method, body; only error handling and message quality changed. Assignment flow and success path unchanged.
- **Email/SMS?** No (backend still triggers email/SMS on success).
- **API contract?** No change to request payload or success response structure.
- **Break demo?** No; improves clarity when backend is down or returns non-JSON.

### validation.ts (V1–V3)

- **Old:** SignUp: password min 8 max 72, no complexity; name trim min 1 max 100. CreateFE: name trim min 1 max 100.
- **New:** SignUp: password must have lower, upper, digit, special; name + CreateFE name disallow <>"'\\ and control chars.
- **Affect assignment?** No (assignment does not use these schemas).
- **Email/SMS?** No.
- **API contract?** No.
- **Break demo?** Possible: new signups or new FE creation with weak password or "invalid" name (e.g. containing < or quote) will fail validation until adjusted. Demo accounts created before this change are unaffected.

### SahayaLanding.tsx (A1–A8)

- **Old:** OutlineButton button only; Request Demo not a link; View All span; Pricing featured PrimaryButton without to, non-featured button without navigation; footer links #lowercase only.
- **New:** OutlineButton can be link; Request Demo and pricing CTAs go to /login; View All is Link to /login; nav/footer hashes use replace(/\s+/g, "-"); footer has id="documentation".
- **Affect assignment?** No.
- **Email/SMS?** No.
- **API contract?** No.
- **Break demo?** No; landing page only; more consistent CTAs and anchors.

### TicketDetail.tsx (T1)

- **Old:** Two places to open assign modal: header button and in-column "Assign Field Executive" card.
- **New:** Only header button; card removed.
- **Affect assignment?** No; same modal, same assign flow; one fewer UI entry point.
- **Email/SMS?** No.
- **API contract?** No.
- **Break demo?** No; assignment still works from header.

### vercel.json (VJ1)

- **Old:** Only rewrites.
- **New:** Same rewrites; added headers for CSP, X-Content-Type-Options, X-Frame-Options on all routes.
- **Affect assignment?** Same CSP as index.html; same caveat for http backend in local dev if Vercel build is used to serve locally (unusual). For Vercel deployment, backend is typically https.
- **Email/SMS?** No.
- **API contract?** No.
- **Break demo?** No for normal Vercel + HTTPS backend; same as H1 for http backend.

---

## 4. Specific Checklist

- **Fetch/axios calls:** No change to URL, method, or body. useAssignTicket still: `fetch(\`${apiBase}/tickets/${ticketId}/assign\`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ feId, override_reason }) })`.
- **Request payload structure:** Unchanged: `{ feId: string, override_reason?: string }`.
- **Response parsing:** Changed only for robustness: res.json() wrapped in try/catch; on !res.ok use data?.error or status-based message. Success response still returned as-is; no structural change.
- **Route paths:** No change to app routes (/app, /app/tickets, etc.). Only landing page links to /login added/changed.
- **Environment variables (VITE_*):** No new or removed VITE_* usage. VITE_CRM_API_URL still read in useTickets (apiBase); only error message text references it.
- **CSP and API calls:** connect-src 'self' https: wss: — allows same-origin and any https/wss. **Blocks** fetch to **http** origins (e.g. http://localhost:3000) when app is on another origin (e.g. http://localhost:5173). Can affect local demo; production HTTPS backend fine.
- **TicketDetail assign flow:** Unchanged: header button still opens modal (setAssignModalOpen(true)); FEAssignmentModal still receives ticket, open, onOpenChange; no changes to when modal is shown or what it does.
- **FEAssignmentModal submission logic:** Unchanged: handleConfirmAssign still calls assignTicket.mutateAsync({ ticketId, feId: selectedFE, overrideReason }); only the catch block now shows a toast with the error message. No change to success path or payload.

---

## 5. Risk Summary

- **Assignment workflow:** Unchanged (same endpoint, payload, success path). Error handling and user feedback improved (toast on failure, clearer messages). Only risk is CSP blocking **http** backend in local dev.
- **Email/SMS triggering:** No frontend change; still triggered by backend on successful assign.
- **Demo workflow:** Stricter signup/FE validation may require strong passwords and “safe” names; Sidebar has fewer links; landing CTAs and anchors improved. Local demo with **http** backend could see assign fail due to CSP unless CSP is relaxed for dev (e.g. connect-src including http: for localhost) or backend is served over https.

**Verdict: Safe to commit** for production and for demo **if** (1) backend is HTTPS in production (CSP is fine), and (2) local demo either uses an HTTPS backend or CSP is adjusted for local (e.g. connect-src 'self' https: wss: http://localhost:*).  

**Medium risk** only in the narrow case: local demo with app and backend on different origins and backend on **http** — then assignment can be blocked by CSP until connect-src is updated.

**Recommendation:** For a **live demo**, prefer an HTTPS backend (e.g. deployed backend URL in VITE_CRM_API_URL) so CSP does not block assign. If you must use local http backend, add to CSP connect-src: `http://localhost:3000` (or similar) for the demo environment only.
