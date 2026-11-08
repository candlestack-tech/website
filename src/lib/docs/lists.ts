import { elements, h, isBlank, isElement, text, textOf, type Element, type Node } from './hast';

// Two list shapes of the docs, found by how the items start:
//   - **Label** text        rows: a label column and the text, as on the rest of the website
//   - `name` text           rows with a code label
//   - [Page](/docs/x/) text rows that link to a page
//   1. **Title** + blocks   numbered steps, when every item starts with a bold paragraph

const filled = (nodes: Node[]) => nodes.filter((n) => !isBlank(n));
const ROW_LABELS = new Set(['strong', 'code', 'a']);

function rowParts(li: Element): [Element, Node[]] | undefined {
  const [first, ...rest] = filled(li.children);
  if (!isElement(first) || !ROW_LABELS.has(first.tagName) || !rest.length) return undefined;
  if (rest.some((n) => isElement(n, 'p') || isElement(n, 'ul') || isElement(n, 'ol'))) return undefined;
  const lead = rest[0];
  const trimmed = lead.type === 'text' ? [text(lead.value.trimStart()), ...rest.slice(1)] : rest;
  return [first, trimmed];
}

const hasLink = (nodes: Node[]): boolean =>
  nodes.some((n) => isElement(n) && (n.tagName === 'a' || hasLink(n.children)));

function row([label, rest]: [Element, Node[]]): Element {
  const t = h('span', { className: ['t'] }, rest);
  if (label.tagName === 'a' && !hasLink(rest)) {
    return h('li', {}, [
      h('a', { ...label.properties, className: ['rl'] }, [h('span', { className: ['l'] }, label.children), t]),
    ]);
  }
  if (label.tagName === 'code') {
    return h('li', { className: ['r'] }, [h('span', { className: ['l', 'mono'] }, [text(textOf(label))]), t]);
  }
  const content = label.tagName === 'a' ? [label] : label.children;
  return h('li', { className: ['r'] }, [h('span', { className: ['l'] }, content), t]);
}

export function rows(ul: Element): Element | undefined {
  const items = elements(ul.children);
  const parts = items.map(rowParts);
  if (!items.length || parts.some((p) => !p)) return undefined;
  return h('ul', { className: ['rows'] }, (parts as [Element, Node[]][]).map(row));
}

function stepTitle(li: Element): Element | undefined {
  const first = elements(li.children)[0];
  if (!isElement(first, 'p')) return undefined;
  const inner = filled(first.children);
  return inner.length === 1 && isElement(inner[0], 'strong') ? inner[0] : undefined;
}

export function steps(ol: Element): Element | undefined {
  const items = elements(ol.children);
  const titles = items.map(stepTitle);
  if (!items.length || titles.some((t) => !t)) return undefined;
  return h(
    'ol',
    { className: ['steps'] },
    items.map((li, i) => {
      const body = filled(li.children).slice(1);
      return h('li', {}, [
        h('span', { className: ['n'] }, [text(String(i + 1))]),
        h('div', {}, [
          h('div', { className: ['s-t'] }, (titles[i] as Element).children),
          h('div', { className: ['s-b'] }, body),
        ]),
      ]);
    }),
  );
}
