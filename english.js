/* משבצת — מנוע שאלות באנגלית לכיתות א'–ו'
 * אותו מבנה כמו math.js: כל שאלה מחזירה { t:'choice', prompt, vis, ans, opts, ex, hint, say?, data }
 * say: הטקסט באנגלית שכפתור ההקראה קורא בקול אנגלי.
 * data מתאר את השאלה כך שבודק עצמאי (verify.js) יכול לחשב את התשובה מחדש.
 * עובד בדפדפן (window.ENGLISH) וב־Node (module.exports).
 */
(function (root) {
'use strict';

/* ===== כלים ===== */
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const EN = s => `<span class="ltr" lang="en">${s}</span>`;
const big = s => `<div class="enw" lang="en">${s}</div>`;
const pic = e => `<div class="pic" aria-hidden="true">${e}</div>`;
const stack = (...p) => `<div class="stack">${p.join('')}</div>`;
const BLANK = '___';
const sayText = s => s.replace(/_+/g, '…');
// התשובה + עד n−1 מסיחים שונים ממנה
const withOpts = (ans, pool, n = 4) => [ans, ...shuffle([...new Set(pool)].filter(x => x !== ans)).slice(0, n - 1)];
function Q(o) { o.t = 'choice'; o.opts = shuffle(o.opts); o.hint = o.hint || ''; o.ex = o.ex || ''; return o; }

/* ===== אוצר מילים: [מילה, תמונה, עברית, קטגוריה, רמה] ===== */
const W = [
  ['dog', '🐶', 'כלב', 'animal', 1], ['cat', '🐱', 'חתול', 'animal', 1], ['fish', '🐟', 'דג', 'animal', 1], ['bird', '🐦', 'ציפור', 'animal', 1],
  ['horse', '🐴', 'סוס', 'animal', 1], ['cow', '🐮', 'פרה', 'animal', 1], ['lion', '🦁', 'אריה', 'animal', 1], ['monkey', '🐵', 'קוף', 'animal', 1],
  ['rabbit', '🐰', 'ארנב', 'animal', 1], ['duck', '🦆', 'ברווז', 'animal', 1], ['frog', '🐸', 'צפרדע', 'animal', 1], ['elephant', '🐘', 'פיל', 'animal', 1],
  ['bear', '🐻', 'דוב', 'animal', 1], ['pig', '🐷', 'חזיר', 'animal', 1],
  ['snake', '🐍', 'נחש', 'animal', 2], ['sheep', '🐑', 'כבשה', 'animal', 2], ['mouse', '🐭', 'עכבר', 'animal', 2], ['tiger', '🐯', 'נמר', 'animal', 2],
  ['owl', '🦉', 'ינשוף', 'animal', 2], ['ant', '🐜', 'נמלה', 'animal', 2], ['chicken', '🐔', 'תרנגולת', 'animal', 2], ['bee', '🐝', 'דבורה', 'animal', 2],
  ['turtle', '🐢', 'צב', 'animal', 2], ['whale', '🐳', 'לווייתן', 'animal', 2], ['giraffe', '🦒', "ג'ירפה", 'animal', 2], ['zebra', '🦓', 'זברה', 'animal', 2],
  ['camel', '🐪', 'גמל', 'animal', 2], ['butterfly', '🦋', 'פרפר', 'animal', 2], ['spider', '🕷️', 'עכביש', 'animal', 2],

  ['apple', '🍎', 'תפוח', 'food', 1], ['banana', '🍌', 'בננה', 'food', 1], ['bread', '🍞', 'לחם', 'food', 1], ['milk', '🥛', 'חלב', 'food', 1],
  ['egg', '🥚', 'ביצה', 'food', 1], ['cake', '🍰', 'עוגה', 'food', 1], ['pizza', '🍕', 'פיצה', 'food', 1], ['orange', '🍊', 'תפוז', 'food', 1],
  ['carrot', '🥕', 'גזר', 'food', 1], ['ice cream', '🍦', 'גלידה', 'food', 1],
  ['cheese', '🧀', 'גבינה', 'food', 2], ['grapes', '🍇', 'ענבים', 'food', 2], ['tomato', '🍅', 'עגבנייה', 'food', 2], ['lemon', '🍋', 'לימון', 'food', 2],
  ['strawberry', '🍓', 'תות', 'food', 2], ['cookie', '🍪', 'עוגייה', 'food', 2], ['candy', '🍬', 'סוכרייה', 'food', 2], ['watermelon', '🍉', 'אבטיח', 'food', 2],
  ['corn', '🌽', 'תירס', 'food', 2], ['sandwich', '🥪', 'כריך', 'food', 2], ['honey', '🍯', 'דבש', 'food', 2], ['salad', '🥗', 'סלט', 'food', 2],

  ['book', '📖', 'ספר', 'thing', 1], ['pencil', '✏️', 'עיפרון', 'thing', 1], ['bag', '🎒', 'תיק', 'thing', 1], ['ball', '⚽', 'כדור', 'thing', 1],
  ['house', '🏠', 'בית', 'thing', 1], ['car', '🚗', 'מכונית', 'thing', 1], ['bus', '🚌', 'אוטובוס', 'thing', 1], ['tree', '🌳', 'עץ', 'thing', 1],
  ['flower', '🌸', 'פרח', 'thing', 1], ['sun', '☀️', 'שמש', 'thing', 1], ['moon', '🌙', 'ירח', 'thing', 1], ['star', '⭐', 'כוכב', 'thing', 1],
  ['key', '🔑', 'מפתח', 'thing', 1], ['door', '🚪', 'דלת', 'thing', 1],
  ['clock', '🕒', 'שעון', 'thing', 2], ['phone', '📱', 'טלפון', 'thing', 2], ['umbrella', '☂️', 'מטרייה', 'thing', 2], ['box', '📦', 'קופסה', 'thing', 2],
  ['cup', '☕', 'ספל', 'thing', 2], ['boat', '⛵', 'סירה', 'thing', 2], ['plane', '✈️', 'מטוס', 'thing', 2], ['train', '🚆', 'רכבת', 'thing', 2],
  ['bed', '🛏️', 'מיטה', 'thing', 2], ['bike', '🚲', 'אופניים', 'thing', 2], ['computer', '💻', 'מחשב', 'thing', 2], ['hat', '🎩', 'כובע', 'thing', 2],
  ['shoe', '👟', 'נעל', 'thing', 2], ['shirt', '👕', 'חולצה', 'thing', 2], ['dress', '👗', 'שמלה', 'thing', 2], ['gift', '🎁', 'מתנה', 'thing', 2],
  ['guitar', '🎸', 'גיטרה', 'thing', 2], ['candle', '🕯️', 'נר', 'thing', 2], ['ring', '💍', 'טבעת', 'thing', 2], ['crown', '👑', 'כתר', 'thing', 2],
  ['balloon', '🎈', 'בלון', 'thing', 2], ['camera', '📷', 'מצלמה', 'thing', 2], ['letter', '✉️', 'מכתב', 'thing', 2], ['map', '🗺️', 'מפה', 'thing', 2],

  ['rain', '🌧️', 'גשם', 'nature', 2], ['snow', '❄️', 'שלג', 'nature', 2], ['cloud', '☁️', 'ענן', 'nature', 2], ['rainbow', '🌈', 'קשת', 'nature', 2],
  ['sea', '🌊', 'ים', 'nature', 2], ['fire', '🔥', 'אש', 'nature', 2], ['mountain', '⛰️', 'הר', 'nature', 2],

  ['hand', '✋', 'יד', 'body', 2], ['eye', '👁️', 'עין', 'body', 2], ['ear', '👂', 'אוזן', 'body', 2], ['nose', '👃', 'אף', 'body', 2],
  ['mouth', '👄', 'פה', 'body', 2], ['foot', '🦶', 'כף רגל', 'body', 2], ['leg', '🦵', 'רגל', 'body', 2], ['tooth', '🦷', 'שן', 'body', 2], ['heart', '❤️', 'לב', 'body', 2],

  ['red', '🔴', 'אדום', 'color', 1], ['blue', '🔵', 'כחול', 'color', 1], ['green', '🟢', 'ירוק', 'color', 1], ['yellow', '🟡', 'צהוב', 'color', 1],
  ['orange', '🟠', 'כתום', 'color', 1], ['purple', '🟣', 'סגול', 'color', 1], ['black', '⚫', 'שחור', 'color', 1], ['white', '⚪', 'לבן', 'color', 1],
  ['brown', '🟤', 'חום', 'color', 1],

  ['boy', '👦', 'ילד', 'people', 2], ['girl', '👧', 'ילדה', 'people', 2], ['baby', '👶', 'תינוק', 'people', 2], ['man', '👨', 'איש', 'people', 2],
  ['woman', '👩', 'אישה', 'people', 2], ['mother', '', 'אמא', 'people', 2], ['father', '', 'אבא', 'people', 2], ['brother', '', 'אח', 'people', 2],
  ['sister', '', 'אחות', 'people', 2], ['grandmother', '', 'סבתא', 'people', 2], ['grandfather', '', 'סבא', 'people', 2], ['teacher', '', 'מורה', 'people', 2],
  ['friend', '', 'חבר', 'people', 2],

  ['run', '', 'לרוץ', 'verb', 3], ['jump', '', 'לקפוץ', 'verb', 3], ['swim', '', 'לשחות', 'verb', 3], ['eat', '', 'לאכול', 'verb', 3],
  ['drink', '', 'לשתות', 'verb', 3], ['read', '', 'לקרוא', 'verb', 3], ['write', '', 'לכתוב', 'verb', 3], ['sleep', '', 'לישון', 'verb', 3],
  ['play', '', 'לשחק', 'verb', 3], ['sing', '', 'לשיר', 'verb', 3], ['dance', '', 'לרקוד', 'verb', 3], ['go', '', 'ללכת', 'verb', 3],
  ['come', '', 'לבוא', 'verb', 3], ['see', '', 'לראות', 'verb', 3], ['open', '', 'לפתוח', 'verb', 3], ['close', '', 'לסגור', 'verb', 3],
  ['sit', '', 'לשבת', 'verb', 3], ['help', '', 'לעזור', 'verb', 3], ['cook', '', 'לבשל', 'verb', 3], ['buy', '', 'לקנות', 'verb', 3],
  ['speak', '', 'לדבר', 'verb', 3], ['listen', '', 'להקשיב', 'verb', 3], ['love', '', 'לאהוב', 'verb', 3], ['want', '', 'לרצות', 'verb', 3],
  ['clean', '', 'לנקות', 'verb', 3], ['draw', '', 'לצייר', 'verb', 3], ['fly', '', 'לעוף', 'verb', 3], ['cry', '', 'לבכות', 'verb', 3],
  ['laugh', '', 'לצחוק', 'verb', 3],

  ['big', '', 'גדול', 'adj', 3], ['small', '', 'קטן', 'adj', 3], ['hot', '', 'חם', 'adj', 3], ['cold', '', 'קר', 'adj', 3],
  ['happy', '', 'שמח', 'adj', 3], ['sad', '', 'עצוב', 'adj', 3], ['tall', '', 'גבוה', 'adj', 3], ['short', '', 'נמוך', 'adj', 3],
  ['fast', '', 'מהיר', 'adj', 3], ['slow', '', 'איטי', 'adj', 3], ['new', '', 'חדש', 'adj', 3], ['good', '', 'טוב', 'adj', 3],
  ['bad', '', 'רע', 'adj', 3], ['beautiful', '', 'יפה', 'adj', 3], ['clean', '', 'נקי', 'adj', 3], ['dirty', '', 'מלוכלך', 'adj', 3],
  ['full', '', 'מלא', 'adj', 3], ['empty', '', 'ריק', 'adj', 3], ['rich', '', 'עשיר', 'adj', 3], ['poor', '', 'עני', 'adj', 3],
  ['strong', '', 'חזק', 'adj', 3], ['weak', '', 'חלש', 'adj', 3], ['easy', '', 'קל', 'adj', 3], ['hard', '', 'קשה', 'adj', 3],
  ['early', '', 'מוקדם', 'adj', 3], ['late', '', 'מאוחר', 'adj', 3], ['wet', '', 'רטוב', 'adj', 3], ['dry', '', 'יבש', 'adj', 3],
  ['open', '', 'פתוח', 'adj', 3], ['closed', '', 'סגור', 'adj', 3], ['hungry', '', 'רעב', 'adj', 3], ['tired', '', 'עייף', 'adj', 3]
].map(([en, e, he, cat, lv]) => ({ en, e, he, cat, lv }));

const NONCOUNT = new Set(['bread', 'milk', 'cheese', 'honey', 'corn', 'candy', 'salad', 'rain', 'snow', 'fire', 'ice cream', 'grapes', 'sea']);
const isNoun = w => !['verb', 'adj', 'color'].includes(w.cat);
const words = (f, lvMax) => W.filter(w => w.lv <= lvMax && f(w));

/* ===== אותיות ===== */
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOOKALIKE = { b: 'dpq', d: 'bpq', p: 'qbd', q: 'pdb', m: 'nw', n: 'mu', u: 'nv', i: 'jl', j: 'il', l: 'it' };
function caseQ(toSmall) {
  const U = pick(ABC), l = U.toLowerCase(), near = (LOOKALIKE[l] || '').split('').filter(Boolean);
  const pool = shuffle([...near, ...shuffle(ABC.toLowerCase().split('')).slice(0, 6)]).filter(x => x !== l);
  const opts = withOpts(l, pool).map(x => toSmall ? x : x.toUpperCase());
  return Q({ prompt: toSmall ? `מה האות הקטנה של ${EN(U)}?` : `מה האות הגדולה של ${EN(l)}?`, vis: big(toSmall ? U : l), say: U, opts, ans: toSmall ? l : U,
    ex: `${EN(U)} ו־${EN(l)} הן אותה אות.`, hint: 'האות הגדולה והאות הקטנה נקראות אותו דבר.', data: { k: 'en-case', U, toSmall } });
}
function abcSeqQ() {
  const from = rnd(0, 21), miss = rnd(1, 3), seq = ABC.slice(from, from + 5).split(''), ans = seq[miss];
  const shown = seq.map((c, i) => i === miss ? '<span class="box">?</span>' : c).join(' ');
  const pool = ABC.slice(Math.max(0, from - 3), from + 8).split('');
  return Q({ prompt: 'איזו אות חסרה?', vis: big(shown), opts: withOpts(ans, pool), ans,
    ex: `${EN(seq.join(' '))}`, hint: 'אמרו את ה־ABC בקול מההתחלה.', data: { k: 'en-seq', from, miss } });
}
function firstLetterQ(lvMax) {
  const w = pick(words(x => x.e && !x.en.includes(' '), lvMax)), U = w.en[0].toUpperCase(), ans = U + w.en[0];
  const pool = shuffle(ABC.split('')).filter(c => c !== U).slice(0, 3).map(c => c + c.toLowerCase());
  return Q({ prompt: 'באיזו אות מתחילה המילה באנגלית?', vis: pic(w.e), say: w.en, opts: [ans, ...pool], ans,
    ex: `${EN(w.en)} (${w.he}) מתחילה ב־${EN(ans)}.`, hint: 'לחצו על 🔊 ושמעו את הצליל הראשון.', data: { k: 'en-first', en: w.en } });
}

/* ===== מילים ותמונות ===== */
function picToWordQ(lvMax, cats) {
  const pool = words(x => x.e && (!cats || cats.includes(x.cat)), lvMax), w = pick(pool);
  const same = pool.filter(x => x.cat === w.cat && x.e !== w.e).map(x => x.en);
  return Q({ prompt: w.cat === 'color' ? 'איזה צבע זה?' : 'מה זה באנגלית?', vis: pic(w.e), opts: withOpts(w.en, same.length >= 3 ? same : pool.map(x => x.en)), ans: w.en,
    ex: `${w.e} = ${EN(w.en)} (${w.he})`, hint: 'אמרו את המילה בעברית, ונסו להיזכר איך אומרים אותה באנגלית.', data: { k: 'en-pic', en: w.en, e: w.e } });
}
function wordToPicQ(lvMax, cats) {
  const pool = words(x => x.e && (!cats || cats.includes(x.cat)), lvMax), w = pick(pool);
  const same = pool.filter(x => x.cat === w.cat && x.e !== w.e).map(x => x.e);
  return Q({ prompt: 'איזו תמונה מתאימה למילה? (לחצו על 🔊 כדי לשמוע)', vis: big(w.en), say: w.en, opts: withOpts(w.e, same.length >= 3 ? same : pool.map(x => x.e)), ans: w.e,
    ex: `${EN(w.en)} = ${w.e} (${w.he})`, hint: 'הקשיבו למילה. האם אתם מכירים מילה דומה?', data: { k: 'en-wpic', en: w.en, e: w.e } });
}
function translateQ(lvMin, lvMax, cats) {
  const pool = W.filter(x => x.lv >= lvMin && x.lv <= lvMax && (!cats || cats.includes(x.cat))), w = pick(pool);
  const same = W.filter(x => x.cat === w.cat && x.en !== w.en && x.he !== w.he);
  if (Math.random() < .5) return Q({ prompt: `מה פירוש המילה ${EN(w.en)}?`, vis: big(w.en), say: w.en, opts: withOpts(w.he, same.map(x => x.he)), ans: w.he,
    ex: `${EN(w.en)} = ${w.he}`, hint: 'נסו לחשוב על משפט שבו שמעתם את המילה.', data: { k: 'en-tr', en: w.en, cat: w.cat, dir: 'he' } });
  return Q({ prompt: `איך אומרים באנגלית: <b>${w.he}</b>?`, vis: '', opts: withOpts(w.en, same.map(x => x.en)), ans: w.en,
    ex: `${w.he} = ${EN(w.en)}`, hint: 'אמרו כל אפשרות בקול. איזו נשמעת מוכרת?', data: { k: 'en-tr', en: w.en, cat: w.cat, dir: 'en' } });
}
function spellQ(lvMax) {
  const w = pick(words(x => x.e && isNoun(x) && !x.en.includes(' ') && x.en.length >= 3 && x.en.length <= 7, lvMax));
  const i = rnd(0, w.en.length - 1), ans = w.en[i], vow = 'aeiou'.includes(ans);
  const pool = (vow ? 'aeiou' : 'bcdfghklmnprst').split('');
  const shown = w.en.split('').map((c, j) => j === i ? '_' : c).join('');
  return Q({ prompt: 'איזו אות חסרה במילה?', vis: stack(pic(w.e), big(shown)), say: w.en, opts: withOpts(ans, pool), ans,
    ex: `${EN(w.en)} (${w.he})`, hint: 'לחצו על 🔊, הקשיבו טוב, ואמרו את המילה לאט.', data: { k: 'en-spell', en: w.en, i, shown } });
}

/* ===== מספרים, ימים וחודשים ===== */
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const numWord = n => n < 20 ? ONES[n] : n === 100 ? 'one hundred' : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
function numQ(lo, hi, dir) {
  // מסיחים: שכנים, עשר למעלה/למטה, ספרות הפוכות (47/74), ובלבול teen/ty (14/40)
  const n = rnd(lo, hi), near = [n - 1, n + 1, n + 10, n - 10, n % 10 * 10 + Math.floor(n / 10), n < 20 ? n % 10 * 10 : 10 + n % 10];
  const nums = [...new Set(near)].filter(x => x >= 1 && x <= 100 && x !== n);
  if (dir === 'word') return Q({ prompt: 'איך כותבים את המספר באנגלית?', vis: big(n), opts: withOpts(numWord(n), nums.map(numWord)), ans: numWord(n),
    ex: `${n} = ${EN(numWord(n))}`, hint: n > 20 ? 'קודם העשרות (twenty, thirty…), ואחר כך האחדות.' : 'ספרו באנגלית מ־one.', data: { k: 'en-num', n, dir } });
  return Q({ prompt: 'איזה מספר שמעתם? (לחצו על 🔊)', vis: big(numWord(n)), say: numWord(n), opts: withOpts(String(n), nums.map(String)), ans: String(n),
    ex: `${EN(numWord(n))} = ${n}`, hint: 'ספרו באנגלית מ־one עד שתגיעו למילה.', data: { k: 'en-num', n, dir } });
}
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function orderQ() {
  const isDay = Math.random() < .5, L = isDay ? DAYS : MONTHS, i = rnd(0, L.length - 1), after = Math.random() < .5;
  const ans = L[(i + (after ? 1 : -1) + L.length) % L.length];
  return Q({ prompt: `איזה ${isDay ? 'יום' : 'חודש'} בא ${after ? 'אחרי' : 'לפני'} ${EN(L[i])}?`, vis: big(L[i]), say: L[i], opts: withOpts(ans, L.filter(x => x !== L[i])), ans,
    ex: `${EN(after ? `${L[i]} → ${ans}` : `${ans} → ${L[i]}`)}`, hint: isDay ? 'השבוע מתחיל ב־Sunday (יום ראשון).' : 'השנה מתחילה ב־January (ינואר).', data: { k: 'en-order', isDay, i, after } });
}

/* ===== דקדוק ===== */
// a / an
function aanQ() {
  const vowelFirst = Math.random() < .5;
  const w = pick(words(x => x.e && isNoun(x) && x.cat !== 'people' && !NONCOUNT.has(x.en) && /^[aeiou]/.test(x.en) === vowelFirst, 2));
  const ans = vowelFirst ? 'an' : 'a';
  return Q({ prompt: `מה מתאים: ${EN('a')} או ${EN('an')}?`, vis: stack(pic(w.e), big(`${BLANK} ${w.en}`)), say: w.en, opts: ['a', 'an'], ans,
    ex: vowelFirst ? `${EN(w.en)} מתחילה בתנועה (a, e, i, o, u), ולכן ${EN('an ' + w.en)}.` : `${EN(w.en)} מתחילה בעיצור, ולכן ${EN('a ' + w.en)}.`,
    hint: `לפני מילה שמתחילה ב־${EN('a, e, i, o, u')} כותבים ${EN('an')}.`, data: { k: 'en-aan', en: w.en } });
}
// רבים
const IRR_PL = { mouse: 'mice', sheep: 'sheep', tooth: 'teeth', foot: 'feet', man: 'men', woman: 'women' };
function plural(w) {
  if (IRR_PL[w]) return IRR_PL[w];
  if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ies';
  if (/(s|x|z|ch|sh)$/.test(w) || w === 'tomato') return w + 'es';
  return w + 's';
}
function pluralQ() {
  const w = pick(words(x => x.e && isNoun(x) && !NONCOUNT.has(x.en) && x.en !== 'fish' && !['mother', 'father'].includes(x.en), 2)), ans = plural(w.en);
  const wrong = [w.en + 's', w.en + 'es', /y$/.test(w.en) ? w.en.slice(0, -1) + 'ies' : w.en, IRR_PL[w.en] ? IRR_PL[w.en] + 's' : w.en];
  const why = IRR_PL[w.en] ? `${EN(w.en)} היא מילה יוצאת דופן: ${EN(ans)}.` : ans.endsWith('ies') && !w.en.endsWith('ie') ? `עיצור ואחריו ${EN('y')}: מחליפים את ה־${EN('y')} ב־${EN('ies')}.`
    : ans.endsWith('es') && !(w.en + 's').endsWith('es') ? `מילה שנגמרת ב־${EN('s, x, ch, sh')} (וגם ${EN('tomato')}) מקבלת ${EN('es')}.` : `ברוב המילים מוסיפים ${EN('s')}.`;
  return Q({ prompt: 'מה הרבים של המילה?', vis: stack(pic(w.e), big(`one ${w.en} → two ${BLANK}`)), say: `one ${w.en}`, opts: withOpts(ans, wrong), ans,
    ex: `${EN(`one ${w.en} → two ${ans}`)}. ${why}`, hint: `ברוב המילים מוסיפים ${EN('s')}. אבל יש מילים שמקבלות ${EN('es')} או ${EN('ies')}, ויש כמה יוצאות דופן.`, data: { k: 'en-plural', en: w.en } });
}
// נושאים למשפטים: [מילים, סוג] — I / you / s (אחד) / pl (רבים)
const SUBJ = [['I', 'I'], ['You', 'you'], ['We', 'pl'], ['They', 'pl'], ['He', 's'], ['She', 's'], ['My sister', 's'], ['Dan', 's'], ['Noa', 's'],
  ['My friends', 'pl'], ['Dan and Maya', 'pl'], ['My parents', 'pl'], ['The teacher', 's']];
const beOf = t => t === 'I' ? 'am' : t === 's' ? 'is' : 'are';
const BE_RULE = `${EN('I → am')}. ${EN('he, she, it')} ואדם אחד ← ${EN('is')}. ${EN('you, we, they')} וכמה אנשים ← ${EN('are')}.`;
function beQ() {
  const [s, t] = pick(SUBJ), rest = pick(['happy', 'at home', 'in the park', 'tired', 'at school', 'hungry', 'in the garden', 'ready']), ans = beOf(t);
  const sent = `${s} ${BLANK} ${rest}.`;
  return Q({ prompt: `בחרו: ${EN('am')}, ${EN('is')} או ${EN('are')}`, vis: big(sent), say: sayText(sent), opts: ['am', 'is', 'are'], ans,
    ex: `${EN(`${s} ${ans} ${rest}.`)}`, hint: BE_RULE, data: { k: 'en-be', s, t } });
}
function third(v) {
  if (v === 'have') return 'has';
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies';
  if (/(s|x|z|ch|sh|o)$/.test(v)) return v + 'es';
  return v + 's';
}
function ing(v) {
  if (/ie$/.test(v)) return v.slice(0, -2) + 'ying';
  if (/[^e]e$/.test(v)) return v.slice(0, -1) + 'ing';
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(v)) return v + v.slice(-1) + 'ing';
  return v + 'ing';
}
// הווה פשוט: [פועל, המשך המשפט]
const PS = [['play', 'football every day'], ['read', 'a book every night'], ['eat', 'pizza on Fridays'], ['swim', 'in the pool every morning'],
  ['watch', 'TV after school'], ['go', 'to school by bus'], ['do', 'homework every day'], ['have', 'a big dog'], ['fly', 'a kite at the beach'],
  ['study', 'English on Mondays'], ['wash', 'the dishes after dinner'], ['drink', 'milk every morning'], ['sing', 'in the shower'],
  ['ride', 'a bike to school'], ['walk', 'to the park'], ['cook', 'dinner on Saturdays'], ['live', 'in Haifa'], ['catch', 'the bus at eight'],
  ['teach', 'English'], ['like', 'ice cream'], ['fix', 'old bikes'], ['brush', 'teeth twice a day'], ['finish', 'school at two']];
function presentQ() {
  const [s, t] = pick(SUBJ), [v, rest] = pick(PS), ans = t === 's' ? third(v) : v, sent = `${s} ${BLANK} (${v}) ${rest}.`;
  return Q({ prompt: 'השלימו את המשפט', vis: big(sent), say: sayText(sent), opts: [v, third(v), ing(v)], ans,
    ex: `${EN(`${s} ${ans} ${rest}.`)} ${t === 's' ? `עם ${EN('he / she / it')} (או אדם אחד) מוסיפים ${EN('s')} לפועל.` : `עם ${EN('I / you / we / they')} הפועל נשאר בלי ${EN('s')}.`}`,
    hint: `${EN('he, she, it')} ← מוסיפים ${EN('s')}: ${EN('she plays')}. ${EN('I, you, we, they')} ← בלי ${EN('s')}: ${EN('they play')}.`, data: { k: 'en-pres', s, t, v } });
}
// הווה מתמשך
const PROG = [['play', 'football'], ['read', 'a book'], ['eat', 'an apple'], ['swim', 'in the pool'], ['run', 'in the park'], ['dance', 'at the party'],
  ['write', 'a letter'], ['ride', 'a bike'], ['sing', 'a song'], ['sleep', 'on the sofa'], ['cook', 'dinner'], ['watch', 'TV'], ['drink', 'juice'],
  ['sit', 'on the floor'], ['jump', 'on the bed'], ['draw', 'a picture'], ['fly', 'a kite'], ['make', 'a cake'], ['clean', 'the room'],
  ['wash', 'the car'], ['listen', 'to music'], ['get', 'dressed'], ['stop', 'the car']];
function progQ() {
  const [s, t] = pick(SUBJ), [v, rest] = pick(PROG), be = beOf(t), ans = `${be} ${ing(v)}`, sent = `Look! ${s} ${BLANK} (${v}) ${rest} now.`;
  const wrongBe = t === 's' ? 'are' : 'is';
  return Q({ prompt: 'השלימו את המשפט', vis: big(sent), say: sayText(sent), opts: withOpts(ans, [`${wrongBe} ${ing(v)}`, `${be} ${v}`, t === 's' ? third(v) : v]), ans,
    ex: `${EN(`${s} ${ans} ${rest} now.`)} עכשיו ← ${EN('am / is / are')} + פועל עם ${EN('ing')}.`,
    hint: `${BE_RULE} ואחר כך הפועל עם ${EN('ing')}.`, data: { k: 'en-prog', s, t, v } });
}
// עבר פשוט
const IRR_PAST = { go: 'went', eat: 'ate', see: 'saw', have: 'had', do: 'did', swim: 'swam', run: 'ran', drink: 'drank', sing: 'sang', sleep: 'slept',
  write: 'wrote', ride: 'rode', buy: 'bought', come: 'came', take: 'took', make: 'made', give: 'gave', get: 'got', fly: 'flew', catch: 'caught',
  find: 'found', sit: 'sat', draw: 'drew', break: 'broke', win: 'won', lose: 'lost', meet: 'met', tell: 'told' };
function past(v) {
  if (IRR_PAST[v]) return IRR_PAST[v];
  if (/e$/.test(v)) return v + 'd';
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ied';
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(v)) return v + v.slice(-1) + 'ed';
  return v + 'ed';
}
const PAST = [['go', 'to the beach'], ['eat', 'a sandwich'], ['see', 'a big lion'], ['have', 'a party'], ['do', 'the homework'], ['swim', 'in the sea'],
  ['run', 'to school'], ['drink', 'orange juice'], ['sing', 'a song'], ['sleep', 'at home'], ['write', 'a letter'], ['ride', 'a horse'], ['buy', 'new shoes'],
  ['come', 'home late'], ['take', 'a photo'], ['make', 'a cake'], ['give', 'the teacher a flower'], ['get', 'a new bike'], ['fly', 'to London'],
  ['catch', 'a fish'], ['find', 'a key'], ['sit', 'under a tree'], ['draw', 'a cat'], ['break', 'a glass'], ['win', 'the game'], ['lose', 'the key'],
  ['meet', 'a friend'], ['tell', 'a story'],
  ['play', 'basketball'], ['watch', 'a movie'], ['cook', 'pasta'], ['help', 'the teacher'], ['walk', 'to the park'], ['jump', 'into the pool'],
  ['clean', 'the house'], ['open', 'the window'], ['wash', 'the car'], ['visit', 'Grandma'], ['dance', 'at the party'], ['study', 'for the test'],
  ['cry', 'at the end of the movie'], ['try', 'a new game'], ['stop', 'at the red light'], ['plan', 'a trip'], ['drop', 'the ball'], ['hug', 'the dog'],
  ['carry', 'a heavy bag'], ['finish', 'the book']];
function pastQ() {
  const s = pick(SUBJ)[0].replace(/^(You|We|They|He|She)$/, x => x.toLowerCase()), [v, rest] = pick(PAST), ans = past(v), sent = `Yesterday, ${s} ${BLANK} (${v}) ${rest}.`;
  const wrong = [v, third(v), ing(v)].concat(/e$/.test(v) ? [] : [v + 'ed']);
  return Q({ prompt: 'השלימו את המשפט בזמן עבר', vis: big(sent), say: sayText(sent), opts: withOpts(ans, wrong), ans,
    ex: `${EN(`Yesterday, ${s} ${ans} ${rest}.`)} ${IRR_PAST[v] ? `${EN(v)} הוא פועל יוצא דופן: ${EN(`${v} → ${ans}`)}.` : `פועל רגיל: מוסיפים ${EN('ed')} (${EN(`${v} → ${ans}`)}).`}`,
    hint: `ברוב הפעלים מוסיפים ${EN('ed')}: ${EN('play → played')}. יש פעלים יוצאי דופן, כמו ${EN('go → went')}.`, data: { k: 'en-past', v } });
}
// השוואה: [תואר, משפט "יותר", משפט "הכי"]
const syl = a => (a.replace(/e$/, '').match(/[aeiouy]+/g) || []).length; // e שקטה בסוף (nice) לא נספרת
function comp(a) {
  if (a === 'good') return 'better'; if (a === 'bad') return 'worse';
  if (/[^aeiou]y$/.test(a)) return a.slice(0, -1) + 'ier';
  if (syl(a) >= 2) return 'more ' + a;
  if (/e$/.test(a)) return a + 'r';
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(a)) return a + a.slice(-1) + 'er';
  return a + 'er';
}
function sup(a) {
  if (a === 'good') return 'best'; if (a === 'bad') return 'worst';
  const c = comp(a); return c.startsWith('more ') ? 'most ' + a : c.slice(0, -2) + 'est';
}
const COMP = [['tall', 'My brother is ___ than me.', 'Dan is the ___ boy in the class.'], ['big', 'An elephant is ___ than a dog.', 'The whale is the ___ animal in the sea.'],
  ['small', 'A mouse is ___ than a cat.', 'This is the ___ room in the house.'], ['fast', 'A car is ___ than a bike.', 'Noa is the ___ runner in the school.'],
  ['hot', 'Summer is ___ than winter.', 'August is the ___ month of the year.'], ['cold', 'Winter is ___ than summer.', 'January is the ___ month of the year.'],
  ['happy', 'Today I am ___ than yesterday.', 'She is the ___ girl in the world.'], ['easy', 'This test is ___ than the last test.', 'This is the ___ question in the test.'],
  ['heavy', 'A horse is ___ than a cat.', 'This is the ___ bag in the class.'], ['funny', 'This movie is ___ than that movie.', 'He is the ___ boy in the class.'],
  ['beautiful', 'This flower is ___ than that flower.', 'This is the ___ picture in the book.'], ['expensive', 'A car is ___ than a bike.', 'This is the ___ phone in the shop.'],
  ['interesting', 'This book is ___ than the movie.', 'It was the ___ trip of the year.'], ['good', 'My new phone is ___ than my old phone.', 'She is the ___ student in the class.'],
  ['bad', 'The weather today is ___ than yesterday.', 'This is the ___ day of my life!'], ['old', 'My grandfather is ___ than my father.', 'He is the ___ man in the town.'],
  ['long', 'A train is ___ than a bus.', 'The Nile is the ___ river in the world.'], ['strong', 'A lion is ___ than a cat.', 'He is the ___ man in the gym.'],
  ['nice', 'This room is ___ than my old room.', 'She is the ___ teacher in the school.']];
function compQ() {
  const [a, s1, s2] = pick(COMP), most = Math.random() < .45, ans = most ? sup(a) : comp(a), sent = (most ? s2 : s1).replace('___', `${BLANK} (${a})`);
  const wrong = most ? [comp(a), a + 'est', 'most ' + a, a] : [sup(a), a + 'er', 'more ' + a, a];
  return Q({ prompt: most ? 'השלימו: הכי…' : 'השלימו: יותר…', vis: big(sent), say: sayText(sent), opts: withOpts(ans, wrong), ans,
    ex: `${EN(`${a} → ${comp(a)} → ${sup(a)}`)}`,
    hint: `מילה קצרה: ${EN('er / est')} (${EN('tall → taller → tallest')}). מילה ארוכה: ${EN('more / most')}. ${EN('than')} ← יותר; ${EN('the')} ← הכי.`, data: { k: 'en-comp', a, most } });
}
// מילות שאלה: [שאלה, תשובה, מילת השאלה]
const WH = [['___ is your name?', 'My name is Noa.', 'What'], ['___ do you live?', 'I live in Haifa.', 'Where'], ['___ do you eat lunch?', 'At one o\'clock.', 'When'],
  ['___ is that girl?', 'She is my sister.', 'Who'], ['___ old are you?', 'I am ten.', 'How'], ['___ brothers do you have?', 'I have two brothers.', 'How many'],
  ['___ is your favorite color?', 'It is blue.', 'What'], ['___ is my bag?', 'It is under the table.', 'Where'], ['___ do you go to school?', 'At eight o\'clock.', 'When'],
  ['___ are you?', 'I am fine, thank you.', 'How'], ['___ is your teacher?', 'Mrs. Cohen.', 'Who'], ['___ are you sad?', 'Because my cat is sick.', 'Why'],
  ['___ is this?', 'It is a pencil.', 'What'], ['___ apples are on the table?', 'Five apples.', 'How many'], ['___ is the cat?', 'It is on the bed.', 'Where'],
  ['___ is the party?', 'On Friday.', 'When'], ['___ are you late?', 'Because I missed the bus.', 'Why'], ['___ can swim?', 'My brother can swim.', 'Who']];
const WH_HE = { What: 'מה', Where: 'איפה', When: 'מתי', Who: 'מי', Why: 'למה', How: 'איך', 'How many': 'כמה' };
function whQ() {
  const i = rnd(0, WH.length - 1), [q, a, ans] = WH[i], shown = q.replace('___', BLANK);
  return Q({ prompt: 'איזו מילת שאלה חסרה? (התשובה עוזרת!)', vis: stack(big(shown), big(`— ${a}`)), say: sayText(`${shown} ${a}`),
    opts: withOpts(ans, Object.keys(WH_HE)), ans,
    ex: `${EN(`${q.replace('___', ans)} ${a}`)} ${EN(ans)} = ${WH_HE[ans]}.`,
    hint: `${Object.entries(WH_HE).map(([e, h]) => `${EN(e)} = ${h}`).join(', ')}`, data: { k: 'en-wh', i } });
}
// הפכים
const OPP = [['big', 'small'], ['hot', 'cold'], ['happy', 'sad'], ['tall', 'short'], ['fast', 'slow'], ['good', 'bad'], ['clean', 'dirty'], ['full', 'empty'],
  ['rich', 'poor'], ['strong', 'weak'], ['early', 'late'], ['wet', 'dry'], ['open', 'closed'], ['easy', 'hard']];
const heAdj = en => W.find(w => w.en === en && w.cat === 'adj').he;
function oppQ() {
  const pair = pick(OPP), [w, ans] = Math.random() < .5 ? pair : [pair[1], pair[0]];
  const pool = OPP.flat().filter(x => x !== w && x !== ans);
  return Q({ prompt: `מה ההפך של ${EN(w)}?`, vis: big(w), say: w, opts: withOpts(ans, pool), ans,
    ex: `${EN(`${w} ↔ ${ans}`)} (${heAdj(w)} ↔ ${heAdj(ans)})`, hint: `קודם תרגמו את ${EN(w)} לעברית, ואז חשבו על ההפך.`, data: { k: 'en-opp', w } });
}

/* ===== נושאים לפי כיתה ===== */
// there is / there are: סופרים את התמונות
const countable = lv => words(x => x.e && ['animal', 'food', 'thing'].includes(x.cat) && !NONCOUNT.has(x.en) && !['fish', 'sun', 'moon'].includes(x.en), lv);
function thereQ() {
  const w = pick(countable(2)), n = Math.random() < .4 ? 1 : rnd(2, 5);
  const thing = n === 1 ? `${/^[aeiou]/.test(w.en) ? 'an' : 'a'} ${w.en}` : `${numWord(n)} ${plural(w.en)}`, ans = n === 1 ? 'is' : 'are';
  const sent = `There ${BLANK} ${thing} in the picture.`;
  return Q({ prompt: `בחרו: ${EN('is')} או ${EN('are')}`, vis: stack(pic(w.e.repeat(n)), big(sent)), say: sayText(sent), opts: ['is', 'are'], ans,
    ex: `${EN(`There ${ans} ${thing}.`)} ${n === 1 ? 'דבר אחד' : 'כמה דברים'} ← ${EN(`there ${ans}`)}.`,
    hint: `דבר אחד ← ${EN('there is')}. שניים או יותר ← ${EN('there are')}.`, data: { k: 'en-there', n } });
}
// can / can't: מה בעל החיים יכול לעשות
const CAN = [['A fish', 'swim', 1], ['A fish', 'walk', 0], ['A bird', 'fly', 1], ['A dog', 'fly', 0], ['A dog', 'run', 1], ['A cat', 'climb trees', 1],
  ['A snake', 'walk', 0], ['An elephant', 'fly', 0], ['A monkey', 'climb trees', 1], ['A frog', 'jump', 1], ['A cow', 'read', 0], ['A baby', 'drive a car', 0],
  ['A horse', 'run fast', 1], ['A duck', 'swim', 1], ['A penguin', 'fly', 0], ['A penguin', 'swim', 1], ['A turtle', 'run fast', 0], ['A parrot', 'talk', 1],
  ['A rabbit', 'jump', 1], ['A whale', 'walk', 0], ['A bee', 'fly', 1], ['A pig', 'fly', 0], ['A giraffe', 'eat leaves from tall trees', 1], ['A cat', 'sing a song', 0]];
function canQ() {
  const i = rnd(0, CAN.length - 1), [s, v, yes] = CAN[i], ans = yes ? 'can' : "can't", sent = `${s} ${BLANK} ${v}.`;
  return Q({ prompt: `בחרו: ${EN('can')} או ${EN("can't")}`, vis: big(sent), say: sayText(sent), opts: ['can', "can't"], ans,
    ex: `${EN(`${s} ${ans} ${v}.`)} ${EN('can')} = יכול, ${EN("can't")} = לא יכול.`, hint: `${EN('can')} = יכול. ${EN("can't")} = לא יכול. דמיינו את בעל החיים: הוא באמת יכול?`, data: { k: 'en-can', i } });
}
// in / on / under / next to: כדור וקופסה בציור. הקופסה: x 70–150, y 50–110
const WHERE = { in: [110, 85], on: [110, 34], under: [110, 128], 'next to': [170, 94] };
const WHERE_HE = { in: 'בתוך', on: 'על', under: 'מתחת ל־', 'next to': 'ליד' };
function whereQ() {
  const ans = pick(Object.keys(WHERE)), [cx, cy] = WHERE[ans];
  const svg = `<svg viewBox="0 0 220 150" width="220" height="150" role="img" aria-label="ball and box"><circle cx="${cx}" cy="${cy}" r="15" style="fill:var(--tc);stroke:var(--ink);stroke-width:3"/>`
    + `<rect class="shape" x="70" y="50" width="80" height="60" style="fill:${ans === 'in' ? 'none' : 'var(--shape-fill)'}"/></svg>`;
  return Q({ prompt: 'איפה הכדור? השלימו את המשפט', vis: stack(svg, big(`The ball is ${BLANK} the box.`)), opts: Object.keys(WHERE), ans,
    ex: `${EN(`The ball is ${ans} the box.`)} ${EN(ans)} = ${WHERE_HE[ans]}.`, hint: `${EN('in')} = בתוך, ${EN('on')} = על, ${EN('under')} = מתחת, ${EN('next to')} = ליד.`, data: { k: 'en-where' } });
}
// my / your / his / her / our / their
const POSS = [['I', 'my'], ['You', 'your'], ['He', 'his'], ['She', 'her'], ['We', 'our'], ['They', 'their'], ['Dan', 'his'], ['Noa', 'her'],
  ['Dan and Maya', 'their'], ['My sister', 'her'], ['My brother', 'his']];
function possQ() {
  const [s, ans] = pick(POSS), w = pick(countable(2)), adj = pick(['big', 'small', 'new', 'old', 'nice']);
  const has = ['He', 'She', 'Dan', 'Noa', 'My sister', 'My brother'].includes(s) ? 'has' : 'have';
  const sent = `${s} ${has} ${/^[aeiou]/.test(w.en) ? 'an' : 'a'} ${w.en}. ${BLANK} ${w.en} is ${adj}.`;
  return Q({ prompt: 'של מי? השלימו', vis: stack(pic(w.e), big(sent)), say: sayText(sent), opts: withOpts(ans, POSS.map(p => p[1])), ans,
    ex: `${EN(`${s} → ${ans}`)}: ${EN(`${ans[0].toUpperCase() + ans.slice(1)} ${w.en} is ${adj}.`)}`,
    hint: `${EN('I → my, you → your, he → his, she → her, we → our, they → their')}`, data: { k: 'en-poss', s } });
}
// this / that / these / those
function demQ() {
  const w = pick(countable(2)), near = Math.random() < .5, pl = Math.random() < .5, ans = near ? (pl ? 'These' : 'This') : (pl ? 'Those' : 'That');
  const sent = `${BLANK} ${pl ? plural(w.en) : w.en} ${near ? 'here' : 'over there'} ${pl ? 'are' : 'is'} mine.`;
  return Q({ prompt: 'השלימו את המשפט', vis: stack(pic(w.e.repeat(pl ? 3 : 1)), big(sent)), say: sayText(sent), opts: ['This', 'That', 'These', 'Those'], ans,
    ex: `${EN(sent.replace(BLANK, ans))} ${near ? 'קרוב' : 'רחוק'} ו${pl ? 'הרבה' : 'אחד'} ← ${EN(ans)}.`,
    hint: `קרוב: ${EN('this')} (אחד), ${EN('these')} (הרבה). רחוק: ${EN('that')} (אחד), ${EN('those')} (הרבה).`, data: { k: 'en-dem' } });
}
// הבנת הנקרא: קטע קצר ושאלות
const READ = [
  ['Dan has a dog. The dog is brown and small. Its name is Max. Every morning Dan and Max go to the park.',
    [['What is the dog\'s name?', 'Max', ['Dan', 'Rex', 'Tom']], ['What color is the dog?', 'brown', ['black', 'white', 'gray']], ['Where do they go every morning?', 'to the park', ['to school', 'to the beach', 'to the zoo']]]],
  ['Noa is ten years old. She lives in Haifa with her mother and two brothers. She likes to swim and to read books.',
    [['How old is Noa?', 'ten', ['nine', 'eleven', 'twelve']], ['Where does Noa live?', 'in Haifa', ['in Eilat', 'in a big school', 'in the park']], ['How many brothers does Noa have?', 'two', ['one', 'three', 'four']]]],
  ['It is a cold winter day. It is raining. Tom wears a coat and boots. He takes an umbrella and walks to school.',
    [['What is the weather?', 'cold and rainy', ['hot and sunny', 'warm', 'windy and hot']], ['What does Tom take?', 'an umbrella', ['a ball', 'a book', 'a hat']], ['Where does Tom walk?', 'to school', ['to the beach', 'to the park', 'home']]]],
  ['Maya has a birthday party on Friday. Her friends come to her house. They eat cake and play games. Maya gets a red bike.',
    [['When is the party?', 'on Friday', ['on Monday', 'on Sunday', 'on Tuesday']], ['What do they eat?', 'cake', ['pizza', 'salad', 'eggs']], ['What does Maya get?', 'a red bike', ['a blue bike', 'a red ball', 'a cat']]]],
  ['The zoo is big. There are lions, monkeys and elephants. The monkeys eat bananas. The elephant is very tall and gray.',
    [['What do the monkeys eat?', 'bananas', ['apples', 'carrots', 'cake']], ['What color is the elephant?', 'gray', ['brown', 'white', 'black']], ['Is the zoo small?', 'No, it is big.', ['Yes, it is small.', 'Yes, it is.', 'No, it is small.']]]],
  ['Ben gets up at seven. He eats eggs and drinks milk. Then he rides his bike to school. School starts at eight.',
    [['When does Ben get up?', 'at seven', ['at eight', 'at six', 'at nine']], ['What does Ben drink?', 'milk', ['juice', 'tea', 'water']], ['How does Ben go to school?', 'by bike', ['by bus', 'by car', 'on foot']]]]];
function readQ() {
  const p = rnd(0, READ.length - 1), qi = rnd(0, 2), [text, qs] = READ[p], [qq, ans, wrong] = qs[qi];
  return Q({ prompt: `קראו וענו: ${EN(qq)}`, vis: big(text), say: text, opts: [ans, ...wrong], ans,
    ex: `${EN(qq)} ← ${EN(ans)}.`, hint: 'חפשו בקטע את המילים מהשאלה, והתשובה תהיה קרוב אליהן.', data: { k: 'en-read', p, qi } });
}

// חרוזים: מילים שנגמרות באותו צליל
const RHYME = [['cat', 'hat', 'bat', 'mat', 'rat'], ['dog', 'frog', 'log'], ['sun', 'run', 'fun', 'bun'], ['pig', 'big', 'dig', 'wig'], ['ten', 'hen', 'pen'],
  ['cake', 'lake', 'snake', 'make'], ['bee', 'tree', 'see', 'three'], ['box', 'fox'], ['bed', 'red'], ['car', 'star', 'jar'], ['ball', 'tall', 'wall'], ['cup', 'pup']];
function rhymeQ() {
  const g = pick(RHYME), [w, ans] = shuffle(g), wrong = shuffle(RHYME.filter(x => x !== g).flat()).slice(0, 3);
  return Q({ prompt: `איזו מילה מתחרזת עם ${EN(w)}?`, vis: big(w), say: w, opts: [ans, ...wrong], ans,
    ex: `${EN(`${w} – ${ans}`)}: שתיהן נגמרות באותו צליל.`, hint: 'אמרו את המילים בקול. מילים מתחרזות נשמעות אותו דבר בסוף.', data: { k: 'en-rhyme', w } });
}
// have got / has got
function haveGotQ() {
  const [s, t] = pick(SUBJ), w = pick(countable(2)), thing = `${/^[aeiou]/.test(w.en) ? 'an' : 'a'} ${w.en}`, ans = t === 's' ? 'has got' : 'have got';
  const sent = `${s} ${BLANK} ${thing}.`;
  return Q({ prompt: `בחרו: ${EN('have got')} או ${EN('has got')}`, vis: stack(pic(w.e), big(sent)), say: sayText(sent), opts: ['have got', 'has got'], ans,
    ex: `${EN(`${s} ${ans} ${thing}.`)}`, hint: `${EN('he, she, it')} ואדם אחד ← ${EN('has got')}. ${EN('I, you, we, they')} ← ${EN('have got')}.`, data: { k: 'en-havegot', s } });
}

const EARLY = [
  { id: 'e-abc1', name: 'אותיות', sym: 'Aa', c: 'num', desc: 'אות גדולה ואות קטנה', gens: [() => caseQ(true), () => caseQ(false)] },
  { id: 'e-hear', name: 'שומעים ובוחרים', sym: '🔊', c: 'geo', desc: 'מקשיבים למילה ובוחרים תמונה', gens: [() => wordToPicQ(1)] },
  { id: 'e-num1', name: 'מספרים עד 10', sym: '123', c: 'eq', desc: 'שומעים מספר באנגלית ובוחרים', gens: [() => numQ(1, 10, 'digit')] }];
const G3 = [
  { id: 'e-abc3', name: 'ה־ABC', sym: 'Aa', c: 'num', desc: 'אות גדולה וקטנה, סדר האותיות', gens: [() => caseQ(true), () => caseQ(false), abcSeqQ] },
  { id: 'e-first', name: 'האות הראשונה', sym: 'B?', c: 'ops', desc: 'באיזו אות מתחילה המילה', gens: [() => firstLetterQ(1)] },
  { id: 'e-pic3', name: 'מילים ותמונות', sym: '🐶', c: 'geo', desc: 'חיות, אוכל, חפצים וצבעים', gens: [() => picToWordQ(1), () => wordToPicQ(2)] },
  { id: 'e-rhyme', name: 'חרוזים', sym: '♪', c: 'word', desc: EN('cat – hat, sun – run'), gens: [rhymeQ] },
  { id: 'e-num3', name: 'מספרים עד 20', sym: '123', c: 'eq', desc: 'קוראים וכותבים מספרים באנגלית', gens: [() => numQ(1, 20, 'word'), () => numQ(1, 20, 'digit')] }];
const G4 = [
  { id: 'e-spell', name: 'איות', sym: 'c_t', c: 'ops', desc: 'משלימים את האות החסרה', gens: [() => spellQ(2)] },
  { id: 'e-tr4', name: 'אוצר מילים', sym: '⇄', c: 'geo', desc: 'תרגום מאנגלית לעברית ובחזרה', gens: [() => translateQ(1, 2), () => picToWordQ(2)] },
  { id: 'e-plural', name: 'יחיד ורבים', sym: 's', c: 'div', desc: `${EN('cat → cats')}, ${EN('box → boxes')}, ${EN('mouse → mice')}`, gens: [pluralQ] },
  { id: 'e-gram4', name: EN('a / an, am / is / are'), sym: 'is', c: 'eq', desc: 'מילים קטנות שבונות משפט', gens: [aanQ, beQ] },
  { id: 'e-there', name: EN('there is / are, can'), sym: 'can', c: 'meas', desc: `${EN('There are three cats')}, ${EN("A fish can't walk")}`, gens: [thereQ, canQ] },
  { id: 'e-where', name: 'איפה?', sym: 'in', c: 'word', desc: EN('in, on, under, next to'), gens: [whereQ] }];
const G5 = [
  { id: 'e-tr5', name: 'אוצר מילים', sym: '⇄', c: 'geo', desc: 'פעלים, תארים, משפחה ועוד', gens: [() => translateQ(2, 3)] },
  { id: 'e-opp', name: 'הפכים', sym: '↔', c: 'word', desc: `${EN('big ↔ small')}, ${EN('hot ↔ cold')}`, gens: [oppQ] },
  { id: 'e-pres', name: EN('Present Simple'), sym: 's', c: 'div', desc: EN('she plays, he has, they go'), gens: [presentQ, beQ, haveGotQ] },
  { id: 'e-poss', name: EN('my / his / her, this / that'), sym: 'my', c: 'ops', desc: `${EN('her bag')}, ${EN('these books')}`, gens: [possQ, demQ] },
  { id: 'e-read5', name: 'הבנת הנקרא', sym: '📖', c: 'num', desc: 'קוראים קטע קצר ועונים', gens: [readQ] },
  { id: 'e-cal', name: 'ימים, חודשים ומספרים', sym: '📅', c: 'meas', desc: 'סדר הימים והחודשים, מספרים עד 100', gens: [orderQ, () => numQ(21, 99, 'word'), () => numQ(21, 99, 'digit')] }];
const G6 = [
  { id: 'e-tr6', name: 'אוצר מילים', sym: '⇄', c: 'geo', desc: 'פעלים ותארים', gens: [() => translateQ(3, 3)] },
  { id: 'e-past', name: EN('Past Simple'), sym: 'ed', c: 'div', desc: EN('played, went, ate'), gens: [pastQ] },
  { id: 'e-prog', name: EN('Present Progressive'), sym: 'ing', c: 'ops', desc: EN('Look! She is dancing'), gens: [progQ, presentQ] },
  { id: 'e-comp', name: 'השוואה', sym: 'er', c: 'eq', desc: EN('bigger, the biggest, more beautiful'), gens: [compQ] },
  { id: 'e-read6', name: 'הבנת הנקרא ודקדוק', sym: '📖', c: 'num', desc: `קטעי קריאה, ${EN('my / his')}, ${EN('this / those')}`, gens: [readQ, possQ, demQ] },
  { id: 'e-wh', name: 'מילות שאלה', sym: '?', c: 'word', desc: EN('What, Where, When, Who, Why, How'), gens: [whQ] }];

const GRADES = {
  1: { name: "כיתה א'", topics: EARLY }, 2: { name: "כיתה ב'", topics: EARLY }, 3: { name: "כיתה ג'", topics: G3 },
  4: { name: "כיתה ד'", topics: G4 }, 5: { name: "כיתה ה'", topics: G5 }, 6: { name: "כיתה ו'", topics: G6 } };
const NOTE = { 1: 'חשיפה ראשונה לאנגלית: מקשיבים ובוחרים', 2: 'חשיפה ראשונה לאנגלית: מקשיבים ובוחרים', 3: 'לפי תוכנית הלימודים באנגלית',
  4: 'לפי תוכנית הלימודים באנגלית', 5: 'לפי תוכנית הלימודים באנגלית', 6: 'לפי תוכנית הלימודים באנגלית' };

function generate(grade, topicId) {
  const T = GRADES[grade].topics.find(t => t.id === topicId); if (!T) throw new Error('no topic ' + topicId);
  const q = pick(T.gens)(); q.grade = grade; q.topic = topicId; return q;
}
function makeRound(grade, topicIds, n = 10) {
  const ids = topicIds.length === 1 ? Array(n).fill(topicIds[0]) : shuffle([...Array(n)].map((_, i) => topicIds[i % topicIds.length]));
  const seen = new Set(), out = [];
  for (const id of ids) { let q, k = 0; do { q = generate(grade, id); k++; } while (seen.has(q.prompt + q.vis + q.ans) && k < 30); seen.add(q.prompt + q.vis + q.ans); out.push(q); }
  return out;
}

const API = { GRADES, NOTE, generate, makeRound, WORDS: W, OPP, WH, CAN, READ };
root.ENGLISH = API;
if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
