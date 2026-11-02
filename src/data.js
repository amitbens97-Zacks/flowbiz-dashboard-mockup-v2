// Mock data for the dashboard. In production: CHAPTERS / ALL_STEPS from
// src/features/journey/constants.jsx, progress from BusinessPlan, tasks from
// Task, leads from the leads table, savings from SavingsContext.

export const USER = { firstName: 'דניאל', fullName: 'דניאל כהן', business: 'שיווק שעובד', tagline: 'ייעוץ שיווק דיגיטלי לעסקים קטנים' };

// The new journey (November 2026): 6 chapters, 15 steps.
// Each step: name, minutes to complete, and what it would cost to buy it from a
// professional (the "saved so far" figure; merged steps add their sums up).
// Chapters 1-2 are free; the payment screen comes right after "העסק במספרים".
// The accountant steps stay outside the map ("רואה חשבון" in the top menu).
// Each chapter ends with a rank (female form by "איך נפנה אליך?").
export const CHAPTERS = [
  {
    id: 1,
    title: 'אפיון',
    icon: 'lightbulb',
    rank: ['הפרויקטור', 'הפרויקטורית'],
    steps: [
      { name: 'מציאת רעיון', min: 10, save: 400, optional: true },
      { name: 'אני והעסק', min: 20, save: 800 },
    ],
  },
  {
    id: 2,
    title: 'שביל הכסף',
    icon: 'coins',
    rank: ['האסטרטג', 'האסטרטגית'],
    steps: [
      { name: 'בניית סל מוצרים', min: 20, save: 800 },
      { name: 'צייד הלקוחות', min: 15, save: 600 },
      { name: 'העסק במספרים', min: 20, save: 1100 },
    ],
  },
  {
    id: 3,
    title: 'בניית מותג אישי',
    icon: 'palette',
    rank: ['הפרזנטור', 'הפרזנטורית'],
    steps: [
      { name: 'שם ולוגו', min: 25, save: 1300 },
      { name: 'דף המסרים', min: 15, save: 500 },
      { name: 'בניית הצעה מנצחת', min: 20, save: 700 },
      { name: 'דף נחיתה בקליק', min: 25, save: 1500 },
    ],
  },
  {
    id: 4,
    title: 'סגירת לקוח ראשון',
    icon: 'handshake',
    rank: ['הקלוזר', 'הקלוזרית'],
    steps: [
      { name: 'מכונת תוכן שיווקי', min: 25, save: 900 },
      { name: 'חוגגים מכירה ראשונה', min: 25, save: 500 },
    ],
  },
  {
    id: 5,
    title: 'מאיצים מכירות',
    icon: 'rocket',
    rank: ['הבר סמכא', 'בת סמכא'],
    steps: [
      { name: 'חדר התרגול', min: 25, save: 800 },
      { name: 'בוט WhatsApp', min: 20, save: 1600 },
    ],
  },
  {
    id: 6,
    title: 'העסק שתמיד רצית',
    icon: 'gem',
    rank: ['המאסטר', 'המאסטרית'],
    steps: [
      { name: 'ניהול לקוחות', min: 15, save: 600 },
      { name: 'ליווי עסקי אנושי', min: 5, save: 0 },
    ],
  },
];

// The rank at signup, and the bonus rank for the accountant steps (outside the map).
export const START_RANK = ['מתחיל', 'מתחילה'];
export const BONUS_RANK = ['העצמאי', 'העצמאית'];

export const ALL_STEPS = CHAPTERS.flatMap((c, ci) => c.steps.map((s, si) => ({ ...s, chapter: ci, index: si })));
export const TOTAL_STEPS = ALL_STEPS.length;
const stepIndex = (name) => ALL_STEPS.findIndex((s) => s.name === name);

// The free part ends with "העסק במספרים"; the finance center opens after it.
export const FREE_CHAPTERS = 2;
export const NUMBERS_STEP = stepIndex('העסק במספרים');
// "הלידים שלי" (the simple view of the leads table) opens at step 11;
// the full "לידים" page opens at step 14 and joins the top menu.
export const LEADS_STEP = stepIndex('חוגגים מכירה ראשונה');
export const CRM_STEP = stepIndex('ניהול לקוחות');
export const MEETING_STEP = stepIndex('ליווי עסקי אנושי');

// Demo scenarios: how far the user is (index of the current step in ALL_STEPS).
// `skippedIdea`: started without "מציאת רעיון" (the counter shows "מתוך 14").
export const SCENARIOS = [
  { id: 'new', label: 'משתמש חדש (שלב 1, מציאת רעיון)', current: 0 },
  { id: 'skip', label: 'משתמש עם רעיון (דילג על שלב 1)', current: 1, skippedIdea: true },
  {
    id: 'mid',
    label: 'חוזר אחרי הפסקה (פרק 3)',
    current: stepIndex('דף המסרים'),
    // Return after a break: the place we kept, the question, and the last answer.
    away: { days: 4, question: 'שאלה 3 מתוך 6', answer: 'עזרתי ל-40 עסקים קטנים להביא לקוחות מהרשתות, בלי תקציב פרסום.', topic: 'הסמכות שלך', minutes: 3 },
  },
  { id: 'free', label: 'סוף החלק החינמי (אחרי שלב 5)', current: NUMBERS_STEP + 1 },
  { id: 'leads', label: 'יוצא ללקוחות (שלב 11)', current: LEADS_STEP },
  { id: 'crm', label: 'ניהול לקוחות נפתח (שלב 14)', current: CRM_STEP },
  { id: 'meeting', label: 'השלב האחרון (שלב 15)', current: MEETING_STEP },
  { id: 'done', label: 'סיים את כל המסע', current: TOTAL_STEPS },
];
export const DEFAULT_SCENARIO = 'mid';

// Today's tasks follow the current chapter (6 = journey finished).
export const TASKS_BY_CHAPTER = {
  0: ['לסיים את "אני והעסק"', 'לרשום 3 לקוחות ראשונים אפשריים', 'לשתף את הרעיון עם חבר'],
  1: ['להגדיר 3 מוצרים לסל', 'לנסח את משפט הזהב', 'לבדוק כמה לקוחות צריך בחודש'],
  2: ['לאשר את הסמכות שלך בדף המסרים', 'לבחור 3 המלצות לדף הנחיתה', 'להעלות תמונה מקצועית'],
  3: ['לשלוח הודעה ל-5 אנשי קשר', 'לפרסם ב-3 קבוצות פייסבוק', 'לתזמן את הפוסטים של השבוע'],
  4: ['שיחת תרגול אחת בחדר התרגול', 'לענות ללידים מהשבוע', 'לחבר את בוט ה-WhatsApp'],
  5: ['לעבור על רשימת הלידים', 'להוסיף לידים שחסרים', 'לקבוע פגישת מיקוד'],
  6: ['לחגוג', 'לשתף את הסיפור שלך', 'לעבור על המספרים של החודש'],
};

// The simple view of the leads table: contacts and posts from step 11, leads from
// the bot. Each one can be marked "סגרתי!".
export const LEADS = [
  { name: 'מיכל לוי', source: 'WhatsApp · פנייה חמה', status: 'ענתה', isNew: true },
  { name: 'יוסי אברהם', source: 'פייסבוק · עסקים קטנים בשרון', status: 'שלח הודעה', isNew: true },
  { name: 'רונית שמעוני', source: 'WhatsApp · פנייה חמה', status: 'נשלחה הודעה', isNew: false },
];

// Today's meeting in the calendar (a white note on the home page).
export const MEETING = { title: 'שיחה עם מיכל לוי', when: 'היום · 14:00', where: 'זום' };

// The shark: the one partner of the system, in the partner bubble.
export const PARTNER = {
  name: 'הכריש',
  role: 'השותף העסקי',
  photo: 'assets/shark/shark-calm-sm.svg',
  message: (step, away, state) =>
    away
      ? `טוב שחזרת. עצרנו בשאלה על ${away.topic}, זה לוקח כ-${away.minutes} דקות.`
      : state === 'paywall'
        ? 'התוכנית העסקית שלך מוכנה. מכאן בונים את המותג ויוצאים ללקוחות הראשונים.'
        : step
          ? `הצעד הבא הוא "${step.name}". זה לוקח כ-${step.min} דקות, ומה שבנית עד עכשיו כבר ממולא בו.`
          : 'סיימנו את כל המסע. FlowBiz Plus בדרך, ואני אעדכן אותך כשהוא נפתח.',
};
