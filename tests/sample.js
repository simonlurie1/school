/* דוגמאות שאלות מכל נושא בכל כיתה, כטקסט קריא, לבדיקה ידנית (או של סוכן) שהתוכן מתאים לכיתה.
 *
 *   node tests/sample.js                 כל המקצועות, 3 דוגמאות לכל מחולל שאלות
 *   node tests/sample.js math 3          רק חשבון כיתה ג'
 *   node tests/sample.js hebrew all 6    עברית, כל הכיתות, 6 דוגמאות
 *
 * לכל מחולל מודפס גם המספר הגדול ביותר שהופיע ב־300 שאלות, כדי לראות את טווח המספרים. */
const path = require('path');
globalThis.window = globalThis;
const ENGINES = { math: 'MATH', hebrew: 'HEBREW', english: 'ENGLISH' };
const [subjArg = 'all', gradeArg = 'all', perArg = '3'] = process.argv.slice(2);
const PER = Math.max(1, +perArg || 3);
const strip = s => String(s == null ? '' : s).replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
const nums = s => (s.replace(/(\d),(\d{3})/g, '$1$2').match(/\d+(\.\d+)?/g) || []).map(Number);

for (const [subj, name] of Object.entries(ENGINES)) {
  if (subjArg !== 'all' && subjArg !== subj) continue;
  require(path.join(__dirname, '..', subj + '.js'));
  const M = globalThis[name];
  console.log(`\n################ ${subj}`);
  for (const g of Object.keys(M.GRADES)) {
    if (gradeArg !== 'all' && gradeArg !== g) continue;
    console.log(`\n======== ${subj} כיתה ${g}`);
    for (const t of M.GRADES[g].topics) {
      console.log(`\n## ${t.id} | ${strip(t.name)} | ${strip(t.desc)}`);
      t.gens.forEach((gen, i) => {
        const seen = new Set(), ex = []; let max = 0, kind = '-';
        for (let k = 0; k < 300; k++) {
          let q; try { q = gen(); } catch (e) { ex.push(`!! error: ${e.message}`); break; }
          const text = strip(q.prompt) + (q.vis ? ' | ' + strip(q.vis).slice(0, 160) : '') + (q.vg ? ' | ' + q.vg.slice(0, 2).join(' ' + (q.vg[2] || '') + ' ') : '');
          if (q.data) kind = q.data.k;
          if (q.data && q.data.k !== 'mtab') max = Math.max(max, ...nums(text), 0);
          const line = `${text}  →  ${strip(q.ans)}${q.opts ? `   [${q.opts.map(strip).join(' / ')}]` : ''}`;
          if (ex.length < PER && !seen.has(line)) { seen.add(line); ex.push(line); }
        }
        console.log(`  מחולל ${i} (סוג: ${kind}, מספר מרבי: ${max})`);
        ex.forEach(l => console.log('    • ' + l.slice(0, 300)));
      });
    }
  }
}
