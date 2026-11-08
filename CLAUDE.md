# CLAUDE.md

Static project website for CandleStack (STU FEI team project), built with Astro 7.

## Rules

- All texts live in `content/*.md` (YAML frontmatter only, except the Markdown pages of `content/docs/`). Never hardcode site text in `src/`;
  add a field to the file and its schema in `src/content.config.ts` instead.
- Content is written by non-developers: keep fields flat and obvious, keep `content/templates/meeting.md`
  and `content/README.md` in sync with the schema.
- Do not change existing texts unless asked.
- Internal links go through `url()` from `src/lib/url.ts` so the site works under a base path.
- Colors only through the CSS variables in `src/styles/global.css`; every change must work in both themes.
- Keep the design minimal: one 640px column, no new sections or decorations without being asked.
  The docs at `/docs/` are the exception: their approved layout is `src/layouts/Docs.astro`.
- Fonts go through the Astro Fonts API in `astro.config.mjs` (preload + metric-matched fallbacks), not CSS imports.
- Lighthouse mobile must stay at 100 in every category with CLS 0; check `npm run build && npx astro preview`.
- Everything in English.
- No AI attribution anywhere: no `Co-Authored-By` AI trailers or session links in commits,
  no "Generated with ..." lines in pull requests, no AI mentions in code or content.
  The `no-ai-signs` check fails on them; `.claude/settings.json` already turns Claude Code's attribution off.

## Verify

The git hooks (`uvx pre-commit install`, once per clone) fix whitespace and stop secrets, typos,
Markdown and workflow findings and AI attribution on every commit; CI's `Pre-commit` job runs
them on every file, as `uvx pre-commit run --all-files` does. Before every push:

```bash
npm run check   # must report 0 errors and 0 warnings
npm run lint    # oxlint, Prettier and knip; `npm run format` fixes the formatting
npm run build
```

After changing `src/content.config.ts`, restart the dev server: it does not reload schema changes.
