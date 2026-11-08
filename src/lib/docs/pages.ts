import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

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

// A line that is only a comment, like the <!-- cards --> markers
const isComment = (line: string) => /^\s*<!--.*-->\s*$/.test(line);

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

export function toMarkdown(page: DocsPage) {
  return `# ${page.data.title}\n\n${page.data.description}\n\n${plain(page.body ?? '')}\n`;
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
  const parts = pages.map((p) => `${toMarkdown(p).trim()}\n\nSource: ${SITE}${pagePath(p)}`);
  return `# CandleStack docs\n\n> ${nav.summary}\n\n---\n\n${parts.join('\n\n---\n\n')}\n`;
}

export function formatDay(date: Date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
