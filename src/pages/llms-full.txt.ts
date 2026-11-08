import type { APIRoute } from 'astro';
import { llmsFull } from '../lib/docs/pages';

// Every docs page in one file, for agents that take the docs in one go
export const GET: APIRoute = async () =>
  new Response(await llmsFull(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
