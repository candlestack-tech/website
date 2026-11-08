import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
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

// A section's first page has the section's own address, the crumbs stop at the section then
export function isSectionPage(page: DocsPage) {
  return !page.id.includes('/');
}

// The use cases a page lists: the first page of the Use cases section lists them all
export async function listedCases(page: DocsPage) {
  if (page.id !== USE_CASES) return [];
  const pages = await getDocsPages();
  return pages.filter((p): p is CasePage => p.kind === 'case');
}

// A line that is only a marker for the HTML page, like <!-- cards --> (the .md versions are plain text, never HTML)
function isComment(line: string) {
  const t = line.trim();
  return t.startsWith('<!--') && t.endsWith('-->');
}

// Links and the page as an agent reads them: plain Markdown, absolute addresses, no comment lines
function plain(body: string) {
  return body
    .split('\n')
    .filter((line) => !isComment(line))
    .join('\n')
    .replace(/\]\(\//g, `](${SITE}/`)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// The use cases under the text of the Use cases page, one line each, or the section's `soon` text
function caseList(cases: DocsPage[], soon: string | undefined) {
  if (!cases.length) return soon ?? '';
  return cases.map((c) => `- [${c.data.title}](${SITE}${pagePath(c)}) ${c.data.description}`).join('\n');
}

export async function toMarkdown(page: DocsPage) {
  const head = `# ${page.data.title}\n\n${page.data.description}\n\n`;
  if (page.kind === 'case') return `${head}${plain(useCaseMarkdown(page.entry.data))}\n`;
  const body = plain(page.entry.body ?? '');
  if (page.id !== USE_CASES) return `${head}${body}\n`;
  const nav = await getDocsNav();
  const soon = nav.sections.find((s) => s.id === USE_CASES)?.soon;
  return `${head}${[body, caseList(await listedCases(page), soon)].filter(Boolean).join('\n\n')}\n`;
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
