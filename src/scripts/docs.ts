// The docs with JavaScript: Copy and Copy page, code tabs, client tabs, the Menu drawer and On this
// page following the scroll. Without it every page still shows all its text (docs.css).

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

// The text a Copy button stands for: the visible code of its block, the prompt or the address
function blockText(button: HTMLElement) {
  const block = button.closest('.cb, .prompt, .srv');
  const pane = block?.querySelector('.cb-pane.on pre') ?? block?.querySelector('pre, p, .srv-v');
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
      if (el.classList.contains('cb-tab')) markTab(el, on);
    });
  });
}

function markTab(tab: HTMLElement, on: boolean) {
  tab.setAttribute('aria-selected', String(on));
  tab.tabIndex = on ? 0 : -1;
}

function pickLanguage(name: string) {
  selectTab(name);
  try {
    localStorage.setItem(LANG_KEY, name);
  } catch {
    // Storage can be blocked; the tab still switches on this page
  }
}

// Client tabs: the pane's id is the client, so the address of the page names the open tab
function selectClient(id: string, updateAddress: boolean) {
  const pane = document.getElementById(id);
  const block = pane?.closest<HTMLElement>('.ctabs');
  if (!pane?.classList.contains('ctab-pane') || !block) return false;
  block.querySelectorAll<HTMLElement>('.ctab, .ctab-pane').forEach((el) => {
    const on = el === pane || el.getAttribute('aria-controls') === id;
    el.classList.toggle('on', on);
    if (el.classList.contains('ctab')) markTab(el, on);
  });
  if (updateAddress) history.replaceState(null, '', `#${id}`);
  return true;
}

function clientFromAddress() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (id && selectClient(id, false)) document.getElementById(id)?.closest('.ctabs')?.scrollIntoView();
}

// Arrow keys, Home and End move between the tabs of one tab list and open the tab
function moveTab(tab: HTMLElement, key: string) {
  const tabs = [...(tab.parentElement?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])];
  const i = tabs.indexOf(tab);
  const steps: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
  if (!(key in steps) || i < 0) return false;
  const next = tabs[(steps[key] + tabs.length) % tabs.length];
  next.focus();
  next.click();
  return true;
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
  const client = target.closest<HTMLElement>('.ctab');
  if (copyButton) copy(copyButton, blockText(copyButton));
  else if (pageButton) copy(pageButton, pageMarkdown());
  else if (tab?.dataset.tab) pickLanguage(tab.dataset.tab);
  else if (client) selectClient(client.getAttribute('aria-controls') ?? '', true);
  else if (target.closest('.mbtn')) {
    e.preventDefault();
    setMenu(!document.body.classList.contains('menu'));
  } else if (target.closest('.side a, .toc-m a')) {
    setMenu(false);
    target.closest('details')?.removeAttribute('open');
  }
});

document.addEventListener('keydown', (e) => {
  const tab = (e.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
  if (e.key === 'Escape' && document.body.classList.contains('menu')) setMenu(false);
  else if (tab && moveTab(tab, e.key)) e.preventDefault();
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
clientFromAddress();
addEventListener('hashchange', clientFromAddress);
spy();
addEventListener('scroll', spy, { passive: true });
