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
- Units and theme live on-device in localStorage (src/lib/lift/prefs.ts); weights always stored in kg, converted only for display/input — keeps history consistent when switching units.
- AI Gateway calls live only in src/lib/lift/ai.server.ts and are reached through authenticated server functions — keeps the key server-side and cost capped per user.
