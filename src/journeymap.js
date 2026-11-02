// The journey map: an illustrated country road that winds through the 6
// chapters, climbing from the first chapter, at the start (bottom right), to
// the last one, at the finish line (top left).
// The bends are deliberately uneven, like a hand-drawn map, and every turn is
// rounded (a smooth curve through the chapters).
// The road has pencil edges and a centre line; the travelled part is coloured in
// with sky pencil and a solid grainy line, the road ahead keeps a dotted centre.
// Nodes are HTML buttons laid over the SVG (crisp text, real focus/click), in
// the same coordinate space, and everything scales with the map's width.
// On wide screens a chapter's steps open in a floating card next to it.
import { html, useState, useEffect, useRef, Icon, PencilCheck, cx } from './lib.js';

const NAVY = '#2d3e66';
const SKY = '#8fb3ef';
const SKY_TEXT = '#2f5fc4';
const PAPER = '#fffdf8';

// Two layouts of the same road: wide (desktop, right to left, climbing to the
// top-left corner) and tall (phone, top to bottom). The road starts at the
// first chapter and ends at the last one.
// `lab` is where a chapter's name sits relative to its stop on the road;
// `noteDx` nudges the "you are here" note sideways, off the road, and `note`
// ('east' / 'west') puts it beside the chapter instead.
const LAYOUTS = {
  wide: {
    w: 1000,
    h: 440,
    // A low, uneven wave (like the original FlowBiz map) that rises overall,
    // then one long climb to the finish line in the top-left corner.
    nodes: [
      { x: 930, y: 326, lab: 'top' },
      { x: 778, y: 352, lab: 'bottom' },
      { x: 628, y: 250, lab: 'top' },
      { x: 470, y: 340, lab: 'bottom', noteDx: 26 },
      { x: 318, y: 222, lab: 'top' },
      { x: 104, y: 132, lab: 'top', noteDx: -24 },
    ],
    // Hint and legend, in the free top-right corner.
    legend: [990, 16],
    clouds: [
      [540, 80, 0.9],
      [210, 300, 0.7],
      [790, 160, 0.6],
    ],
  },
  tall: {
    w: 360,
    h: 1000,
    nodes: [
      { x: 180, y: 112, lab: 'top', note: 'east' },
      { x: 100, y: 250, lab: 'right' },
      { x: 250, y: 404, lab: 'left' },
      { x: 96, y: 558, lab: 'right' },
      { x: 252, y: 712, lab: 'left' },
      { x: 160, y: 858, lab: 'bottom', note: 'west' },
    ],
    clouds: [[300, 150, 0.6]],
  },
};

// A smooth curve through all the points (Catmull-Rom as cubic Béziers), so the
// road bends softly at each chapter while keeping the uneven hand-drawn route.
function segments(points) {
  const segs = [];
  const t = 1.15; // a little rounder than a plain Catmull-Rom
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * t, p1[1] + ((p2[1] - p0[1]) / 6) * t];
    const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * t, p2[1] - ((p3[1] - p1[1]) / 6) * t];
    const r = (v) => Math.round(v * 10) / 10;
    segs.push({ from: p1, d: `C${r(c1[0])},${r(c1[1])} ${r(c2[0])},${r(c2[1])} ${p2[0]},${p2[1]}` });
  }
  return segs;
}
const pathOf = (segs) => (segs.length ? `M${segs[0].from[0]},${segs[0].from[1]} ${segs.map((s) => s.d).join(' ')}` : '');
const pct = (v, total) => `${(v / total) * 100}%`;

// A small hatched pencil cloud.
function Cloud({ x, y, s }) {
  const d = 'M-34,6 C-40,-6 -26,-16 -16,-10 C-12,-24 10,-26 16,-12 C28,-18 40,-6 32,6 Z';
  return html`<g transform=${`translate(${x} ${y}) scale(${s})`} opacity="0.9">
    <path d=${d} fill="url(#pencil-hatch-lg)" transform="translate(2 2)" />
    <path d=${d} fill="none" stroke=${NAVY} stroke-opacity="0.45" stroke-width="1.6" stroke-linejoin="round" filter="url(#pencil-rough)" />
  </g>`;
}

function ChapterNode({ chapter, state, selected, onSelect, size }) {
  const done = state.status === 'done';
  const current = state.status === 'current';
  const locked = state.status === 'locked';
  const d = current ? size.current : locked ? size.locked : size.done;
  return html`<button
    type="button"
    data-node
    onClick=${onSelect}
    aria-label=${`פרק ${chapter.id}: ${chapter.title} · ${done ? 'הושלם' : current ? 'הפרק הנוכחי' : 'עוד לא נפתח'}`}
    aria-expanded=${selected}
    class=${cx('group relative flex items-center justify-center transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none cursor-pointer', selected && 'z-10')}
    style=${{ width: `${d}px`, height: `${d}px` }}
  >
    ${current && html`<span class="absolute inset-[-10px] animate-ping rounded-full bg-brand-400/25" style="animation-duration:2.2s" aria-hidden="true"></span>`}
    ${selected && html`<span class="absolute inset-[-7px] rounded-full ring-4 ring-brand-300/70" aria-hidden="true"></span>`}
    <span
      class=${cx(
        'relative flex h-full w-full items-center justify-center',
        current && 'bg-brand-600 text-white shadow-[3px_4px_0_#2d3e66]',
        done && 'bg-surface text-brand-600 shadow-[2px_3px_0_rgba(45,62,102,0.9)]',
        locked && 'border-2 border-dashed border-faint/70 bg-canvas text-faint',
      )}
      style=${{ borderRadius: '52% 48% 50% 50% / 48% 52% 48% 52%', border: locked ? undefined : `2.5px solid ${NAVY}` }}
    >
      <${Icon} name=${chapter.icon} size=${Math.round(d * (current ? 0.42 : 0.4))} strokeWidth=${current ? 2.2 : 2} />
    </span>
    ${done &&
    html`<span class="absolute -end-2 -top-2 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-surface shadow-sm ring-2 ring-brand-900">
      <${PencilCheck} size=${15} color="#0038b8" weight=${4} />
    </span>`}
    ${locked &&
    html`<span class="absolute -end-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-faint ring-1 ring-line">
      <${Icon} name="lock" size=${10} />
    </span>`}
  </button>`;
}

// `end` marks the first chapter ("start") or the last one ("finish").
function ChapterLabel({ chapter, state, end, finished }) {
  const done = state.status === 'done';
  const current = state.status === 'current';
  return html`<div class="pointer-events-none flex flex-col items-center text-center leading-tight">
    ${end === 'start' && html`<span class="mb-1 whitespace-nowrap text-[12px] font-bold text-muted">יוצאים לדרך</span>`}
    ${end === 'finish' &&
    html`<span class="mb-1 flex items-center gap-1.5 whitespace-nowrap">
      <span class=${cx('flex h-7 w-7 items-center justify-center rounded-full text-gold', finished && 'bg-warn-50')}><${Icon} name="trophy" size=${19} /></span>
      <span class="hand text-[26px] leading-none">קו הסיום</span>
    </span>`}
    <span class=${cx('whitespace-nowrap text-[16px] font-black', current || done ? 'text-ink' : 'text-muted')}>
      ${current ? html`<span class="marker">${chapter.title}</span>` : chapter.title}
    </span>
    <span class=${cx('mt-0.5 whitespace-nowrap text-[12px] font-semibold', current ? 'text-brand-600' : 'text-muted')}>
      ${done ? 'הושלם' : current ? `שלב ${state.doneInChapter + 1} מתוך ${chapter.steps.length}` : `${chapter.steps.length} שלבים`}
    </span>
  </div>`;
}

// "You are here": a handwritten note with a pencil arrow pointing at the node.
// `point` is where the node is relative to the note: below it ('down'), above
// ('up'), or beside it ('left' / 'right', used on the phone map).
function HereNote({ point = 'down' }) {
  const turn = { up: 'scaleY(-1)', left: 'rotate(90deg)', right: 'rotate(-90deg)' }[point];
  const arrow = html`<svg width="34" height="28" viewBox="0 0 34 28" fill="none" style=${turn ? { transform: turn } : undefined}>
    <path d="M17 2 C 13 9, 21 15, 17 24" stroke=${SKY_TEXT} stroke-width="2.6" stroke-linecap="round" filter="url(#pencil-rough)" />
    <path d="M11 18 L17 25 L23 18" stroke=${SKY_TEXT} stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`;
  const text = html`<span class="hand whitespace-nowrap text-[26px] leading-none">אנחנו כאן</span>`;
  return html`<div class="pointer-events-none flex flex-col items-center" aria-hidden="true">
    ${point === 'up' ? html`${arrow}${text}` : html`${text}${arrow}`}
  </div>`;
}

function useWidth() {
  const ref = useRef();
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Measure right away too: ResizeObserver only reports once the page renders.
    setW(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    const onResize = () => setW(el.getBoundingClientRect().width);
    window.addEventListener('resize', onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return [ref, w];
}

export function JourneyMap({ chapters, states, currentChapter, selected, onSelect, onClose, renderPanel, layout = 'wide' }) {
  const L = LAYOUTS[layout];
  const [box, width] = useWidth();
  const pop = useRef();
  // 1 = the design size (1000 units wide on desktop, 360 on phones).
  const k = width ? Math.max(0.6, Math.min(1.2, width / (layout === 'wide' ? 1008 : 360))) : 1;
  const base = layout === 'wide' ? { done: 46, current: 62, locked: 42 } : { done: 48, current: 62, locked: 44 };
  const size = { done: base.done * k, current: base.current * k, locked: base.locked * k };

  const segs = segments(L.nodes.map((n) => [n.x, n.y]));
  const finished = currentChapter < 0;
  // Coloured in up to the current chapter (all of it once done).
  const travelled = segs.slice(0, finished ? segs.length : currentChapter);
  const road = pathOf(segs);
  const done = pathOf(travelled);
  // Only on a visible wide map (the hidden one on phones has no width).
  const showPopover = renderPanel && selected != null && layout === 'wide' && width > 0;

  // The floating card closes on Escape or a click outside it (nodes toggle it).
  useEffect(() => {
    if (!showPopover) return;
    const onDown = (e) => {
      if (pop.current?.contains(e.target) || e.target.closest?.('[data-node]')) return;
      onClose?.();
    };
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [showPopover]);

  return html`<div ref=${box} class="relative w-full" style=${{ aspectRatio: `${L.w} / ${L.h}` }}>
    <svg viewBox=${`0 0 ${L.w} ${L.h}`} class="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
      ${L.clouds.map(([x, y, s]) => html`<${Cloud} x=${x} y=${y} s=${s} />`)}

      <!-- The road: soft pencil edges, paper surface, dotted centre line. -->
      <path d=${road} fill="none" stroke=${NAVY} stroke-opacity="0.16" stroke-width="34" stroke-linecap="round" filter="url(#pencil-rough-lg)" />
      <path d=${road} fill="none" stroke=${PAPER} stroke-width="28" stroke-linecap="round" />
      <path d=${road} fill="none" stroke=${NAVY} stroke-opacity="0.35" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 11" />

      <!-- The travelled part, coloured in. -->
      ${travelled.length > 0 &&
      html`<g>
        <path d=${done} fill="none" stroke=${SKY} stroke-opacity="0.45" stroke-width="28" stroke-linecap="round" />
        <path d=${done} fill="none" stroke="url(#pencil-hatch-lg)" stroke-width="28" stroke-linecap="round" opacity="0.7" />
        <path class="pencil-draw" pathLength="1" style=${{ animationDuration: '1.4s' }} d=${done} fill="none" stroke=${NAVY} stroke-width="1.3" stroke-opacity="0.3" stroke-linecap="round" transform="translate(-2 2.4)" />
        <path class="pencil-draw" pathLength="1" style=${{ animationDuration: '1.4s' }} d=${done} fill="none" stroke=${NAVY} stroke-width="3.4" stroke-linecap="round" filter="url(#pencil-rough-lg)" />
      </g>`}

    </svg>

    ${L.legend &&
    html`<div class="absolute" style=${{ right: pct(L.w - L.legend[0], L.w), top: pct(L.legend[1], L.h) }}>
      <div class="flex flex-col items-end gap-1.5" style=${{ zoom: k }}>
        <p class="whitespace-nowrap text-[12px] font-bold text-brand-600">לחיצה על פרק פותחת את השלבים שלו</p>
        <ul class="flex items-center gap-3 whitespace-nowrap text-[12px] font-semibold text-muted" aria-label="מקרא">
          <li class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full border-2 border-brand-900 bg-surface"></span> הושלם</li>
          <li class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-brand-600"></span> עכשיו</li>
          <li class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full border-2 border-dashed border-faint"></span> בהמשך</li>
        </ul>
      </div>
    </div>`}

    ${chapters.map((ch, i) => {
      const n = L.nodes[i];
      const st = states[i];
      const nodeD = st.status === 'current' ? size.current : size.done;
      const labPos =
        n.lab === 'top'
          ? { bottom: `calc(100% - ${pct(n.y, L.h)} + ${nodeD / 2 + 17 * k}px)`, left: pct(n.x, L.w), transform: 'translateX(-50%)' }
          : n.lab === 'bottom'
            ? { top: `calc(${pct(n.y, L.h)} + ${nodeD / 2 + 17 * k}px)`, left: pct(n.x, L.w), transform: 'translateX(-50%)' }
            : n.lab === 'left'
              ? { top: pct(n.y, L.h), right: `calc(100% - ${pct(n.x, L.w)} + ${nodeD / 2 + 19 * k}px)`, transform: 'translateY(-50%)' }
              : { top: pct(n.y, L.h), left: `calc(${pct(n.x, L.w)} + ${nodeD / 2 + 19 * k}px)`, transform: 'translateY(-50%)' };
      // The "you are here" note goes on the side the label does not use.
      const noteX = `calc(${pct(n.x, L.w)} + ${((n.noteDx || 0) * width) / L.w}px)`;
      const side = n.note || (layout === 'tall' && n.lab === 'left' ? 'east' : layout === 'tall' && n.lab === 'right' ? 'west' : null);
      const notePos = side
        ? side === 'east'
          ? { top: pct(n.y, L.h), left: `calc(${pct(n.x, L.w)} + ${size.current / 2 + 2 * k}px)`, transform: 'translateY(-50%)' }
          : { top: pct(n.y, L.h), right: `calc(100% - ${pct(n.x, L.w)} + ${size.current / 2 + 2 * k}px)`, transform: 'translateY(-50%)' }
        : n.lab === 'top'
          ? { top: `calc(${pct(n.y, L.h)} + ${size.current / 2 + 14 * k}px)`, left: noteX, transform: 'translateX(-50%)' }
          : { bottom: `calc(100% - ${pct(n.y, L.h)} + ${size.current / 2 + 12 * k}px)`, left: noteX, transform: 'translateX(-50%)' };
      return html`<div key=${ch.id}>
        <div class="absolute -translate-x-1/2 -translate-y-1/2" style=${{ left: pct(n.x, L.w), top: pct(n.y, L.h) }}>
          <${ChapterNode} chapter=${ch} state=${st} selected=${selected === i} onSelect=${() => onSelect(i)} size=${size} />
        </div>
        <div class="absolute" style=${labPos}><div style=${{ zoom: k }}><${ChapterLabel} chapter=${ch} state=${st} finished=${finished} end=${i === 0 ? 'start' : i === chapters.length - 1 ? 'finish' : undefined} /></div></div>
        ${st.status === 'current' &&
        html`<div class="absolute" style=${notePos}><div style=${{ zoom: k }}><${HereNote} point=${side ? (side === 'east' ? 'left' : 'right') : n.lab === 'top' ? 'up' : 'down'} /></div></div>`}
      </div>`;
    })}

    ${showPopover &&
    (() => {
      const n = L.nodes[selected];
      const nodeD = states[selected].status === 'current' ? size.current : size.done;
      const toLeft = n.x > L.w / 2; // open towards the roomier side
      const side = toLeft
        ? { right: `calc(100% - ${pct(n.x, L.w)} + ${nodeD / 2 + 18}px)` }
        : { left: `calc(${pct(n.x, L.w)} + ${nodeD / 2 + 18}px)` };
      const vertical = n.y > L.h / 2 ? { bottom: `calc(100% - ${pct(n.y, L.h)} - 48px)` } : { top: `calc(${pct(n.y, L.h)} - 48px)` };
      return html`<div
        ref=${pop}
        role="dialog"
        aria-label=${`שלבי הפרק ${chapters[selected].title}`}
        class="pop-in absolute z-30 w-[min(330px,45%)] rounded-2xl bg-surface p-4 shadow-[0_18px_40px_-12px_rgba(45,62,102,0.35)] ring-2 ring-brand-900"
        style=${{ ...side, ...vertical }}
      >
        <button
          type="button"
          onClick=${onClose}
          aria-label="סגירה"
          class="absolute end-2.5 top-2.5 rounded-lg p-1 text-muted hover:bg-canvas hover:text-ink cursor-pointer"
        >
          <${Icon} name="x" size=${16} />
        </button>
        ${renderPanel(selected)}
      </div>`;
    })()}
  </div>`;
}
