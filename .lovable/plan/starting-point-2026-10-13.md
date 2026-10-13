- MaQi Admin Panel — Plan

## Starting point

This project is a fresh, empty template. It does not contain the MaQi Android app, the Cloudflare Worker code, KV bindings or Firebase config. So phase 1 is a complete, working frontend with clearly labelled DEMO data. Phase 2 (the integration report) needs access to the real Worker/app source — either another Lovable project, or files/repo you share.

## Phase 1 — Frontend (DEMO data)

Design

- Near-black charcoal background, off-white type, one restrained violet accent.
- Editorial typography (display serif-free grotesk for headings, readable sans for body), compact controls, thin borders.
- Posters and banner previews as the main visuals; plain tables/lists elsewhere. No glows, glass, decorative charts or fake analytics.
- Mobile-first: bottom tab bar (5 main items + "More" sheet) on phones, side rail on tablet/desktop.
- Persistent "DEMO DATA — not connected to production" strip on every page.

Pages (each its own URL)

1. Overview — counts of catalog items, active banners, enabled sections/providers, pending unpublished changes, recent activity. No charts.
2. Catalog — search by title or TMDB ID, filter by type (anime / movie / series) and visibility, add/edit/remove, drag or up/down ordering, curated anime ID lists incl. Hindi-dubbed list. TMDB IDs entered by the admin, never invented.
3. Hero Banners — list with poster thumbnails, add/edit/remove, enable toggle, order, full banner preview before publish.
4. Home Sections — existing sections only, reorder, enable/disable, edit config. No auto-renaming or new sections.
5. Streaming Providers — name, movie URL template, TV/episode URL template, priority, enabled. Live URL preview with sample IDs shown as text only (never opened).
6. Firebase / Users — list of authorized admins (demo), sign-in status placeholder; no end-user tracking.
7. Settings & Activity Log — backend connection status (shown as "Not connected"), log of admin changes.

Behaviour

- Edits go into a local draft; a "Review & publish" sheet shows the diff and requires confirmation.
- Every delete asks for confirmation.
- In demo mode, publish clearly says "Demo — nothing was sent to production". Success is only ever shown when the service layer confirms.
- Loading, empty, success and error states on every list.

## Phase 2 — Integration report (after UI)

Once the real source is accessible, inspect and report: the actual Worker URL, existing endpoints and KV keys (distinguishing bindings vs keys), JSON schemas, Firebase config/auth status, missing admin endpoints with the smallest safe addition, and exact files needing changes. No deploys, key rotation, KV writes or Android changes without your approval.

## Technical details

- `src/services/` holds a typed `AdminService` interface with a `DemoAdminService` implementation (in-memory + localStorage draft). A future `WorkerAdminService` calls a protected server-side API; the frontend never holds Cloudflare tokens.
- Types for catalog items, banners, sections, providers are provisional and marked as such until verified against real schemas.
- TanStack Query for reads (no polling), mutations only on explicit publish.
- Routes: `/`, `/catalog`, `/banners`, `/sections`, `/providers`, `/users`, `/settings`, each with its own head metadata.
- Firebase Auth gate and server-side admin allowlist are deferred to phase 2 (needs your Firebase project); the UI includes a sign-in screen stub flagged DEMO.
- Theme tokens in `src/styles.css`; no hardcoded colors.