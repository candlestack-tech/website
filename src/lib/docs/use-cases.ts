import type { CollectionEntry } from 'astro:content';
import { formatDay } from '../format';
import { url } from '../url';
import { escapeHtml } from './highlight';

// A recorded session (content/docs/use-cases/<slug>.json) for the player, the .md version and
// llms-full.txt: counts, the one-line form of a call, the chart's lines and the table's marks.

export type Session = CollectionEntry<'useCases'>['data'];
type Chart = NonNullable<Session['outcome']['chart']>;
type Table = NonNullable<Session['outcome']['table']>;

export const callCount = (s: Session) => s.steps.reduce((n, step) => n + step.calls.length, 0);

// The last step without calls is the agent's answer, shown as the end of the session
export const isAnswer = (s: Session, i: number) => i === s.steps.length - 1 && !s.steps[i].calls.length;

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function duration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return `${h} h ${m} min`;
  return m ? `${m} min ${s} s` : `${s} s`;
}

// Claude Code · 7 steps · 9 tool calls · 2 min 51 s · recorded 6 Nov 2026
export function metaLine(s: Session) {
  return [
    s.client,
    plural(s.steps.length, 'step'),
    plural(callCount(s), 'tool call'),
    ...(s.duration_s ? [duration(s.duration_s)] : []),
    `recorded ${formatDay(s.recorded_at)}`,
  ].join(' · ');
}

const leaves = (value: unknown): string[] => {
  if (value === null || typeof value !== 'object') return [String(value)];
  return Object.values(value).flatMap(leaves);
};

// The arguments of a call in one line, cut with an ellipsis by the CSS: model_id mdl_r4n8, ids 3 items
export function argLine(args: Record<string, unknown>) {
  const parts = Object.entries(args).map(([k, v]) => {
    if (Array.isArray(v)) return `${k} ${plural(v.length, 'item')}`;
    if (v !== null && typeof v === 'object') return `${k} ${leaves(v).join(' ')}`;
    return `${k} ${String(v)}`;
  });
  return parts.join(', ') || 'no arguments';
}

export const json = (value: unknown) => JSON.stringify(value ?? null, null, 2);

// Text of a session file: paragraphs with `code`, **bold** and [links](/docs/x/)
export function inline(md: string) {
  return md
    .split(/(`[^`]+`)/)
    .map((part, i) => {
      if (i % 2) return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
      return escapeHtml(part)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t: string, href: string) => {
          const to = href.startsWith('/') ? url(href) : href;
          return `<a href="${to}">${t}</a>`;
        });
    })
    .join('');
}

export function paragraphs(md: string, cls = '') {
  const attr = cls ? ` class="${cls}"` : '';
  return md
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p${attr}>${inline(p)}</p>`)
    .join('');
}

// ---- The chart: lines in a 1000 x 100 box, the y axis on round numbers ----

// The round step (1, 2 or 5 times a power of ten) that puts closest to 6 grid lines in the range
function niceTicks(lo: number, hi: number) {
  const exp = 10 ** Math.floor(Math.log10((hi - lo) / 6));
  const candidates = [1, 2, 5, 10, 20].map((f) => f * exp);
  const ticksOf = (step: number) => {
    const out: number[] = [];
    for (let t = Math.ceil(lo / step) * step; t <= hi + step / 1e6; t += step) out.push(Number(t.toFixed(6)));
    return out;
  };
  return candidates.map(ticksOf).reduce((a, b) => (Math.abs(b.length - 6) < Math.abs(a.length - 6) ? b : a));
}

export const num = (v: number) => String(Number(v.toFixed(2)));

// The color of each series: the Compare colors in order, buy and hold (a benchmark) in grey
export function seriesColors(chart: Chart) {
  let next = 0;
  return chart.series.map((s) => (s.benchmark ? 3 : Math.min(3, next++)));
}

export function chartGeometry(chart: Chart) {
  const all = chart.series.flatMap((s) => s.values).concat(chart.base ?? []);
  const min = Math.min(...all);
  const max = Math.max(...all);
  // A little room above and below the lines, the grid on round numbers inside it
  const pad = (max - min || Math.abs(max) || 1) * 0.05;
  const lo = min - pad;
  const hi = max + pad;
  const y = (v: number) => ((hi - v) / (hi - lo)) * 100;
  const n = chart.labels.length;
  const x = (i: number) => (i / (n - 1)) * 1000;
  const ticks = niceTicks(lo, hi);
  const paths = chart.series.map((s) =>
    s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(2)}`).join(''),
  );
  const count = Math.min(6, n);
  const xTicks =
    chart.ticks ?? Array.from({ length: count }, (_, k) => chart.labels[Math.round((k * (n - 1)) / (count - 1))]);
  return { ticks: ticks.map((t) => ({ value: t, top: y(t) })), paths, base: chart.base, y, xTicks };
}

// ---- The table: the best and worst value of each column, as on the Compare page ----

function parse(value: string | number) {
  if (typeof value === 'number') return value;
  const n = parseFloat(value.replace(/[−–]/g, '-').replace(/[^0-9.+-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

// marks[row][column of values]: best, worst or nothing; benchmark rows are never marked
export function tableMarks(table: Table) {
  const marks = table.rows.map((r) => r.values.map(() => ''));
  table.columns.slice(1).forEach((col, c) => {
    if (!col.better) return;
    const found = table.rows
      .map((r, i) => ({ i, v: r.benchmark ? undefined : parse(r.values[c]) }))
      .filter((e): e is { i: number; v: number } => e.v !== undefined);
    if (found.length < 2) return;
    const sign = col.better === 'higher' ? 1 : -1;
    const best = Math.max(...found.map((e) => sign * e.v));
    const worst = Math.min(...found.map((e) => sign * e.v));
    if (best === worst) return;
    for (const e of found) {
      if (sign * e.v === best) marks[e.i][c] = 'best';
      else if (sign * e.v === worst) marks[e.i][c] = 'worst';
    }
  });
  return marks;
}

// ---- The session as Markdown: the .md version of the page and its part of llms-full.txt ----

const fence = (lang: string, code: string) => `\`\`\`${lang}\n${code}\n\`\`\``;

function stepTitle(s: Session, i: number) {
  const step = s.steps[i];
  const tools = [...new Set(step.calls.map((c) => c.tool))];
  if (tools.length) return `### Step ${i + 1} · ${tools.join(', ')}`;
  return isAnswer(s, i) ? `### Step ${i + 1} · the answer` : `### Step ${i + 1}`;
}

function stepMarkdown(s: Session, i: number) {
  const step = s.steps[i];
  const say = step.say ? [isAnswer(s, i) ? step.say.replace(/^/gm, '> ') : step.say] : [];
  const calls = step.calls.map((c) =>
    [
      `Call \`${c.tool}\`${c.result ? ` → ${c.result}` : ''}`,
      fence('json', json(c.arguments)),
      c.is_error ? 'Error' : 'Answer',
      fence('json', json(c.answer)),
    ].join('\n\n'),
  );
  return [stepTitle(s, i), ...say, ...calls].join('\n\n');
}

function chartMarkdown(chart: Chart) {
  const last = chart.labels.length - 1;
  const lines = chart.series.map((s) => {
    const low = Math.min(...s.values);
    const at = chart.labels[s.values.indexOf(low)];
    return `- **${s.name}** ${num(s.values[0])} on ${chart.labels[0]}, ${num(s.values[last])} on ${chart.labels[last]}, lowest ${num(low)} on ${at}`;
  });
  return [`Chart: ${chart.title}`, lines.join('\n')].join('\n\n');
}

const cellText = (v: string | number) => String(v).replace(/\|/g, '\\|');

function tableMarkdown(table: Table) {
  const head = `| ${table.columns.map((c) => cellText(c.name)).join(' | ')} |`;
  const rule = `| ${table.columns.map(() => '---').join(' | ')} |`;
  const rows = table.rows.map((r) => {
    const name = r.sub ? `${r.name} (${r.sub})` : r.name;
    return `| ${[name, ...r.values].map(cellText).join(' | ')} |`;
  });
  return [head, rule, ...rows].join('\n');
}

export function useCaseMarkdown(s: Session) {
  const { outcome } = s;
  return [
    metaLine(s),
    '## The prompt',
    fence('text', s.prompt),
    '## The session',
    ...s.steps.map((_, i) => stepMarkdown(s, i)),
    '## The outcome',
    outcome.text,
    ...(outcome.chart ? [chartMarkdown(outcome.chart)] : []),
    ...(outcome.table ? [tableMarkdown(outcome.table)] : []),
    ...(outcome.warning ? [`> **Warning.** ${outcome.warning}`] : []),
    ...(s.try ? ['## Try it yourself', s.try] : []),
  ].join('\n\n');
}

// The sections of a use case page, for On this page
export function caseHeadings(s: Session) {
  const h = (slug: string, text: string) => ({ depth: 2, slug, text });
  return [
    h('prompt', 'The prompt'),
    h('session', 'The session'),
    h('outcome', 'The outcome'),
    ...(s.try ? [h('try', 'Try it yourself')] : []),
  ];
}

// ---- The kind of a tool: Read only, Changes data or Destructive ----

interface ToolList {
  tools: { name: string; annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean } }[];
}

// The server's tool list, once the site has a copy of it (src/data/mcp-tools.json, from
// candlestack's docs/mcp-tools.json). Without it the calls show no kind.
const toolLists = import.meta.glob<ToolList>('../../data/mcp-tools.json', { eager: true, import: 'default' });
const KINDS = new Map(
  Object.values(toolLists)
    .flatMap((list) => list.tools)
    .map((t) => {
      const a = t.annotations ?? {};
      const kind = a.readOnlyHint ? 'ro' : a.destructiveHint ? 'de' : 'rw';
      return [t.name, kind] as const;
    }),
);
const KIND_NAMES = { ro: 'Read only', rw: 'Changes data', de: 'Destructive' };

export function toolKind(name: string) {
  const kind = KINDS.get(name);
  return kind && { kind, name: KIND_NAMES[kind] };
}
