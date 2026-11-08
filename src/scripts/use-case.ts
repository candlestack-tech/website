// The session player of a use case and the tooltip of its chart. The HTML already holds every step
// open (UseCase.astro): Step by step shows the steps up to the current one, with the current one's
// calls open and the earlier ones folded; All steps opens everything. Arrow keys step too.

interface ChartData {
  labels: string[];
  series: { name: string; values: number[]; color: number }[];
}

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Player {
  root: HTMLElement;
  steps: HTMLElement[];
  current: number;
  all: boolean;
}

// The bar: the mode buttons, where you are, Previous and Next, the progress and "N more steps"
function showBar(p: Player) {
  const { root, steps, current, all } = p;
  const total = steps.length;
  root.querySelectorAll<HTMLElement>('.seg button').forEach((b) => {
    const on = (b.dataset.mode === 'all') === all;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  root.querySelectorAll('.prog i').forEach((bar, i) => bar.classList.toggle('on', i <= current));
  const pos = root.querySelector('[data-pos]');
  if (pos) pos.textContent = `Step ${current + 1} of ${total}`;
  const left = total - current - 1;
  const more = root.querySelector('[data-more]');
  if (more) {
    more.textContent = `${left} more ${left === 1 ? 'step' : 'steps'}`;
    more.closest('li')?.toggleAttribute('hidden', left === 0);
  }
  const prev = root.querySelector<HTMLButtonElement>('[data-go="-1"]');
  const next = root.querySelector<HTMLButtonElement>('[data-go="1"]');
  if (prev) prev.disabled = current === 0;
  if (next) next.disabled = current === total - 1;
}

function show(p: Player) {
  p.root.classList.toggle('all', p.all);
  p.steps.forEach((step, i) => {
    step.classList.toggle('cur', !p.all && i === p.current);
    step.classList.toggle('later', !p.all && i > p.current);
    step.querySelectorAll('details').forEach((d) => {
      d.open = p.all || i >= p.current;
    });
  });
  showBar(p);
}

function go(p: Player, by: number) {
  const to = Math.max(0, Math.min(p.steps.length - 1, p.current + by));
  if (to === p.current) return;
  p.current = to;
  show(p);
  if (by > 0) p.steps[to].scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'nearest' });
}

function setupPlayer(root: HTMLElement) {
  const p: Player = { root, steps: [...root.querySelectorAll<HTMLElement>('.st')], current: 0, all: false };

  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const mode = target.closest<HTMLElement>('[data-mode]')?.dataset.mode;
    const by = target.closest<HTMLElement>('[data-go]')?.dataset.go;
    if (mode) {
      p.all = mode === 'all';
      p.current = 0;
      show(p);
    } else if (by) {
      go(p, Number(by));
    }
  });

  document.addEventListener('keydown', (e) => {
    if (p.all || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
    go(p, e.key === 'ArrowRight' ? 1 : -1);
  });
}

// A line under the pointer and the value of every series at that point
function setupChart(plot: HTMLElement) {
  const data = JSON.parse(plot.dataset.chart ?? '{}') as ChartData;
  const line = plot.querySelector<HTMLElement>('.xh');
  const tip = plot.querySelector<HTMLElement>('.tip');
  const n = data.labels?.length ?? 0;
  if (!line || !tip || n < 2) return;

  function row(name: string, value: number, color: number) {
    const r = document.createElement('div');
    r.className = 'r';
    const swatch = document.createElement('i');
    swatch.className = `c${color}`;
    const v = document.createElement('b');
    v.textContent = value.toFixed(1);
    r.append(swatch, name, v);
    return r;
  }

  plot.addEventListener('pointermove', (e) => {
    const box = plot.getBoundingClientRect();
    const i = Math.round(Math.max(0, Math.min(1, (e.clientX - box.left) / box.width)) * (n - 1));
    const x = (i / (n - 1)) * box.width;
    line.hidden = false;
    line.style.left = `${x}px`;
    const date = document.createElement('div');
    date.className = 'd';
    date.textContent = data.labels[i];
    tip.replaceChildren(date, ...data.series.map((s) => row(s.name, s.values[i], s.color)));
    tip.hidden = false;
    const w = tip.offsetWidth;
    tip.style.left = `${x + 12 + w > box.width ? Math.max(0, x - w - 12) : x + 12}px`;
  });
  plot.addEventListener('pointerleave', () => {
    line.hidden = true;
    tip.hidden = true;
  });
}

document.querySelectorAll<HTMLElement>('[data-player]').forEach(setupPlayer);
document.querySelectorAll<HTMLElement>('.plot[data-chart]').forEach(setupChart);
