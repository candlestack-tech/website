import type { APIRoute } from 'astro';
import { llmsIndex } from '../lib/docs/pages';

// The index of the docs for agents (llmstxt.org), one line per page
export const GET: APIRoute = async () =>
  new Response(await llmsIndex(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
