import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// All texts live in the top-level content/ folder, see content/README.md.
// The schemas below validate them at build time.

const meetings = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/meetings' }),
  schema: z.object({
    week: z.number().int().positive(),
    date: z.coerce.date(),
    time: z.string().optional(),
    title: z.string(),
    summary: z.string(),
    place: z.string(),
    present: z.array(z.string()),
    absent: z.array(z.string()).default([]),
    notesBy: z.string().optional(),
    agenda: z.array(z.string()),
    decisions: z.array(z.string()).default([]),
    actions: z.array(z.object({ task: z.string(), owner: z.string(), due: z.coerce.date().optional() })).default([]),
    next: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

// Problem types of the CandleStack API (RFC 9457): the page of each is its `type` URI,
// https://candlestack.tech/problems/<slug>, so the file name must be the slug the API sends.
const problems = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/problems' }),
  schema: z.object({
    title: z.string(),
    status: z.number().int().min(400).max(599),
    summary: z.string(),
    when: z.array(z.string()).min(1),
    todo: z.array(z.string()).min(1),
    fields: z.array(z.object({ name: z.string(), description: z.string() })).default([]),
  }),
});

// Pages of the docs at /docs/: content/docs/<section>.md is a section's first page,
// content/docs/<section>/<page>.md the others. The path is the address: agents/docs-for-agents.md
// becomes /docs/agents/docs-for-agents/ and /docs/agents/docs-for-agents.md.
const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/docs' }),
  schema: z.object({
    title: z.string(),
    nav: z.string().optional(),
    description: z.string(),
    section: z.string(),
    order: z.number().int().nonnegative(),
    updated: z.coerce.date(),
  }),
});

// The sections of the docs sidebar, in order: content/docs-nav.md
const docsNav = defineCollection({
  loader: glob({ pattern: 'docs-nav.md', base: './content' }),
  schema: z.object({
    summary: z.string(),
    sections: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          soon: z.string().optional(),
          links: z.array(z.object({ name: z.string(), url: z.string() })).default([]),
        }),
      )
      .min(1),
  }),
});

const site = defineCollection({
  loader: glob({ pattern: 'site.md', base: './content' }),
  schema: z.object({
    name: z.string(),
    title: z.string(),
    tagline: z.string(),
    subtitle: z.string(),
    github: z.url(),
    meetingsIntro: z.string(),
    problemsIntro: z.string(),
  }),
});

const status = defineCollection({
  loader: glob({ pattern: 'status.md', base: './content' }),
  schema: z.object({
    updated: z.coerce.date(),
    phases: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        state: z.enum(['done', 'active', 'planned']),
      }),
    ),
    done: z.array(z.string()).default([]),
    inProgress: z.array(z.string()).default([]),
    planned: z.array(z.string()).default([]),
  }),
});

const team = defineCollection({
  loader: glob({ pattern: 'team.md', base: './content' }),
  schema: z.object({
    supervisor: z.object({ name: z.string(), affiliation: z.string() }),
    members: z.array(
      z.object({
        name: z.string(),
        role: z.string(),
        area: z.string().optional(),
      }),
    ),
  }),
});

const links = defineCollection({
  loader: glob({ pattern: 'links.md', base: './content' }),
  schema: z.object({
    title: z.string(),
    teamNote: z.string(),
    groups: z.array(
      z.object({
        name: z.string(),
        links: z.array(
          z.object({
            name: z.string(),
            detail: z.string(),
            url: z.url(),
            team: z.boolean().default(false),
          }),
        ),
      }),
    ),
  }),
});

export const collections = { meetings, problems, docs, docsNav, site, status, team, links };
