# Content

All texts of the website live in this folder. No code needs to change to update the site.

| File | What it controls |
|---|---|
| `site.md` | project name, headline, subtitle, GitHub link, intros of the Meetings and Problem types pages |
| `status.md` | Status page and the status block on the home page |
| `team.md` | Team page and the team block on the home page |
| `links.md` | Links section at the bottom of the home page |
| `meetings/` | one file per meeting, named by date: `2026-09-23.md` |
| `templates/meeting.md` | template for new meeting minutes |
| `problems/` | one file per error type of the CandleStack API, named by its slug: `rate-limited.md` |
| `docs/` | the pages of the docs at `/docs/`, see below |
| `docs-nav.md` | the sections of the docs sidebar and the summary line of `/llms.txt` |

## Add meeting minutes

1. Copy `templates/meeting.md` to `meetings/YYYY-MM-DD.md`.
2. Fill it in, following the comments in the template.
3. Open a pull request.

The meeting appears in the list and gets its own page. With `draft: true` it is visible
only in `npm run dev`.

## Add a problem type

The API's error responses link to `https://candlestack.tech/problems/<slug>`. When the API gets a
new slug, add `problems/<slug>.md` with the exact slug as the file name, and fill in `title` (the
exact title the API sends), `status`, `summary`, `when` and `todo`, plus `fields` for the extra
members and headers of the response. Copy an existing file as a start. The page appears at
`/problems/<slug>/` and in the list at `/problems/`.

## Add a docs page

A page is a Markdown file in `docs/`. Its path is its address: `docs/agents.md` is the first page
of the Agents section at `/docs/agents/`, `docs/agents/docs-for-agents.md` is
`/docs/agents/docs-for-agents/`. Fill in the block at the top:

| Field | What it is |
|---|---|
| `title` | the heading of the page |
| `nav` | the name in the sidebar, when it differs from the title (optional) |
| `description` | the line under the title, also the page's line in `/llms.txt` |
| `section` | the `id` of a section in `docs-nav.md` |
| `order` | the place in its section, `0` first |
| `updated` | the date of the last change |

Below the block, write plain Markdown. Agents read the same text: every page is also at
`<address>.md` (`/docs/agents.md`), and `/llms.txt` and `/llms-full.txt` list and hold all of them.
So write it to read well as plain text. These shapes get the look of the docs:

| Write | It shows as |
|---|---|
| `> [!NOTE]` or `> [!WARNING]`, then the text on the next `>` line | a Note or Warning box; bold text at its start replaces the label |
| a code fence with `title="Terminal"` after the language | a code block with that label and Copy |
| a code fence `text prompt` | a prompt to paste into a chat, with Copy |
| a code fence with `out` after the language | output, in muted text |
| code fences with `tab="curl"`, `tab="Python"` right after each other | one code block with tabs; the reader's choice is kept |
| a list whose items all start with `**Label**`, a `` `name` `` or a `[link](/docs/x/)` | rows: the label on the left, the text on the right |
| a numbered list whose items all start with a bold line of their own | numbered steps |
| `<!-- cards -->`, cards that start with `###`, then `<!-- /cards -->` | cards side by side, see `docs/agents.md` |
| `<!-- tabs -->`, tabs that start with `###`, then `<!-- /tabs -->` | tabs with the client's logo, see `docs/mcp/install.md`, italic text in the `###` is a tag |
| a code fence `text address title="Server address"` | the address of a server, large, with Copy |
| `<!-- mcp-tools -->` on a line of its own | every tool of the MCP server, built from the server's tool reference |
| `<!-- mcp-web-only -->` on a line of its own | the API endpoints that stay in the web app, with the reason, from the same reference |

A list with blank lines between its items stops being rows and shows as a plain list. A `###` heading that starts with "Card" is left out of On this page, as card titles are.

Other HTML than the markers in the table fails the build, and so does a link that does not start
with `https://`, `http://`, `/` (not `//`), `#` or `mailto:`. In a tab, the link to the page
with `#` and the tab's name in lowercase with dashes (`/docs/mcp/install/#cursor`,
`#vs-code`, `#claude-ai`) opens that tab. A heading with the same name as a tab gets `-1` after
its id. Code fences in `powershell` get the same colors as `bash`.

In a card, a line of bold and italic text is the small label and its tag, a line of
`` `Claude Code` `ChatGPT` `` shows client tags with their logos, a list gets ticks and a link on
the last line becomes the card's link.

## Rules

- Everything is inside the block between the two `---` lines, one `field: value` per line.
- List items start with `-` and a space, nested fields are indented with two spaces.
- Put text with a colon in quotes: `'Project: goals and scope'`.
- A mistake does not break the live site: the build fails and names the file and the field.
