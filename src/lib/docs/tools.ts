import { z } from 'astro/zod';
import reference from '../../data/mcp-tools.json';
import { h, text, type Element, type Node } from './hast';

// The tool reference of the MCP server: src/data/mcp-tools.json, vendored from candlestack's
// docs/mcp-tools.json (`npm run mcp-tools`, CI fails when it is older). Three markers in a docs
// page stand for the parts built from it, as HTML on the page and as Markdown in its .md version:
//   <!-- mcp-tools -->     the legend, the index and one entry per tool
//   <!-- mcp-prompts -->   the server's prompts, with their arguments
//   <!-- mcp-web-only -->  the API endpoints that have no tool on purpose, with the reason

const SOURCE = 'https://github.com/candlestack-tech/candlestack/blob/main/docs/mcp-tools.json';
const TOOLS_PAGE = 'https://candlestack.tech/docs/mcp/tools/';

type JsonSchema = Record<string, unknown>;

const Tool = z.object({
  name: z.string(),
  title: z.string(),
  description: z.string(),
  annotations: z.object({
    readOnlyHint: z.boolean(),
    destructiveHint: z.boolean(),
    idempotentHint: z.boolean(),
  }),
  inputSchema: z.record(z.string(), z.unknown()),
  scopes: z.array(z.string()).min(1),
  example: z.object({ arguments: z.record(z.string(), z.unknown()), result: z.unknown() }),
  endpoints: z.array(z.string()),
});

const Prompt = z.object({
  name: z.string(),
  title: z.string(),
  description: z.string(),
  arguments: z.array(z.object({ name: z.string(), description: z.string().optional(), required: z.boolean() })),
});

// A reference of a release before the server had prompts has none
const Reference = z.object({
  tools: z.array(Tool),
  prompts: z.array(Prompt).default([]),
  webOnly: z.array(z.object({ endpoint: z.string(), reason: z.string() })),
});

type Tool = z.infer<typeof Tool>;

const parsed = Reference.safeParse(reference);
if (!parsed.success) {
  throw new Error(`src/data/mcp-tools.json does not have the shape the docs expect: ${parsed.error.message}`);
}
const { tools, prompts, webOnly } = parsed.data;

// The ids of the tool entries: On this page leaves them out, the index of the page lists them
export const toolIds = new Set(tools.map((t) => t.name));

// What a tool does to your data, from its annotations
type Kind = 'ro' | 'rw' | 'de';
const KINDS: Record<Kind, [string, string]> = {
  ro: ['Read only', 'Reads, never changes anything'],
  rw: ['Changes data', 'Creates or edits your things'],
  de: ['Destructive', 'Deletes your things or shows them to others. Your client can ask you first'],
};

function kind(tool: Tool): Kind {
  if (tool.annotations.readOnlyHint) return 'ro';
  return tool.annotations.destructiveHint ? 'de' : 'rw';
}

// The kind of a tool by its name, for the calls of a use case; undefined for a tool the file lacks
export function toolKind(name: string) {
  const tool = tools.find((t) => t.name === name);
  return tool && { kind: kind(tool), name: KINDS[kind(tool)][0] };
}

// The index groups tools by the part of the API they do the work of
const GROUPS: [string, RegExp][] = [
  ['Account', /^\/api\/v1\/me\b/],
  ['Market data', /^\/api\/v1\/(data|preprocessing)\//],
  ['Models', /^\/api\/v1\/(models|uploads)\b/],
  ['Experiments', /^\/api\/v1\/experiments\b/],
  ['Backtests', /^\/api\/v1\/(backtests|compare|dashboard|sweeps)\b/],
];

function group(tool: Tool) {
  if (/publish|experiment/.test(tool.name)) return 'Experiments';
  const path = tool.endpoints[0]?.split(' ')[1] ?? '';
  return GROUPS.find(([, re]) => re.test(path))?.[0] ?? 'Other';
}

function groups() {
  const order = [...GROUPS.map(([name]) => name), 'Other'];
  return order.map((name) => ({ name, tools: tools.filter((t) => group(t) === name) })).filter((g) => g.tools.length);
}

// The description a model reads, without the link back to this page that the server adds
function paragraphs(tool: Tool) {
  return tool.description
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith(`Docs: ${TOOLS_PAGE}`));
}

interface Param {
  name: string;
  type: string;
  required: boolean;
  about: string;
}

function resolve(schema: JsonSchema, root: JsonSchema): JsonSchema {
  const ref = schema.$ref;
  if (typeof ref !== 'string') return schema;
  const defs = (root.$defs ?? {}) as Record<string, JsonSchema>;
  const def = defs[ref.split('/').pop() ?? ''] ?? {};
  return { ...def, ...schema, $ref: undefined };
}

function typeName(raw: JsonSchema, root: JsonSchema): string {
  const schema = resolve(raw, root);
  if (Array.isArray(schema.anyOf)) {
    const types = (schema.anyOf as JsonSchema[]).filter((s) => s.type !== 'null').map((s) => typeName(s, root));
    return [...new Set(types)].join(' or ');
  }
  if (schema.type === 'array') return `array of ${typeName((schema.items ?? {}) as JsonSchema, root)}`;
  if (schema.format === 'date' || schema.format === 'date-time') return schema.format;
  return typeof schema.type === 'string' ? schema.type : 'any';
}

const json = (value: unknown) => JSON.stringify(value);

function about(raw: JsonSchema, root: JsonSchema) {
  const schema = resolve(raw, root);
  const parts = [typeof schema.description === 'string' ? schema.description.trim().replace(/\.?$/, '.') : ''];
  const values = Array.isArray(schema.enum) ? schema.enum : undefined;
  if (values) parts.push(`One of ${values.map((v) => `\`${json(v)}\``).join(', ')}.`);
  if (schema.default !== undefined) parts.push(`Default \`${json(schema.default)}\`.`);
  return parts.filter(Boolean).join(' ');
}

function params(tool: Tool): Param[] {
  const root = tool.inputSchema;
  const props = (root.properties ?? {}) as Record<string, JsonSchema>;
  const required = new Set(Array.isArray(root.required) ? (root.required as string[]) : []);
  return Object.entries(props).map(([name, schema]) => ({
    name,
    type: typeName(schema, root),
    required: required.has(name),
    about: about(schema, root),
  }));
}

const pretty = (value: unknown) => JSON.stringify(value, null, 2);
const count = tools.length === 1 ? '1 tool' : `${tools.length} tools`;

// ---------- Markdown, for the .md versions, /llms-full.txt and Copy page ----------

// Text in a table cell: a backslash or a | would change the table
const cell = (value: string) => value.replace(/[\\|]/g, (c) => `\\${c}`);

function toolMarkdown(tool: Tool) {
  const tags = [
    KINDS[kind(tool)][0],
    ...tool.scopes.map((s) => `scope \`${s}\``),
    ...tool.endpoints.map((e) => `\`${e}\``),
  ];
  const list = params(tool);
  const table = list.length
    ? [
        '| Name | Type | Required | What it is |',
        '| --- | --- | --- | --- |',
        ...list.map((p) => `| \`${p.name}\` | ${p.type} | ${p.required ? 'yes' : 'no'} | ${cell(p.about)} |`),
      ].join('\n')
    : 'No parameters.';
  return [
    `### ${tool.name}`,
    `${tool.title} · ${tags.join(' · ')}`,
    ...paragraphs(tool),
    'Parameters',
    table,
    'Example call',
    `\`\`\`json\n${pretty(tool.example.arguments)}\n\`\`\``,
    'Answer',
    `\`\`\`json\n${pretty(tool.example.result)}\n\`\`\``,
  ].join('\n\n');
}

export function toolsMarkdown() {
  const legend = Object.values(KINDS).map(([name, what]) => `- **${name}** ${what}`);
  const index = groups().map((g) => `- **${g.name}** ${g.tools.map((t) => `\`${t.name}\``).join(', ')}`);
  return [
    `${count}, generated from [the server's tool reference](${SOURCE}).`,
    legend.join('\n'),
    '## All tools',
    index.join('\n'),
    ...tools.map(toolMarkdown),
  ].join('\n\n');
}

type Prompt = z.infer<typeof Prompt>;

// A prompt's arguments in one line: "backtest (required), model, instrument"
function promptArguments(prompt: Prompt) {
  if (!prompt.arguments.length) return 'No arguments.';
  const list = prompt.arguments.map((a) => (a.required ? `${a.name} (required)` : a.name));
  return `Arguments: ${list.join(', ')}.`;
}

const description = (prompt: Prompt) => prompt.description.split(/\s+/).join(' ');

export function promptsMarkdown() {
  if (!prompts.length) return '';
  return prompts.map((p) => `- \`${p.name}\` ${description(p)} ${promptArguments(p)}`).join('\n');
}

// Endpoints with the same reason share one line
function webOnlyGroups() {
  const byReason = new Map<string, string[]>();
  for (const { endpoint, reason } of webOnly) byReason.set(reason, [...(byReason.get(reason) ?? []), endpoint]);
  return [...byReason].map(([reason, endpoints]) => ({ reason, endpoints }));
}

export function webOnlyMarkdown() {
  return webOnlyGroups()
    .map((g) => `- ${g.endpoints.map((e) => `\`${e}\``).join(', ')}: ${g.reason}`)
    .join('\n');
}

// ---------- HTML, for the page; markdown.ts shapes the code blocks and headings ----------

// Inline `code` in the texts of the server
function inline(value: string): Node[] {
  return value
    .split(/(`[^`]+`)/)
    .map((part) =>
      part.startsWith('`') && part.endsWith('`') && part.length > 1
        ? h('code', {}, [text(part.slice(1, -1))])
        : text(part),
    );
}

const tag = (k: Kind) => h('span', { className: ['tag', k] }, [h('span', { className: ['dot'] }), text(KINDS[k][0])]);

// A fence as the Markdown processor gives it, so markdown.ts builds the block with its label and Copy
function fence(code: string, meta: string): Element {
  const el = h('code', { className: ['language-json'] }, [text(`${code}\n`)]);
  return h('pre', {}, [{ ...el, data: { lang: 'json', meta } }]);
}

const label = (value: string) => h('div', { className: ['lbl'] }, [text(value)]);

function paramTable(list: Param[]): Node {
  if (!list.length) return h('p', { className: ['none'] }, [text('No parameters.')]);
  const head = h(
    'tr',
    {},
    ['Name', 'Type', 'What it is'].map((t) => h('th', {}, [text(t)])),
  );
  const rows = list.map((p) =>
    h('tr', {}, [
      h('td', { className: ['nm'] }, [text(p.name), h('small', {}, [text(p.required ? 'required' : 'optional')])]),
      h('td', { className: ['ty'] }, [text(p.type)]),
      h('td', {}, inline(p.about)),
    ]),
  );
  return h('div', { className: ['tw'] }, [
    h('table', { className: ['pt'] }, [h('thead', {}, [head]), h('tbody', {}, rows)]),
  ]);
}

function toolEntry(tool: Tool): Element {
  const tags = [
    tag(kind(tool)),
    ...tool.scopes.map((s) => h('span', { className: ['tag'] }, [text(`scope ${s}`)])),
    ...tool.endpoints.map((e) => h('span', { className: ['tag'] }, [text(e)])),
  ];
  return h('section', { className: ['tool'] }, [
    h('h3', { id: tool.name }, [
      text(tool.name),
      h('a', { className: ['hlink'], href: `#${tool.name}`, ariaLabel: 'Link to this tool' }),
    ]),
    h('div', { className: ['tags'] }, [h('span', { className: ['tool-t'] }, [text(tool.title)]), ...tags]),
    ...paragraphs(tool).map((p) => h('p', {}, inline(p))),
    label('Parameters'),
    paramTable(params(tool)),
    label('Example call'),
    fence(pretty(tool.example.arguments), `title="${tool.name}"`),
    label('Answer'),
    fence(pretty(tool.example.result), 'out title="structuredContent"'),
  ]);
}

function legend(): Element {
  return h(
    'ul',
    { className: ['legend'] },
    (Object.keys(KINDS) as Kind[]).map((k) => h('li', {}, [tag(k), text(KINDS[k][1])])),
  );
}

function index(): Element {
  return h(
    'div',
    { className: ['tidx'] },
    groups().map((g) =>
      h('div', { className: ['tidx-g'] }, [
        h('div', { className: ['gt'] }, [text(g.name)]),
        h(
          'ul',
          {},
          g.tools.map((t) =>
            h('li', {}, [
              h('a', { href: `#${t.name}` }, [
                h('span', { className: ['tdot', kind(t)], title: KINDS[kind(t)][0] }),
                text(t.name),
              ]),
            ]),
          ),
        ),
      ]),
    ),
  );
}

export function toolsHast(): Node[] {
  return [
    h('p', { className: ['tmeta'] }, [
      text(`${count}, generated from `),
      h('a', { href: SOURCE }, [text("the server's tool reference")]),
      text('.'),
    ]),
    legend(),
    h('h2', {}, [text('All tools')]),
    index(),
    ...tools.map(toolEntry),
  ];
}

export function promptsHast(): Node[] {
  if (!prompts.length) return [];
  return [
    h(
      'ul',
      { className: ['rows'] },
      prompts.map((p) =>
        h('li', { className: ['r'] }, [
          h('span', { className: ['l', 'mono'] }, [text(p.name)]),
          h('span', { className: ['t'] }, [text(`${description(p)} ${promptArguments(p)}`)]),
        ]),
      ),
    ),
  ];
}

export function webOnlyHast(): Node[] {
  return [
    h(
      'ul',
      { className: ['rows', 'ep'] },
      webOnlyGroups().map((g) =>
        h('li', { className: ['r'] }, [
          h(
            'span',
            { className: ['l', 'mono'] },
            g.endpoints.flatMap((e, i) => (i ? [h('br'), text(e)] : [text(e)])),
          ),
          h('span', { className: ['t'] }, [text(g.reason)]),
        ]),
      ),
    ),
  ];
}
