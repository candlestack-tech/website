import { codeBlocks, resetTabIds } from './blocks';
import { clone, elements, h, isBlank, isElement, raw, text, textOf, type Element, type Node, type Root } from './hast';
import { clientLogo, icon } from './icons';
import { rows, steps } from './lists';
import { promptsHast, toolsHast, webOnlyHast } from './tools';

// Turns the plain Markdown of content/docs/ into the pieces of the docs design. Pages stay plain
// Markdown that reads well as it is (the .md versions are the source), the shapes below get their
// look here. content/README.md lists them for writers.

type Slug = (value: string) => string;

// Heading ids as GitHub makes them: lowercase, punctuation dropped, spaces to dashes, numbered repeats
function slugger(): Slug {
  const seen = new Map<string, number>();
  return (value) => {
    const base = value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .trim()
      .replace(/\s/g, '-');
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n ? `${base}-${n}` : base;
  };
}

const filled = (nodes: Node[]) => nodes.filter((n) => !isBlank(n));
const only = (node: Element, tagName: string) => {
  const inner = filled(node.children);
  return inner.length === 1 && isElement(inner[0], tagName) ? inner[0] : undefined;
};

// The kind of a GitHub alert at the start of a quote's first paragraph, and the text after it
function alert(first: Element | undefined): { warn: boolean; rest: Node[] } | undefined {
  const head = first?.tagName === 'p' ? first.children[0] : undefined;
  if (!first || head?.type !== 'text') return undefined;
  const m = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/.exec(head.value);
  if (!m) return undefined;
  const rest = [text(head.value.slice(m[0].length)), ...first.children.slice(1)];
  return {
    warn: m[1] === 'WARNING' || m[1] === 'CAUTION',
    rest: rest.filter((n) => n.type !== 'text' || n.value !== ''),
  };
}

// > [!NOTE] or > [!WARNING] (GitHub's alerts). Bold text at the start replaces the "Note" label.
function callout(quote: Element): Element | undefined {
  const blocks = elements(quote.children);
  const found = alert(blocks[0]);
  if (!found) return undefined;
  const { warn, rest } = found;
  const label = isElement(rest[0], 'strong') ? [] : [h('b', {}, [text(warn ? 'Warning' : 'Note')]), text(' ')];
  return h('div', { className: warn ? ['co', 'warn'] : ['co'], role: 'note' }, [
    raw(icon(warn ? 'warn' : 'info')),
    h('div', {}, [h('p', {}, [...label, ...rest]), ...blocks.slice(1)]),
  ]);
}

// One card between <!-- cards --> and <!-- /cards -->: a ### title, then a line of bold (the kicker)
// and italic (a tag) text, a line of `code` names (client tags), a list (ticks) and a last link.
function cardPart(node: Element, last: boolean): Node | undefined {
  if (node.tagName === 'ul') {
    return h(
      'ul',
      { className: ['checks'] },
      elements(node.children).map((li) => h('li', {}, [raw(icon('check')), h('span', {}, li.children)])),
    );
  }
  const inner = filled(node.children);
  if (node.tagName === 'p' && inner.length && inner.every((n) => isElement(n, 'code'))) {
    const names = inner.map(textOf);
    return h(
      'div',
      { className: ['clients'] },
      names.map((n) => h('span', { className: ['tag'] }, [raw(clientLogo(n)), text(n)])),
    );
  }
  const link = node.tagName === 'p' && last ? only(node, 'a') : undefined;
  if (link) return h('a', { ...link.properties, className: ['go'] }, [...link.children, text(' →')]);
  return node;
}

function card(nodes: Node[], slug: Slug): Element {
  const [title, ...rest] = elements(nodes);
  const top: Node[] = [];
  const body: Node[] = [];
  rest.forEach((node, i) => {
    const inner = filled(node.children);
    const isTop =
      node.tagName === 'p' && inner.length && inner.every((n) => isElement(n, 'strong') || isElement(n, 'em'));
    if (!isTop) {
      body.push(cardPart(node, i === rest.length - 1) ?? node);
      return;
    }
    for (const part of elements(inner)) {
      // A tag that says Live is green, any other is the amber of what is still to come
      const live = textOf(part).trim() === 'Live';
      const cls = part.tagName === 'strong' ? ['k'] : ['tag', live ? 'live' : 'soon'];
      top.push(h('span', { className: cls }, part.children));
    }
  });
  const heading = h('h3', { id: `card-${slug(textOf(title))}` }, title.children);
  return h('div', { className: ['card'] }, [
    ...(top.length ? [h('div', { className: ['card-top'] }, top)] : []),
    heading,
    ...body,
  ]);
}

function pick(nodes: Node[], slug: Slug): Element {
  const groups: Node[][] = [];
  for (const node of nodes) {
    if (isElement(node, 'h3')) groups.push([node]);
    else if (groups.length) groups[groups.length - 1].push(node);
  }
  return h(
    'div',
    { className: ['pick'] },
    groups.map((g) => card(g, slug)),
  );
}

const marker = (node: Node, name: string) => node.type === 'raw' && node.value.trim() === `<!-- ${name} -->`;

// The nodes between <!-- name --> and <!-- /name --> become one piece
function between(nodes: Node[], name: string, build: (inner: Node[]) => Element): Node[] {
  const out: Node[] = [];
  for (let i = 0; i < nodes.length; i++) {
    if (!marker(nodes[i], name)) {
      out.push(nodes[i]);
      continue;
    }
    const end = nodes.findIndex((n, j) => j > i && marker(n, `/${name}`));
    const stop = end === -1 ? nodes.length : end;
    out.push(build(nodes.slice(i + 1, stop)));
    i = stop;
  }
  return out;
}

// Tabs between <!-- tabs --> and <!-- /tabs -->: each ### starts a tab, its name is the heading's
// text and italic text in it a tag. The pane's id is the name (claude.ai is #claude-ai), so a link
// opens its tab. Without JavaScript every pane shows under its name.
const tabId = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '');

const tabName = (title: Element) =>
  textOf({ ...title, children: title.children.filter((n) => !isElement(n, 'em')) }).trim();

function tabLabel(title: Element): Node[] {
  const name = tabName(title);
  const tags = elements(title.children).filter((n) => isElement(n, 'em'));
  return [
    raw(clientLogo(name)),
    h('span', {}, [text(name)]),
    ...tags.map((t) => h('span', { className: ['tag', 'soon'] }, t.children)),
  ];
}

function tabs(nodes: Node[], slug: Slug): Element {
  const groups: { title: Element; body: Node[] }[] = [];
  for (const node of nodes) {
    if (isElement(node, 'h3')) groups.push({ title: node, body: [] });
    else groups[groups.length - 1]?.body.push(node);
  }
  // Through the page's slugger, so a heading with the same name gets another id
  const ids = groups.map((g) => slug(tabId(tabName(g.title))));
  const list = h(
    'div',
    { className: ['ctab-list'], role: 'tablist' },
    groups.map((g, i) =>
      h(
        'button',
        {
          type: 'button',
          role: 'tab',
          id: `tab-${ids[i]}`,
          className: i ? ['ctab'] : ['ctab', 'on'],
          ariaSelected: String(!i),
          ariaControls: ids[i],
          tabIndex: i ? -1 : 0,
        },
        tabLabel(g.title),
      ),
    ),
  );
  const panes = groups.map((g, i) =>
    h(
      'div',
      {
        className: i ? ['ctab-pane'] : ['ctab-pane', 'on'],
        role: 'tabpanel',
        id: ids[i],
        ariaLabelledby: `tab-${ids[i]}`,
      },
      [h('div', { className: ['ctab-l'] }, tabLabel(g.title)), ...g.body],
    ),
  );
  return h('div', { className: ['ctabs'] }, [list, ...panes]);
}

// ## and ### get an id and a # link that shows on hover; the link has no text, so headings stay clean
function heading(node: Element, slug: Slug): Element {
  if (typeof node.properties.id === 'string') return node;
  const id = slug(textOf(node));
  return h(node.tagName, { ...node.properties, id }, [
    ...node.children,
    h('a', { className: ['hlink'], href: `#${id}`, ariaLabel: 'Link to this section' }),
  ]);
}

const hasClass = (node: Element) => Array.isArray(node.properties.className) && node.properties.className.length > 0;

// The transform of one element by its tag, after its children
const BY_TAG: Record<string, (el: Element, slug: Slug) => Node | undefined> = {
  h2: heading,
  h3: heading,
  blockquote: callout,
  ul: (el) => (hasClass(el) ? undefined : rows(el)),
  ol: (el) => (hasClass(el) ? undefined : steps(el)),
};

function element(node: Element, slug: Slug): Node {
  const el = { ...node, children: transform(node.children, slug) };
  return BY_TAG[el.tagName]?.(el, slug) ?? el;
}

function transform(nodes: Node[], slug: Slug): Node[] {
  const pieces = between(
    between(nodes, 'cards', (inner) => pick(inner, slug)),
    'tabs',
    (inner) => tabs(inner, slug),
  );
  return codeBlocks(pieces).map((n) => (isElement(n) && !n.data?.built ? element(n, slug) : n));
}

// The parts built from the server's tool reference (tools.ts), by their marker
const GENERATED = new Map<string, () => Node[]>([
  ['<!-- mcp-tools -->', toolsHast],
  ['<!-- mcp-prompts -->', promptsHast],
  ['<!-- mcp-web-only -->', webOnlyHast],
]);
const MARKERS = new Set(['<!-- cards -->', '<!-- /cards -->', '<!-- tabs -->', '<!-- /tabs -->', ...GENERATED.keys()]);

function generated(nodes: Node[]): Node[] {
  return nodes.flatMap((n) => (n.type === 'raw' && GENERATED.get(n.value.trim())?.()) || [n]);
}

// Pages stay plain Markdown: raw HTML other than the markers above, and links that are not
// http(s), a path (not //host), an anchor or mailto, fail the build with the file named
const LINK = /^(https?:\/\/|\/(?!\/)|#|mailto:)/;

function check(node: Node, file: string) {
  if (node.type === 'raw' && !MARKERS.has(node.value.trim())) {
    throw new Error(`${file}: raw HTML is not allowed in the docs, write Markdown instead: ${node.value.trim()}`);
  }
  if (isElement(node, 'a')) {
    const href = typeof node.properties.href === 'string' ? node.properties.href : '';
    if (!LINK.test(href)) throw new Error(`${file}: the link "${href}" must start with https://, /, # or mailto:`);
  }
  if ('children' in node) for (const child of node.children) check(child, file);
}

interface PluginContext {
  readonly fileURL: URL | undefined;
  replaceNode(node: unknown, replacement: unknown): void;
}

// A hast plugin of Astro's Markdown processor (Sätteri), set in astro.config.mjs
export const docsMarkdown = {
  name: 'candlestack-docs',
  after(root: unknown, ctx: PluginContext) {
    const tree = clone(root as Root) as Root;
    check(tree, ctx.fileURL ? decodeURI(ctx.fileURL.pathname).replace(/^.*\/(?=content\/)/, '') : 'A docs page');
    resetTabIds();
    tree.children = transform(generated(tree.children), slugger());
    ctx.replaceNode(root, tree);
  },
};
