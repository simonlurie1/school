/* משבצת — בודק שאלות אוטומטי
 * מייצר הרבה שאלות מכל נושא בכל כיתה, ובודק:
 *   1. כללים לכל שאלה: תשובה תקינה, התשובה בין האפשרויות, אין "undefined"/"NaN" בטקסט, התשובה נכנסת במקלדת.
 *   2. חישוב מחדש: לפי השדה data, מחשב את התשובה בדרך עצמאית ומשווה.
 * הרצה:  node tests/verify.js [מספר שאלות לכל נושא, ברירת מחדל 2000]
 */
'use strict';
const M = require('../math.js');
const PER_TOPIC = +process.argv[2] || 2000;
const MAX_KEYPAD_DIGITS = 7;

/* ---------- כלים ---------- */
const close = (a, b) => Math.abs(a - b) < 1e-6;
const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
const pad2 = n => String(n).padStart(2, '0');
const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const fromMin = t => `${Math.floor(t / 60) % 24}:${pad2(t % 60)}`;
// ביטוי חשבוני פשוט בלבד: ספרות, נקודה, רווחים, + - * / ( ), ו־Math.floor/ceil/round
function calc(expr) {
  const e = String(expr).replace(/×/g, '*').replace(/−/g, '-').replace(/:/g, '/').replace(/,/g, '');
  if (!/^[\d.\s+\-*/()]+$/.test(e.replace(/Math\.(floor|ceil|round)/g, ''))) throw new Error('unsafe expression: ' + expr);
  return Function(`"use strict";return (${e})`)();
}
// "3/5", "1 1/2", "4" → מספר
function fracVal(s) {
  s = String(s).trim();
  let m = s.match(/^(\d+) (\d+)\/(\d+)$/); if (m) return +m[1] + m[2] / m[3];
  m = s.match(/^(\d+)\/(\d+)$/); if (m) return m[1] / m[2];
  return +s;
}
const sign = (a, b) => close(a, b) ? '=' : a > b ? '>' : '<';
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
// הזווית הגדולה במשולש, במעלות
function maxAngle(P) {
  return Math.max(...[0, 1, 2].map(i => {
    const v = P[i], a = P[(i + 1) % 3], b = P[(i + 2) % 3];
    const u1 = [a[0] - v[0], a[1] - v[1]], u2 = [b[0] - v[0], b[1] - v[1]];
    return Math.acos((u1[0] * u2[0] + u1[1] * u2[1]) / (Math.hypot(...u1) * Math.hypot(...u2))) * 180 / Math.PI;
  }));
}
const GEM = { א: 1, ב: 2, ג: 3, ד: 4, ה: 5, ו: 6, ז: 7, ח: 8, ט: 9, י: 10, כ: 20, ל: 30, מ: 40, נ: 50, ס: 60, ע: 70, פ: 80, צ: 90, ק: 100, ר: 200, ש: 300, ת: 400 };
const POLY = { 3: 'משולש', 4: 'מרובע', 5: 'מחומש', 6: 'משושה', 8: 'מתומן' };

/* ---------- חישוב מחדש לפי סוג השאלה ----------
 * כל פונקציה מחזירה את התשובה הצפויה, או undefined אם אין לה מספיק מידע. */
const RECOMPUTE = {
  expr: d => calc(d.e),
  eqn: (d, q) => close(calc(d.l.replace('?', `(${q.ans})`)), calc(d.r)) ? q.ans : `no: ${d.l}=${d.r}`,
  poly: (d, q) => d.ask === 'name' ? POLY[d.n] : (typeof q.ans === 'number' ? d.n : undefined),
  clock: d => `${d.h}:${pad2(d.m)}`,
  chart: d => {
    const v = d.vals;
    if (d.q === 'val') return v[d.i];
    if (d.q === 'sum') return v.reduce((a, b) => a + b, 0);
    if (d.q === 'max') return d.cats[v.indexOf(Math.max(...v))];
    if (d.q === 'min') return d.cats[v.indexOf(Math.min(...v))];
    if (d.q === 'diff' && d.j != null) return Math.abs(v[d.i] - v[d.j]);
  },
  parity: d => d.n % 2 ? 'אי־זוגי' : 'זוגי',
  right: d => close(maxAngle(d.P), 90) ? 'כן' : 'לא',
  ruler: d => d.b - d.a,
  seq: d => {
    const t = d.terms, step = t[1] - t[0];
    return t.every((x, i) => i === 0 || x - t[i - 1] === step) ? t[d.mi] : 'not arithmetic';
  },
  rem: d => d.ask === 'r' ? d.n % d.a : Math.floor(d.n / d.a),
  digval: d => {
    const s = String(d.n), idx = s.indexOf(String(d.d));
    if (idx < 0 || s.lastIndexOf(String(d.d)) !== idx) return 'digit missing or repeated';
    return d.d * 10 ** (s.length - 1 - idx);
  },
  expand: d => d.n * d.D / d.d,
  cmp: d => { const v = s => /^(\d+ )?\d+\/\d+$/.test(String(s).trim()) ? fracVal(s) : calc(s); return sign(v(d.l), v(d.r)); },
  mean: d => d.vals.reduce((a, b) => a + b, 0) / d.vals.length,
  fpart: d => d.tot / d.d * d.n,
  dur: d => { const m = toMin(d.e) - toMin(d.s); return d.unit === 'hr' ? m / 60 : m; },
  coins: d => d.list.reduce((a, b) => a + b, 0) / 100,
  tri: d => {
    if (d.by === 'sides') { const [a, b, c] = d.labels.map(Number); return a === b && b === c ? 'שווה־צלעות' : a === b || b === c || a === c ? 'שווה־שוקיים' : 'שונה־צלעות'; }
    const m = maxAngle(d.P); return close(m, 90) ? 'ישר־זווית' : m > 90 ? 'קהה־זווית' : 'חד־זווית';
  },
  gem: d => [...d.w].reduce((s, ch) => s + (GEM[ch] || NaN), 0),
  angle: d => d.deg < 90 ? 'חדה' : d.deg === 90 ? 'ישרה' : d.deg < 180 ? 'קהה' : undefined,
  fcmp: d => sign(d.a[0] / d.a[1], d.b[0] / d.b[1]),
  endtime: d => fromMin(toMin(d.s) + d.d),
  mixed: d => d.w * d.d + d.n,
  f2d: d => d.n / d.d,
  fop: (d, q) => {
    const a = d.a[0] / d.a[1], b = d.b[0] / d.b[1];
    const v = { '+': a + b, '-': a - b, '*': a * b, ':': a / b, '/': a / b }[d.op];
    return v === undefined ? undefined : close(fracVal(q.ans), v) ? q.ans : `value ${v}`;
  },
  rect: d => d.ask === 'area' ? d.a * d.b : d.ask === 'per' || d.ask === 'perim' ? 2 * (d.a + d.b) : undefined,
  area: d => d.shape === 'tri' ? d.b * d.h / 2 : d.shape === 'rect' || d.shape === 'para' ? d.b * d.h : undefined,
  prob: (d, q) => close(fracVal(q.ans), d.fav / d.tot) ? q.ans : `value ${d.fav}/${d.tot}`,
  digit: d => Math.floor(d.n / 10 ** d.p) % 10,
  decdig: d => +d.s.split('.')[1][d.p - 1],
  circle: d => Math.round((d.ask === 'C' ? 2 * 3.14 * d.r : 3.14 * d.r * d.r) * 1000) / 1000,
  simplify: d => { const g = gcd(d.n, d.d); return d.d / g === 1 ? String(d.n / g) : `${d.n / g}/${d.d / g}`; },
  ineqMax: d => { let x = 0; while (calc(d.e.replace('?', `(${x + 1})`)) < d.lt) x++; return x; },
  fwhole: d => d.part / d.n * d.d,
  digits: d => {
    const perms = [], go = (cur, rest) => { if (!rest.length) { if (cur[0] !== 0) perms.push(+cur.join('')); return; } rest.forEach((x, i) => go([...cur, x], rest.filter((_, j) => j !== i))); };
    go([], d.ds);
    const pool = d.type.includes('אי־זוגי') ? perms.filter(x => x % 2) : d.type.includes('זוגי') ? perms.filter(x => x % 2 === 0) : perms;
    return d.type.includes('גדול') ? Math.max(...pool) : Math.min(...pool);
  },
  round: d => Math.round(d.n / d.to) * d.to,
  lines: d => ({ par: 'מקבילים', perp: 'מאונכים', cross: 'נחתכים (לא מאונכים)' })[d.kind],
  // מהציור עצמו: סופרים את העיגולים / מודדים את המלבן הצבוע (משבצת = 18 פיקסלים)
  count: (d, q) => (q.vis.match(/class="cnt"/g) || []).length,
  grid: (d, q) => {
    const [, w, h] = q.vis.match(/class="accline"[^>]*width="(\d+)" height="(\d+)"/).map(Number), a = w / 18, b = h / 18;
    return d.ask === 'area' ? a * b : 2 * (a + b);
  },
  solid: d => ({ 'קובייה': [6, 12, 8], 'תיבה': [6, 12, 8], 'מנסרה משולשת': [5, 9, 6], 'פירמידה מרובעת': [5, 8, 5], 'פירמידה משולשת': [4, 6, 4] })[d.s][d.pi],
  h24: d => `${d.h - 12} אחר הצהריים`,
  ineqOpt: (d, q) => { const ok = q.opts.filter(o => calc(d.e.replace('?', `(${o})`)) > d.gt); return ok.length === 1 ? ok[0] : undefined; },
  quad: d => {
    // מסווגים לפי הקודקודים: צלעות מקבילות, זווית ישרה, צלעות שוות
    const v = d.P.map((p, i) => { const n = d.P[(i + 1) % 4]; return [n[0] - p[0], n[1] - p[1]]; });
    const len = v.map(([x, y]) => Math.hypot(x, y)), par = (a, b) => close(a[0] * b[1] - a[1] * b[0], 0);
    if (d.labels && d.labels.some((l, i) => !close(l, len[i]))) return `labels ${d.labels} but sides ${len.map(x => +x.toFixed(2))}`;
    const pairs = par(v[0], v[2]) + par(v[1], v[3]), right = close(v[0][0] * v[1][0] + v[0][1] * v[1][1], 0), eq = len.every(x => close(x, len[0]));
    if (pairs === 1) return 'טרפז';
    if (pairs !== 2) return 'not a quadrilateral with parallel sides';
    return right ? (eq ? 'ריבוע' : 'מלבן') : (eq ? 'מעוין' : 'מקבילית');
  }
};

/* ---------- כללים לכל שאלה ---------- */
const BAD_TEXT = /undefined|NaN|null|\[object/;
function generalProblems(q) {
  const p = [];
  if (q.t !== 'num' && q.t !== 'choice') p.push(`bad type ${q.t}`);
  for (const f of ['prompt', 'ex', 'hint']) {
    if (typeof q[f] !== 'string' || !q[f].trim()) p.push(`missing ${f}`);
    else if (BAD_TEXT.test(q[f])) p.push(`${f} contains ${q[f].match(BAD_TEXT)[0]}`);
  }
  if (q.vis && BAD_TEXT.test(q.vis)) p.push('visual contains ' + q.vis.match(BAD_TEXT)[0]);
  if (q.t === 'num') {
    if (typeof q.ans !== 'number' || !Number.isFinite(q.ans)) p.push(`num answer not a number: ${q.ans}`);
    else {
      if (q.ans < 0) p.push(`negative answer ${q.ans}`);
      if (!q.dec && !Number.isInteger(q.ans)) p.push(`non-integer answer ${q.ans} without decimal key`);
      if (String(q.ans).replace('.', '').length > MAX_KEYPAD_DIGITS) p.push(`answer ${q.ans} too long for keypad`);
    }
    if (q.vg) {
      const [a, b, op] = q.vg, want = op === '+' ? a + b : a - b;
      if (want !== q.ans) p.push(`column sheet ${a}${op}${b}=${want} but answer ${q.ans}`);
    }
  }
  if (q.t === 'choice') {
    if (!Array.isArray(q.opts) || q.opts.length < 2) p.push('fewer than 2 options');
    else {
      if (!q.opts.includes(q.ans)) p.push(`answer ${q.ans} not among options ${JSON.stringify(q.opts)}`);
      if (new Set(q.opts).size !== q.opts.length) p.push(`duplicate options ${JSON.stringify(q.opts)}`);
      if (q.opts.some(o => o === undefined || BAD_TEXT.test(String(o)))) p.push(`bad option ${JSON.stringify(q.opts)}`);
      if (q.data && q.data.k === 'ineqOpt') {
        const ok = q.opts.filter(o => calc(q.data.e.replace('?', `(${o})`)) > q.data.gt);
        if (ok.length !== 1) p.push(`${ok.length} options satisfy ${q.data.e} > ${q.data.gt}: ${JSON.stringify(q.opts)}`);
      }
    }
  }
  return p;
}

function recomputeProblem(q) {
  if (!q.data || !RECOMPUTE[q.data.k]) return null;
  let want;
  try { want = RECOMPUTE[q.data.k](q.data, q); } catch (e) { return `checker error: ${e.message}`; }
  if (want === undefined) return null;
  const same = typeof want === 'number' && typeof q.ans === 'number' ? close(want, q.ans) : String(want) === String(q.ans);
  return same ? null : `answer ${JSON.stringify(q.ans)} but expected ${JSON.stringify(want)}`;
}

/* ---------- הרצה ---------- */
const fails = new Map();   // מפתח: כיתה/נושא/בעיה → { count, sample }
const kinds = new Map();   // סוג → { total, recomputed }
let total = 0;
function note(key, q) {
  const f = fails.get(key) || { count: 0, sample: q };
  f.count++; fails.set(key, f);
}
for (const g of Object.keys(M.GRADES)) {
  const topics = M.GRADES[g].topics;
  for (const t of topics) {
    for (let i = 0; i < PER_TOPIC; i++) {
      let q;
      try { q = M.generate(+g, t.id); } catch (e) { note(`${g}/${t.id}: generator threw ${e.message}`, null); continue; }
      total++;
      const k = q.data ? q.data.k : '(no data)';
      const ks = kinds.get(k) || { total: 0, recomputed: 0 }; ks.total++;
      for (const p of generalProblems(q)) note(`${g}/${t.id}/${k}: ${p.replace(/[\d.]+/g, '#')}`, q);
      const r = recomputeProblem(q);
      if (q.data && RECOMPUTE[q.data.k]) ks.recomputed++;
      if (r) note(`${g}/${t.id}/${k}: ${r.startsWith('checker') ? r.replace(/[\d.]+/g, '#') : 'wrong answer'}`, q);
      kinds.set(k, ks);
    }
  }
  // סבב מעורב (מבחן לדוגמה) תמיד מחזיר 10 שאלות
  const round = M.makeRound(+g, topics.map(t => t.id), 10);
  if (round.length !== 10) note(`${g}/mix: round has ${round.length} questions`, null);
}

const unchecked = [...kinds].filter(([, v]) => v.recomputed === 0).map(([k]) => k);
console.log(`Checked ${total} questions across ${Object.keys(M.GRADES).length} grades.`);
console.log(`Answer recomputed independently for ${[...kinds.values()].reduce((a, v) => a + v.recomputed, 0)} of them.`);
if (unchecked.length) console.log(`Kinds checked by general rules only: ${unchecked.join(', ')}`);
if (!fails.size) { console.log('All good.'); process.exit(0); }
console.log(`\n${fails.size} problem types found:\n`);
for (const [key, f] of [...fails].sort((a, b) => b[1].count - a[1].count)) {
  console.log(`✗ ${key}  (${f.count}×)`);
  if (f.sample) console.log(`    e.g. ans=${JSON.stringify(f.sample.ans)} data=${JSON.stringify(f.sample.data)}${f.sample.opts ? ' opts=' + JSON.stringify(f.sample.opts) : ''}`);
}
process.exit(1);
