# MaQi Studio

Build a premium, mobile-first MaQi Admin Panel for managing my existing MaQi Android OTT app.



1. Design direction



Create a distinctive, professional OTT content-management interface, not a generic AI-generated SaaS dashboard.



- Dark charcoal/near-black background with off-white typography and subtle violet accents.

- Minimal, editorial layout inspired by premium streaming platforms.

- Clean spacing, restrained borders, compact controls and excellent readability on Android phones.

- Use content posters, hero-banner previews and clear data tables where useful.

- No excessive gradients, glassmorphism, glowing cards, decorative charts, fake analytics or unnecessary animations.

- Fully responsive on mobile, tablet and desktop.

- Use the name MaQi. Do not redesign the MaQi consumer app.



2. Admin navigation



Create these sections:



1. Overview

2. Catalog

3. Hero Banners

4. Home Sections

5. Streaming Providers

6. Firebase / User Management

7. Settings and Activity Logs



Use a compact mobile navigation that works properly on small screens.



3. Catalog management



Build a searchable catalog manager that supports:



- Adding and removing anime, movies and web series.

- Searching by title or TMDB ID.

- Selecting content type and visibility.

- Adding and removing curated anime IDs, including Hindi-dubbed anime.

- Editing metadata and content ordering.

- Confirmation before destructive changes.



Do not invent TMDB IDs or assume an undocumented data schema. Allow configuration of TMDB IDs and metadata.



4. Hero banners and home sections



Allow the admin to:



- Add, edit, remove, enable or disable hero items.

- Set a TMDB ID, title, content type and display order.

- Preview banners before publishing.

- Reorder home sections.

- Enable or disable existing sections.

- Edit section configuration without changing the existing MaQi app UI.



Do not introduce unwanted sections or rename existing sections automatically.



5. Streaming providers



Create a provider manager that supports:



- Adding and removing providers.

- Editing provider display names and embed URL templates.

- Setting provider priority and enabled status.

- Supporting movie and TV/episode URL formats where the existing backend requires them.

- Previewing the resulting URL format without automatically opening or playing it.

- Confirming changes before publishing.



Preserve existing WebView playback behavior, ad-blocking behavior, continue-watching history, episode handling and local caching. Do not replace the playback system or hardcode provider URLs into the Android app.



6. Firebase and admin security



Use Firebase Authentication for admin sign-in if appropriate for the existing project. Restrict access to explicitly authorized administrators.



Never allow public visitors to access admin pages or write to Cloudflare KV. Never put Cloudflare API tokens, private secrets or unrestricted credentials in frontend JavaScript, public environment variables or the GitHub repository.



Use a protected server-side API for privileged operations. Validate all inputs and log administrative changes. Do not add user tracking or collect personal information without a legitimate, clearly defined purpose.



7. Existing backend integration



My existing MaQi app already uses a Cloudflare Worker and KV configuration for dynamic content and streaming providers. I want the admin panel to manage the existing backend, not create a replacement backend.



Before implementing any backend writes:



- Inspect the actual repository, existing Worker code, API routes, KV bindings and JSON schemas.

- Identify the active Worker URL from the real code/configuration. Do not guess which Worker URL is active.

- Reuse existing API endpoints and data formats wherever possible.

- Do not rename KV keys, change existing endpoint response formats, rotate API keys, or modify the Android app without explicit approval.

- Do not assume a KV binding name is the same as a KV key.

- If a required admin endpoint does not exist, document the missing endpoint and propose the smallest safe addition.

- Keep the existing consumer website and Android app unchanged.



8. Performance and reliability



Minimize unnecessary Cloudflare Worker requests. Fetch configuration efficiently, avoid polling, use caching where appropriate, and provide clear loading, success and error states. Never report that a change was published unless the backend confirms it.



9. Implementation workflow



First inspect the available project and create the complete frontend with realistic sample data clearly marked as DEMO. Keep the interface functional and responsive.



Do not pretend the demo data is connected to production. Separate the frontend from the backend service layer so the real APIs can be integrated later.



After the UI is complete, inspect the existing backend and provide a concise integration report listing:



- The actual Worker URL found in the code.

- Existing API endpoints and KV keys verified from source.

- Firebase configuration and authentication status.

- Missing backend functionality.

- Exact files that need changes.



Do not deploy, overwrite production configuration, or make destructive changes without my approval.



The final result should feel like a carefully designed MaQi product: content-first, fast, minimal and easy to operate entirely from an Android phone.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/36ece355-a43f-4a1c-b33b-1f127db407f4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
