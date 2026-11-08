# CandleStack website

Project website of CandleStack, a team project at STU FEI: project status, meeting minutes, team
and the docs for agents.
Built with [Astro](https://astro.build) as a static site.

## Run locally

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:4321. Pages reload on every change.

| Command | What it does |
|---|---|
| `npm run dev` | local development server |
| `npm run build` | builds the static site into `dist/` |
| `npm run preview` | serves the built site |
| `npm run check` | type-checks the code and validates the content |
| `npm run lint` | lints the code (oxlint), checks its formatting (Prettier) and finds unused files and exports (knip) |
| `npm run format` | formats the code with Prettier |
| `uvx pre-commit install` | once per clone: the git hooks (`.pre-commit-config.yaml`) fix whitespace and stop secrets, typos, Markdown and workflow findings on every commit; `uvx pre-commit run --all-files` runs them on every file, as CI's `Pre-commit` job does |

## Editing content

All texts live in [`content/`](content/). To update the site you only edit Markdown files there,
never the code. See [`content/README.md`](content/README.md) for the rules.

| File | What it controls |
|---|---|
| `content/site.md` | project name, headline, subtitle, GitHub link, intros of the Meetings and Problem types pages |
| `content/status.md` | Status page and the status block on the home page |
| `content/team.md` | Team page and the team block on the home page |
| `content/links.md` | Links section at the bottom of the home page |
| `content/meetings/YYYY-MM-DD.md` | one file per meeting |
| `content/templates/meeting.md` | template for new meeting minutes |
| `content/problems/<slug>.md` | one file per error type of the CandleStack API, see below |
| `content/docs/` | the pages of the docs at `/docs/`, see below |
| `content/docs/use-cases/<slug>.json` | one recorded session per use case at `/docs/use-cases/<slug>/` |
| `content/docs-nav.md` | the sections of the docs sidebar |

### Add meeting minutes

1. Copy `content/templates/meeting.md` to `content/meetings/YYYY-MM-DD.md`.
2. Fill it in, following the comments in the template.
3. Open a pull request.

The meeting appears in the list and gets its own page at `/meetings/YYYY-MM-DD/`.
With `draft: true` it is visible only in `npm run dev`.

### Problem types of the API

Error responses of the CandleStack API (RFC 9457) have a `type` of
`https://candlestack.tech/problems/<slug>`. Each `content/problems/<slug>.md` becomes that page:
the status, when the error happens and what the client should do. `/problems/` lists them all.
See [`content/README.md`](content/README.md) to add one.

### Docs

The docs at `/docs/` explain how agents use CandleStack through the MCP server and the API. Each
page is a Markdown file in `content/docs/`, and its text is served three ways, all built with the
site: the page itself, the plain Markdown at `<page>.md` (`/docs/agents.md`), and `/llms.txt`
(one line per page) and `/llms-full.txt` (every page in one file) for agents. See
[`content/README.md`](content/README.md) to add a page and for the Markdown shapes the docs style.
A use case is a recorded session in `content/docs/use-cases/<slug>.json`, played step by step on its
page. `content/README.md` explains the format and how to remove secrets before committing one.

### Update status or team

Edit `content/status.md` or `content/team.md`. In `status.md`, also change `updated` to today's date.

Every content file is validated at build time. A missing field or a typo fails the build
with the file and field named, so a mistake never reaches the live site.

## Project structure

```text
content/                 texts: site, status, team, links, meetings, templates, problems, docs
public/                  static files (favicon)
src/
  content.config.ts      schemas that validate everything in content/
  pages/                 one file per page; meetings/[slug].astro and problems/[slug].astro
                         render each meeting and problem type, docs/ each docs page and its .md,
                         llms.txt.ts and llms-full.txt.ts the files for agents
  layouts/Base.astro     page shell: header, navigation, theme
  layouts/Docs.astro     docs shell: sidebar, page, On this page, Menu drawer on phones
  components/            head, background, hero band, theme toggle, section heading, lock icon,
                         the client logos of the docs, the use case page and the list of use cases
  lib/                   content loaders, date format, base-path links, background generator
  lib/docs/              docs pages and their Markdown versions, the Markdown transform that
                         builds code blocks, tabs, callouts, rows, steps and cards, use cases
  scripts/docs.ts        Copy, tabs, the Menu drawer and On this page in the browser
  scripts/use-case.ts    the session player and the chart's tooltip of a use case
  styles/global.css      colors for the light and dark theme, shared styles
  styles/docs.css        styles of the docs pages
  styles/use-cases.css   styles of the use case pages
```

## Theme

Light and dark theme. The first visit follows the system setting, the toggle in the header
overrides it and the choice is remembered in the browser.
