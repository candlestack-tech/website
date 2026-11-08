import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { isSafeHref, LINK } from './lib/docs/links';

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

// Strings that must never be committed in a recorded session: an API key, a one-time upload link,
// a bearer token, an email address. Placeholders like cs_xxxx, uploads/xxxx and @example.com pass.
const SECRETS: [RegExp, string][] = [
  [/\bcs_(?!x+\b)[A-Za-z0-9_-]{8,}/, 'an API key (write cs_xxxx instead)'],
  [/\/uploads?\/(?!x+\b)[A-Za-z0-9_-]{16,}/, 'a one-time upload link (write xxxx in place of its token)'],
  [/\bBearer\s+(?!x+\b)[A-Za-z0-9._-]{8,}/i, 'a bearer token (write Bearer xxxx instead)'],
  [/[A-Za-z0-9._%+-]+@(?!example\.(?:com|org)\b)[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/, 'an email address'],
];

function checkSecrets(text: string, path: (string | number)[], ctx: z.RefinementCtx) {
  for (const [re, what] of SECRETS) {
    if (re.test(text)) ctx.addIssue({ code: 'custom', path, message: `looks like ${what}, remove it` });
  }
}

// Every string and every key of the file, the JSON of the answers included
function findSecrets(value: unknown, path: (string | number)[], ctx: z.RefinementCtx) {
  if (typeof value === 'string') {
    checkSecrets(value, path, ctx);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => findSecrets(v, [...path, i], ctx));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      checkSecrets(k, [...path, k], ctx);
      findSecrets(v, [...path, k], ctx);
    }
  }
}

// Text with Markdown links (say, outcome.text, outcome.warning, try): only pages of the site,
// sections, web addresses and emails, never javascript: or data:
const text = z.string().superRefine((value, ctx) => {
  for (const [, , href] of value.matchAll(LINK)) {
    if (!isSafeHref(href)) {
      ctx.addIssue({ code: 'custom', message: `the link ${href} must start with /, #, https://, http:// or mailto:` });
    }
  }
});

// A number in a table cell as written: "+18.4 %", "−9.8 %", "1.36", 41
const cell = z.union([z.string(), z.number()]);

// Use cases: one recorded session per file, content/docs/use-cases/<slug>.json, shown at
// /docs/use-cases/<slug>/ with the player. content/README.md explains every field to writers.
const useCases = defineCollection({
  loader: glob({ pattern: '*.json', base: './content/docs/use-cases' }),
  schema: z
    .object({
      title: z.string(),
      nav: z.string().optional(),
      summary: z.string(),
      order: z.number().int().nonnegative(),
      client: z.string(),
      recorded_at: z.coerce.date(),
      duration_s: z.number().int().positive().optional(),
      updated: z.coerce.date().optional(),
      draft: z.boolean().default(false),
      prompt: z.string(),
      steps: z
        .array(
          z
            .object({
              say: text.optional(),
              calls: z
                .array(
                  z.object({
                    tool: z.string().regex(/^[a-z][a-z0-9_]*$/, 'a tool name like list_models'),
                    arguments: z.record(z.string(), z.unknown()).default({}),
                    result: z.string().optional(),
                    // Required: a call without its answer fails the build
                    answer: z.unknown(),
                    is_error: z.boolean().default(false),
                  }),
                )
                .default([]),
            })
            .refine((s) => s.say || s.calls.length, 'a step needs `say`, `calls` or both'),
        )
        .min(1),
      outcome: z.object({
        text,
        chart: z
          .object({
            title: z.string(),
            labels: z.array(z.string()).min(2),
            ticks: z.array(z.string()).optional(),
            base: z.number().optional(),
            series: z
              .array(z.object({ name: z.string(), values: z.array(z.number()), benchmark: z.boolean().default(false) }))
              .min(1)
              .max(4),
          })
          .refine((c) => c.series.every((s) => s.values.length === c.labels.length), {
            message: 'every series needs one value per label',
            path: ['series'],
          })
          .optional(),
        table: z
          .object({
            columns: z.array(z.object({ name: z.string(), better: z.enum(['higher', 'lower']).optional() })).min(2),
            rows: z
              .array(
                z.object({
                  name: z.string(),
                  sub: z.string().optional(),
                  values: z.array(cell),
                  benchmark: z.boolean().default(false),
                }),
              )
              .min(1),
          })
          .refine((t) => t.rows.every((r) => r.values.length === t.columns.length - 1), {
            message: 'every row needs one value per column after the first',
            path: ['rows'],
          })
          .optional(),
        warning: text.optional(),
      }),
      try: text.optional(),
    })
    .superRefine((data, ctx) => findSecrets(data, [], ctx)),
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

export const collections = { meetings, problems, docs, useCases, docsNav, site, status, team, links };
