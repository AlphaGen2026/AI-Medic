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

- Keep the three-language UI in the shared language context and translation catalog; this keeps language switching consistent across screens.
- Keep the chronic-condition identifiers language-neutral and localize labels only at display time; saved health selections must survive language changes.
- Keep the voice companion inside authenticated providers; it needs the signed-in user's identity for appointment commands.
