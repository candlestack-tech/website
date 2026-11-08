import { h, text, type Node } from './hast';

// Code colors of the docs, as in the approved design: strings in the accent, numbers in the warn
// color, comments muted, command-line flags in blue. A few rules instead of a full highlighter.

type Lang = 'bash' | 'py' | 'js' | 'json' | 'plain';

const LANGS: Record<string, Lang> = {
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  // Close enough for the one-liners in the docs: # comments, strings and -flags
  powershell: 'bash',
  pwsh: 'bash',
  python: 'py',
  py: 'py',
  js: 'js',
  javascript: 'js',
  ts: 'js',
  typescript: 'js',
  json: 'json',
};

const COMMENT: Record<Lang, string> = {
  bash: String.raw`(^|\s)(#[^\n]*)`,
  py: String.raw`(^|\s)(#[^\n]*)`,
  js: String.raw`(^|\s)(\/\/[^\n]*)`,
  json: '()(?!)()',
  plain: '()(?!)()',
};

const STRING = String.raw`("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')`;
const FLAG = String.raw`(\s--?[a-z][a-z-]*)`;
const NUMBER = String.raw`(\b-?\d+(?:\.\d+)?\b)`;

const span = (cls: string, value: string) => h('span', { className: [cls] }, [text(value)]);

// One match of the pattern as colored nodes
function token(m: RegExpExecArray, lang: Lang): Node[] {
  if (m[2] !== undefined) return [text(m[1]), span('t-c', m[2])];
  if (m[3] !== undefined) return [span('t-s', m[3])];
  if (m[4] !== undefined) return [lang === 'bash' ? span('t-k', m[4]) : text(m[4])];
  return [span('t-n', m[5])];
}

export function highlight(code: string, language: string): Node[] {
  const lang = LANGS[language] ?? 'plain';
  if (lang === 'plain') return [text(code)];
  const re = new RegExp(`${COMMENT[lang]}|${STRING}|${FLAG}|${NUMBER}`, 'gm');
  const out: Node[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    if (m[0] === '') {
      re.lastIndex++;
      continue;
    }
    out.push(text(code.slice(last, m.index)), ...token(m, lang));
    last = re.lastIndex;
  }
  out.push(text(code.slice(last)));
  return out.filter((n) => n.type !== 'text' || n.value !== '');
}
