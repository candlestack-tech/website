import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { promptsMarkdown, toolsMarkdown, webOnlyMarkdown } from './tools';
import { useCaseMarkdown } from './use-cases';

// The docs pages in sidebar order, their neighbours and their Markdown versions. A page is a
// Markdown file of content/docs/ or a recorded session of content/docs/use-cases/ (a use case).

type UseCase = CollectionEntry<'useCases'>;

interface PageData {
  title: string;
  nav?: string;
  description: string;
  section: string;
  order: number;
  updated: Date;
}

interface Base {
  id: string;
  filePath?: string;
  data: PageData;
}

export type DocsPage =
  (Base & { kind: 'page'; entry: CollectionEntry<'docs'> }) | (Base & { kind: 'case'; entry: UseCase });

export type CasePage = Extract<DocsPage, { kind: 'case' }>;

// The site's address from astro.config.mjs, for links that must work outside the site
const SITE = import.meta.env.SITE.replace(/\/$/, '');

// The section of the use cases in content/docs-nav.md
export const USE_CASES = 'use-cases';

export async function getDocsNav() {
  const entry = await getEntry('docsNav', 'docs-nav');
  if (!entry) throw new Error('content/docs-nav.md is missing');
  return entry.data;
}

// Drafts are visible in `npm run dev` only, never in the built site, its .md files or llms.txt
async function getUseCases(): Promise<DocsPage[]> {
  const cases = await getCollection('useCases', ({ data }) => import.meta.env.DEV || !data.draft);
  return cases.map((entry) => ({
    kind: 'case',
    id: `${USE_CASES}/${entry.id}`,
    filePath: entry.filePath,
    entry,
    data: {
      title: entry.data.title,
      nav: entry.data.nav,
      description: entry.data.summary,
      section: USE_CASES,
      order: entry.data.order,
      updated: entry.data.updated ?? entry.data.recorded_at,
    },
  }));
}

// Every page, by the order of its section in docs-nav.md, then by `order`
export async function getDocsPages() {
  const [nav, docs, cases] = await Promise.all([getDocsNav(), getCollection('docs'), getUseCases()]);
  const pages: DocsPage[] = [
    ...docs.map((entry): DocsPage => ({
      kind: 'page',
      id: entry.id,
      filePath: entry.filePath,
      entry,
      data: entry.data,
    })),
    ...cases,
  ];
  const rank = new Map(nav.sections.map((s, i) => [s.id, i]));
  const seen = new Set<string>();
  for (const page of pages) {
    if (!rank.has(page.data.section)) {
      throw new Error(`${page.filePath}: section "${page.data.section}" is not in content/docs-nav.md`);
    }
    if (seen.has(page.id)) throw new Error(`${page.filePath}: another page already has the address /docs/${page.id}/`);
    seen.add(page.id);
  }
  return pages.sort(
    (a, b) => (rank.get(a.data.section) ?? 0) - (rank.get(b.data.section) ?? 0) || a.data.order - b.data.order,
  );
}

// /docs/agents/ for agents.md, /docs/agents/docs-for-agents/ for agents/docs-for-agents.md
export const pagePath = (page: DocsPage) => `/docs/${page.id}/`;
export const markdownPath = (page: DocsPage) => `/docs/${page.id}.md`;
export const navLabel = (page: DocsPage) => page.data.nav ?? page.data.title;

// A section's first page has the section's own address, the crumbs stop at the section then.
// Other top-level pages, like manifest.md in Formats, show their own name after the section.
export function isSectionPage(page: DocsPage) {
  return page.id === page.data.section;
}

// The use cases a page lists: the first page of the Use cases section lists them all
export async function listedCases(page: DocsPage) {
  if (page.id !== USE_CASES) return [];
  const pages = await getDocsPages();
  return pages.filter((p): p is CasePage => p.kind === 'case');
}

// The parts built from the server's tool reference, in place of their markers (tools.ts)
const GENERATED = new Map<string, () => string>([
  ['<!-- mcp-tools -->', toolsMarkdown],
  ['<!-- mcp-prompts -->', promptsMarkdown],
  ['<!-- mcp-web-only -->', webOnlyMarkdown],
]);

// A line that is only a marker for the HTML page, like <!-- cards --> (the .md versions are plain text, never HTML)
function isComment(line: string) {
  const t = line.trim();
  return t.startsWith('<!--') && t.endsWith('-->');
}

// A fence of three or more backticks or tildes, closed by a fence of the same kind at least as long
const FENCE = /^\s*(`{3,}|~{3,})/;
const ADDRESS = /^(\s*(?:```|~~~))text address(?: .*)?$/;
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

// A line that ends the open fence: only the same mark, at least as long as the opening one
function closes(line: string, fence: string) {
  const mark = FENCE.exec(line)?.[1];
  return !!mark && mark[0] === fence[0] && mark.length >= fence.length && line.trim() === mark;
}

// The page as an agent reads it: plain Markdown with the generated parts filled in, no marker
// lines, a colon after each row's label and links that work outside the site. Code stays as it is.
function plain(body: string, pages: Set<string>) {
  const lines = body.split('\n').flatMap((line) => GENERATED.get(line.trim())?.().split('\n') ?? [line]);
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
      if (closes(line, fence)) fence = '';
    } else if (mark) {
      flush();
      fence = mark;
      // The address box is the page's look only: in plain text it is a text block
      out.push(ADDRESS.test(line) ? line.replace(ADDRESS, '$1text') : line);
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

// The use cases under the text of the Use cases page, one line each, or the section's `soon` text.
// The links are relative, so plain() points them at the .md versions like every other docs link.
function caseList(cases: DocsPage[], soon: string | undefined) {
  if (!cases.length) return soon ?? '';
  return cases.map((c) => `- [${c.data.title}](${pagePath(c)}) ${c.data.description}`).join('\n');
}

export async function toMarkdown(page: DocsPage) {
  const pages = new Set((await getDocsPages()).map((p) => p.id));
  const head = `# ${page.data.title}\n\n${page.data.description}\n\n`;
  if (page.kind === 'case') return `${head}${plain(useCaseMarkdown(page.entry.data), pages)}\n`;
  let body = page.entry.body ?? '';
  if (page.id === USE_CASES) {
    const soon = (await getDocsNav()).sections.find((s) => s.id === USE_CASES)?.soon;
    body = [body.trim(), caseList(await listedCases(page), soon)].filter(Boolean).join('\n\n');
  }
  return `${head}${plain(body, pages)}\n`;
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
