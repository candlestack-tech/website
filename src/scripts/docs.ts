// The docs with JavaScript: Copy and Copy page, code tabs, the Menu drawer and On this page
// following the scroll. Without it every page still shows all its text (docs.css).

const COPIED_MS = 1600;
const LANG_KEY = 'docs-lang';

const timers = new WeakMap<HTMLElement, number>();

// "Copy" turns into "Copied" with a tick for a moment
function flash(button: HTMLElement) {
  const label = button.querySelector('span');
  if (!label) return;
  label.dataset.text ??= label.textContent ?? '';
  button.classList.add('done');
  label.textContent = 'Copied';
  clearTimeout(timers.get(button));
  timers.set(
    button,
    window.setTimeout(() => {
      button.classList.remove('done');
      label.textContent = label.dataset.text ?? '';
    }, COPIED_MS),
  );
}

function copy(button: HTMLElement, value: string) {
  navigator.clipboard.writeText(value).then(
    () => flash(button),
    () => {
      // The clipboard can be blocked; the text is still on the page to select
    },
  );
}

// The text a Copy button stands for: the visible code of its block, or the prompt
function blockText(button: HTMLElement) {
  const block = button.closest('.cb, .prompt');
  const pane = block?.querySelector('.cb-pane.on pre') ?? block?.querySelector('pre, p');
  return (pane?.textContent ?? '').replace(/\n$/, '');
}

function pageMarkdown() {
  const data = document.getElementById('page-md')?.textContent;
  return data ? (JSON.parse(data) as string) : '';
}

// One language for every tab set of the page, remembered for the next pages
function selectTab(name: string) {
  document.querySelectorAll<HTMLElement>('.cb.tabbed').forEach((block) => {
    if (!block.querySelector(`.cb-tab[data-tab="${CSS.escape(name)}"]`)) return;
    block.querySelectorAll<HTMLElement>('.cb-tab, .cb-pane').forEach((el) => {
      const on = el.dataset.tab === name;
      el.classList.toggle('on', on);
      if (el.classList.contains('cb-tab')) el.setAttribute('aria-selected', String(on));
    });
  });
}

function setMenu(open: boolean) {
  const button = document.querySelector<HTMLElement>('.mbtn');
  const bar = document.querySelector<HTMLElement>('.mbar');
  if (bar) document.body.style.setProperty('--drawer-top', `${Math.max(0, bar.getBoundingClientRect().bottom)}px`);
  document.body.classList.toggle('menu', open);
  button?.setAttribute('aria-expanded', String(open));
}

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const copyButton = target.closest<HTMLElement>('[data-copy]');
  const pageButton = target.closest<HTMLElement>('[data-copy-page]');
  const tab = target.closest<HTMLElement>('.cb-tab');
  if (copyButton) copy(copyButton, blockText(copyButton));
  else if (pageButton) copy(pageButton, pageMarkdown());
  else if (tab?.dataset.tab) {
    selectTab(tab.dataset.tab);
    try {
      localStorage.setItem(LANG_KEY, tab.dataset.tab);
    } catch {
      // Storage can be blocked; the tab still switches on this page
    }
  } else if (target.closest('.mbtn')) {
    e.preventDefault();
    setMenu(!document.body.classList.contains('menu'));
  } else if (target.closest('.side a, .toc-m a')) {
    setMenu(false);
    target.closest('details')?.removeAttribute('open');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.body.classList.contains('menu')) setMenu(false);
});

// On this page marks the last section whose heading has scrolled past the top
function spy() {
  const links = [...document.querySelectorAll<HTMLElement>('.toc a[data-toc]')];
  if (!links.length) return;
  let current = links[0].dataset.toc;
  for (const link of links) {
    const heading = document.getElementById(link.dataset.toc ?? '');
    if (heading && heading.getBoundingClientRect().top < 140) current = link.dataset.toc;
  }
  links.forEach((link) => link.classList.toggle('on', link.dataset.toc === current));
}

try {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved) selectTab(saved);
} catch {
  // Storage can be blocked; the first tab stays
}
spy();
addEventListener('scroll', spy, { passive: true });
