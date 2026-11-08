import type { APIRoute, GetStaticPaths } from 'astro';
import { getDocsPages, toMarkdown, type DocsPage } from '../../lib/docs/pages';

// Every docs page as plain Markdown: /docs/agents/ is also /docs/agents.md
export const getStaticPaths = (async () => {
  const pages = await getDocsPages();
  return pages.map((page) => ({ params: { slug: page.id }, props: { page } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ page: DocsPage }> = ({ props }) =>
  new Response(toMarkdown(props.page), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
