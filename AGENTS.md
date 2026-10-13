<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- UI talks only to the `AdminService` interface in `src/services/admin-service.ts`; swap the demo implementation for a real one there. Why: keeps the backend integration isolated from pages.
- Privileged writes (Worker/KV) must go through a protected server-side API; never put Cloudflare tokens in frontend code. Why: admin security.
- Data types in `src/services/types.ts` are provisional until verified against the real Worker JSON. Why: no undocumented schema assumptions.
