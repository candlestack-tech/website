// Line icons of the docs (24 x 24, drawn with currentColor), shared by the Markdown transform and the layout.

const PATHS = {
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  md: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  term: '<path d="m4 17 6-5-6-5M12 19h8"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  steps: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
};

export type IconName = keyof typeof PATHS;

export function icon(name: IconName, cls = '') {
  return `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${PATHS[name]}</svg>`;
}

// AI client logos from the sprite in ClientLogos.astro, by the name a page writes
const LOGOS: Record<string, string> = {
  'claude code': 'claude',
  'claude.ai': 'claude',
  claude: 'claude',
  chatgpt: 'openai',
  cursor: 'cursor',
  'vs code': 'vscode',
};

export function clientLogo(name: string) {
  const logo = LOGOS[name.toLowerCase()];
  return logo ? `<svg class="cl-logo is-${logo}" aria-hidden="true"><use href="#cl-${logo}"></use></svg>` : '';
}
