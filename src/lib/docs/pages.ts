import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { toolsMarkdown, webOnlyMarkdown } from './tools';

// The docs pages in sidebar order, their neighbours and their Markdown versions.

export type DocsPage = CollectionEntry<'docs'>;

// The site's address from astro.config.mjs, for links that must work outside the site
const SITE = import.meta.env.SITE.replace(/\/$/, '');

export async function getDocsNav() {
  const entry = await getEntry('docsNav', 'docs-nav');
  if (!entry) throw new Error('content/docs-nav.md is missing');
  return entry.data;
}

// Every page, by the order of its section in docs-nav.md, then by `order`
export async function getDocsPages() {
  const [nav, pages] = await Promise.all([getDocsNav(), getCollection('docs')]);
  const rank = new Map(nav.sections.map((s, i) => [s.id, i]));
  for (const page of pages) {
    if (!rank.has(page.data.section)) {
      throw new Error(`${page.filePath}: section "${page.data.section}" is not in content/docs-nav.md`);
    }
  }
  return pages.sort(
    (a, b) => (rank.get(a.data.section) ?? 0) - (rank.get(b.data.section) ?? 0) || a.data.order - b.data.order,
  );
}

// /docs/agents/ for agents.md, /docs/agents/docs-for-agents/ for agents/docs-for-agents.md
export const pagePath = (page: DocsPage) => `/docs/${page.id}/`;
export const markdownPath = (page: DocsPage) => `/docs/${page.id}.md`;
export const navLabel = (page: DocsPage) => page.data.nav ?? page.data.title;

// A section's first page has the section's own address, the crumbs stop at the section then
export function isSectionPage(page: DocsPage) {
  return !page.id.includes('/');
}

// The parts built from the server's tool reference, in place of their markers (tools.ts)
const GENERATED: Record<string, () => string> = { 'mcp-tools': toolsMarkdown, 'mcp-web-only': webOnlyMarkdown };
const MARKER = /^<!-- (\S+) -->$/;

// A line that is only a marker for the HTML page, like <!-- cards --> (the .md versions are plain text, never HTML)
function isComment(line: string) {
  const t = line.trim();
  return t.startsWith('<!--') && t.endsWith('-->');
}

const FENCE = /^\s*(```|~~~)/;
const ITEM = /^\s*[-*] /;
// A row as lists.ts finds it: **Label**, `name` or [Page](/docs/x/), then the text
const ROW = /^(\s*[-*] )(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))( \S.*)$/;

// Rows read as one run-on line in plain text ("**Find data** Search..."): a colon after each label
// tells the label from the text. Only in lists whose items are all rows, as on the page.
function rowColons(lines: string[]) {
  const out = [...lines];
  let i = 0;
  while (i < out.length) {
    let j = i;
    while (j < out.length && ITEM.test(out[j])) j++;
    if (j > i && out.slice(i, j).every((line) => ROW.test(line))) {
      for (let k = i; k < j; k++) out[k] = out[k].replace(ROW, '$1$2:$3');
    }
    i = Math.max(j, i + 1);
  }
  return out;
}

// Links as an agent follows them: other docs pages to their .md versions, every path absolute
function links(line: string, pages: Set<string>) {
  return line.replace(/\]\((\/[^)\s#]*)(#[^)\s]*)?\)/g, (_, path: string, hash = '') => {
    const id = /^\/docs\/(.+?)\/?$/.exec(path)?.[1];
    return id && pages.has(id) ? `](${SITE}/docs/${id}.md${hash})` : `](${SITE}${path}${hash})`;
  });
}

// The page as an agent reads it: plain Markdown with the generated parts filled in, no marker
// lines, a colon after each row's label and links that work outside the site. Code stays as it is.
function plain(body: string, pages: Set<string>) {
  const lines = body
    .split('\n')
    .flatMap((line) => GENERATED[MARKER.exec(line.trim())?.[1] ?? '']?.().split('\n') ?? [line]);
  const out: string[] = [];
  let prose: string[] = [];
  let fence = '';
  const flush = () => {
    out.push(...rowColons(prose).map((line) => links(line, pages)));
    prose = [];
  };
  for (const line of lines) {
    const mark = FENCE.exec(line)?.[1];
    if (fence) {
      out.push(line);
      if (mark === fence) fence = '';
    } else if (mark) {
      flush();
      fence = mark;
      out.push(line);
    } else if (!isComment(line)) {
      prose.push(line);
    }
  }
  flush();
  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function toMarkdown(page: DocsPage) {
  const pages = new Set((await getCollection('docs')).map((p) => p.id));
  return `# ${page.data.title}\n\n${page.data.description}\n\n${plain(page.body ?? '', pages)}\n`;
}

// /llms.txt (llmstxt.org): the title, a summary and one line per page, grouped by section
export async function llmsIndex() {
  const [nav, pages] = await Promise.all([getDocsNav(), getDocsPages()]);
  const groups = nav.sections
    .map((s) => ({ name: s.name, pages: pages.filter((p) => p.data.section === s.id) }))
    .filter((g) => g.pages.length)
    .map(
      (g) =>
        `## ${g.name}\n\n${g.pages.map((p) => `- [${p.data.title}](${SITE}${markdownPath(p)}): ${p.data.description}`).join('\n')}`,
    );
  return `# CandleStack\n\n> ${nav.summary}\n\n${groups.join('\n\n')}\n`;
}

// /llms-full.txt: every page in one file, in sidebar order
export async function llmsFull() {
  const [nav, pages] = await Promise.all([getDocsNav(), getDocsPages()]);
  const parts = await Promise.all(
    pages.map(async (p) => `${(await toMarkdown(p)).trim()}\n\nSource: ${SITE}${pagePath(p)}`),
  );
  return `# CandleStack docs\n\n> ${nav.summary}\n\n---\n\n${parts.join('\n\n---\n\n')}\n`;
}

export function formatDay(date: Date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
