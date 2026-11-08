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
| `docs/use-cases/` | one recorded session per use case, see below |
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

In a card, a line of bold and italic text is the small label and its tag, a line of
`` `Claude Code` `ChatGPT` `` shows client tags with their logos, a list gets ticks and a link on
the last line becomes the card's link.

## Add a use case

A use case is one real session of an agent with CandleStack: the prompt, every tool call with its
answer, and the outcome. Each is a JSON file in `docs/use-cases/`, named by its address:
`docs/use-cases/compare-three-models-nvda.json` is `/docs/use-cases/compare-three-models-nvda/`.
The page plays the session step by step, and its `.md` version and `/llms-full.txt` hold it as a
plain transcript. `/docs/use-cases/` lists every use case below the text of `docs/use-cases.md`.

Record the session for real, against the test server, and write down only what happened. Never
make up a session, a call or an answer. `docs/use-cases/sample-session.json` is made-up test data
for the player and stays a draft. Copy it as a start, then replace everything in it.

| Field | What it is |
|---|---|
| `title` | the heading of the page, also its name in the sidebar |
| `nav` | a shorter name for the sidebar (optional) |
| `summary` | the line under the title, also the page's line in `/llms.txt` |
| `order` | the place in the Use cases section, `1` first (the list page is `0`) |
| `client` | the client the session ran in, as it is called: `Claude Code`, `claude.ai`, `ChatGPT`, `Cursor`, `VS Code` (these get their logo) |
| `recorded_at` | the day of the recording, `2026-11-20` |
| `duration_s` | how long the session took, in seconds (optional) |
| `updated` | the day of the last change, when it is not the recording day (optional) |
| `draft` | `true` keeps the page out of the built site, its `.md`, the list and `/llms.txt`. It shows only in `npm run dev` |
| `prompt` | what was typed into the client, word for word |
| `steps` | the session in order, see below |
| `outcome` | the result, see below |
| `try` | the text under Try it yourself (optional) |

Each step is what the agent did between two of its messages:

| Field | What it is |
|---|---|
| `say` | the agent's text at that point (optional when the step has calls). A last step with only `say` is shown as the agent's answer |
| `calls` | the tool calls of the step, in order (optional) |
| `calls[].tool` | the name of the tool, `list_models` |
| `calls[].arguments` | the arguments as the agent sent them, JSON |
| `calls[].result` | a few words on what came back, shown on the folded line: `3 models, all 1h` (optional) |
| `calls[].answer` | what the tool answered, JSON. Cut long answers down: keep the fields the session is about, shorten long lists to their first items. Never change a value |
| `calls[].is_error` | `true` when the tool answered with an error |

The outcome:

| Field | What it is |
|---|---|
| `outcome.text` | a short paragraph on the result |
| `outcome.chart` | a line chart (optional): `title`, `labels` (one per point, shown on hover, like `2 Jan 2025`), `ticks` (the labels under the chart, optional), `base` (a dashed line, like `100`, optional) and up to four `series` of `name` and `values`, one value per label. `benchmark: true` draws a series dashed and grey, for buy and hold |
| `outcome.table` | a table of the figures (optional): `columns` (each a `name`, the first one is the column of names) and `rows` (each a `name`, an optional `sub` line, `values` for the other columns and `benchmark: true` for buy and hold). A column with `better: "higher"` or `better: "lower"` gets its best value in green and its worst in red. A row named like a series of the chart gets its color |
| `outcome.warning` | a Warning under the table (optional) |

In `say`, `outcome` texts and `try`, write `` `code` ``, `**bold**` and `[links](/docs/agents/)`. A
blank line starts a new paragraph.

### Remove secrets and private data first

A recorded session holds things that must never reach the repository. Before you commit, go
through the whole file and replace them:

- **API keys** (`cs_...`) with `cs_xxxx`.
- **One-time upload links** (`.../uploads/<token>` and `.../upload/<token>`, also inside the
  `command` of `create_model_upload`) with `xxxx` in place of the token.
- **Bearer tokens** and any `Authorization` header with `Bearer xxxx`.
- **Email addresses** with `name@example.com`, and **names of people** (`display_name`, `author`)
  with `Sample User`, or leave the field out.
- File paths from your computer, private model names and anything else you would not show.

The build checks for API keys, upload tokens, bearer tokens and email addresses and fails with the
field named, but it cannot spot everything. Read the file once more before you open the pull request.

## Rules

- Everything is inside the block between the two `---` lines, one `field: value` per line.
- List items start with `-` and a space, nested fields are indented with two spaces.
- Put text with a colon in quotes: `'Project: goals and scope'`.
- A mistake does not break the live site: the build fails and names the file and the field.
