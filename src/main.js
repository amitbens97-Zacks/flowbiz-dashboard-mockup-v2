// FlowBiz home page, built to the design system ("דף הבית" in the design system).
// It answers one question: what do we do now. The journey panel holds the title,
// one progress figure, the money saved, the next step and the map; below it, today's
// notes (tasks and calendar), "הלידים שלי" and the rank card; the shark sits
// bottom-right. The journey: 6 chapters, 15 steps (November 2026).
import { html, render, useState, useEffect, useRef, Icon, PencilCheck, PencilLine, cx, money } from './lib.js';
import { Button, Toast, Logo, Mark, Note, PartnerBubble } from './components.js';
import { JourneyMap } from './journeymap.js';
import { DevPanel } from './devnotes.js';
import { USER, CHAPTERS, ALL_STEPS, TOTAL_STEPS, SCENARIOS, DEFAULT_SCENARIO, TASKS_BY_CHAPTER, LEADS, PARTNER, MEETING, FREE_CHAPTERS, NUMBERS_STEP, LEADS_STEP, CRM_STEP, MEETING_STEP, START_RANK, BONUS_RANK } from './data.js';
import { EMBED, IS_PHONE, readView, saveView, writeHandoff, takeHandoff, applyPhoneViewport, ViewToggle, PhonePreview } from './viewswitch.js';

const NAV = [
  ['home', 'בית', 'house'],
  ['calendar', 'יומן', 'calendar-days'],
  ['tasks', 'משימות', 'list-checks'],
  ['finance', 'כספים', 'wallet'],
  ['accountant', 'רואה חשבון', 'calculator'],
  ['files', 'קבצים', 'folder-open'],
  ['leads', 'לידים', 'users'],
];
const MOBILE_NAV = ['home', 'calendar', 'tasks', 'leads', 'finance'];

// Menu items that open along the journey: the finance center after "העסק במספרים",
// the full leads page at step 14 ("ניהול לקוחות").
function lockedNav(current) {
  const locked = {};
  if (current <= NUMBERS_STEP) locked.finance = 'נפתח אחרי "העסק במספרים"';
  if (current < CRM_STEP) locked.leads = 'נפתח בשלב 14, "ניהול לקוחות"';
  return locked;
}

// The rank text by "איך נפנה אליך?" ([male, female]).
const said = (pair, female) => pair[female ? 1 : 0];

function journeyState(current, skippedIdea) {
  const currentChapter = current >= TOTAL_STEPS ? -1 : ALL_STEPS[current].chapter;
  let before = 0;
  const states = CHAPTERS.map((c, ci) => {
    const doneInChapter = Math.max(0, Math.min(c.steps.length, current - before));
    before += c.steps.length;
    const status = doneInChapter >= c.steps.length ? 'done' : ci === currentChapter ? 'current' : 'locked';
    return { status, doneInChapter };
  });
  const saved = ALL_STEPS.slice(skippedIdea ? 1 : 0, current).reduce((s, st) => s + st.save, 0);
  // The counter: "X מתוך 15", or "מתוך 14" for whoever skipped "מציאת רעיון".
  const total = TOTAL_STEPS - (skippedIdea ? 1 : 0);
  const doneCount = Math.min(current, TOTAL_STEPS) - (skippedIdea ? 1 : 0);
  // The rank: one per finished chapter.
  const doneChapters = states.filter((s) => s.status === 'done').length;
  return { currentChapter, states, saved, step: ALL_STEPS[current], total, doneCount, doneChapters, skippedIdea };
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : 'ערב טוב';
}

// One progress figure: one segment per chapter, sized by its number of steps.
function ChapterProgress({ states }) {
  return html`<div class="flex h-2.5 w-full gap-[3px]" aria-hidden="true">
    ${CHAPTERS.map((c, i) => {
      const st = states[i];
      const fill = (st.doneInChapter / c.steps.length) * 100;
      return html`<span key=${c.id} class="relative h-full overflow-hidden rounded-full bg-line" style=${{ flexGrow: c.steps.length }}>
        <span class=${cx('absolute inset-y-0 start-0 rounded-full transition-all duration-500', st.status === 'done' ? 'bg-brand-600' : 'bg-brand-300')} style=${{ width: `${fill}%` }}></span>
      </span>`;
    })}
  </div>`;
}

// The top of the journey panel: greeting, title, one progress figure, the money saved.
function JourneyHeader({ journey }) {
  return html`<div class="flex min-w-0 flex-col justify-center">
    <span class="fb-eyebrow">${greeting()}, ${USER.firstName}</span>
    <h1 class="fb-h1 mt-1 text-[28px] md:text-[36px]">המסע שלך <${Mark}>להקמת העסק<//></h1>
    <div class="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
      <div class="w-full max-w-[320px]">
        <p class="mb-1.5 text-[14px] font-bold text-ink">
          <span class="font-display tabular-nums">${journey.doneCount}</span> מתוך <span class="font-display tabular-nums">${journey.total}</span> שלבים
        </p>
        <${ChapterProgress} states=${journey.states} />
      </div>
      <span class="inline-flex items-center gap-2 rounded-xl bg-money-50 px-3 py-2 font-bold text-money">
        <span class="font-display text-[18px] font-extrabold tabular-nums">${money(journey.saved)}</span>
        <span class="text-[14px]">חסכת עד עכשיו</span>
      </span>
    </div>
  </div>`;
}

// "הצעד הבא": a dark card inside the journey panel. Returning after a break, it shows
// the place we kept: the question and the last answer, and goes straight back to it.
// After chapter 2 ("העסק במספרים") it becomes the way into the paid part of the
// journey; at the end it shows FlowBiz Plus, coming soon.
function NextStepCard({ journey, current, away, paywall, onContinue }) {
  const step = journey.step;
  const cta = (label) => html`<button
    type="button"
    onClick=${onContinue}
    class="group inline-flex h-12 w-full shrink-0 items-center justify-center gap-2.5 rounded-[14px] bg-white px-5 text-[16px] font-bold text-brand-600 shadow-[3px_4px_0_#8fb3ef] transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_2px_0_#8fb3ef] cursor-pointer sm:w-auto"
  >
    ${label}
    <${Icon} name="arrow-left" size=${18} />
  </button>`;
  const kicker = (t) => html`<p class="flex items-center gap-2 text-[12px] font-bold text-brand-300">${t}<span class="h-px w-6 bg-brand-300"></span></p>`;
  const shell = (body, label) => html`<div class="relative overflow-hidden rounded-[18px] bg-ink px-5 py-4 text-white">
    <div class="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">${body}</div>
      ${cta(label)}
    </div>
  </div>`;

  if (!step)
    return shell(
      html`${kicker('המסע הושלם · הגעת לקו הסיום')}
        <h2 class="fb-h2 mt-1 flex flex-wrap items-center gap-2 !text-[24px]">FlowBiz Plus <span class="rounded-full bg-white/15 px-2.5 py-0.5 text-[14px] font-bold">בקרוב</span></h2>
        <p class="mt-1 text-[14px] text-white/75">השלב הבא לעסק שכבר עובד. נעדכן אותך כשהוא נפתח.</p>`,
      'לעדכן אותי כשנפתח',
    );
  if (paywall)
    return shell(
      html`${kicker('החלק החינמי הושלם')}
        <h2 class="fb-h2 mt-1 !text-[24px]">התוכנית העסקית שלך מוכנה</h2>
        <p class="mt-1 text-[14px] text-white/75">חסכת ${money(journey.saved)} ב-${journey.doneCount} שלבים · מכאן בונים את המותג ויוצאים ללקוחות</p>`,
      'להמשך המסע',
    );
  const chapter = CHAPTERS[step.chapter];
  if (away)
    return shell(
      html`${kicker(`שמרנו לך את המקום · לפני ${away.days} ימים`)}
        <h2 class="fb-h2 mt-1 !text-[24px]">${step.name}</h2>
        <p class="text-[14px] text-white/75">פרק ${chapter.id} · ${chapter.title} · ${away.question}</p>
        <p class="mt-1.5 line-clamp-1 text-[14px] text-white/90">התשובה האחרונה: "${away.answer}"</p>`,
      'המשך מכאן',
    );
  if (current === MEETING_STEP)
    return shell(
      html`${kicker('השלב האחרון · מתנה מ-FlowBiz')}
        <h2 class="fb-h2 mt-1 !text-[24px]">פגישת מיקוד על חשבון FlowBiz</h2>
        <p class="mt-1 text-[14px] text-white/75">פרק ${chapter.id} · ${chapter.title} · ${step.name}</p>`,
      'לקביעת הפגישה',
    );
  return shell(
    html`${kicker('הצעד הבא')}
      <h2 class="fb-h2 mt-1 !text-[24px]">${step.name}</h2>
      <p class="mt-1 flex flex-wrap items-center gap-x-3 text-[14px] text-white/75">
        <span>פרק ${chapter.id} · ${chapter.title}</span>
        <span class="flex items-center gap-1"><${Icon} name="clock" size=${14} /> כ-${step.min} דקות</span>
      </p>`,
    journey.doneCount === 0 ? 'מתחילים' : 'המשך מכאן',
  );
}

function ChapterPanel({ index, journey, current, female, onContinue }) {
  const chapter = CHAPTERS[index];
  const st = journey.states[index];
  let before = 0;
  for (let i = 0; i < index; i++) before += CHAPTERS[i].steps.length;
  return html`<div>
    <div class="pe-7">
      <p class="text-[12px] font-bold text-brand-600">פרק ${chapter.id} מתוך ${CHAPTERS.length}${index >= FREE_CHAPTERS ? ' · אחרי מסך התשלום' : ' · חינם'}</p>
      <h3 class="fb-h3 mt-1 flex items-center gap-2">
        <span class="fb-chip-ic h-9 w-9"><${Icon} name=${chapter.icon} size=${19} /></span>
        ${chapter.title}
      </h3>
      <p class="mt-1 text-[14px] text-muted">
        ${st.status === 'done' ? 'הפרק הושלם' : st.status === 'current' ? `${st.doneInChapter} מתוך ${chapter.steps.length} שלבים הושלמו` : 'ייפתח אחרי הפרקים הקודמים'}
      </p>
      <p class="mt-1 flex items-center gap-1.5 text-[12px] font-bold text-ink">
        <${Icon} name="medal" size=${14} class=${st.status === 'done' ? 'text-gold' : 'text-faint'} />
        ${st.status === 'done' ? 'הדרגה שקיבלת' : 'בסוף הפרק'}: ${said(chapter.rank, female)}
      </p>
    </div>
    <ol class="mt-3 flex flex-col gap-1.5">
      ${chapter.steps.map((s, si) => {
        const g = before + si;
        const skipped = g === 0 && journey.skippedIdea;
        const done = g < current && !skipped;
        const now = g === current;
        return html`<li key=${s.name} class=${cx('flex items-center gap-3 rounded-xl px-3 py-2', now ? 'bg-brand-100 ring-2 ring-brand-300' : done ? 'bg-surface ring-1 ring-line' : 'bg-canvas/60 ring-1 ring-line/70')}>
          <span class=${cx('flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border-2', done ? 'border-ink bg-white' : now ? 'border-brand-600 bg-white' : skipped ? 'border-dashed border-faint bg-white' : 'border-dashed border-faint/60')}>
            ${done ? html`<${PencilCheck} size=${20} color="#0038b8" weight=${4} />` : now ? html`<span class="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-600"></span>` : skipped ? html`<${Icon} name="redo-2" size=${13} class="text-faint" />` : html`<${Icon} name="lock" size=${13} class="text-faint" />`}
          </span>
          <div class="min-w-0 flex-1">
            <p class=${cx('flex flex-wrap items-center gap-x-1.5 text-[14px] font-bold leading-snug', done || now ? 'text-ink' : 'text-muted')}>
              <span class="font-display tabular-nums text-faint">${g + 1}</span> ${s.name}
              ${s.optional && html`<span class="rounded-full bg-canvas px-1.5 text-[12px] font-semibold text-muted ring-1 ring-line">רשות</span>`}
            </p>
            <p class="text-[12px] text-muted">${skipped ? 'דילגת: יש לך כבר רעיון' : done ? 'הושלם' : g === MEETING_STEP ? 'פגישת מיקוד על חשבון FlowBiz' : `כ-${s.min} דקות`}</p>
          </div>
          ${now && html`<${Button} variant="mini" onClick=${onContinue}>המשך מכאן<//>`}
        </li>`;
      })}
    </ol>
  </div>`;
}

// Today's tasks: a sky note with pencil checkboxes; the urgent one gets a pencil underline.
function TasksNote({ tasks, doneTasks, toggle, onOpen }) {
  return html`<${Note} tilt=${-1.5} class="h-full">
    <span class="flex items-center justify-between">
      <span class="fb-note-kicker">משימות להיום</span>
      <button type="button" onClick=${onOpen} class="text-[12px] font-bold text-brand-600 hover:underline cursor-pointer">לכל המשימות</button>
    </span>
    <ul class="mt-2 flex flex-col gap-1">
      ${tasks.map((t, i) => {
        const done = doneTasks.includes(t);
        return html`<li key=${t}>
          <button type="button" role="checkbox" aria-checked=${done} onClick=${() => toggle(t)} class="group flex w-full items-center gap-2.5 rounded-lg py-1.5 text-start cursor-pointer">
            <span class=${cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border-2 bg-white', done ? 'border-brand-600' : 'border-ink/70 group-hover:border-brand-600')}>
              ${done && html`<${PencilCheck} size=${19} color="#0038b8" weight=${4.2} />`}
            </span>
            <span class=${cx('text-[14px] font-semibold leading-snug', done ? 'text-muted line-through decoration-brand-300' : 'text-ink')}>${t}</span>
            ${i === 0 && !done &&
            html`<span class="fb-urgent ms-auto text-[12px] text-ink">דחוף<${PencilLine} class="absolute -bottom-1.5 -left-1 h-3 w-[calc(100%+8px)]" /></span>`}
          </button>
        </li>`;
      })}
    </ul>
  <//>`;
}

function MeetingNote({ onOpen, onWeek }) {
  return html`<${Note} tone="white" tilt=${1.5} class="h-full">
    <span class="fb-note-kicker">ביומן · ${MEETING.when}</span>
    <span class="fb-note-title mt-1">${MEETING.title}</span>
    <span class="fb-meta mt-1 flex items-center gap-1"><${Icon} name="video" size=${14} />${MEETING.where}</span>
    <span class="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-3">
      <button type="button" onClick=${onOpen} class="text-[12px] font-bold text-brand-600 hover:underline cursor-pointer">ליומן</button>
      <button type="button" onClick=${onWeek} class="flex items-center gap-1 text-[12px] font-bold text-brand-600 hover:underline cursor-pointer"><${Icon} name="calendar-range" size=${14} />תכנן לי שבוע מושלם</button>
    </span>
  <//>`;
}

// "הלידים שלי": the simple view of the leads table. It opens at step 11 ("חוגגים
// מכירה ראשונה"), with the contacts and the Facebook groups, and every lead can be
// marked "סגרתי!". At step 14 the full "לידים" page opens in the top menu.
function LeadsPanel({ open, full, onOpen, onClosed }) {
  const fresh = LEADS.filter((l) => l.isNew).length;
  return html`<section class="fb-panel h-full !p-5">
    <div class="mb-2 flex items-center justify-between gap-2">
      <h3 class="fb-h3 flex items-center gap-2">
        <span class="relative">
          <span class="fb-chip-ic h-9 w-9"><${Icon} name="users" size=${19} /></span>
          ${open && fresh > 0 && html`<span class="absolute -end-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-error text-[12px] font-extrabold text-white ring-2 ring-white">${fresh}</span>`}
        </span>
        הלידים שלי
      </h3>
      ${open && html`<button type="button" onClick=${onOpen} class="whitespace-nowrap text-[12px] font-bold text-brand-600 hover:underline cursor-pointer">${full ? 'לכל הלידים' : 'למעקב'}</button>`}
    </div>
    ${open
      ? html`<ul class="flex flex-col divide-y divide-line">
          ${LEADS.map(
            (l) => html`<li key=${l.name} class="flex items-center gap-2.5 py-2">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 font-display text-[16px] font-extrabold text-brand-600">${l.name[0]}</span>
              <div class="min-w-0 flex-1">
                <p class="flex items-center gap-1.5 text-[14px] font-bold text-ink">${l.name}${l.isNew && html`<span class="h-2 w-2 rounded-full bg-error" title="חדש"></span>`}</p>
                <p class="truncate text-[12px] text-muted" title=${l.source}>${l.status} · ${l.source}</p>
              </div>
              <button type="button" onClick=${() => onClosed(l)} class="shrink-0 rounded-lg px-2 py-1 text-[12px] font-bold text-brand-600 ring-1 ring-brand-300 hover:bg-brand-50 cursor-pointer">סגרתי!</button>
            </li>`,
          )}
        </ul>`
      : html`<div class="fb-empty !p-4 text-[14px]">עוד אין לידים. הם יופיעו כאן בשלב 11, "חוגגים מכירה ראשונה", כשיוצאות הפניות הראשונות.</div>`}
  </section>`;
}

// The rank card: a small stack of notes with the rank of the last chapter finished,
// and the next one. It opens to the whole ladder.
function RankCard({ journey, female, onOpen }) {
  const rank = journey.doneChapters ? said(CHAPTERS[journey.doneChapters - 1].rank, female) : said(START_RANK, female);
  const next = CHAPTERS[journey.doneChapters];
  return html`<button type="button" onClick=${onOpen} class="group relative h-full min-h-[170px] w-full text-start cursor-pointer" aria-label=${`הדרגה שלך: ${rank}. לכל הדרגות`}>
    <span class="fb-stack !absolute inset-0 !w-auto">
      <span class="fb-behind b1"></span><span class="fb-behind b2"></span>
    </span>
    <span class="fb-note is-white relative flex h-full flex-col items-center justify-center gap-1 text-center transition-transform group-hover:-translate-y-0.5" style="--tilt:-1deg">
      <span class="fb-note-kicker">הדרגה שלך</span>
      <span class=${cx('mt-1 flex h-14 w-14 items-center justify-center rounded-full bg-white', journey.doneChapters ? 'text-gold' : 'text-ink')} style="box-shadow:0 0 0 4px var(--sky)">
        <${Icon} name=${journey.doneChapters ? 'medal' : 'footprints'} size=${24} />
      </span>
      <span class="font-display text-[20px] font-extrabold leading-tight">${rank}</span>
      <span class="text-[12px] text-muted">${next ? `הבאה: ${said(next.rank, female)}, בסוף "${next.title}"` : 'הגעת לדרגה הגבוהה ביותר'}</span>
    </span>
  </button>`;
}

function RankSheet({ journey, female, onClose }) {
  const ladder = [
    { name: said(START_RANK, female), when: 'בהרשמה', icon: 'footprints' },
    ...CHAPTERS.map((c) => ({ name: said(c.rank, female), when: `בסוף פרק ${c.id}, ${c.title}`, icon: c.icon })),
  ];
  return html`<div class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-ink/30" onClick=${onClose}></div>
    <div class="rise absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[18px] bg-canvas p-5 md:inset-auto md:left-1/2 md:top-1/2 md:w-[560px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[18px] md:shadow-2xl" role="dialog" aria-modal="true" aria-label="הדרגות">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="fb-h2">הדרגות במסע</h2>
        <button type="button" aria-label="סגירה" class="rounded-lg p-1.5 text-muted hover:bg-white cursor-pointer" onClick=${onClose}><${Icon} name="x" size=${18} /></button>
      </div>
      <ol class="flex flex-col gap-1.5">
        ${ladder.map((r, i) => {
          const got = i <= journey.doneChapters;
          const now = i === journey.doneChapters;
          return html`<li key=${r.name} class=${cx('flex items-center gap-3 rounded-xl px-3 py-2', now ? 'bg-brand-100 ring-2 ring-brand-300' : got ? 'bg-surface ring-1 ring-line' : 'bg-canvas/60 ring-1 ring-line/70')}>
            <span class=${cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', got ? 'bg-white text-ink' : 'border-2 border-dashed border-faint/70 text-faint')} style=${got ? 'box-shadow:0 0 0 3px var(--sky)' : undefined}>
              <${Icon} name=${got ? r.icon : 'lock'} size=${got ? 18 : 14} />
            </span>
            <div class="min-w-0 flex-1">
              <p class=${cx('font-display text-[16px] font-extrabold leading-tight', got ? 'text-ink' : 'text-muted')}>${r.name}</p>
              <p class="text-[12px] text-muted">${r.when}</p>
            </div>
            ${now ? html`<span class="text-[12px] font-bold text-brand-600">הדרגה שלך</span>` : got && html`<${PencilCheck} size=${20} color="#0038b8" weight=${4} />`}
          </li>`;
        })}
      </ol>
      <p class="mt-3 flex items-center gap-2 rounded-xl border-2 border-dashed border-line px-3 py-2 text-[14px] text-muted">
        <${Icon} name="calculator" size=${16} class="shrink-0" />
        <span>דרגת בונוס: <b class="text-ink">${said(BONUS_RANK, female)}</b>, על שלבי רואה החשבון (מחוץ למפה).</span>
      </p>
    </div>
  </div>`;
}

// The user menu: settings, reporting a problem (no longer a red pill in the header), sign out.
function UserMenu({ onPick }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (e) => !e.target.closest?.('[data-user-menu]') && setOpen(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  return html`<div class="relative max-sm:hidden" data-user-menu>
    <button type="button" onClick=${() => setOpen((o) => !o)} aria-expanded=${open} class="flex items-center gap-2 rounded-xl py-1 pe-1 ps-2.5 hover:bg-canvas cursor-pointer">
      <span class="text-[14px] font-bold text-ink">${USER.firstName}</span>
      <span class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 font-display text-[14px] font-extrabold text-white">${USER.firstName[0]}</span>
    </button>
    ${open &&
    html`<div class="pop-in absolute end-0 top-[calc(100%+6px)] z-40 w-48 rounded-[14px] bg-white p-1.5 shadow-[0_12px_30px_-10px_rgba(45,62,102,.35)] ring-1 ring-line">
      ${[
        ['settings', 'הגדרות'],
        ['message-square-warning', 'דיווח בעיה'],
        ['log-out', 'יציאה'],
      ].map(
        ([icon, label]) => html`<button key=${label} type="button" onClick=${() => (setOpen(false), onPick(label))} class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-semibold text-ink hover:bg-brand-50 cursor-pointer">
          <${Icon} name=${icon} size=${16} class="text-muted" />${label}
        </button>`,
      )}
    </div>`}
  </div>`;
}

function App({ view, onViewChange }) {
  const handoff = useRef();
  if (handoff.current === undefined) handoff.current = takeHandoff();
  const from = (k, f) => (handoff.current && k in handoff.current ? handoff.current[k] : f);

  const [scenarioId, setScenarioId] = useState(() => from('scenarioId', DEFAULT_SCENARIO));
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  const current = scenario.current;
  const journey = journeyState(current, scenario.skippedIdea);
  const [selected, setSelected] = useState(() => from('selected', null));
  const [doneTasks, setDoneTasks] = useState(() => from('doneTasks', []));
  const [sheet, setSheet] = useState(false);
  const [rankOpen, setRankOpen] = useState(false);
  const [female, setFemale] = useState(() => from('female', false));
  const [read, setRead] = useState(() => new Set());
  const [dev, setDev] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (text, icon) => {
    const id = Date.now();
    setToast({ id, text, icon });
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 2400);
  };
  const snapshot = () => ({ scenarioId, selected, doneTasks, female });
  useEffect(() => {
    window.__flowbizSnapshot = snapshot;
  });
  const switchView = (v) => {
    if (!IS_PHONE) writeHandoff(snapshot());
    onViewChange(v);
  };
  const setScenario = (id) => {
    const sc = SCENARIOS.find((s) => s.id === id);
    setScenarioId(id);
    setSelected(null);
    setSheet(false);
    setDoneTasks([]);
    showToast(`תרחיש: ${sc.label}`, 'flask-conical');
  };
  const paywall = journey.currentChapter === FREE_CHAPTERS && journey.states[FREE_CHAPTERS].doneInChapter === 0;
  const onContinue = () =>
    showToast(
      paywall
        ? 'כאן נפתח מסך התשלום, עם שמות הפרקים והסדר החדש'
        : !journey.step
          ? 'כאן נרשמים לעדכון על FlowBiz Plus'
          : current === MEETING_STEP
            ? 'כאן נפתח היומן של FlowBiz ב-Calendly'
            : `כאן נפתח השלב "${journey.step.name}"${scenario.away ? `, ב${scenario.away.question}` : ''}`,
      'arrow-left',
    );
  const ctaLabel = scenario.away ? 'המשך מכאן' : paywall ? 'להמשך המסע' : !journey.step ? 'לעדכן אותי' : current === MEETING_STEP ? 'לקביעת הפגישה' : journey.doneCount === 0 ? 'מתחילים' : 'המשך מכאן';
  const locked = lockedNav(current);
  const onNav = (id) => {
    const label = NAV.find((n) => n[0] === id)[1];
    if (locked[id]) return showToast(`"${label}" ${locked[id]}`, 'lock');
    if (id === 'accountant') return showToast(`כאן נפתח "רואה חשבון", מחוץ למפה, עם דרגת הבונוס "${said(BONUS_RANK, female)}"`, 'calculator');
    if (id !== 'home') showToast('במוק-אפ הזה יש רק את דף הבית', 'info');
  };
  const selectChapter = (i) => {
    if (matchMedia('(min-width: 768px)').matches) return setSelected((s) => (s === i ? null : i));
    setSelected(i);
    setSheet(true);
  };
  const closeSheet = () => {
    setSheet(false);
    setSelected(null);
  };
  const tasks = TASKS_BY_CHAPTER[journey.currentChapter < 0 ? CHAPTERS.length : journey.currentChapter];
  const leadsOpen = current >= LEADS_STEP;
  const crmOpen = current >= CRM_STEP;
  const fresh = LEADS.filter((l) => l.isNew).length;
  const msgKey = `${scenarioId}`;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'D' && e.shiftKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) setDev((d) => !d);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return html`<div dir="rtl" class="flex h-dvh flex-col bg-canvas text-ink">
    ${EMBED &&
    html`<div dir="ltr" class="flex h-11 shrink-0 items-end justify-between bg-surface px-7 pb-1.5 text-[14px] font-bold text-ink" aria-hidden="true">
      <span>9:41</span>
      <span class="flex items-center gap-1.5"><${Icon} name="signal" size=${15} /><${Icon} name="wifi" size=${15} /><${Icon} name="battery-full" size=${18} /></span>
    </div>`}

    <header class="no-print z-20 flex h-16 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:gap-3 md:px-5">
      <${Logo} />
      <nav class="hidden min-w-0 flex-1 items-center justify-evenly gap-1 lg:mx-2 lg:flex xl:mx-4 2xl:mx-10 2xl:gap-2" aria-label="ניווט ראשי">
        ${NAV.map(
          ([id, label, icon]) => html`<button
            key=${id}
            type="button"
            onClick=${() => onNav(id)}
            aria-current=${id === 'home' ? 'page' : undefined}
            title=${locked[id]}
            class=${cx(
              'relative flex h-10 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 text-[14px] font-bold transition-colors cursor-pointer xl:px-3 2xl:gap-2 2xl:px-4',
              id === 'home' ? 'bg-brand-100 text-brand-600' : locked[id] ? 'text-faint hover:bg-canvas' : 'text-muted hover:bg-canvas hover:text-ink',
            )}
          >
            <${Icon} name=${icon} size=${17} /> ${label}
            ${locked[id] && html`<${Icon} name="lock" size=${12} />`}
            ${id === 'leads' && crmOpen && html`<span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[12px] font-extrabold text-white">${fresh}</span>`}
          </button>`,
        )}
      </nav>
      <div class="ms-auto flex items-center gap-1.5 lg:ms-0">
        <span class="hidden rounded border border-warn/40 bg-warn-50 px-1.5 py-0.5 text-[12px] font-bold text-warn 2xl:inline">מוק-אפ</span>
        ${!EMBED && html`<${ViewToggle} view=${view} onChange=${switchView} />`}
        <button type="button" onClick=${() => setDev((d) => !d)} title="הערות למפתחים (Shift+D)" aria-label="הערות למפתחים" class="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-brand-50 hover:text-brand-600 cursor-pointer max-sm:hidden">
          <${Icon} name="code-xml" size=${18} />
        </button>
        <${UserMenu} onPick=${(label) => showToast(label === 'דיווח בעיה' ? 'כאן נפתח טופס דיווח בעיה' : `במוק-אפ הזה אין ${label}`, 'info')} />
      </div>
    </header>

    <div class="fb-notebook fb-margin relative min-h-0 flex-1">
      <main class="thin-scroll absolute inset-0 overflow-y-auto">
        <div class="mx-auto max-w-6xl px-4 pb-24 pt-4 md:px-8 md:pt-5 lg:pb-10">
          <section class="rise fb-panel !rounded-[18px] !p-4 md:!p-6" aria-label="מפת המסע">
            <div class="grid gap-5 lg:grid-cols-[1fr_460px] lg:items-center">
              <${JourneyHeader} journey=${journey} />
              <${NextStepCard} journey=${journey} current=${current} away=${scenario.away} paywall=${paywall} onContinue=${onContinue} />
            </div>

            <div class="mt-4 border-t-2 border-dashed border-line max-md:hidden"></div>
            <div class="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t-2 border-dashed border-line pt-3 md:hidden">
              <p class="text-[12px] font-bold text-brand-600">לחיצה על פרק פותחת את השלבים שלו</p>
              <ul class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-semibold text-muted" aria-label="מקרא">
                <li class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full border-2 border-ink bg-surface"></span> הושלם</li>
                <li class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-brand-600"></span> עכשיו</li>
                <li class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full border-2 border-dashed border-faint"></span> בהמשך</li>
              </ul>
            </div>

            <div class="hidden md:block">
              <${JourneyMap}
                chapters=${CHAPTERS}
                states=${journey.states}
                currentChapter=${journey.currentChapter}
                selected=${selected}
                onSelect=${selectChapter}
                onClose=${() => setSelected(null)}
                renderPanel=${(i) => html`<${ChapterPanel} index=${i} journey=${journey} current=${current} female=${female} onContinue=${onContinue} />`}
                layout="wide"
              />
            </div>
            <div class="mx-auto mt-2 max-w-[400px] md:hidden">
              <${JourneyMap} chapters=${CHAPTERS} states=${journey.states} currentChapter=${journey.currentChapter} selected=${selected} onSelect=${selectChapter} layout="tall" />
            </div>
          </section>

          <div class="rise mt-8 grid items-stretch gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.4fr_0.9fr]">
            <${TasksNote} tasks=${tasks} doneTasks=${doneTasks} toggle=${(t) => setDoneTasks((d) => (d.includes(t) ? d.filter((x) => x !== t) : [...d, t]))} onOpen=${() => onNav('tasks')} />
            <${MeetingNote} onOpen=${() => onNav('calendar')} onWeek=${() => showToast('כאן נפתח "תכנן לי שבוע מושלם"', 'calendar-range')} />
            <${LeadsPanel}
              open=${leadsOpen}
              full=${crmOpen}
              onOpen=${() => (crmOpen ? onNav('leads') : showToast('כאן נפתח המעקב: התצוגה הפשוטה של טבלת הלידים', 'users'))}
              onClosed=${(l) => showToast(`סגרת עם ${l.name}! כאן מתחילה החגיגה, ונפתחת עסקה בלוח התשלומים`, 'party-popper')}
            />
            <${RankCard} journey=${journey} female=${female} onOpen=${() => setRankOpen(true)} />
          </div>
        </div>
      </main>
      <${PartnerBubble}
        message=${PARTNER.message(paywall ? null : journey.step, scenario.away, paywall ? 'paywall' : null)}
        unread=${!read.has(msgKey)}
        onRead=${() => setRead((s) => new Set(s).add(msgKey))}
        action=${html`<div class="mt-2.5 flex items-center gap-3">
          <${Button} variant="mini" onClick=${onContinue}>${ctaLabel}<//>
        </div>`}
      />
    </div>

    <nav class="no-print pb-safe z-20 flex shrink-0 items-stretch justify-around border-t border-line bg-surface px-1 pt-1.5 lg:hidden" aria-label="ניווט ראשי">
      ${NAV.filter(([id]) => MOBILE_NAV.includes(id))
        .sort((a, b) => MOBILE_NAV.indexOf(a[0]) - MOBILE_NAV.indexOf(b[0]))
        .map(
          ([id, label, icon]) => html`<button
            key=${id}
            type="button"
            onClick=${() => onNav(id)}
            aria-current=${id === 'home' ? 'page' : undefined}
            class=${cx('relative flex min-w-[60px] flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[12px] font-bold cursor-pointer', id === 'home' ? 'text-brand-600' : locked[id] ? 'text-faint' : 'text-muted')}
          >
            <span class=${cx('flex h-8 w-12 items-center justify-center rounded-full', id === 'home' && 'bg-brand-100')}><${Icon} name=${icon} size=${20} /></span>
            ${label}
            ${locked[id] && html`<span class="absolute end-3 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface ring-1 ring-line"><${Icon} name="lock" size=${9} /></span>`}
            ${id === 'leads' && crmOpen && html`<span class="absolute end-2.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[12px] font-extrabold text-white">${fresh}</span>`}
          </button>`,
        )}
    </nav>

    ${EMBED &&
    html`<div class="flex h-6 shrink-0 items-center justify-center bg-surface" aria-hidden="true">
      <span class="h-[5px] w-32 rounded-full bg-ink/80"></span>
    </div>`}

    ${sheet &&
    selected != null &&
    html`<div class="fixed inset-0 z-50 md:hidden">
      <div class="absolute inset-0 bg-ink/30" onClick=${closeSheet}></div>
      <div class="rise pb-safe absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[18px] bg-canvas px-5 pt-3" role="dialog" aria-modal="true" aria-label="שלבי הפרק">
        <div class="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line"></div>
        <div class="mb-1 flex justify-end">
          <button type="button" aria-label="סגירה" class="rounded-lg p-1.5 text-muted hover:bg-white cursor-pointer" onClick=${closeSheet}><${Icon} name="x" size=${18} /></button>
        </div>
        <${ChapterPanel} index=${selected} journey=${journey} current=${current} female=${female} onContinue=${onContinue} />
      </div>
    </div>`}
    ${rankOpen && html`<${RankSheet} journey=${journey} female=${female} onClose=${() => setRankOpen(false)} />`}

    <${DevPanel} open=${dev} onClose=${() => setDev(false)} scenario=${scenarioId} onScenario=${setScenario} female=${female} onFemale=${setFemale} />
    <${Toast} toast=${toast} />
  </div>`;
}

function Root() {
  const [view, setView] = useState(readView);
  useEffect(() => applyPhoneViewport(view), [view]);
  const change = (v) => {
    saveView(v);
    setView(v);
  };
  if (!EMBED && !IS_PHONE && view === 'mobile') return html`<${PhonePreview} onSwitch=${change} />`;
  return html`<${App} view=${view} onViewChange=${change} />`;
}

applyPhoneViewport(readView());
render(html`<${Root} />`, document.getElementById('app'));
