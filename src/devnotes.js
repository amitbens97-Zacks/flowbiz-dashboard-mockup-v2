// Developer notes for the dashboard, plus journey-stage scenarios.
import { html, Icon, cx } from './lib.js';
import { SCENARIOS } from './data.js';

const NOTES = [
  {
    title: 'המסע החדש בדף הבית',
    items: [
      '6 פרקים ו-15 שלבים: אפיון · שביל הכסף · בניית מותג אישי · סגירת לקוח ראשון · מאיצים מכירות · העסק שתמיד רצית. השמות האלה בכל מקום: המפה, הכותרות, הדרגות וההודעות.',
      'המונה: "X מתוך 15 שלבים". מי שדילג על "מציאת רעיון" (רשות) רואה "מתוך 14", והשלב מסומן אצלו "דילגת".',
      '"חסכת עד עכשיו": הסכומים של שלבים מאוחדים מתחברים לסכום אחד.',
      'פרקים 1 ו-2 חינם. אחרי "העסק במספרים" (שלב 5) הכרטיס "הצעד הבא" מוביל למסך התשלום: "התוכנית העסקית שלך מוכנה" ו"להמשך המסע".',
      'שלב 15: הכרטיס מציג "פגישת מיקוד על חשבון FlowBiz" ופותח את היומן של FlowBiz ב-Calendly, בלי מחיר.',
      'סוף המסע: "FlowBiz Plus, בקרוב", עם "לעדכן אותי כשנפתח".',
    ],
  },
  {
    title: 'תפריט עליון',
    items: [
      'בית · יומן · משימות · כספים · רואה חשבון · קבצים · לידים.',
      '"כספים" (המרכז הפיננסי) נעול עד שמסיימים את "העסק במספרים".',
      '"לידים" נעול עד שלב 14, "ניהול לקוחות". בשלב 14 הוא נפתח לתצוגה המלאה, משמאל ל"קבצים".',
      'פריט נעול: אפור עם מנעול קטן. לחיצה מסבירה מתי הוא נפתח.',
      '"רואה חשבון" מחוץ למפה: בחירת ישות, מחשבון מס ופתיחת תיק.',
    ],
  },
  {
    title: 'הלידים שלי',
    items: [
      'כרטיס בדף הבית: התצוגה הפשוטה של טבלת הלידים. נפתח בשלב 11, "חוגגים מכירה ראשונה". לפני כן מצב ריק שמסביר מתי הלידים יופיעו.',
      'לכל ליד: סטטוס ומקור (פנייה בוואטסאפ, קבוצת פייסבוק, הבוט), וכפתור "סגרתי!" שמפעיל את החגיגה ופותח עסקה בלוח התשלומים במרכז הפיננסי.',
      'עד שלב 14 "למעקב" פותח את התצוגה הפשוטה. משלב 14 "לכל הלידים" פותח את הדף המלא.',
    ],
  },
  {
    title: 'דרגות',
    items: [
      'דרגה בסוף כל פרק: מתחיל (בהרשמה), הפרויקטור, האסטרטג, הפרזנטור, הקלוזר, הבר סמכא, המאסטר. כל דרגה דורשת את השלבים של הפרק שלה.',
      'דרגת בונוס: העצמאי, על שלבי רואה החשבון.',
      'לשון נקבה לפי "איך נפנה אליך?": מתחילה, הפרויקטורית, האסטרטגית, הפרזנטורית, הקלוזרית, בת סמכא, המאסטרית, העצמאית.',
      'הכרטיס "הדרגה שלך" מציג את הדרגה הנוכחית ואת הבאה. לחיצה פותחת את כל הדרגות. בחלונית של כל פרק במפה כתוב איזו דרגה מקבלים בסופו.',
    ],
  },
  {
    title: 'עוד בדף הבית',
    items: [
      'הכריש: השותף העסקי, בבועה ימין למטה. אפשר לגרור אותו לכל מקום פנוי.',
      'פתק היומן: הפגישה של היום, "ליומן", ו"תכנן לי שבוע מושלם".',
      'משימות להיום לפי הפרק הנוכחי.',
    ],
  },
  {
    title: 'המפה',
    items: [
      'מקור הנתונים: CHAPTERS / ALL_STEPS, וההתקדמות מ-BusinessPlan.',
      'מצבי פרק: הושלם (וי בעיפרון), נוכחי (גדול, פועם, "אנחנו כאן" בכתב יד), נעול (מקווקו עם מנעול).',
      'לחיצה על פרק פותחת את השלבים שלו, עם מספר השלב במסע, בחלונית מרחפת (במובייל בחלון תחתון).',
    ],
  },
];

export function DevPanel({ open, onClose, scenario, onScenario, female, onFemale }) {
  return html`<aside
    class=${cx(
      'fixed inset-y-0 end-0 z-40 flex w-full max-w-sm flex-col border-s border-slate-200 bg-white shadow-2xl transition-transform duration-300',
      open ? 'translate-x-0' : '-translate-x-full pointer-events-none invisible',
    )}
    aria-hidden=${!open}
  >
    <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
      <h2 class="flex items-center gap-2 text-[16px] font-bold text-slate-900"><${Icon} name="code-xml" size=${17} /> הערות למפתחים</h2>
      <button type="button" onClick=${onClose} aria-label="סגירה" class="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer"><${Icon} name="x" size=${18} /></button>
    </div>
    <div class="flex-1 overflow-y-auto thin-scroll p-4 text-[14px] leading-relaxed text-slate-700">
      <section class="mb-5 rounded-xl border border-dashed border-brand-300 bg-brand-50/60 p-3">
        <h3 class="mb-2 font-bold text-brand-900">שלב במסע</h3>
        <p class="mb-2 text-[12px] text-slate-600">איך הדאשבורד נראה בנקודות שונות של המסע.</p>
        <div class="flex flex-col gap-1.5">
          ${SCENARIOS.map(
            (s) => html`<button
              key=${s.id}
              type="button"
              onClick=${() => onScenario(s.id)}
              aria-pressed=${scenario === s.id}
              class=${cx(
                'rounded-lg border px-3 py-1.5 text-start text-[12px] font-medium cursor-pointer',
                scenario === s.id ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-200 bg-white text-brand-800 hover:bg-brand-100',
              )}
            >
              ${s.label}
            </button>`,
          )}
        </div>
        <h3 class="mb-2 mt-4 font-bold text-brand-900">איך נפנה אליך?</h3>
        <div class="flex gap-1.5">
          ${[
            [false, 'זכר'],
            [true, 'נקבה'],
          ].map(
            ([f, label]) => html`<button
              key=${label}
              type="button"
              onClick=${() => onFemale(f)}
              aria-pressed=${female === f}
              class=${cx(
                'flex-1 rounded-lg border px-3 py-1.5 text-[12px] font-medium cursor-pointer',
                female === f ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-200 bg-white text-brand-800 hover:bg-brand-100',
              )}
            >
              ${label}
            </button>`,
          )}
        </div>
      </section>
      ${NOTES.map(
        (n) => html`<section key=${n.title} class="mb-4 p-1">
          <h3 class="mb-1.5 font-bold text-slate-900">${n.title}</h3>
          <ul class="list-disc space-y-1 ps-4">${n.items.map((t) => html`<li>${t}</li>`)}</ul>
        </section>`,
      )}
    </div>
  </aside>`;
}
