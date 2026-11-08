import { elements, h, isBlank, isElement, raw, text, textOf, type Element, type Node } from './hast';
import { highlight } from './highlight';
import { icon } from './icons';

// Code blocks, prompts and language tabs. The fence's info string carries the options:
//   ```bash title="Terminal"       a label in the block's top bar
//   ```text prompt                 a prompt to paste into a chat
//   ```json out                    output, in muted text
//   ```python tab="Python"         fences with `tab` in a row become one block with tabs

interface CodeInfo {
  pre: Element;
  lang: string;
  code: string;
  title?: string;
  tab?: string;
  prompt: boolean;
  out: boolean;
}

export function codeInfo(node: Node): CodeInfo | undefined {
  if (!isElement(node, 'pre')) return undefined;
  const code = elements(node.children).find((c) => c.tagName === 'code');
  if (!code) return undefined;
  const className = Array.isArray(code.properties.className) ? (code.properties.className as string[]) : [];
  const fromClass = className.find((c) => c.startsWith('language-'))?.slice('language-'.length);
  const lang = typeof code.data?.lang === 'string' ? code.data.lang : (fromClass ?? '');
  const meta = typeof code.data?.meta === 'string' ? code.data.meta : '';
  const attr = (key: string) => new RegExp(`${key}="([^"]*)"`).exec(meta)?.[1];
  const flags = meta.replace(/\w+="[^"]*"/g, '').split(/\s+/);
  return {
    pre: node,
    lang,
    code: textOf(code).replace(/\n$/, ''),
    title: attr('title'),
    tab: attr('tab'),
    prompt: flags.includes('prompt'),
    out: flags.includes('out'),
  };
}

// Copy is added by docs.ts on pages with JavaScript, the CSS hides it without
const copyButton = () =>
  h('button', { type: 'button', className: ['btn', 'xs', 'ghost', 'copy'], dataCopy: '' }, [
    raw(icon('copy', 'ic-copy')),
    raw(icon('check', 'ic-done')),
    h('span', {}, [text('Copy')]),
  ]);

const pre = (info: CodeInfo) =>
  h('pre', {}, [h('code', info.lang ? { className: [`language-${info.lang}`] } : {}, highlight(info.code, info.lang))]);

const bar = (children: Node[]) =>
  h('div', { className: ['cb-hd'] }, [...children, h('span', { className: ['cb-sp'] }), copyButton()]);

function prompt(info: CodeInfo) {
  return h('div', { className: ['prompt'] }, [
    bar([h('span', { className: ['prompt-l'] }, [raw(icon('term')), text('Prompt')])]),
    h('p', {}, [text(info.code)]),
  ]);
}

export function codeBlock(info: CodeInfo): Element {
  if (info.prompt) return prompt(info);
  const label = info.title ?? (info.lang && info.lang !== 'text' ? info.lang : '');
  return h('div', { className: info.out ? ['cb', 'out'] : ['cb'] }, [
    bar([h('span', { className: ['cb-lbl'] }, [text(label)])]),
    pre(info),
  ]);
}

// Without JavaScript every pane shows, each under its own label
function tabs(infos: CodeInfo[]): Element {
  const names = infos.map((info) => info.tab ?? '');
  const buttons = names.map((name, i) =>
    h(
      'button',
      {
        type: 'button',
        role: 'tab',
        className: i ? ['cb-tab'] : ['cb-tab', 'on'],
        ariaSelected: String(!i),
        dataTab: name,
      },
      [text(name)],
    ),
  );
  const panes = infos.map((info, i) =>
    h('div', { className: i ? ['cb-pane'] : ['cb-pane', 'on'], role: 'tabpanel', dataTab: names[i] }, [
      h('div', { className: ['cb-pl'] }, [text(names[i])]),
      pre(info),
    ]),
  );
  return h('div', { className: ['cb', 'tabbed'] }, [
    bar([h('div', { className: ['cb-tabs'], role: 'tablist' }, buttons)]),
    ...panes,
  ]);
}

// Marks a finished block, so the transform does not walk into it again
const built = (el: Element): Element => ({ ...el, data: { built: true } });

// Code blocks of one list of siblings; fences with `tab` that follow each other join one block
export function codeBlocks(nodes: Node[]): Node[] {
  const out: Node[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const info = codeInfo(nodes[i]);
    if (!info) {
      out.push(nodes[i]);
    } else if (!info.tab) {
      out.push(built(codeBlock(info)));
    } else {
      const group = [info];
      let j = i + 1;
      for (; j < nodes.length; j++) {
        if (isBlank(nodes[j])) continue;
        const next = codeInfo(nodes[j]);
        if (!next?.tab) break;
        group.push(next);
      }
      out.push(built(tabs(group)));
      i = j - 1;
    }
  }
  return out;
}
