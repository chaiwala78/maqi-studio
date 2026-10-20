# MaQi Admin: website management scope

This is for the public download website at https://maqiii.web.app only. Do not modify the Android app, its Firebase Remote Config, or Android code as part of this feature.

## Required admin section: Website
- Download settings: APK URL, version, file size, release date, minimum Android version.
- Homepage content: headline, description, announcement/banner.
- Links: support email, Telegram, Discord, GitHub.
- SEO/social preview: title, description, Open Graph image.
- Website status: public settings fetch health, latest publish timestamp, GA4 connection state.
- Website analytics: sessions/users/page views/top pages/referrers and APK CTA click events.

## Existing implementation findings
- The current `/analytics` route contains hard-coded sample charts and fake activity events; they must not be shown as live data.
- The current admin service uses a hard-coded Worker token in browser JavaScript. Do not reuse this token as a security boundary or add more privileged secrets to the client.
- The current website repo already has GA4 measurement ID `G-BRQND6X3GG` in `src/routes/__root.tsx`.
- The website's download settings currently live in `src/config/site.ts`.

## Safe architecture
1. Website reads only public, validated settings from a public read-only endpoint or public config document, with hard-coded fallbacks.
2. Admin edits a draft, validates values, then submits changes to an authenticated server endpoint.
3. Server verifies the Firebase ID token and checks a strict admin allowlist before writing the public config to Cloudflare KV/Firestore.
4. GA4 aggregate data is fetched server-side with credentials held in server secrets; the browser sees aggregate metrics only.
5. Every page shows an explicit disconnected state instead of fabricated numbers when a data source is not connected.

## Measurement caveats
- An APK button click is not proof of a completed download.
- A website click cannot confirm that the APK was installed.
- Android app analytics are out of scope for this task.
- Never display sample metrics as production data.

## Deployment gate
No production deploy until the Worker routes, admin authorization, KV binding, CORS, settings schema, and rollback behavior are verified. Do not modify or deploy the Android app.
