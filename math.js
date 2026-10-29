/* משבצת — מנוע שאלות במתמטיקה לכיתות א'–ו'
 * כל שאלה מחזירה: { t:'num'|'choice', prompt, vis, ans, opts?, dec?, ex, hint, vg?, help?, data }
 * data מתאר את השאלה כך שבודק עצמאי (verify.js) יכול לחשב את התשובה מחדש בדרך אחרת.
 * עובד בדפדפן (window.MATH) וב־Node (module.exports).
 */
(function (root) {
'use strict';

/* ===== תוכנית לימודים לפי שכבה (לעדכן פעם בשנה לפי חוזר המפמ"ר) ===== */
const SCHOOL_YEAR = 'תשפ"ז';
const PROGRAM = { 1: 'new', 2: 'new', 3: 'new', 4: '2006', 5: '2006', 6: '2006' };

/* ===== כלים ===== */
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
const pad2 = n => String(n).padStart(2, '0');
const tm = (h, m) => `${h}:${pad2(m)}`;
const r2 = x => Math.round(x * 1000) / 1000;
const fmt = n => typeof n === 'number' && Math.abs(n) >= 10000 && Number.isInteger(n) ? n.toLocaleString('en-US') : String(n);
const L = s => `<span class="ltr">${s}</span>`;
const N = n => L(fmt(n));
const BOX = '<span class="box">?</span>';
const eq = s => `<div class="eq ltr">${s}</div>`;
const fr = (n, d) => `<span class="frac"><span>${n}</span><span>${d}</span></span>`;
/* הצגת ביטוי JS לילדים: * → ×, / → :, - → −, ? → משבצת */
const E = e => e.replace(/\s+/g, '').replace(/\*/g, ' × ').replace(/\//g, ' : ').replace(/-/g, ' − ').replace(/\+/g, ' + ').replace(/\?/g, BOX);
const svg = (inner, w, h) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">${inner}</svg>`;
/* שברים כמחרוזת: "3/4", "1 1/2", "2" */
function fstr(n, d) { const g = gcd(n, d); n /= g; d /= g; if (n % d === 0) return String(n / d); if (n > d) return `${Math.floor(n / d)} ${n % d}/${d}`; return `${n}/${d}`; }
function fhtml(s) { s = String(s); const m = s.match(/^(?:(\d+) )?(\d+)\/(\d+)$/); if (!m) return L(s); return `<span class="ltr">${m[1] ? m[1] + ' ' : ''}${fr(m[2], m[3])}</span>`; }
const HEB_POS = ['אחדות', 'עשרות', 'מאות', 'אלפים', 'רבבות'];

/* ===== ציורים ===== */
function tenFrames(n) {
  const c = 26, gap = 14, frames = n > 10 ? 2 : 1; let s = '', placed = 0;
  for (let f = 0; f < frames; f++) {
    const x0 = 8 + f * (5 * c + gap);
    for (let i = 0; i < 10; i++) {
      const x = x0 + (i % 5) * c, y = 8 + Math.floor(i / 5) * c;
      s += `<rect x="${x}" y="${y}" width="${c}" height="${c}" class="tf"/>`;
      if (placed < n && i < (f === 0 ? Math.min(n, 10) : n - 10)) { s += `<circle class="cnt" cx="${x + c / 2}" cy="${y + c / 2}" r="${c * 0.34}"/>`; placed++; }
    }
  }
  return svg(s, 16 + frames * 5 * c + (frames - 1) * gap, 16 + 2 * c);
}
function polySvg(pts, opts = {}) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  const W = 280, H = 200, k = Math.min(210 / (maxx - minx || 1), 140 / (maxy - miny || 1));
  const Q = pts.map(([x, y]) => [+((x - minx) * k + (W - (maxx - minx) * k) / 2).toFixed(2), +((maxy - y) * k + (H - (maxy - miny) * k) / 2).toFixed(2)]);
  let s = `<polygon class="shape" points="${Q.map(p => p.join(',')).join(' ')}"/>`;
  const cx = Q.reduce((a, p) => a + p[0], 0) / Q.length, cy = Q.reduce((a, p) => a + p[1], 0) / Q.length;
  if (opts.labels) Q.forEach((p, i) => { const q = Q[(i + 1) % Q.length]; if (opts.labels[i] == null) return; let mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; const dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy) || 1; mx += dx / d * 18; my += dy / d * 18 + 5; s += `<text x="${mx.toFixed(1)}" y="${my.toFixed(1)}" text-anchor="middle">${opts.labels[i]}</text>`; });
  if (opts.right) Q.forEach((v, i) => {
    const a = pts[(i + 1) % pts.length], b = pts[(i + pts.length - 1) % pts.length], o = pts[i];
    const dot = (a[0] - o[0]) * (b[0] - o[0]) + (a[1] - o[1]) * (b[1] - o[1]);
    if (Math.abs(dot) > 1e-9) return;
    const A = Q[(i + 1) % Q.length], B = Q[(i + Q.length - 1) % Q.length];
    const u = p => { const d = Math.hypot(p[0] - v[0], p[1] - v[1]); return [(p[0] - v[0]) / d * 14, (p[1] - v[1]) / d * 14]; };
    const ua = u(A), ub = u(B);
    s += `<path class="mark" d="M${v[0] + ua[0]} ${v[1] + ua[1]} L${v[0] + ua[0] + ub[0]} ${v[1] + ua[1] + ub[1]} L${v[0] + ub[0]} ${v[1] + ub[1]}"/>`;
  });
  if (opts.dots) Q.forEach(p => s += `<circle class="dot" cx="${p[0]}" cy="${p[1]}" r="4.5"/>`);
  return svg(s, W, H);
}
function regPoly(n) { const rot = Math.random() * Math.PI, pts = []; for (let i = 0; i < n; i++) { const t = rot + i * 2 * Math.PI / n; pts.push([+(Math.cos(t) * 10).toFixed(4), +(Math.sin(t) * 10).toFixed(4)]); } return pts; }
function triFromSides(a, b, c) { const x = (b * b + c * c - a * a) / (2 * c); return [[0, 0], [c, 0], [x, Math.sqrt(Math.max(0, b * b - x * x))]]; }
function angleSvg(deg) {
  const vx = deg >= 100 ? 150 : 70, vy = 145, r = 125, rad = deg * Math.PI / 180, ex = vx + r * Math.cos(rad), ey = vy - r * Math.sin(rad);
  let s = `<path class="ln" d="M${vx + 140} ${vy} L${vx} ${vy} L${ex.toFixed(1)} ${ey.toFixed(1)}"/>`;
  if (deg === 90) s += `<path class="mark" d="M${vx + 20} ${vy} V${vy - 20} H${vx}"/>`;
  else { const ar = 30; s += `<path class="mark" d="M${vx + ar} ${vy} A${ar} ${ar} 0 0 0 ${(vx + ar * Math.cos(rad)).toFixed(1)} ${(vy - ar * Math.sin(rad)).toFixed(1)}"/>`; }
  return svg(s + `<circle class="dot" cx="${vx}" cy="${vy}" r="5"/>`, 300, 165);
}
function linesSvg(kind, t0, t1) {
  const cx = 150, cy = 90;
  const seg = (t, ox, oy, len = 120) => `<path class="ln" d="M${(ox - len * Math.cos(t)).toFixed(1)} ${(oy - len * Math.sin(t)).toFixed(1)} L${(ox + len * Math.cos(t)).toFixed(1)} ${(oy + len * Math.sin(t)).toFixed(1)}"/>`;
  let s = '';
  if (kind === 'par') { const nx = -Math.sin(t0) * 32, ny = Math.cos(t0) * 32; s = seg(t0, cx - nx, cy - ny) + seg(t0, cx + nx, cy + ny); }
  else { s = seg(t0, cx, cy) + seg(t1, cx, cy, 80); if (kind === 'perp') { const u = [Math.cos(t0) * 14, Math.sin(t0) * 14], v = [Math.cos(t1) * 14, Math.sin(t1) * 14]; s += `<path class="mark" d="M${cx + u[0]} ${cy + u[1]} L${cx + u[0] + v[0]} ${cy + u[1] + v[1]} L${cx + v[0]} ${cy + v[1]}"/>`; } }
  return svg(s, 300, 180);
}
function gridSvg(w, h) {
  const c = 18, cols = Math.max(w + 4, 12), rows = h + 3, W = cols * c, H = rows * c; let s = '';
  for (let i = 0; i <= cols; i++) s += `<line class="gl" x1="${i * c}" y1="0" x2="${i * c}" y2="${H}"/>`;
  for (let j = 0; j <= rows; j++) s += `<line class="gl" x1="0" y1="${j * c}" x2="${W}" y2="${j * c}"/>`;
  const x0 = Math.floor((cols - w) / 2) * c;
  return svg(s + `<rect class="accline" x="${x0}" y="${2 * c}" width="${w * c}" height="${h * c}" data-w="${w}" data-h="${h}"/>`, W, H);
}
function rectSvg(a, b) {
  const k = Math.min(180 / a, 110 / b), W = a * k, H = b * k, x = (250 - W) / 2, y = (180 - H) / 2 + 6;
  let s = `<rect class="shape" x="${x}" y="${y}" width="${W}" height="${H}"/>`;
  const c = 12;[[x, y, 1, 1], [x + W, y, -1, 1], [x, y + H, 1, -1], [x + W, y + H, -1, -1]].forEach(([px, py, dx, dy]) => { s += `<path class="mark" d="M${px + dx * c} ${py} V${py + dy * c} H${px}"/>`; });
  s += `<text x="${x + W / 2}" y="${y - 10}" text-anchor="middle">${a} ס״מ</text>`;
  if (a !== b) s += `<text x="${x + W + 32}" y="${y + H / 2 + 5}" text-anchor="middle">${b} ס״מ</text>`;
  return svg(s, 300, 190);
}
function clockSvg(h, m) {
  const C = 100; let s = `<circle class="face" cx="${C}" cy="${C}" r="88"/>`;
  for (let i = 0; i < 60; i++) { const a = i * 6 * Math.PI / 180, r1 = i % 5 ? 82 : 76; s += `<line class="thin" x1="${(C + r1 * Math.sin(a)).toFixed(1)}" y1="${(C - r1 * Math.cos(a)).toFixed(1)}" x2="${(C + 86 * Math.sin(a)).toFixed(1)}" y2="${(C - 86 * Math.cos(a)).toFixed(1)}" style="stroke-width:${i % 5 ? 1 : 2.5}"/>`; }
  for (let n = 1; n <= 12; n++) { const a = n * 30 * Math.PI / 180; s += `<text x="${(C + 62 * Math.sin(a)).toFixed(1)}" y="${(C - 62 * Math.cos(a) + 6).toFixed(1)}" text-anchor="middle">${n}</text>`; }
  const ha = ((h % 12) + m / 60) * 30 * Math.PI / 180, ma = m * 6 * Math.PI / 180;
  s += `<line class="ln hand-h" style="stroke-width:7" x1="${C}" y1="${C}" x2="${(C + 42 * Math.sin(ha)).toFixed(2)}" y2="${(C - 42 * Math.cos(ha)).toFixed(2)}"/>`;
  s += `<line class="ln hand-m" style="stroke:var(--tc);stroke-width:4" x1="${C}" y1="${C}" x2="${(C + 70 * Math.sin(ma)).toFixed(2)}" y2="${(C - 70 * Math.cos(ma)).toFixed(2)}"/>`;
  return svg(s + `<circle class="dot" cx="${C}" cy="${C}" r="6"/>`, 200, 200);
}
function rulerSvg(a, b, what) {
  const u = 22, x0 = 18, W = x0 * 2 + 12 * u; let s = `<rect class="ruler" x="${x0 - 10}" y="78" width="${12 * u + 20}" height="46" rx="4"/>`;
  for (let i = 0; i <= 24; i++) { const x = x0 + i * u / 2, len = i % 2 ? 9 : 16; s += `<line class="thin" x1="${x}" y1="78" x2="${x}" y2="${78 + len}"/>`; if (i % 2 === 0) s += `<text class="sm" x="${x}" y="114" text-anchor="middle">${i / 2}</text>`; }
  const xa = x0 + a * u, xb = x0 + b * u;
  if (what === 'pencil') s += `<rect class="acc" x="${xa}" y="38" width="${xb - xa - 14}" height="18" rx="3"/><path class="acc" d="M${xb - 14} 38 L${xb} 47 L${xb - 14} 56 Z" style="opacity:.75"/>`;
  else s += `<rect class="acc" x="${xa}" y="40" width="${xb - xa}" height="14" rx="7"/>`;
  s += `<line class="guide" x1="${xa}" y1="30" x2="${xa}" y2="78"/><line class="guide" x1="${xb}" y1="30" x2="${xb}" y2="78"/>`;
  return svg(s, W, 135);
}
function chartSvg(cats, vals, step) {
  const W = 300, H = 230, x0 = 44, x1 = 290, y0 = 185, y1 = 20, max = step * 6, sy = (y0 - y1) / max; let s = '';
  for (let v = 0; v <= max; v += step) { const y = y0 - v * sy; s += `<line class="gl" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/><text class="sm" x="${x0 - 18}" y="${y + 5}" text-anchor="middle">${v}</text>`; }
  const bw = (x1 - x0) / cats.length;
  cats.forEach((c, i) => { const h = vals[i] * sy, x = x0 + i * bw + bw * .2; s += `<rect class="acc" x="${x}" y="${y0 - h}" width="${bw * .6}" height="${h}" rx="3"/><text class="sm" x="${x + bw * .3}" y="${y0 + 20}" text-anchor="middle">${c}</text>`; });
  s += `<line class="thin" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" style="stroke-width:2"/><line class="thin" x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1 - 6}" style="stroke-width:2"/>`;
  return svg(s, W, H);
}
const COIN = { 10: '10 אג׳', 50: '50 אג׳', 100: '1 ₪', 200: '2 ₪', 500: '5 ₪', 1000: '10 ₪' };
function coinsSvg(list) {
  let s = '', x = 34;
  list.forEach(v => { const r = v >= 1000 ? 30 : v >= 500 ? 28 : v >= 200 ? 26 : v >= 100 ? 24 : 20; s += `<g class="coin" data-v="${v}"><circle class="coinc" cx="${x}" cy="40" r="${r}"/><text class="sm" x="${x}" y="45" text-anchor="middle">${COIN[v]}</text></g>`; x += 2 * r + 10; });
  return svg(s, x, 80);
}
function circleSvg(r, showD) {
  let s = `<circle class="shape" cx="110" cy="100" r="80"/><circle class="dot" cx="110" cy="100" r="4"/>`;
  if (showD) s += `<line class="ln" style="stroke:var(--tc)" x1="30" y1="100" x2="190" y2="100"/><text x="110" y="90" text-anchor="middle">${2 * r} ס״מ</text>`;
  else s += `<line class="ln" style="stroke:var(--tc)" x1="110" y1="100" x2="190" y2="100"/><text x="150" y="90" text-anchor="middle">${r} ס״מ</text>`;
  return svg(s, 220, 200);
}
function triBHSvg(b, h, off) {
  const k = Math.min(200 / Math.max(b, Math.abs(off) + 1, b - off), 120 / h), x0 = 40, y0 = 160;
  const A = [x0, y0], B = [x0 + b * k, y0], C = [x0 + off * k, y0 - h * k], F = [x0 + off * k, y0];
  let s = `<polygon class="shape" points="${[A, B, C].map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}"/>`;
  s += `<line class="guide" x1="${C[0].toFixed(1)}" y1="${C[1].toFixed(1)}" x2="${F[0].toFixed(1)}" y2="${F[1]}"/>`;
  s += `<text x="${((A[0] + B[0]) / 2).toFixed(1)}" y="${y0 + 22}" text-anchor="middle">${b} ס״מ</text><text x="${(C[0] + 10).toFixed(1)}" y="${((C[1] + y0) / 2).toFixed(1)}" text-anchor="start">${h} ס״מ</text>`;
  return svg(s, 300, 190);
}

/* ===== אוצר מילים לבעיות ===== */
const KIDS = ['דנה', 'יואב', 'נועה', 'אורי', 'מאיה', 'איתי', 'שירה', 'עומר', 'תמר', 'רון'];
const FEM = new Set(['דנה', 'נועה', 'מאיה', 'שירה', 'תמר']);
const v = (name, m, f) => FEM.has(name) ? f : m;

/* ===== בונים בסיסיים (משותפים לכמה כיתות) ===== */
function Q(o) { o.hint = o.hint || ''; o.ex = o.ex || ''; return o; }
function exprQ(e, prompt, hint, opts = {}) { // שאלה "כמה זה" עם משבצת
  const ans = +Function('return ' + e)().toFixed(6); // לא r2: חילוק ב־1000 צריך עד 5 ספרות אחרי הנקודה
  return Q({ t: 'num', prompt, vis: eq(`${E(e)} = ${BOX}`), ans, dec: !Number.isInteger(ans) || opts.dec, ex: `${E(e).replace(BOX, '?')} = ${ans}`, hint, data: { k: 'expr', e }, ...opts });
}
function missQ(l, r, prompt, hint, ans) { // משוואה עם משבצת במקום אחד
  return Q({ t: 'num', prompt: prompt || 'איזה מספר חסר?', vis: eq(`${E(l)} = ${E(r)}`), ans, ex: `${E(l).replace(BOX, ans)} = ${E(r).replace(BOX, ans)}`, hint, data: { k: 'eqn', l, r } });
}
function cmpQ(l, r, prompt, hint, ex) {
  const a = Function('return ' + l)(), b = Function('return ' + r)();
  const ans = a > b ? '>' : a < b ? '<' : '=';
  return Q({ t: 'choice', prompt: prompt || 'איזה סימן מתאים?', vis: eq(`${E(l)} ${BOX} ${E(r)}`), opts: ['<', '=', '>'], ans, ex: ex || `${E(l)} = ${r2(a)}, ${E(r)} = ${r2(b)}`, hint: hint || 'הפה של התנין פתוח לכיוון המספר הגדול.', data: { k: 'cmp', l, r } });
}
function vertQ(a, b, op) {
  return Q({ t: 'num', prompt: 'פתרו במאונך:', vis: '', vg: [a, b, op], ans: op === '+' ? a + b : a - b, ex: `${a} ${op} ${b} = ${op === '+' ? a + b : a - b}`,
    hint: op === '+' ? 'מתחילים מהאחדות (הכי ימינה). אם יוצא 10 או יותר, כותבים את האחדות למטה, ואת ה־1 במשבצת הקטנה של העמודה הבאה.' : 'מתחילים מהאחדות. אם הספרה למעלה קטנה מהספרה למטה, פורטים: לוקחים 1 מהעמודה שמשמאל.',
    data: { k: 'expr', e: `${a}${op === '+' ? '+' : '-'}${b}` } });
}
function wordQ(prompt, e, ex, hint, consts = [], help) {
  const ans = +Function('return ' + e)().toFixed(6); // לא r2: חילוק ב־1000 צריך עד 5 ספרות אחרי הנקודה
  return Q({ t: 'num', prompt, vis: '', ans, dec: !Number.isInteger(ans), ex, hint, help, data: { k: 'expr', e, word: true, consts } });
}
function seqQ(start, d, len, lo, hi) {
  const terms = [...Array(len)].map((_, i) => start + d * i);
  if (terms.some(t => t < lo || t > hi)) return null;
  const mi = rnd(1, len - 1);
  return Q({ t: 'num', prompt: 'איזה מספר חסר בסדרה?', vis: `<div class="seq">${terms.map((t, i) => i === mi ? '<span class="miss">?</span>' : `<span>${t}</span>`).join('')}</div>`,
    ans: terms[mi], ex: `בכל צעד ${d > 0 ? 'מוסיפים' : 'מורידים'} ${Math.abs(d)}. המספר החסר הוא ${terms[mi]}.`, hint: 'בדקו בכמה המספרים גדלים או קטנים מאחד לשני.', data: { k: 'seq', terms, mi } });
}
function retry(f) { for (let i = 0; i < 50; i++) { const q = f(); if (q) return q; } throw new Error('generator failed'); }

function clockQ(minStep) {
  const h = rnd(1, 12), m = minStep === 60 ? 0 : minStep === 30 ? pick([0, 30]) : rnd(0, 11) * 5, ans = tm(h, m);
  const cand = [tm(h % 12 + 1, m), tm(h === 1 ? 12 : h - 1, m)];
  if (minStep <= 30) cand.push(tm(h, (m + 30) % 60));
  if (minStep === 5) { cand.push(tm(m === 0 ? 12 : m / 5, (h * 5) % 60), tm(h, (m + 15) % 60)); }
  if (minStep === 60) cand.push(tm(h === 12 ? 6 : h <= 6 ? h + 6 : h - 6, 0));
  const opts = shuffle([ans, ...shuffle([...new Set(cand)].filter(o => o !== ans)).slice(0, 3)]);
  return Q({ t: 'choice', prompt: 'מה השעה?', vis: clockSvg(h, m), opts, ans,
    ex: m === 0 ? `המחוג הקצר מצביע על ${h} והמחוג הארוך על 12, ולכן השעה ${ans}.` : `המחוג הקצר (שעות) ליד ${h}, המחוג הארוך (דקות) על ${m / 5}: ${m} דקות. השעה ${ans}.`,
    hint: 'המחוג הקצר מראה שעות. המחוג הארוך (הצבעוני) מראה דקות: כל מספר על השעון שווה 5 דקות.', data: { k: 'clock', h, m } });
}
function durQ(unit) { // unit: 'hr' | 'min'
  if (unit === 'hr') {
    const h = rnd(7, 16), m = pick([0, 0, 30]), d = rnd(1, 4), eh = h + d;
    const P = pick([`הטיול התחיל ב־${L(tm(h, m))} ונגמר ב־${L(tm(eh, m))}. כמה שעות נמשך הטיול?`, `החוג מתחיל ב־${L(tm(h, m))} ונגמר ב־${L(tm(eh, m))}. כמה שעות נמשך החוג?`]);
    return Q({ t: 'num', prompt: P, vis: '', ans: d, ex: `מ־${tm(h, m)} עד ${tm(eh, m)} עוברות ${d} שעות.`, hint: 'סופרים כמה פעמים עוברת שעה שלמה מההתחלה עד הסוף.', data: { k: 'dur', s: tm(h, m), e: tm(eh, m), unit } });
  }
  const h = rnd(7, 17), m = pick([0, 10, 15, 20, 30, 40, 45]), d = pick([15, 20, 25, 30, 40, 45, 50, 60, 75, 90]), t = h * 60 + m + d, eh = Math.floor(t / 60), em = t % 60;
  const P = pick([`ההצגה התחילה ב־${L(tm(h, m))} ונגמרה ב־${L(tm(eh, em))}. כמה דקות נמשכה ההצגה?`, `הנסיעה לסבתא התחילה ב־${L(tm(h, m))} ונגמרה ב־${L(tm(eh, em))}. כמה דקות נמשכה הנסיעה?`]);
  return Q({ t: 'num', prompt: P, vis: '', ans: d, ex: `מ־${tm(h, m)} עד ${tm(eh, em)} עוברות ${d} דקות.`, hint: 'סופרים בקפיצות: קודם עד השעה העגולה, ואחר כך הלאה. בשעה יש 60 דקות.', data: { k: 'dur', s: tm(h, m), e: tm(eh, em), unit } });
}
function endTimeQ() {
  const h = rnd(8, 16), m = pick([0, 10, 15, 20, 30, 40, 45]), d = pick([15, 20, 30, 40, 45, 50, 60, 75, 90]), t = h * 60 + m + d, ans = tm(Math.floor(t / 60), t % 60);
  const wrong = new Set([tm(Math.floor(t / 60) + 1, t % 60), tm(Math.floor(t / 60), (t % 60 + 30) % 60), tm(h, m), tm(Math.floor(t / 60), (t % 60 + 10) % 60)]); wrong.delete(ans);
  return Q({ t: 'choice', prompt: `השיעור התחיל ב־${L(tm(h, m))} ונמשך ${L(d)} דקות. מתי הוא נגמר?`, vis: '', opts: shuffle([ans, ...[...wrong].slice(0, 3)]), ans,
    ex: `${tm(h, m)} ועוד ${d} דקות = ${ans}`, hint: 'בשעה יש 60 דקות. אם עוברים את 60, עוברים לשעה הבאה.', data: { k: 'endtime', s: tm(h, m), d } });
}
function rulerQ(shift) {
  const a = shift && Math.random() < .5 ? rnd(1, 4) : 0, b = rnd(a + 2, 12), what = pick(['pencil', 'bar']);
  return Q({ t: 'num', prompt: `מה האורך של ${what === 'pencil' ? 'העיפרון' : 'הפס'}? (בס״מ)`, vis: rulerSvg(a, b, what), ans: b - a,
    ex: a ? `מתחיל ב־${a} ונגמר ב־${b}: ${b} − ${a} = ${b - a}` : `מתחיל ב־0 ונגמר ב־${b}.`, hint: a ? 'הוא לא מתחיל ב־0! מחסרים את נקודת ההתחלה מנקודת הסוף.' : 'בדקו באיזה מספר הוא נגמר.', data: { k: 'ruler', a, b } });
}
const CHART_SETS = [
  { title: 'הפרי שהכי אוהבים בכיתה', cats: ['תפוח', 'בננה', 'ענבים', 'תות'], val: c => `כמה ילדים בחרו ב${c}?`, max: 'איזה פרי בחרו הכי הרבה ילדים?', min: 'איזה פרי בחרו הכי מעט ילדים?', diff: (b, s) => `בכמה ילדים יותר בחרו ב${b} מאשר ב${s}?`, sum: 'כמה ילדים ענו בסך הכול?' },
  { title: 'ספרים שקראו בחודש', cats: ['דנה', 'עומר', 'שירה', 'איתי'], val: c => `כמה ספרים ${v(c, 'קרא', 'קראה')} ${c}?`, max: 'מי קרא הכי הרבה ספרים?', min: 'מי קרא הכי מעט ספרים?', diff: (b, s) => `בכמה ספרים יותר ${v(b, 'קרא', 'קראה')} ${b} מ${s}?`, sum: 'כמה ספרים קראו כל הילדים יחד?' },
  { title: 'חיות בפינת החי', cats: ['ארנבים', 'תוכים', 'צבים', 'דגים'], val: c => `כמה ${c} יש בפינת החי?`, max: 'מאיזו חיה יש הכי הרבה?', min: 'מאיזו חיה יש הכי מעט?', diff: (b, s) => `בכמה יש יותר ${b} מ${s}?`, sum: 'כמה חיות יש בפינת החי בסך הכול?' },
  { title: 'ימי גשם בכל חודש', cats: ['נובמבר', 'דצמבר', 'ינואר', 'פברואר'], val: c => `כמה ימי גשם היו ב${c}?`, max: 'באיזה חודש היו הכי הרבה ימי גשם?', min: 'באיזה חודש היו הכי מעט ימי גשם?', diff: (b, s) => `בכמה ימי גשם יותר היו ב${b} מאשר ב${s}?`, sum: 'כמה ימי גשם היו בארבעת החודשים יחד?' }];
function chartQ(steps, kinds) {
  const D = pick(CHART_SETS), cats = D.cats, step = pick(steps);
  let vals; do { vals = cats.map(() => rnd(1, 6) * step); } while (new Set(vals).size < cats.length);
  const vis = `<div class="chartbox"><b>${D.title}</b>${chartSvg(cats, vals, step)}</div>`;
  const i = rnd(0, 3), j = (i + rnd(1, 3)) % 4, q = pick(kinds || ['val', 'max', 'min', 'diff', 'sum']), pre = 'לפי התרשים: ';
  const base = { vis, data: { k: 'chart', cats, vals, step, q } };
  if (q === 'max' || q === 'min') { const idx = vals.indexOf(q === 'max' ? Math.max(...vals) : Math.min(...vals)); return Q({ ...base, t: 'choice', prompt: pre + D[q], opts: cats, ans: cats[idx], ex: `העמודה של ${cats[idx]} ${q === 'max' ? 'הכי גבוהה' : 'הכי נמוכה'} (${vals[idx]}).`, hint: `חפשו את העמודה ה${q === 'max' ? 'גבוהה' : 'נמוכה'} ביותר.` }); }
  if (q === 'val') { base.data.i = i; return Q({ ...base, t: 'num', prompt: pre + D.val(cats[i]), ans: vals[i], ex: `העמודה של ${cats[i]} מגיעה ל־${vals[i]}.`, hint: 'עקבו באצבע מראש העמודה ישר הצידה אל המספרים.' }); }
  if (q === 'diff') { const big = vals[i] > vals[j] ? i : j, sm = big === i ? j : i; base.data.i = big; base.data.j = sm; return Q({ ...base, t: 'num', prompt: pre + D.diff(cats[big], cats[sm]), ans: vals[big] - vals[sm], ex: `${vals[big]} − ${vals[sm]} = ${vals[big] - vals[sm]}`, hint: 'קראו את שני המספרים, וחסרו את הקטן מהגדול.' }); }
  const sum = vals.reduce((x, y) => x + y, 0); return Q({ ...base, t: 'num', prompt: pre + D.sum, ans: sum, ex: vals.join(' + ') + ` = ${sum}`, hint: 'קראו את כל העמודות וחברו אותן.' });
}
const POLY = { 3: 'משולש', 4: 'מרובע', 5: 'מחומש', 6: 'משושה', 7: 'משובע', 8: 'מתומן', 9: 'מתושע', 10: 'מעושר' };
function polyNameQ(maxN) {
  const ns = Object.keys(POLY).map(Number).filter(n => n <= maxN), n = pick(ns), pts = regPoly(n);
  const others = shuffle(ns.filter(x => x !== n)).slice(0, 3).map(x => POLY[x]);
  return Q({ t: 'choice', prompt: 'איך קוראים לצורה הזו?', vis: polySvg(pts, { dots: true }), opts: shuffle([POLY[n], ...others]), ans: POLY[n], ex: `יש לה ${n} צלעות, ולכן היא ${POLY[n]}.`, hint: 'ספרו את הצלעות.', data: { k: 'poly', n, ask: 'name' } });
}
function polyCountQ(maxN) {
  const n = rnd(3, maxN), w = pick(['צלעות', 'קודקודים']), pts = regPoly(n);
  return Q({ t: 'num', prompt: `כמה ${w} יש לצורה?`, vis: polySvg(pts, { dots: true }), ans: n, ex: `לצורה יש ${n} צלעות ו־${n} קודקודים.`, hint: w === 'קודקודים' ? 'קודקוד הוא הנקודה שבה שתי צלעות נפגשות. ספרו את הנקודות.' : 'ספרו את הקווים הישרים מסביב.', data: { k: 'poly', n, ask: 'count' } });
}
function angleQ(withStraight) {
  const types = withStraight ? ['חדה', 'ישרה', 'קהה', 'שטוחה'] : ['חדה', 'ישרה', 'קהה'], type = pick(types);
  const deg = type === 'חדה' ? rnd(28, 68) : type === 'ישרה' ? 90 : type === 'קהה' ? rnd(115, 160) : 180;
  return Q({ t: 'choice', prompt: 'איזו זווית זו?', vis: angleSvg(deg), opts: types, ans: type,
    ex: { 'חדה': 'זווית חדה קטנה מזווית ישרה.', 'ישרה': 'זווית ישרה נראית כמו פינה של דף.', 'קהה': 'זווית קהה גדולה מזווית ישרה וקטנה מזווית שטוחה.', 'שטוחה': 'זווית שטוחה נראית כמו קו ישר.' }[type],
    hint: 'השוו לפינה של מחברת: קטנה ממנה, בדיוק כמוה, או גדולה ממנה?', data: { k: 'angle', deg } });
}
function triSidesQ() {
  const type = pick(['שווה־צלעות', 'שווה־שוקיים', 'שונה־צלעות']); let s;
  if (type === 'שווה־צלעות') { const a = rnd(4, 9); s = [a, a, a]; }
  else if (type === 'שווה־שוקיים') { const a = rnd(5, 9); s = [a, a, rnd(3, a - 1)]; }
  else { let a, b, c; do { c = rnd(6, 9); a = c - rnd(1, 2); b = a - rnd(1, 2); } while (a + b <= c + 1); s = [a, b, c]; }
  const [a, b, c] = s, P = triFromSides(a, b, c);
  return Q({ t: 'choice', prompt: 'איזה משולש זה, לפי אורכי הצלעות? (בס״מ)', vis: polySvg(P, { labels: [c, a, b] }), opts: ['שווה־צלעות', 'שווה־שוקיים', 'שונה־צלעות'], ans: type,
    ex: { 'שווה־צלעות': 'כל 3 הצלעות שוות.', 'שווה־שוקיים': '2 צלעות שוות זו לזו.', 'שונה־צלעות': 'כל הצלעות באורכים שונים.' }[type], hint: 'בדקו כמה צלעות שוות זו לזו.', data: { k: 'tri', by: 'sides', P, labels: [c, a, b] } });
}
function triAnglesQ() {
  const type = pick(['חד־זווית', 'ישר־זווית', 'קהה־זווית']); let P;
  if (type === 'חד־זווית') P = triFromSides(rnd(6, 7), rnd(6, 7), 6);
  else if (type === 'ישר־זווית') P = [[0, 0], [rnd(3, 6), 0], [0, rnd(3, 6)]];
  else P = [[0, 0], [9, 0], [2, 2.3]];
  if (Math.random() < .5) P = P.map(([x, y]) => [-x, y]);
  return Q({ t: 'choice', prompt: 'איזה משולש זה, לפי הזוויות שלו?', vis: polySvg(P, { right: true }), opts: ['חד־זווית', 'ישר־זווית', 'קהה־זווית'], ans: type,
    ex: { 'חד־זווית': 'כל שלוש הזוויות חדות.', 'ישר־זווית': 'יש לו זווית ישרה אחת.', 'קהה־זווית': 'יש לו זווית קהה אחת.' }[type], hint: 'חפשו את הזווית הכי גדולה במשולש. היא חדה, ישרה או קהה?', data: { k: 'tri', by: 'angles', P } });
}
function linesQ() {
  const kind = pick(['par', 'perp', 'cross']), t0 = rnd(-25, 25) * Math.PI / 180, t1 = kind === 'perp' ? t0 + Math.PI / 2 : t0 + pick([50, 130, 40, 140]) * Math.PI / 180;
  const nm = { par: 'מקבילים', perp: 'מאונכים', cross: 'נחתכים (לא מאונכים)' };
  return Q({ t: 'choice', prompt: 'מה נכון לגבי שני הקווים?', vis: linesSvg(kind, t0, t1), opts: [nm.par, nm.perp, nm.cross], ans: nm[kind],
    ex: { par: 'קווים מקבילים לא נפגשים אף פעם, והמרחק ביניהם תמיד שווה.', perp: 'קווים מאונכים נחתכים ויוצרים זווית ישרה.', cross: 'הקווים נחתכים, אבל הזווית ביניהם לא ישרה.' }[kind], hint: 'האם הקווים נפגשים? ואם כן, יש ביניהם זווית ישרה?', data: { k: 'lines', kind, t0, t1 } });
}
const QUADS = ['ריבוע', 'מלבן', 'מעוין', 'מקבילית', 'טרפז'];
function quadQ() {
  const type = pick(QUADS); let P, labels;
  const trip = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13]]);
  if (type === 'ריבוע') { const s = rnd(3, 8); P = [[0, 0], [s, 0], [s, s], [0, s]]; labels = [s, s, s, s]; }
  else if (type === 'מלבן') { const a = rnd(5, 10), b = rnd(2, a - 2); P = [[0, 0], [a, 0], [a, b], [0, b]]; labels = [a, b, a, b]; }
  else if (type === 'מעוין') { const [c, d, a] = trip; P = [[0, 0], [a, 0], [a + c, d], [c, d]]; labels = [a, a, a, a]; }
  else if (type === 'מקבילית') { const [c, d, l] = trip; let a; do { a = rnd(4, 14); } while (a === l); P = [[0, 0], [a, 0], [a + c, d], [c, d]]; labels = [a, l, a, l]; }
  else { const a = rnd(8, 12), c1 = rnd(1, 3), c2 = rnd(1, 3), d = rnd(3, 5); P = [[0, 0], [a, 0], [a - c1, d], [c2, d]]; labels = null; }
  if (Math.random() < .5) P = P.map(([x, y]) => [-x, y]);
  return Q({ t: 'choice', prompt: labels ? 'מה השם המדויק ביותר של המרובע? (אורכים בס״מ)' : 'מה השם המדויק ביותר של המרובע?', vis: polySvg(P, { labels, right: true }), opts: QUADS, ans: type,
    ex: { 'ריבוע': 'כל הצלעות שוות וכל הזוויות ישרות. (ריבוע הוא גם מלבן וגם מעוין, אבל השם המדויק הוא ריבוע.)', 'מלבן': 'כל הזוויות ישרות, והצלעות הנגדיות שוות.', 'מעוין': 'כל הצלעות שוות, אבל הזוויות לא ישרות.', 'מקבילית': 'שני זוגות של צלעות מקבילות, בלי זוויות ישרות, והצלעות לא כולן שוות.', 'טרפז': 'רק זוג אחד של צלעות מקבילות.' }[type],
    hint: 'בדקו: האם יש זוויות ישרות? האם כל הצלעות שוות? כמה זוגות של צלעות מקבילות יש?', data: { k: 'quad', P, labels } });
}
function rightAngleQ() {
  const kinds = [['rect', true], ['rtri', true], ['sq', true], ['eq', false], ['pent', false], ['hex', false], ['rhom', false]];
  const [kind, has] = pick(kinds); let P;
  if (kind === 'rect') { const a = rnd(5, 9), b = rnd(2, 4); P = [[0, 0], [a, 0], [a, b], [0, b]]; }
  else if (kind === 'sq') { const s = rnd(3, 6); P = [[0, 0], [s, 0], [s, s], [0, s]]; }
  else if (kind === 'rtri') P = [[0, 0], [rnd(3, 6), 0], [0, rnd(3, 6)]];
  else if (kind === 'eq') P = triFromSides(5, 5, 5);
  else if (kind === 'pent') P = regPoly(5);
  else if (kind === 'hex') P = regPoly(6);
  else P = [[0, 0], [5, 0], [8, 4], [3, 4]];
  return Q({ t: 'choice', prompt: 'האם יש בצורה זווית ישרה?', vis: polySvg(P, { right: true }), opts: ['כן', 'לא'], ans: has ? 'כן' : 'לא',
    ex: has ? 'כן. יש פינה שנראית כמו פינה של דף (מסומנת בריבוע קטן).' : 'לא. אף פינה לא נראית בדיוק כמו פינה של דף.', hint: 'השוו כל פינה לפינה של דף.', data: { k: 'right', P } });
}
const SOLIDS = { 'קובייה': [6, 12, 8], 'תיבה': [6, 12, 8], 'מנסרה משולשת': [5, 9, 6], 'פירמידה מרובעת': [5, 8, 5], 'פירמידה משולשת': [4, 6, 4] };
function solidQ() {
  const s = pick(Object.keys(SOLIDS)), pi = rnd(0, 2), w = ['פאות', 'מקצועות', 'קודקודים'][pi];
  return Q({ t: 'num', prompt: `כמה ${w} יש ל${s}?`, vis: '', ans: SOLIDS[s][pi], ex: `ל${s} יש ${SOLIDS[s][0]} פאות, ${SOLIDS[s][1]} מקצועות ו־${SOLIDS[s][2]} קודקודים.`, hint: 'פאה היא "קיר" שטוח, מקצוע הוא קו שבו שתי פאות נפגשות, וקודקוד הוא פינה.', data: { k: 'solid', s, pi } });
}
function digitsQ(withZero) {
  const zero = withZero && Math.random() < .35, ds = shuffle(zero ? [0, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3)] : shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4));
  const perms = []; const go = (c, r) => { if (!r.length) { if (c[0] !== 0) perms.push(+c.join('')); return; } r.forEach((x, i) => go([...c, x], r.filter((_, j) => j !== i))); }; go([], ds);
  const types = [['הגדול ביותר', p => p, Math.max], ['הקטן ביותר', p => p, Math.min], ['הזוגי הגדול ביותר', p => p.filter(x => x % 2 === 0), Math.max], ['האי־זוגי הקטן ביותר', p => p.filter(x => x % 2), Math.min]];
  let tp, cand; do { tp = pick(types); cand = tp[1](perms); } while (!cand.length);
  return Q({ t: 'num', prompt: `בעזרת כל הספרות האלה (כל ספרה פעם אחת), כתבו את המספר ${tp[0]} בן 4 ספרות:`, vis: `<div class="digits">${ds.map(d => `<span>${d}</span>`).join('')}</div>`, ans: tp[2](...cand),
    ex: `המספר ${tp[0]} הוא ${tp[2](...cand)}.`, hint: tp[0].includes('גדול') ? 'שמים את הספרות הגדולות בהתחלה (משמאל). מספר זוגי נגמר ב־0, 2, 4, 6 או 8.' : 'שמים את הספרות הקטנות בהתחלה, אבל מספר לא מתחיל ב־0. מספר אי־זוגי נגמר ב־1, 3, 5, 7 או 9.', data: { k: 'digits', ds, type: tp[0] } });
}
function digValQ(len) {
  const ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, len), n = +ds.join(''), p = rnd(0, len - 1), d = ds[len - 1 - p];
  return Q({ t: 'num', prompt: `מה הערך של הספרה ${L(d)} במספר ${N(n)}?`, vis: '', ans: d * 10 ** p, ex: `הספרה ${d} נמצאת במקום ה${HEB_POS[p]}, ולכן ערכה ${d * 10 ** p}.`, hint: 'מימין לשמאל: אחדות, עשרות, מאות, אלפים.', data: { k: 'digval', n, d } });
}
function digitPosQ(len) {
  const n = rnd(10 ** (len - 1), 10 ** len - 1), p = rnd(0, len - 1), ans = Math.floor(n / 10 ** p) % 10;
  return Q({ t: 'num', prompt: `מה ספרת ה${HEB_POS[p]} במספר ${N(n)}?`, vis: '', ans, ex: `במספר ${n}, ספרת ה${HEB_POS[p]} היא ${ans}.`, hint: 'מימין לשמאל: אחדות, עשרות, מאות, אלפים.', data: { k: 'digit', n, p } });
}
function composeQ(len) {
  const parts = [...Array(len)].map((_, i) => i === len - 1 ? rnd(1, 9) : rnd(0, 9)).reverse(); // parts[0]=אחדות
  const txt = parts.map((d, i) => [d, i]).filter(([d]) => d > 0).reverse().map(([d, i]) => `${L(d)} ${HEB_POS[i]}`);
  const e = parts.map((d, i) => `${d}*${10 ** i}`).filter((_, i) => parts[i] > 0).join('+');
  const prompt = `איזה מספר זה? ${txt.length > 1 ? txt.slice(0, -1).join(', ') + ' ו־' + txt[txt.length - 1] : txt[0]}`;
  return Q({ t: 'num', prompt, vis: '', ans: parts.reduce((a, d, i) => a + d * 10 ** i, 0), ex: `${e.replace(/\*/g, '×').replace(/\+/g, ' + ')} = ${parts.reduce((a, d, i) => a + d * 10 ** i, 0)}`, hint: 'כותבים כל ספרה במקום שלה. מקום שאין בו כלום מקבל 0.', data: { k: 'expr', e } });
}
function roundQ(maxN, tos) {
  const to = pick(tos); let n; do { n = rnd(to + 1, maxN); } while (n % to === 0);
  const ans = Math.floor(n / to + 0.5) * to;
  return Q({ t: 'num', prompt: `עגלו את ${N(n)} ל${{ 10: 'עשרות', 100: 'מאות', 1000: 'אלפים' }[to]} השלמות הקרובות:`, vis: '', ans, ex: `${n} ≈ ${ans}`, hint: `מסתכלים על הספרה שמימין למקום ה${{ 10: 'עשרות', 100: 'מאות', 1000: 'אלפים' }[to]}: 5 ומעלה מעגלים למעלה, פחות מ־5 למטה.`, data: { k: 'round', n, to } });
}
function remQ(maxA) {
  const a = rnd(3, maxA), q = rnd(2, 9), r = rnd(1, a - 1), n = a * q + r, askQ = Math.random() < .4;
  return Q({ t: 'num', prompt: askQ ? 'כמה זה? (בלי השארית)' : 'מה השארית?', vis: `<div class="stack">${eq(askQ ? `${n} : ${a} = ${BOX}` : `${n} : ${a} = ${q}`)}<div class="eq small">שארית: ${askQ ? L(r) : BOX}</div></div>`, ans: askQ ? q : r,
    ex: `${a} × ${q} = ${a * q}, ו־${n} − ${a * q} = ${r}`, hint: `מצאו את הכפולה של ${L(a)} הכי קרובה ל־${L(n)} בלי לעבור אותו.`, data: { k: 'rem', n, a, ask: askQ ? 'q' : 'r' } });
}
function fracPartQ(ds, word) {
  const d = pick(ds), n = d === 2 ? 1 : rnd(1, Math.min(4, d - 1)), kk = rnd(2, d >= 8 ? 6 : 9), tot = d * kk, ans = n * kk;
  const P = word ? pick([`בכיתה ${L(tot)} ילדים. ${fr(n, d)} מהם הלכו לחוג. כמה ילדים הלכו לחוג?`, `בקופסה ${L(tot)} עוגיות. אכלו ${fr(n, d)} מהן. כמה עוגיות אכלו?`]) : `כמה זה ${fr(n, d)} מ־${L(tot)}?`;
  return Q({ t: 'num', prompt: P, vis: '', ans, ex: `${tot} : ${d} = ${kk}${n > 1 ? `, ו־${kk} × ${n} = ${ans}` : ''}`, hint: `מחלקים את ${L(tot)} ל־${L(d)} חלקים שווים${n > 1 ? `, ולוקחים ${L(n)} חלקים` : ''}.`, data: { k: 'fpart', n, d, tot } });
}
function fracChoice(val, extra) { // val=[n,d]; distractors distinct by value
  const ans = fstr(val[0], val[1]), seen = new Set([val[0] / val[1]]), opts = [ans];
  for (const c of shuffle(extra)) { if (opts.length >= 4) break; if (c[1] <= 0 || c[0] <= 0) continue; const x = c[0] / c[1]; if ([...seen].some(s => Math.abs(s - x) < 1e-9)) continue; seen.add(x); opts.push(fstr(c[0], c[1])); }
  return { ans, opts: shuffle(opts) };
}
/* חלון מלוח הכפל: rows×cols, ערכים שמוצגים ב־shown ("r,c"), משבצת ? ב־q ({r,c} או {r} / {c} לכותרת חסרה) */
function tabSvg(rows, cols, shown, q) {
  const c = 46, x0 = 4, y0 = 4; let s = '';
  const cell = (x, y, cls, txt, tcls) => s += `<rect x="${x}" y="${y}" width="${c}" height="${c}" class="${cls}"/>` + (txt === '' ? '' : `<text x="${x + c / 2}" y="${y + c / 2 + 6}" text-anchor="middle"${tcls ? ` class="${tcls}"` : ''}>${txt}</text>`);
  cell(x0, y0, 'mtc', '×', 'mtt');
  cols.forEach((b, j) => q.c === b && q.r == null ? cell(x0 + (j + 1) * c, y0, 'mtq', '?', 'mtqt') : cell(x0 + (j + 1) * c, y0, 'mth', b, 'mtt'));
  rows.forEach((a, i) => {
    const y = y0 + (i + 1) * c;
    q.r === a && q.c == null ? cell(x0, y, 'mtq', '?', 'mtqt') : cell(x0, y, 'mth', a, 'mtt');
    cols.forEach((b, j) => { const x = x0 + (j + 1) * c; q.r === a && q.c === b ? cell(x, y, 'mtq', '?', 'mtqt') : cell(x, y, 'mtd', shown.has(a + ',' + b) ? a * b : ''); });
  });
  return svg(s, 2 * x0 + (cols.length + 1) * c, 2 * y0 + (rows.length + 1) * c);
}
/* השלמת לוח הכפל בשאלה אחת (במבחן לדוגמה ובמבחן מותאם; בתרגול הנושא עצמו יש לוח מלא, tableBoard).
 * maxR: השורה הגדולה ביותר. heads: גם שאלות של כותרת חסרה */
function tabQ(maxR, heads) {
  const R = 3, C = rnd(4, 5), r0 = rnd(1, maxR - R + 1), c0 = rnd(1, 11 - C);
  const rows = [...Array(R)].map((_, i) => r0 + i), cols = [...Array(C)].map((_, i) => c0 + i);
  const mode = heads && Math.random() < .3 ? pick(['row', 'col']) : 'cell';
  const shown = new Set(), cells = [];
  const show = (a, b) => { shown.add(a + ',' + b); cells.push([a, b, a * b]); };
  if (mode === 'cell') {
    const r = pick(rows), cc = pick(cols);
    rows.forEach(a => cols.forEach(b => { if ((a !== r || b !== cc) && Math.random() < (maxR <= 6 ? .6 : .45)) show(a, b); }));
    return Q({ t: 'num', prompt: 'השלימו את לוח הכפל: איזה מספר צריך להיות במשבצת עם סימן השאלה?', vis: tabSvg(rows, cols, shown, { r, c: cc }), ans: r * cc,
      ex: `${L(`${r} × ${cc} = ${r * cc}`)}: המספר בתחילת השורה כפול המספר בראש העמודה.`,
      hint: `מסתכלים על המספר בתחילת השורה (${L(r)}) ועל המספר בראש העמודה (${L(cc)}), וכופלים אותם.`, data: { k: 'mtab', ask: 'cell', r, c: cc, cells } });
  }
  // כותרת חסרה: כל המשבצות בשורה (או בעמודה) של הסימן מלאות, כדי שאפשר יהיה לגלות אותה
  const h = mode === 'row' ? pick(rows) : pick(cols);
  rows.forEach(a => cols.forEach(b => { if ((mode === 'row' ? a === h : b === h) || Math.random() < .35) show(a, b); }));
  const other = mode === 'row' ? cols[0] : rows[0];
  return Q({ t: 'num', prompt: `השלימו את לוח הכפל: איזה מספר חסר ${mode === 'row' ? 'בתחילת השורה' : 'בראש העמודה'}?`, vis: tabSvg(rows, cols, shown, mode === 'row' ? { r: h } : { c: h }), ans: h,
    ex: `${L(`${h * other} : ${other} = ${h}`)}, כי ${L(`${h} × ${other} = ${h * other}`)}.`,
    hint: `בוחרים משבצת ${mode === 'row' ? 'בשורה' : 'בעמודה'} של הסימן, ושואלים: איזה מספר כפול ${L(other)} שווה ${L(h * other)}?`, data: { k: 'mtab', ask: mode, h, cells } });
}

/* לוח כפל מלא 10×10 להשלמה: אילו משבצות ריקות. בכיתה ב' 40% ריקות, אחר כך 50% */
function tableBoard(grade) {
  const all = []; for (let r = 1; r <= 10; r++) for (let c = 1; c <= 10; c++) all.push([r, c]);
  const blanks = shuffle(all).slice(0, grade <= 2 ? 40 : 50).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return { n: 10, blanks };
}

/* ===== כיתה א' (תוכנית חדשה) ===== */
const G1 = [
  { id: 'count', name: 'מספרים עד 100', sym: '123', c: 'num', desc: 'מנייה, לפני ואחרי, השוואה, סדרות', gens: [
    () => { const n = rnd(3, 20); return Q({ t: 'num', prompt: 'כמה עיגולים יש?', vis: tenFrames(n), ans: n, ex: `יש ${n} עיגולים.`, hint: 'בכל שורה יש 5 משבצות, ובכל מסגרת 10.', data: { k: 'count' } }); },
    () => { const n = rnd(1, 98), w = pick(['אחרי', 'לפני', 'בין']); if (w === 'אחרי') return Q({ t: 'num', prompt: `איזה מספר בא מיד אחרי ${L(n)}?`, vis: '', ans: n + 1, ex: `אחרי ${n} בא ${n + 1}.`, hint: 'סופרים צעד אחד קדימה.', data: { k: 'expr', e: `${n}+1` } });
      if (w === 'לפני') return Q({ t: 'num', prompt: `איזה מספר בא מיד לפני ${L(n + 1)}?`, vis: '', ans: n, ex: `לפני ${n + 1} בא ${n}.`, hint: 'סופרים צעד אחד אחורה.', data: { k: 'expr', e: `${n + 1}-1` } });
      const a = Math.min(n, 97); return Q({ t: 'num', prompt: `איזה מספר נמצא בין ${L(a)} ל־${L(a + 2)}?`, vis: '', ans: a + 1, ex: `${a}, ${a + 1}, ${a + 2}`, hint: 'זה המספר שבא אחרי המספר הראשון.', data: { k: 'expr', e: `${a}+1`, word: true, consts: [1] } }); },
    () => { const a = rnd(0, 100); let b = Math.random() < .15 ? a : rnd(0, 100); return cmpQ(String(a), String(b)); },
    () => retry(() => { const d = pick([2, 5, 10]), down = Math.random() < .25; const len = 5; let s = d === 10 ? rnd(0, 5) * 10 : rnd(0, 20) * (d === 5 ? 5 : 1) + (d === 2 ? 0 : 0); if (down) s = rnd(4 * d, 100); return seqQ(s, down ? -d : d, len, 0, 100); })] },
  { id: 'add10', name: 'חיבור וחיסור עד 10', sym: '+−', c: 'ops', desc: 'תרגילים, מספר חסר, השלמה ל־10', gens: [
    () => { const a = rnd(0, 9), b = rnd(0, 10 - a); return exprQ(`${a}+${b}`, 'כמה זה?', 'אפשר לספור על האצבעות מהמספר הגדול.'); },
    () => { const a = rnd(1, 10), b = rnd(0, a); return exprQ(`${a}-${b}`, 'כמה זה?', 'סופרים אחורה.'); },
    () => { const a = rnd(1, 9); return missQ(`${a}+?`, '10', 'כמה חסר כדי להגיע ל־10?', 'מה משלים ל־10? אפשר להיעזר באצבעות של שתי הידיים.', 10 - a); },
    () => { const x = rnd(0, 8), b = rnd(1, 10 - x); return missQ(`?+${b}`, `${x + b}`, null, `איזה מספר ועוד ${L(b)} נותן ${L(x + b)}?`, x); }] },
  { id: 'add20', name: 'חיבור וחיסור עד 20', sym: '20', c: 'eq', desc: 'עד 20, ועשרות שלמות עד 100', gens: [
    () => { const a = rnd(5, 15), b = rnd(2, 20 - a); return exprQ(`${a}+${b}`, 'כמה זה?', 'אפשר להשלים קודם ל־10 ואז להוסיף את השאר.'); },
    () => { const a = rnd(11, 20), b = rnd(2, a - 1); return exprQ(`${a}-${b}`, 'כמה זה?', 'אפשר להוריד קודם עד 10 ואז את השאר.'); },
    () => { const a = rnd(1, 8), b = rnd(1, 9 - a); return exprQ(`${a * 10}+${b * 10}`, 'חיבור עשרות:', `זה כמו ${L(`${a} + ${b}`)}, רק בעשרות.`); },
    () => { const a = rnd(3, 10), b = rnd(1, a - 1); return exprQ(`${a * 10}-${b * 10}`, 'חיסור עשרות:', `זה כמו ${L(`${a} − ${b}`)}, רק בעשרות.`); },
    () => { const x = rnd(2, 9), b = rnd(3, 11); return missQ(`${b}+?`, `${b + x}`, null, `כמה צריך להוסיף ל־${L(b)} כדי להגיע ל־${L(b + x)}?`, x); }] },
  { id: 'word1', name: 'סיפורים חשבוניים', sym: '?', c: 'word', desc: 'מוסיפים, מורידים, כמה יש עכשיו', gens: [
    () => { const k = pick(KIDS), a = rnd(3, 12), b = rnd(2, 20 - a); return wordQ(`ל${k} היו ${L(a)} בלונים. ${v(k, 'הוא', 'היא')} ${v(k, 'קיבל', 'קיבלה')} עוד ${L(b)}. כמה בלונים יש ל${k} עכשיו?`, `${a}+${b}`, `${a} + ${b} = ${a + b}`, '"קיבל עוד" זה חיבור.'); },
    () => { const a = rnd(8, 20), b = rnd(2, a - 2); return wordQ(`על העץ ישבו ${L(a)} ציפורים. ${L(b)} ציפורים עפו. כמה ציפורים נשארו על העץ?`, `${a}-${b}`, `${a} − ${b} = ${a - b}`, '"עפו" ו"נשארו" זה חיסור.'); },
    () => { const a = rnd(3, 10), b = rnd(3, 10); return wordQ(`בסל יש ${L(a)} תפוחים אדומים ו־${L(b)} תפוחים ירוקים. כמה תפוחים יש בסל?`, `${a}+${b}`, `${a} + ${b} = ${a + b}`, 'מחברים את שני הסוגים.'); }] },
  { id: 'shapes1', name: 'צורות', sym: '△', c: 'geo', desc: 'שמות של מצולעים, צלעות וקודקודים', gens: [() => polyNameQ(10), () => polyCountQ(8)] },
  { id: 'meas1', name: 'אורך ושעון', sym: '⌚', c: 'meas', desc: 'מדידה בסרגל, שעות שלמות', gens: [() => rulerQ(false), () => clockQ(60), () => durQ('hr')] },
  { id: 'chart1', name: 'תרשימים', sym: '▂▅▇', c: 'chart', desc: 'קריאת דיאגרמת עמודות', gens: [() => chartQ([1], ['val', 'max', 'min', 'diff'])] }];

/* ===== כיתה ב' (תוכנית חדשה) ===== */
const G2 = [
  { id: 'num2', name: 'מספרים עד 1,000', sym: '123', c: 'num', desc: 'מבנה עשרוני, השוואה, זוגי ואי־זוגי, סדרות', gens: [
    () => digitPosQ(3), () => composeQ(3),
    () => { const a = rnd(100, 999); return cmpQ(String(a), String(Math.random() < .2 ? a : rnd(100, 999))); },
    () => { const n = rnd(0, 999), ans = n % 2 === 0 ? 'זוגי' : 'אי־זוגי'; return Q({ t: 'choice', prompt: `האם המספר ${L(n)} זוגי או אי־זוגי?`, vis: '', opts: ['זוגי', 'אי־זוגי'], ans, ex: `ספרת האחדות היא ${n % 10}, ולכן המספר ${ans}.`, hint: 'מסתכלים רק על ספרת האחדות: 0, 2, 4, 6, 8 זה זוגי.', data: { k: 'parity', n } }); },
    () => retry(() => { const d = pick([2, 5, 10, 20, 50, 100]), down = Math.random() < .3; let s = rnd(0, 20) * (d >= 20 ? d / 2 : 1) + (d >= 10 ? 0 : rnd(0, 9)); if (down) s += d * 5; return seqQ(s, down ? -d : d, 6, 0, 1000); })] },
  { id: 'ops2', name: 'חיבור וחיסור עד 100', sym: '+−', c: 'ops', desc: 'במאוזן ובמאונך, מספר חסר', gens: [
    () => { const a = rnd(11, 80), b = rnd(10, 99 - a); return exprQ(`${a}+${b}`, 'כמה זה?', 'מחברים עשרות עם עשרות, ואחדות עם אחדות.'); },
    () => { const a = rnd(30, 99), b = rnd(11, a - 5); return exprQ(`${a}-${b}`, 'כמה זה?', 'מחסרים קודם את העשרות ואחר כך את האחדות.'); },
    () => { let a = rnd(15, 75), b = rnd(12, 99 - a); if ((a % 10) + (b % 10) < 10) b = Math.min(99 - a, b + 9 - (b % 10)); return vertQ(a, b, '+'); },
    () => { const a = rnd(40, 99); let b = rnd(12, a - 10); if ((b % 10) <= (a % 10) && (a % 10) < 9) b = b - (b % 10) + (a % 10) + 1; if (b >= a) b = a - 11; return vertQ(a, b, '−'); },
    () => { const x = rnd(11, 60), b = rnd(10, 99 - x); return missQ(`${b}+?`, `${b + x}`, null, `אפשר לחסר: ${L(`${b + x} − ${b}`)}`, x); }] },
  { id: 'mul2', name: 'כפל וחילוק', sym: '×:', c: 'eq', desc: 'עובדות הכפל של 2, 4, 5 ו־10', gens: [
    () => { const a = pick([2, 4, 5, 10]), b = rnd(1, 10); return exprQ(Math.random() < .5 ? `${a}*${b}` : `${b}*${a}`, 'כמה זה?', `${L(`${a} × ${b}`)} זה ${b} קבוצות של ${a}. אפשר לספור בקפיצות.`); },
    () => { const a = pick([2, 4, 5, 10]), q = rnd(1, 10); return exprQ(`${a * q}/${a}`, 'כמה זה?', `איזה מספר כפול ${L(a)} שווה ${L(a * q)}?`); },
    () => { const a = pick([2, 4, 5, 10]), x = rnd(1, 10); return missQ(`${a}*?`, `${a * x}`, null, `כמה פעמים ${L(a)} נכנס ב־${L(a * x)}?`, x); },
    () => { const l = rnd(2, 5), p = pick([2, 4, 5]); return wordQ(`בתיבה יש ${L(l)} שכבות של קוביות. בכל שכבה יש ${L(p)} קוביות. כמה קוביות יש בתיבה?`, `${l}*${p}`, `${l} × ${p} = ${l * p}`, 'מספר השכבות כפול מספר הקוביות בכל שכבה.'); }] },
  { id: 'mtab', name: 'השלמת לוח הכפל', sym: '▦×', c: 'num', desc: 'לוח כפל מלא 10×10, משלימים את המשבצות הריקות', gens: [() => tabQ(5, false)] },
  { id: 'word2', name: 'בעיות מילוליות וכסף', sym: '₪', c: 'word', desc: 'השוואה, קנייה, עודף, מטבעות', gens: [
    () => { const a = rnd(30, 90), b = rnd(10, a - 5), k1 = pick(KIDS), k2 = pick(KIDS.filter(x => x !== k1)); return wordQ(`ל${k1} יש ${L(a)} מדבקות ול${k2} יש ${L(b)}. בכמה מדבקות יותר יש ל${k1}?`, `${a}-${b}`, `${a} − ${b} = ${a - b}`, '"בכמה יותר" זה חיסור של הקטן מהגדול.', [], [a, b]); },
    () => { const a = rnd(10, 40), b = rnd(10, 30), c = rnd(5, 99 - a - b); return wordQ(`ביום ראשון נקטפו ${L(a)} תפוזים, ביום שני ${L(b)}, וביום שלישי ${L(c)}. כמה תפוזים נקטפו בסך הכול?`, `${a}+${b}+${c}`, `${a} + ${b} + ${c} = ${a + b + c}`, 'מחברים את שלושת הימים.'); },
    () => { const p = rnd(12, 45), bill = p < 20 ? 20 : p < 50 ? 50 : 100; return wordQ(`ספר עולה ${L(p)} ₪. שילמו בשטר של ${L(bill)} ₪. כמה עודף מקבלים?`, `${bill}-${p}`, `${bill} − ${p} = ${bill - p}`, 'עודף = כמה ששילמנו פחות כמה שעלה.', [], [bill, p]); },
    () => { const list = shuffle([1000, 500, 200, 200, 100, 100, 1000, 500]).slice(0, rnd(3, 5)).sort((a, b) => b - a), tot = list.reduce((a, b) => a + b, 0) / 100; return Q({ t: 'num', prompt: 'כמה שקלים יש כאן בסך הכול?', vis: coinsSvg(list), ans: tot, ex: list.map(x => x / 100).join(' + ') + ` = ${tot}`, hint: 'מתחילים מהמטבע הגדול ומוסיפים.', data: { k: 'coins', list } }); }] },
  { id: 'geo2', name: 'צורות וגופים', sym: '△', c: 'geo', desc: 'משולשים, זווית ישרה, גופים', gens: [triSidesQ, rightAngleQ, solidQ] },
  { id: 'meas2', name: 'אורך, היקף ושעון', sym: '⌚', c: 'meas', desc: 'סרגל, היקף, חצאי שעות', gens: [
    () => rulerQ(true),
    () => { const n = pick([3, 4]), s = [...Array(n)].map(() => rnd(2, 12)), nm = n === 3 ? 'משולש' : 'מרובע'; return wordQ(`ל${nm} צלעות באורך ${s.map(L).join(', ')} ס״מ. מה ההיקף שלו? (בס״מ)`, s.join('+'), `${s.join(' + ')} = ${s.reduce((a, b) => a + b)}`, 'היקף = סכום אורכי כל הצלעות.'); },
    () => clockQ(30), () => durQ('hr')] },
  { id: 'chart2', name: 'תרשימים', sym: '▂▅▇', c: 'chart', desc: 'דיאגרמת עמודות', gens: [() => chartQ([1, 2, 5])] }];

/* ===== כיתה ג' (תוכנית חדשה) ===== */
const GEM = { 'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10, 'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'צ': 90, 'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400 };
const G3 = [
  { id: 'num3', name: 'מספרים עד 10,000', sym: '123', c: 'num', desc: 'ערך המקום, עיגול, סדרות, גימטרייה', gens: [
    () => digValQ(4), () => composeQ(4), () => roundQ(9999, [10, 100, 1000]),
    () => { const a = rnd(1000, 9999); return cmpQ(String(a), String(Math.random() < .5 ? a + pick([-1, 1]) * pick([1, 10, 100, 1000]) : rnd(1000, 9999))); },
    () => retry(() => { const d = pick([20, 25, 50, 200, 250, 500, 1000]), down = Math.random() < .3; let s = rnd(1, 30) * (d >= 200 ? 100 : 10) + (d === 25 ? 25 * rnd(0, 3) : 0); if (down) s += d * 5; return seqQ(s, down ? -d : d, 6, 0, 10000); }),
    () => { const w = pick(['יג', 'כד', 'לב', 'מח', 'קנ', 'רמ', 'שלו', 'תקע', 'תר', 'קכ']); const ans = [...w].reduce((a, c) => a + GEM[c], 0); return Q({ t: 'num', prompt: `בגימטרייה, כמה שווה ${w}?`, vis: '', ans, ex: [...w].map(c => `${c}=${GEM[c]}`).join(', ') + `. ביחד: ${ans}`, hint: 'א–ט הן 1–9, י–צ הן העשרות (10–90), ק–ת הן המאות (100–400).', data: { k: 'gem', w } }); }] },
  { id: 'ops3', name: 'חיבור וחיסור', sym: '+−', c: 'ops', desc: 'במאונך עד 10,000, מאות ואלפים שלמים', gens: [
    () => { let a = rnd(120, 6500), b = rnd(105, Math.min(3499, 9989 - a)); if ((a % 10) + (b % 10) < 10 && Math.random() < .7) b += 9 - (b % 10); return vertQ(a, b, '+'); },
    () => { const a = rnd(400, 9800); let b = rnd(110, a - 80); if ((a % 10) >= (b % 10) && Math.random() < .7) { b = b - (b % 10) + Math.min(9, (a % 10) + rnd(1, 5)); if (b >= a) b = a - rnd(50, 90); } return vertQ(a, b, '−'); },
    () => { const a = rnd(1, 60) * 100, b = rnd(1, 99 - a / 100) * 100; return exprQ(`${a}+${b}`, 'חיבור מאות שלמות:', 'מחברים את מספרי המאות, ומוסיפים 00 בסוף.'); },
    () => { const x = rnd(110, 900), b = rnd(100, 5000); return missQ(`?+${b}`, `${x + b}`, null, `אפשר לחסר: ${L(`${x + b} − ${b}`)}`, x); }] },
  { id: 'mul3', name: 'כפל וחילוק', sym: '×:', c: 'eq', desc: 'לוח הכפל, כפל ב־10, 100, 1,000, שארית, סדר פעולות', gens: [
    () => { const a = rnd(2, 10), b = rnd(2, 10); return exprQ(`${a}*${b}`, 'כמה זה?', `${L(`${a} × ${b}`)} זה ${b} קבוצות של ${a}.`); },
    () => { const a = rnd(2, 10), q = rnd(2, 10); return exprQ(`${a * q}/${a}`, 'כמה זה?', `איזה מספר כפול ${L(a)} שווה ${L(a * q)}?`); },
    () => { const m = pick([10, 100, 1000]), a = m === 1000 ? rnd(2, 9) : m === 100 ? rnd(2, 99) : rnd(11, 999); return exprQ(`${a}*${m}`, 'כמה זה?', `כופלים ב־${L(m)}: מוסיפים ${String(m).length - 1} אפסים בסוף.`); },
    () => { const a = rnd(2, 9), b = rnd(2, 9) * pick([10, 100]); return exprQ(`${a}*${b}`, 'כפל במספר עגול:', `פותרים ${L(`${a} × ${b / (b % 100 === 0 ? 100 : 10)}`)} ומוסיפים את האפסים.`); },
    () => { const a = rnd(2, 9), q = rnd(11, 30), n = a * q; return exprQ(`${n}/${a}`, 'חילוק (אפשר לפרק את המספר):', `פרקו את ${L(n)} לחלקים שקל לחלק ב־${L(a)}, למשל עשרות ועוד השאר.`); },
    () => remQ(9),
    () => { const k = rnd(1, 3); if (k === 1) { const a = rnd(2, 7), b = rnd(2, 10 - a), c = rnd(2, 9); return exprQ(`(${a}+${b})*${c}`, 'סדר פעולות: כמה זה?', 'קודם מה שבסוגריים.'); } if (k === 2) { const b = rnd(2, 9), c = rnd(2, 9), a = b * c + rnd(2, 30); return exprQ(`${a}-${b}*${c}`, 'סדר פעולות: כמה זה?', 'קודם כפל, אחר כך חיסור.'); } const b = rnd(2, 6), c = rnd(2, 6), d = rnd(5, 20); return exprQ(`${d}+${b}*${c}`, 'סדר פעולות: כמה זה?', 'קודם כפל, אחר כך חיבור.'); }] },
  { id: 'mtab', name: 'השלמת לוח הכפל', sym: '▦×', c: 'num', desc: 'לוח כפל מלא 10×10, משלימים חצי מהמשבצות', gens: [() => tabQ(10, false), () => tabQ(10, true)] },
  { id: 'word3', name: 'בעיות מילוליות', sym: '?', c: 'word', desc: 'בעיות של שלב אחד ושני שלבים', gens: [
    () => { const a = rnd(150, 2500), b = rnd(120, 1500); return wordQ(`בספרייה היו ${N(a)} ספרים. הגיעו עוד ${N(b)} ספרים. כמה ספרים יש עכשיו בספרייה?`, `${a}+${b}`, `${a} + ${b} = ${a + b}`, '"עוד" זה חיבור.', [], [a, b]); },
    () => { const a = rnd(600, 3000), b = rnd(150, a - 100); return wordQ(`באולם היו ${N(a)} כיסאות. הוציאו ${N(b)} כיסאות. כמה כיסאות נשארו?`, `${a}-${b}`, `${a} − ${b} = ${a - b}`, '"נשארו" זה חיסור.', [], [a, b]); },
    () => { const a = rnd(20, 60), b = rnd(10, a - 5), c = rnd(5, 30); return wordQ(`באוטובוס היו ${L(a)} נוסעים. בתחנה ירדו ${L(b)} ועלו ${L(c)}. כמה נוסעים יש עכשיו באוטובוס?`, `${a}-${b}+${c}`, `${a} − ${b} = ${a - b}, ואז ${a - b} + ${c} = ${a - b + c}`, 'ירדו זה מורידים, עלו זה מוסיפים. לפי הסדר.'); },
    () => { const n = rnd(2, 5), p = rnd(4, 12), cost = n * p, bill = cost < 50 ? pick([50, 100]) : 100; return wordQ(`קנו ${L(n)} מחברות, כל מחברת ב־${L(p)} ₪. שילמו בשטר של ${L(bill)} ₪. כמה עודף קיבלו?`, `${bill}-${n}*${p}`, `${n} × ${p} = ${cost}, ואז ${bill} − ${cost} = ${bill - cost}`, 'שני שלבים: קודם כמה עלו כל המחברות (כפל), ואחר כך כמה נשאר (חיסור).'); },
    () => { const p = rnd(6, 15); return wordQ(`תמר קוראת ${L(p)} עמודים בכל יום. כמה עמודים תקרא בשבוע?`, `${p}*7`, `בשבוע יש 7 ימים: 7 × ${p} = ${p * 7}`, 'כמה ימים יש בשבוע?', [7]); }] },
  { id: 'geo3', name: 'זוויות ומשולשים', sym: '∠', c: 'geo', desc: 'סוגי זוויות, סוגי משולשים, היקף', gens: [
    () => angleQ(true), triAnglesQ, triSidesQ,
    () => { const t = pick(['שווה־צלעות', 'שווה־שוקיים']); if (t === 'שווה־צלעות') { const s = rnd(3, 15); return wordQ(`למשולש שווה־צלעות צלע באורך ${L(s)} ס״מ. מה ההיקף שלו? (בס״מ)`, `3*${s}`, `3 × ${s} = ${3 * s}`, 'במשולש שווה־צלעות כל 3 הצלעות שוות.', [3]); } const a = rnd(5, 12), b = rnd(3, a - 1); return wordQ(`למשולש שווה־שוקיים שוק באורך ${L(a)} ס״מ ובסיס באורך ${L(b)} ס״מ. מה ההיקף? (בס״מ)`, `2*${a}+${b}`, `${a} + ${a} + ${b} = ${2 * a + b}`, 'במשולש שווה־שוקיים יש 2 שוקיים שוות.', [2]); }] },
  { id: 'area3', name: 'שטח והיקף', sym: '▦', c: 'chart', desc: 'שטח מלבן, משבצות, סמ״ר', gens: [
    () => { const w = rnd(2, 9), h = rnd(2, 6); return Q({ t: 'num', prompt: 'כל משבצת היא 1 סמ״ר. מה השטח של המלבן הצבוע? (בסמ״ר)', vis: gridSvg(w, h), ans: w * h, ex: `${w} × ${h} = ${w * h}`, hint: 'סופרים כמה משבצות בשורה, וכמה שורות, וכופלים.', data: { k: 'grid', ask: 'area' } }); },
    () => { const w = rnd(3, 9), h = rnd(2, 6); return Q({ t: 'num', prompt: 'כל משבצת היא 1 ס״מ. מה ההיקף של המלבן הצבוע? (בס״מ)', vis: gridSvg(w, h), ans: 2 * (w + h), ex: `${w} + ${h} + ${w} + ${h} = ${2 * (w + h)}`, hint: 'סופרים את הצלעות מסביב.', data: { k: 'grid', ask: 'perim' } }); },
    () => { const a = rnd(3, 12), b = rnd(2, 9); return Q({ t: 'num', prompt: 'מה השטח של המלבן? (בסמ״ר)', vis: rectSvg(a, b), ans: a * b, ex: `${a} × ${b} = ${a * b}`, hint: 'שטח מלבן = אורך × רוחב.', data: { k: 'rect', a, b, ask: 'area' } }); }] },
  { id: 'meas3', name: 'מידות, כסף וזמן', sym: '⌚', c: 'meas', desc: 'מטר וס״מ, שקל ואגורות, שעון, משך זמן', gens: [
    () => { const m = rnd(2, 9); return Math.random() < .5 ? wordQ(`כמה סנטימטרים יש ב־${L(m)} מטרים?`, `${m}*100`, `במטר 100 ס״מ: ${m} × 100 = ${m * 100}`, 'במטר אחד יש 100 סנטימטרים.', [100]) : wordQ(`כמה מטרים הם ${L(m * 100)} סנטימטרים?`, `${m * 100}/100`, `${m * 100} : 100 = ${m}`, 'במטר אחד יש 100 סנטימטרים.', [100]); },
    () => { const s = rnd(2, 9); return Math.random() < .5 ? wordQ(`כמה אגורות יש ב־${L(s)} שקלים?`, `${s}*100`, `בשקל 100 אגורות: ${s} × 100 = ${s * 100}`, 'בשקל אחד יש 100 אגורות.', [100]) : wordQ(`כמה שקלים הם ${L(s * 100)} אגורות?`, `${s * 100}/100`, `${s * 100} : 100 = ${s}`, 'בשקל אחד יש 100 אגורות.', [100]); },
    () => clockQ(5), () => durQ('min'),
    () => { const h = rnd(13, 23), ans = `${h - 12} אחר הצהריים`; const opts = shuffle([ans, `${h - 10} אחר הצהריים`, `${h - 12 + 1} אחר הצהריים`, `${h % 10 || 10} בבוקר`]); return Q({ t: 'choice', prompt: `השעה ${L(tm(h, 0))}. איך אומרים אותה בשעון של 12 שעות?`, vis: '', opts: [...new Set(opts)], ans, ex: `${h} − 12 = ${h - 12}`, hint: 'אחרי 12 בצהריים מחסרים 12.', data: { k: 'h24', h } }); }] },
  { id: 'chart3', name: 'תרשימים', sym: '▂▅▇', c: 'chart', desc: 'דיאגרמת עמודות בקפיצות גדולות', gens: [() => chartQ([20, 25, 50])] }];

/* ===== כיתה ד' (תוכנית 2006) ===== */
const G4 = [
  { id: 'num4', name: 'סדרות ומבנה המספר', sym: '123', c: 'num', desc: 'סדרות, בניית מספרים, ערך הספרה, עיגול', gens: [
    () => retry(() => { const d = pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 25, 50, 100, 250]), down = Math.random() < .4; let a = rnd(1, 40) * (d >= 25 ? d : 1) + (d < 25 ? rnd(0, 30) : 0); if (down) a += d * 6; return seqQ(a, down ? -d : d, 6, 0, 100000); }),
    () => digitsQ(true), () => digValQ(4), () => digValQ(5), () => roundQ(99999, [10, 100, 1000])] },
  { id: 'ops4', name: 'ארבע הפעולות', sym: '+×', c: 'ops', desc: 'במאונך, כפל וחילוק, מספרים עגולים, סוגריים, השוואה', gens: [
    G3[1].gens[0], G3[1].gens[1],
    () => { const a = rnd(12, 99), b = rnd(3, 9); return exprQ(`${a}*${b}`, 'כמה זה?', `פרקו: ${L(`${Math.floor(a / 10) * 10} × ${b}`)} ועוד ${L(`${a % 10} × ${b}`)}.`); },
    () => { const a = rnd(2, 9), b = rnd(2, 9) * 10; return exprQ(`${a}*${b}`, 'כפל במספר עגול:', `פותרים ${L(`${a} × ${b / 10}`)} ומוסיפים 0.`); },
    () => { const big = Math.random() < .4, n = big ? rnd(2, 60) : rnd(3, 99), m = big ? 100 : 10; return exprQ(`${n * m}/${m}`, `חילוק ב־${L(m)}:`, m === 10 ? 'מחלקים ב־10: מורידים 0 אחד מהסוף.' : 'מחלקים ב־100: מורידים 2 אפסים מהסוף.'); },
    () => { const a = rnd(2, 9), q = rnd(2, 9); return exprQ(`${a * q * 10}/${a}`, 'חילוק במספר עגול:', `פתרו קודם ${L(`${a * q} : ${a}`)} ואז הוסיפו 0.`); },
    G3[2].gens[6],
    () => { const a = rnd(2, 9), b = rnd(2, 9) * 10, left = a * b; if (Math.random() < .5) return cmpQ(`${a}*${b}`, String(Math.max(10, left + pick([-20, -10, 0, 10, 20])))); const c = rnd(2, 9), d = Math.round(left / c / 10) * 10 || 10; return cmpQ(`${a}*${b}`, `${c}*${d}`); }] },
  { id: 'mtab', name: 'השלמת לוח הכפל', sym: '▦×', c: 'num', desc: 'לוח כפל מלא 10×10, משלימים חצי מהמשבצות', gens: [() => tabQ(10, true)] },
  { id: 'eq4', name: 'משוואות ואי־שוויונות', sym: '□=', c: 'eq', desc: 'מספר חסר, מספר מתאים', gens: [
    () => { const b = rnd(12, 88), x = rnd(15, 95); return missQ(`?+${b}`, `${x + b}`, null, `אפשר לחסר: ${L(`${x + b} − ${b}`)}`, x); },
    () => { const a = rnd(40, 150), x = rnd(12, a - 10); return missQ(`${a}-?`, `${a - x}`, null, `מה צריך להוריד מ־${L(a)} כדי לקבל ${L(a - x)}?`, x); },
    () => { const a = rnd(3, 9), x = rnd(3, 10); return missQ(`${a}*?`, `${a * x}`, null, `כמה פעמים ${L(a)} נכנס ב־${L(a * x)}?`, x); },
    () => { const a = rnd(3, 9), q = rnd(3, 9); return missQ(`?/${a}`, `${q}`, null, `איזה מספר מחולק ל־${L(a)} נותן ${L(q)}? נסו ${L(`${q} × ${a}`)}.`, a * q); },
    () => { const a = rnd(3, 9), b = a * rnd(4, 9) + rnd(1, a - 1), ans = Math.floor((b - 1) / a); return Q({ t: 'num', prompt: 'מה המספר הגדול ביותר שאפשר לכתוב במשבצת?', vis: eq(`${a} × ${BOX} &lt; ${b}`), ans, ex: `${a} × ${ans} = ${a * ans} קטן מ־${b}, אבל ${a} × ${ans + 1} = ${a * (ans + 1)} כבר לא.`, hint: `נסו מספרים: ${L(`${a} × 5`)}, ${L(`${a} × 6`)}... עד שעוברים את ${L(b)}.`, data: { k: 'ineqMax', e: `${a}*?`, lt: b } }); },
    () => { const a = rnd(15, 60), b = rnd(a + 20, a + 80), lim = b - a, ok = lim + rnd(1, 15), bads = [...new Set([lim, lim - rnd(1, 8), lim - rnd(9, 20)].filter(x => x > 0))]; return Q({ t: 'choice', prompt: 'איזה מספר מתאים למשבצת?', vis: eq(`${BOX} + ${a} &gt; ${b}`), opts: shuffle([ok, ...bads].map(String)), ans: String(ok), ex: `${ok} + ${a} = ${ok + a}, וזה גדול מ־${b}.`, hint: `בדקו כל אפשרות: הוסיפו ${L(a)} וראו אם יוצא יותר מ־${L(b)}.`, data: { k: 'ineqOpt', e: `?+${a}`, gt: b } }); }] },
  { id: 'frac4', name: 'חילוק, שארית ושברים', sym: '½', c: 'div', desc: 'שארית, שבר מכמות, השוואת שברים, חיבור שברים', gens: [
    () => remQ(9), () => fracPartQ([2, 3, 4, 5, 6, 10], false), () => fracPartQ([2, 3, 4, 5], true),
    () => { const g = rnd(3, 8), k = rnd(3, 9), tot = g * k; return Math.random() < .5 ? wordQ(`${L(tot)} ילדים מתחלקים לקבוצות של ${L(g)}. כמה קבוצות יהיו?`, `${tot}/${g}`, `${tot} : ${g} = ${k}`, 'כמה פעמים הקבוצה נכנסת במספר הילדים? זה חילוק.') : wordQ(`${L(tot)} מדבקות חולקו שווה בשווה ל־${L(g)} ילדים. כמה מדבקות קיבל כל ילד?`, `${tot}/${g}`, `${tot} : ${g} = ${k}`, 'חלוקה שווה בשווה זה חילוק.'); },
    () => { const a = rnd(2, 9); let b; do { b = rnd(2, 9); } while (b === a); const ans = a < b ? '>' : '<'; return Q({ t: 'choice', prompt: 'איזה סימן מתאים?', vis: eq(`${fr(1, a)} ${BOX} ${fr(1, b)}`), opts: ['<', '=', '>'], ans, ex: `כשמחלקים ל־${Math.min(a, b)} חלקים, כל חלק גדול יותר מאשר כשמחלקים ל־${Math.max(a, b)} חלקים.`, hint: 'פיצה שמחולקת ל־2 או פיצה שמחולקת ל־8: איפה החתיכה גדולה יותר?', data: { k: 'fcmp', a: [1, a], b: [1, b] } }); },
    () => { const d = pick([4, 5, 6, 7, 8, 9, 10]), a = rnd(1, d - 2), b = rnd(1, d - 1 - a); const c = fracChoice([a + b, d], [[a + b, 2 * d], [a * b, d], [a + b + 1, d], [Math.abs(a - b) || 1, d], [a + b, d + d]]); return Q({ t: 'choice', prompt: 'כמה זה?', vis: eq(`${fr(a, d)} + ${fr(b, d)} = ${BOX}`), opts: c.opts, ans: c.ans, ex: `כשהמכנים שווים, מחברים רק את המונים: ${a} + ${b} = ${a + b}. התוצאה: ${c.ans}`, hint: 'המכנה (המספר למטה) נשאר אותו דבר.', data: { k: 'fop', op: '+', a: [a, d], b: [b, d] } }); }] },
  { id: 'word4', name: 'בעיות מילוליות', sym: '?', c: 'word', desc: 'להבין, לבחור פעולה, לפתור', gens: [...G3[4].gens,
    () => { const g = rnd(3, 6), k = rnd(4, 8), tot = g * k, a = rnd(Math.floor(tot / 3), Math.floor(tot * 2 / 3)); return wordQ(`בכיתה ${L(a)} בנים ו־${L(tot - a)} בנות. המורה חילקה את כולם לקבוצות של ${L(g)}. כמה קבוצות יש?`, `(${a}+${tot - a})/${g}`, `${a} + ${tot - a} = ${tot}, ואז ${tot} : ${g} = ${k}`, 'קודם כמה ילדים יש בכיתה (חיבור), ואחר כך חילוק לקבוצות.'); }] },
  { id: 'geo4', name: 'גאומטריה', sym: '△', c: 'geo', desc: 'מקבילים ומאונכים, זוויות, משולשים, מרובעים, היקף ושטח', gens: [
    linesQ, linesQ, () => angleQ(false), triAnglesQ, triSidesQ, quadQ,
    () => { const a = rnd(5, 15), b = rnd(2, a - 1); return Q({ t: 'num', prompt: 'מה ההיקף של המלבן? (בס״מ)', vis: rectSvg(a, b), ans: 2 * (a + b), ex: `${a} + ${b} + ${a} + ${b} = ${2 * (a + b)}`, hint: 'היקף = סכום כל הצלעות.', data: { k: 'rect', a, b, ask: 'perim' } }); },
    G3[6].gens[1], G3[6].gens[2]] },
  { id: 'meas4', name: 'אורך ושעון', sym: '⌚', c: 'meas', desc: 'סרגל, קריאת שעון, משך זמן', gens: [() => rulerQ(true), () => clockQ(5), () => durQ('min'), endTimeQ] },
  { id: 'chart4', name: 'תרשימים', sym: '▂▅▇', c: 'chart', desc: 'קריאת נתונים מתרשים עמודות', gens: [() => chartQ([1, 2, 2, 5])] }];

/* ===== כיתה ה' (תוכנית 2006) ===== */
const G5 = [
  { id: 'ops5', name: 'כפל וחילוק', sym: '×:', c: 'ops', desc: 'כפל ארוך, חילוק במספר חד־ספרתי ודו־ספרתי', gens: [
    () => { const a = rnd(12, 99), b = rnd(12, 99); return exprQ(`${a}*${b}`, 'כמה זה? (אפשר במחברת)', 'כופלים בנפרד באחדות ובעשרות של המספר השני, ומחברים.'); },
    () => { const a = rnd(102, 999), b = rnd(3, 9); return exprQ(`${a}*${b}`, 'כמה זה?', 'פרקו את המספר הגדול למאות, עשרות ואחדות.'); },
    () => { const b = rnd(3, 9), q = rnd(21, 299); return exprQ(`${b * q}/${b}`, 'כמה זה?', 'חילוק ארוך: מתחילים מהספרה השמאלית.'); },
    () => { const b = rnd(11, 25), q = rnd(12, 60); return exprQ(`${b * q}/${b}`, 'חילוק במספר דו־ספרתי:', `אומדן: כמה פעמים ${L(b)} נכנס? נסו כפולות של ${L(b)}.`); },
    () => { const a = rnd(2, 9), b = rnd(11, 40), c = rnd(2, 9), d = rnd(5, Math.min(60, a * b - 1)); return exprQ(`${a}*${b}-${d}+${c}`, 'סדר פעולות: כמה זה?', 'קודם כפל, ואחר כך חיבור וחיסור משמאל לימין.'); }] },
  { id: 'frac5', name: 'שברים', sym: '½', c: 'div', desc: 'צמצום, הרחבה, השוואה, חיבור וחיסור, מעורבים', gens: [
    () => { const d0 = pick([2, 3, 4, 5, 6, 7, 8, 9, 10]), n0 = rnd(1, d0 - 1), g0 = gcd(n0, d0), n = n0 / g0, d = d0 / g0, k = rnd(2, 6); const opts = shuffle([`${n}/${d}`, `${n * k}/${d * k}`, `${n + 1}/${d + 1}`, `${n}/${d * k}`].filter((x, i, a) => a.indexOf(x) === i)); return Q({ t: 'choice', prompt: 'צמצמו עד הסוף:', vis: eq(fr(n * k, d * k) + ' = ' + BOX), opts, ans: `${n}/${d}`, ex: `מחלקים את המונה ואת המכנה ב־${k}: ${n * k}:${k} = ${n}, ${d * k}:${k} = ${d}.`, hint: 'חפשו מספר שמחלק גם את המונה וגם את המכנה.', data: { k: 'simplify', n: n * k, d: d * k } }); },
    () => { const d = pick([2, 3, 4, 5, 6, 8, 10]), n = rnd(1, d - 1), k = rnd(2, 6); return Q({ t: 'num', prompt: 'הרחיבו: איזה מספר חסר במונה?', vis: eq(`${fr(n, d)} = ${fr(BOX, d * k)}`), ans: n * k, ex: `${d} × ${k} = ${d * k}, ולכן גם ${n} × ${k} = ${n * k}.`, hint: `פי כמה המכנה גדל? מכפילים גם את המונה באותו מספר.`, data: { k: 'expand', n, d, D: d * k } }); },
    () => { const pairs = [[2, 4], [2, 6], [3, 6], [4, 8], [2, 8], [3, 9], [5, 10], [2, 10], [4, 12], [3, 12], [6, 12]]; const [d1, d2] = pick(pairs); const a = rnd(1, d1 - 1), b = rnd(1, d2 - 1); const ans = a * d2 > b * d1 ? '>' : a * d2 < b * d1 ? '<' : '='; return Q({ t: 'choice', prompt: 'איזה סימן מתאים?', vis: eq(`${fr(a, d1)} ${BOX} ${fr(b, d2)}`), opts: ['<', '=', '>'], ans, ex: `מרחיבים למכנה ${d2}: ${fr(a, d1)} = ${fr(a * d2 / d1, d2)}. עכשיו משווים את המונים.`, hint: 'מביאים את שני השברים לאותו מכנה.', data: { k: 'fcmp', a: [a, d1], b: [b, d2] } }); },
    () => { const [d1, d2] = pick([[2, 4], [2, 6], [3, 6], [4, 8], [2, 8], [3, 9], [5, 10], [2, 10], [4, 12], [3, 12]]), a = rnd(1, d1 - 1), b = rnd(1, d2 - 1), op = Math.random() < .6 || a * d2 / d1 <= b ? '+' : '-'; const [rn, rd] = op === '+' ? [a * d2 / d1 + b, d2] : [a * d2 / d1 - b, d2]; const c = fracChoice([rn, rd], [[a + b, d1 + d2], [a + b, d2], [rn + 1, rd], [Math.abs(rn - 1) || 2, rd], [rn, rd * 2], [a * b, d2]]); return Q({ t: 'choice', prompt: 'כמה זה?', vis: eq(`${fr(a, d1)} ${op === '+' ? '+' : '−'} ${fr(b, d2)} = ${BOX}`), opts: c.opts, ans: c.ans, ex: `${fr(a, d1)} = ${fr(a * d2 / d1, d2)}. ${a * d2 / d1} ${op === '+' ? '+' : '−'} ${b} = ${rn}, כלומר ${fr(rn, rd)} = ${c.ans}.`, hint: 'קודם מביאים לאותו מכנה, ורק אז מחברים או מחסרים את המונים.', data: { k: 'fop', op, a: [a, d1], b: [b, d2] } }); },
    () => { const d = pick([2, 3, 4, 5, 6, 8]), w = rnd(1, 4), n = rnd(1, d - 1); return Q({ t: 'num', prompt: 'הפכו לשבר מדומה: איזה מספר חסר במונה?', vis: eq(`${w}${fr(n, d)} = ${fr(BOX, d)}`), ans: w * d + n, ex: `${w} × ${d} + ${n} = ${w * d + n}`, hint: `בכל שלם יש ${L(d)} חלקים. כמה חלקים יש ב־${L(w)} שלמים, ועוד ${L(n)}?`, data: { k: 'mixed', w, n, d } }); },
    () => fracPartQ([3, 4, 5, 6, 8, 10], true)] },
  { id: 'dec5', name: 'שברים עשרוניים', sym: '0.5', c: 'eq', desc: 'קריאה, השוואה, חיבור וחיסור', gens: [
    () => { const a = rnd(11, 999) / 100, p = pick([1, 2]), s = a.toFixed(2), ans = +s[s.length - (p === 1 ? 2 : 1)]; return Q({ t: 'num', prompt: `מה ספרת ה${p === 1 ? 'עשיריות' : 'מאיות'} במספר ${L(s)}?`, vis: '', ans, ex: `אחרי הנקודה: הספרה הראשונה היא העשיריות והשנייה המאיות. ב־${s} ספרת ה${p === 1 ? 'עשיריות' : 'מאיות'} היא ${ans}.`, hint: 'הספרה הראשונה אחרי הנקודה היא העשיריות, השנייה היא המאיות.', data: { k: 'decdig', s, p } }); },
    () => { const a = rnd(1, 99) / 10 + (Math.random() < .5 ? rnd(0, 9) / 100 : 0), b = Math.random() < .2 ? a : rnd(1, 99) / 10 + (Math.random() < .5 ? rnd(0, 9) / 100 : 0); return cmpQ(String(r2(a)), String(r2(b)), null, 'משווים קודם את השלמים, אחר כך את העשיריות, ואחר כך את המאיות.'); },
    () => { const a = rnd(10, 999) / 100, b = rnd(10, 999) / 100; return exprQ(`${a}+${b}`, 'כמה זה?', 'כותבים נקודה מתחת לנקודה, ומחברים כרגיל.', { dec: true }); },
    () => { const a = rnd(200, 999) / 100, b = rnd(10, Math.floor(a * 100) - 10) / 100; return exprQ(`${a}-${b}`, 'כמה זה?', 'כותבים נקודה מתחת לנקודה, ומחסרים כרגיל.', { dec: true }); },
    () => { const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 10], [7, 10], [1, 10], [9, 100], [23, 100]]), ans = n / d; return Q({ t: 'num', prompt: 'כתבו כשבר עשרוני:', vis: eq(`${fr(n, d)} = ${BOX}`), ans, dec: true, ex: `${fr(n, d)} = ${ans}`, hint: 'הרחיבו את השבר כך שהמכנה יהיה 10 או 100.', data: { k: 'f2d', n, d } }); }] },
  { id: 'pct5', name: 'אחוזים וממוצע', sym: '%', c: 'word', desc: '10%, 25%, 50%, ממוצע', gens: [
    () => { const p = pick([10, 25, 50]), base = p === 10 ? rnd(2, 40) * 10 : p === 25 ? rnd(2, 40) * 4 : rnd(2, 99) * 2; return wordQ(`כמה זה ${L(p + '%')} מ־${L(base)}?`, `${base}*${p}/100`, `${p}% = ${p === 10 ? 'עשירית' : p === 25 ? 'רבע' : 'חצי'}, ולכן ${base} : ${100 / p} = ${base * p / 100}`, p === 50 ? '50% זה חצי.' : p === 25 ? '25% זה רבע.' : '10% זה עשירית: מחלקים ב־10.', [100]); },
    () => { const n = rnd(3, 5), avg = rnd(5, 30); let vals; do { vals = [...Array(n - 1)].map(() => rnd(Math.max(1, avg - 10), avg + 10)); vals.push(avg * n - vals.reduce((a, b) => a + b, 0)); } while (vals[n - 1] < 1); return Q({ t: 'num', prompt: `מה הממוצע של המספרים ${vals.map(L).join(', ')}?`, vis: '', ans: avg, ex: `${vals.join(' + ')} = ${avg * n}, ו־${avg * n} : ${n} = ${avg}`, hint: 'מחברים את כל המספרים ומחלקים בכמה מספרים יש.', data: { k: 'mean', vals } }); }] },
  { id: 'geo5', name: 'מרובעים ושטחים', sym: '▱', c: 'geo', desc: 'סוגי מרובעים, שטח משולש, מקבילית וטרפז', gens: [
    quadQ,
    () => { const b = rnd(3, 14), h = rnd(2, 10), hh = (b * h) % 2 ? h + 1 : h, off = rnd(-1, b + 1); return Q({ t: 'num', prompt: 'מה השטח של המשולש? (בסמ״ר)', vis: triBHSvg(b, hh, off), ans: b * hh / 2, ex: `בסיס × גובה : 2 = ${b} × ${hh} : 2 = ${b * hh / 2}`, hint: 'שטח משולש = בסיס כפול גובה, לחלק ב־2.', data: { k: 'area', shape: 'tri', b, h: hh } }); },
    () => { const b = rnd(3, 14), h = rnd(2, 10); return wordQ(`למקבילית בסיס באורך ${L(b)} ס״מ וגובה ${L(h)} ס״מ. מה השטח שלה? (בסמ״ר)`, `${b}*${h}`, `${b} × ${h} = ${b * h}`, 'שטח מקבילית = בסיס כפול הגובה אליו.'); },
    () => { let a = rnd(3, 12), b = rnd(3, 12), h = rnd(2, 8); if ((a + b) * h % 2) h++; return wordQ(`לטרפז בסיסים באורך ${L(a)} ס״מ ו־${L(b)} ס״מ, וגובה ${L(h)} ס״מ. מה השטח שלו? (בסמ״ר)`, `(${a}+${b})*${h}/2`, `(${a} + ${b}) × ${h} : 2 = ${(a + b) * h / 2}`, 'שטח טרפז = (בסיס + בסיס) × גובה : 2', [2]); }] },
  { id: 'word5', name: 'בעיות מילוליות', sym: '?', c: 'word', desc: 'בעיות בכמה שלבים', gens: [
    () => { const n = rnd(3, 8), p = rnd(12, 45), m = rnd(2, 4); return wordQ(`לטיול נסעו ${L(n)} אוטובוסים, ובכל אוטובוס ${L(p)} ילדים. כל ילד קיבל ${L(m)} בקבוקי מים. כמה בקבוקים חולקו?`, `${n}*${p}*${m}`, `${n} × ${p} = ${n * p} ילדים, ו־${n * p} × ${m} = ${n * p * m}`, 'קודם כמה ילדים, ואחר כך כמה בקבוקים.'); },
    () => { const p = rnd(25, 90), n = rnd(3, 6), s = n * p + rnd(10, 200); return wordQ(`לנועה ${N(s)} ₪. היא קנתה ${L(n)} משחקים, כל משחק ב־${L(p)} ₪. כמה כסף נשאר לה?`, `${s}-${n}*${p}`, `${n} × ${p} = ${n * p}, ו־${s} − ${n * p} = ${s - n * p}`, 'קודם כמה עלו כל המשחקים, ואחר כך כמה נשאר.'); },
    () => { const per = rnd(12, 30), bags = rnd(4, 12), extra = rnd(1, per - 1), tot = per * bags + extra; return wordQ(`יש ${N(tot)} סוכריות. אורזים אותן בשקיות של ${L(per)}. כמה שקיות מלאות יהיו?`, `Math.floor(${tot}/${per})`, `${tot} : ${per} = ${bags} ושארית ${extra}. יש ${bags} שקיות מלאות.`, 'מחלקים, ומה שנשאר לא ממלא שקית.'); }] },
  { id: 'chart5', name: 'תרשימים', sym: '▂▅▇', c: 'chart', desc: 'קריאת נתונים מתרשים', gens: [() => chartQ([2, 5, 10, 20])] }];

/* ===== כיתה ו' (תוכנית 2006) ===== */
const G6 = [
  { id: 'frac6', name: 'פעולות בשברים', sym: '½', c: 'div', desc: 'כפל וחילוק שברים, חלק מכמות, מציאת השלם', gens: [
    () => { const d = pick([2, 3, 4, 5, 6, 8]), n = rnd(1, d - 1), w = rnd(2, 9); const c = fracChoice([n * w, d], [[n * w, d * w], [n + w, d], [n * w + 1, d], [n, d * w], [n * w, d + 1]]); return Q({ t: 'choice', prompt: 'כמה זה?', vis: eq(`${w} × ${fr(n, d)} = ${BOX}`), opts: c.opts, ans: c.ans, ex: `${w} × ${n} = ${n * w}, כלומר ${fr(n * w, d)} = ${c.ans}.`, hint: 'כופלים רק את המונה במספר השלם.', data: { k: 'fop', op: '*', a: [w, 1], b: [n, d] } }); },
    () => { const d1 = pick([2, 3, 4, 5]), d2 = pick([2, 3, 4, 5, 6]), a = rnd(1, d1 - 1), b = rnd(1, d2 - 1); const c = fracChoice([a * b, d1 * d2], [[a + b, d1 + d2], [a * b, d1 + d2], [a * d2, b * d1], [a + b, d1 * d2], [a * b + 1, d1 * d2]]); return Q({ t: 'choice', prompt: 'כמה זה?', vis: eq(`${fr(a, d1)} × ${fr(b, d2)} = ${BOX}`), opts: c.opts, ans: c.ans, ex: `מונה כפול מונה ומכנה כפול מכנה: ${fr(a * b, d1 * d2)} = ${c.ans}.`, hint: 'בכפל שברים: מונה × מונה, מכנה × מכנה.', data: { k: 'fop', op: '*', a: [a, d1], b: [b, d2] } }); },
    () => { const d = pick([2, 3, 4, 5, 6, 8, 10]), w = rnd(2, 9); return Q({ t: 'num', prompt: 'כמה זה?', vis: eq(`${w} : ${fr(1, d)} = ${BOX}`), ans: w * d, ex: `בכל שלם יש ${d} חלקים של ${fr(1, d)}, ולכן ב־${w} שלמים יש ${w} × ${d} = ${w * d}.`, hint: `כמה פעמים ${fr(1, d)} נכנס בשלם אחד?`, data: { k: 'fop', op: '/', a: [w, 1], b: [1, d], num: true } }); },
    () => { const d = pick([2, 3, 4, 5, 6]), n = rnd(1, d - 1), w = rnd(2, 6); const c = fracChoice([n, d * w], [[n * w, d], [n, d + w], [n * w, d * w], [n + 1, d * w]]); return Q({ t: 'choice', prompt: 'כמה זה?', vis: eq(`${fr(n, d)} : ${w} = ${BOX}`), opts: c.opts, ans: c.ans, ex: `מחלקים ל־${w} חלקים: ${fr(n, d * w)} = ${c.ans}.`, hint: `לחלק ב־${L(w)} זה כמו לכפול ב־${fr(1, w)}.`, data: { k: 'fop', op: '/', a: [n, d], b: [w, 1] } }); },
    () => fracPartQ([3, 4, 5, 6, 8, 10], true),
    () => { const d = pick([3, 4, 5, 6, 8]), n = rnd(1, d - 1), k = rnd(2, 9), whole = d * k, part = n * k; return Q({ t: 'num', prompt: `${fr(n, d)} מהילדים בשכבה הם ${L(part)} ילדים. כמה ילדים יש בשכבה?`, vis: '', ans: whole, ex: `${fr(1, d)} מהילדים: ${part} : ${n} = ${k}. כל השכבה: ${k} × ${d} = ${whole}.`, hint: `מוצאים קודם כמה זה ${fr(1, d)}, ואז כופלים ב־${L(d)}.`, data: { k: 'fwhole', n, d, part } }); }] },
  { id: 'dec6', name: 'שברים עשרוניים', sym: '0.5', c: 'eq', desc: 'כפל וחילוק ב־10, 100, 1,000, כפל וחילוק עשרוניים', gens: [
    () => { const a = rnd(11, 9999) / 100, m = pick([10, 100, 1000]), mul = Math.random() < .5; return exprQ(mul ? `${a}*${m}` : `${a}/${m}`, 'כמה זה?', mul ? `בכפל ב־${L(m)} הנקודה זזה ${String(m).length - 1} מקומות ימינה.` : `בחילוק ב־${L(m)} הנקודה זזה ${String(m).length - 1} מקומות שמאלה.`, { dec: true }); },
    () => { const a = rnd(11, 99) / 10, b = rnd(2, 9); return exprQ(`${a}*${b}`, 'כמה זה?', 'כופלים כאילו אין נקודה, ומחזירים ספרה אחת אחרי הנקודה.', { dec: true }); },
    () => { const a = rnd(1, 9) / 10, b = rnd(1, 9) / 10; return exprQ(`${a}*${b}`, 'כמה זה?', 'כופלים את הספרות, ובתוצאה יהיו 2 ספרות אחרי הנקודה.', { dec: true }); },
    () => { const b = rnd(2, 9), q = rnd(11, 99) / 10; return exprQ(`${r2(b * q)}/${b}`, 'כמה זה?', 'מחלקים כרגיל, ושמים את הנקודה בתוצאה מעל הנקודה שבמספר.', { dec: true }); }] },
  { id: 'pct6', name: 'אחוזים', sym: '%', c: 'word', desc: 'אחוז מכמות, כמה אחוזים, הנחות', gens: [
    () => { const p = pick([10, 20, 25, 30, 40, 50, 60, 75, 80]), base = rnd(2, 30) * (p % 20 === 0 ? 5 : p === 25 || p === 75 ? 4 : 10); return wordQ(`כמה זה ${L(p + '%')} מ־${L(base)}?`, `${base}*${p}/100`, `${base} × ${p} : 100 = ${base * p / 100}`, 'מוצאים קודם 1% או 10%, ואז כופלים.', [100]); },
    () => { const tot = pick([20, 25, 40, 50, 200]), p = pick([10, 20, 25, 40, 50, 60, 75, 80]), part = tot * p / 100; if (!Number.isInteger(part)) return G6[2].gens[0](); return wordQ(`בכיתה ${L(tot)} ילדים. ${L(part)} מהם ${pick(['משחקים כדורגל', 'מנגנים', 'רוקדים'])}. כמה אחוזים מהכיתה זה?`, `${part}/${tot}*100`, `${part} : ${tot} = ${fr(part, tot)}, וזה ${p}%.`, 'כתבו את החלק כשבר, והרחיבו למכנה 100.', [100]); },
    () => { const price = rnd(4, 40) * 10, p = pick([10, 20, 25, 50]); return wordQ(`חולצה עולה ${L(price)} ₪. יש הנחה של ${L(p + '%')}. כמה צריך לשלם?`, `${price}-${price}*${p}/100`, `ההנחה: ${price * p / 100} ₪. משלמים ${price} − ${price * p / 100} = ${price - price * p / 100}.`, 'מחשבים כמה שקלים ההנחה, ומחסרים מהמחיר.', [100]); }] },
  { id: 'ratio6', name: 'יחס וקנה מידה', sym: ':', c: 'num', desc: 'חלוקה לפי יחס, קנה מידה, מהירות', gens: [
    () => { const a = rnd(1, 5), b = rnd(1, 5), k = rnd(2, 12), tot = (a + b) * k, k1 = pick(KIDS), k2 = pick(KIDS.filter(x => x !== k1)); return wordQ(`${k1} ו${k2} חילקו ${L(tot)} קלפים ביחס ${L(`${a}:${b}`)}. כמה קלפים קיבל${v(k1, '', 'ה')} ${k1}?`, `${tot}/(${a}+${b})*${a}`, `יש ${a} + ${b} = ${a + b} חלקים. כל חלק: ${tot} : ${a + b} = ${k}. ל${k1}: ${a} × ${k} = ${a * k}.`, 'סופרים כמה חלקים יש בסך הכול, ומוצאים כמה שווה חלק אחד.'); },
    () => { const sc = pick([100, 1000]), cm = rnd(2, 15); return wordQ(`בשרטוט בקנה מידה ${L(`1:${sc}`)}, אורך החדר ${L(cm)} ס״מ. מה האורך במציאות, במטרים?`, `${cm}*${sc}/100`, `${cm} × ${sc} = ${cm * sc} ס״מ, וזה ${cm * sc / 100} מטרים.`, `כל ס״מ בשרטוט הוא ${L(sc)} ס״מ במציאות. במטר יש 100 ס״מ.`, [100]); },
    () => { const sp = pick([40, 50, 60, 70, 80, 90]), t = rnd(2, 5), w = rnd(1, 3); if (w === 1) return wordQ(`מכונית נוסעת במהירות ${L(sp)} קמ״ש. כמה קילומטרים תעבור ב־${L(t)} שעות?`, `${sp}*${t}`, `${sp} × ${t} = ${sp * t}`, 'דרך = מהירות × זמן.'); if (w === 2) return wordQ(`רכבת עברה ${L(sp * t)} ק״מ ב־${L(t)} שעות. מה המהירות שלה, בקמ״ש?`, `${sp * t}/${t}`, `${sp * t} : ${t} = ${sp}`, 'מהירות = דרך : זמן.'); return wordQ(`אוטובוס נוסע במהירות ${L(sp)} קמ״ש. כמה שעות ייקח לו לעבור ${L(sp * t)} ק״מ?`, `${sp * t}/${sp}`, `${sp * t} : ${sp} = ${t}`, 'זמן = דרך : מהירות.'); }] },
  { id: 'geo6', name: 'מעגל, שטח ונפח', sym: '◯', c: 'geo', desc: 'היקף ושטח מעגל, שטחים, נפח תיבה', gens: [
    () => { const r = rnd(1, 10), d = Math.random() < .4, ans = r2(2 * 3.14 * r); return Q({ t: 'num', prompt: `מה ההיקף של המעגל? (π = ${L('3.14')}, בס״מ)`, vis: circleSvg(r, d), ans, dec: true, ex: `היקף = קוטר × π = ${2 * r} × 3.14 = ${ans}`, hint: d ? 'היקף מעגל = קוטר × 3.14' : 'הקוטר הוא פעמיים הרדיוס. היקף = קוטר × 3.14', data: { k: 'circle', r, ask: 'C' } }); },
    () => { const r = rnd(1, 10), ans = r2(3.14 * r * r); return Q({ t: 'num', prompt: `מה השטח של המעגל? (π = ${L('3.14')}, בסמ״ר)`, vis: circleSvg(r, false), ans, dec: true, ex: `שטח = רדיוס × רדיוס × π = ${r} × ${r} × 3.14 = ${ans}`, hint: 'שטח מעגל = רדיוס × רדיוס × 3.14', data: { k: 'circle', r, ask: 'A' } }); },
    () => { const a = rnd(2, 12), b = rnd(2, 10), c = rnd(2, 10); return wordQ(`לתיבה אורך ${L(a)} ס״מ, רוחב ${L(b)} ס״מ וגובה ${L(c)} ס״מ. מה הנפח שלה? (בסמ״ק)`, `${a}*${b}*${c}`, `${a} × ${b} × ${c} = ${a * b * c}`, 'נפח תיבה = אורך × רוחב × גובה.'); },
    G5[4].gens[1], G5[4].gens[2]] },
  { id: 'data6', name: 'ממוצע והסתברות', sym: '🎲', c: 'chart', desc: 'ממוצע, סיכוי, תרשימים', gens: [
    G5[3].gens[1],
    () => { const r = rnd(1, 6), b = rnd(1, 6), g = rnd(0, 4), tot = r + b + g, col = pick(['אדום', 'כחול']), fav = col === 'אדום' ? r : b; const c = fracChoice([fav, tot], [[fav, tot - fav || 1], [1, tot], [tot - fav, tot], [fav, tot + 1], [1, fav + 1]]); return Q({ t: 'choice', prompt: `בשקית ${L(r)} כדורים אדומים, ${L(b)} כחולים${g ? ` ו־${L(g)} ירוקים` : ''}. מוציאים כדור אחד בלי להסתכל. מה הסיכוי שהוא ${col}?`, vis: '', opts: c.opts, ans: c.ans, ex: `${fav} כדורים מתאימים מתוך ${tot}: ${fr(fav, tot)} = ${c.ans}.`, hint: 'סיכוי = מספר האפשרויות המתאימות : מספר כל האפשרויות.', data: { k: 'prob', fav, tot, counts: [r, b, g] } }); },
    () => chartQ([5, 10, 20, 50])] },
  { id: 'word6', name: 'בעיות מילוליות', sym: '?', c: 'word', desc: 'בעיות בכמה שלבים', gens: [...G5[5].gens,
    () => { const n = rnd(3, 8), p = rnd(15, 60), d = pick([10, 20, 25, 50]), tot = n * p; if (tot * d % 100) return G5[5].gens[0](); return wordQ(`קנו ${L(n)} כרטיסים, כל כרטיס ב־${L(p)} ₪, וקיבלו הנחה של ${L(d + '%')} על הכול. כמה שילמו?`, `${n}*${p}*(100-${d})/100`, `${n} × ${p} = ${tot}. ${d}% מ־${tot} = ${tot * d / 100}. משלמים ${tot} − ${tot * d / 100} = ${tot - tot * d / 100}.`, 'קודם המחיר המלא, אחר כך ההנחה.', [100]); }] }];

const GRADES = {
  1: { name: "כיתה א'", topics: G1 }, 2: { name: "כיתה ב'", topics: G2 }, 3: { name: "כיתה ג'", topics: G3 },
  4: { name: "כיתה ד'", topics: G4 }, 5: { name: "כיתה ה'", topics: G5 }, 6: { name: "כיתה ו'", topics: G6 } };

/* שאלה אחת מנושא. כל שאלה מסומנת בכיתה ובנושא. */
function generate(grade, topicId) {
  const T = GRADES[grade].topics.find(t => t.id === topicId); if (!T) throw new Error('no topic ' + topicId);
  const q = pick(T.gens)(); q.grade = grade; q.topic = topicId; return q;
}
/* סבב: נושא אחד, או כמה נושאים מעורבבים (מבחן לדוגמה / מבחן מותאם) */
function makeRound(grade, topicIds, n = 10) {
  const ids = topicIds.length === 1 ? Array(n).fill(topicIds[0]) : shuffle([...Array(n)].map((_, i) => topicIds[i % topicIds.length]));
  const seen = new Set(), out = [];
  for (const id of ids) { let q, k = 0; do { q = generate(grade, id); k++; } while (seen.has(q.prompt + q.vis + q.ans) && k < 30); seen.add(q.prompt + q.vis + q.ans); out.push(q); }
  return out;
}

const API = { SCHOOL_YEAR, PROGRAM, GRADES, generate, makeRound, tableBoard, fstr, fhtml, util: { L, fr, E, tm, fmt, gcd } };
root.MATH = API;
if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
