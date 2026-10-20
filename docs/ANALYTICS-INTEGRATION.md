# MaQi website + app analytics integration

This document is the implementation contract for connecting real analytics to MaQi Admin. Do not present demo metrics as live data.

## Current state verified
- MaQi Admin is in `chaiwala78/maqi-studio`.
- Its `/analytics` page currently contains hard-coded sample charts and activity events.
- The Admin data service is not yet connected to a live Admin API.
- The website source repository and a GA4 Measurement ID for `maqiii.web.app` have not been verified in this repository.

## Data sources
1. **Website traffic and APK download clicks:** Google Analytics 4 (GA4) on `maqiii.web.app`.
2. **App usage:** Firebase Analytics events emitted by the Android app. The Android APK must be updated if these events are not already instrumented.
3. **Crashes:** Firebase Crashlytics.
4. **Registered accounts:** Existing Firebase Auth/Firestore data, subject to current security rules and admin authorization.

## Required events
Use aggregate event names and non-sensitive parameters:
- `page_view` — page path and referrer source
- `apk_download_click` — download button location and campaign/source
- `app_open` — app session start
- `screen_view` — Home, Anime, Watchlist, Profile
- `title_detail_view` — content type and TMDB ID
- `playback_start` and `playback_error` — content type, provider key, and error category
- `watchlist_add` — content type

Do not send email, name, phone number, raw authentication identifiers, or private viewing history to GA4. Use aggregate reporting by default.

## Admin API contract
Expose an authenticated server endpoint, for example `GET /api/admin/analytics?range=7d`, that returns verified GA4/Firebase aggregate metrics:
- website sessions, users, and APK download clicks
- app daily/weekly/monthly active users
- screen views and playback starts/errors
- retention cohorts where the source supports them
- data freshness timestamp and source status

The browser must never contain service-account credentials or privileged Google Analytics Data API credentials. The endpoint must verify the signed-in admin using a server-validated Firebase ID token and an explicit allowlist, then query GA4/Firebase using server-side credentials.

## Important measurement limits
- An APK download button click is not proof that the file finished downloading.
- A website download is not proof the APK was installed.
- Exact installs cannot be inferred from GA4 web clicks alone.
- Do not show fabricated values or fabricated "live events" when the API is unavailable. Show "Not connected" and the last successful sync instead.

## Blockers before live integration
1. Identify/connect the source repository for `maqiii.web.app` so website events can be added.
2. Confirm or create the GA4 web data stream and provide its Measurement ID (not a service-account key).
3. Configure a server-side analytics endpoint and credentials securely in the backend.
4. Instrument the Android app for any app events that are currently missing.
5. Replace the hard-coded data in `src/routes/analytics.tsx` with the authenticated API response and a clear disconnected/error state.
