// A small, plain-object HTML tree (the hast shape), enough for the docs transform in markdown.ts.

export interface Text {
  type: 'text';
  value: string;
}

export interface Raw {
  type: 'raw';
  value: string;
}

export interface Element {
  type: 'element';
  tagName: string;
  properties: Record<string, unknown>;
  children: Node[];
  data?: Record<string, unknown>;
}

export interface Root {
  type: 'root';
  children: Node[];
}

export type Node = Text | Raw | Element | Root | { type: 'comment' | 'doctype'; value?: string };

export const text = (value: string): Text => ({ type: 'text', value });
export const raw = (value: string): Raw => ({ type: 'raw', value });

export function h(tagName: string, properties: Record<string, unknown> = {}, children: Node[] = []): Element {
  return { type: 'element', tagName, properties, children };
}

export const isElement = (node: Node | undefined, tagName?: string): node is Element =>
  node?.type === 'element' && (!tagName || node.tagName === tagName);

// Whitespace between block elements, which the transform skips over
export const isBlank = (node: Node) => node.type === 'text' && !node.value.trim();

export const elements = (nodes: Node[]) => nodes.filter((n): n is Element => isElement(n));

export function textOf(node: Node): string {
  if (node.type === 'text') return node.value;
  if ('children' in node) return node.children.map(textOf).join('');
  return '';
}

// The parsed tree arrives as read-only objects: copy it into plain ones before changing it
export function clone(node: Node): Node {
  const copy: Record<string, unknown> = { type: node.type };
  const source = node as unknown as Record<string, unknown>;
  for (const key of ['tagName', 'value']) if (source[key] !== undefined) copy[key] = source[key];
  if (source.properties) copy.properties = { ...source.properties };
  if (source.data) copy.data = { ...source.data };
  if ('children' in node) copy.children = node.children.map(clone);
  return copy as unknown as Node;
}
