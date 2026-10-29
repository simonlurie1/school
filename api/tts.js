/* משבצת — הקראה בקול איכותי (Google Text-to-Speech), כפונקציה בשרת של Vercel.
 * המפתח נשמר רק בשרת: משתנה סביבה GOOGLE_TTS_API_KEY בהגדרות הפרויקט ב־Vercel. הוא לא מגיע לדפדפן.
 * GET /api/tts?lang=he|en&text=...  →  MP3
 * אותו טקסט נשמר במטמון של Vercel לשנה, כך שכל משפט עולה כסף פעם אחת בלבד.
 * בלי מפתח (או אם Google לא עונה) מוחזרת שגיאה, והדף עובר לקול של הדפדפן.
 */
const VOICES = {
  he: { languageCode: 'he-IL', name: 'he-IL-Wavenet-A', speakingRate: 0.9 },
  en: { languageCode: 'en-US', name: 'en-US-Wavenet-F', speakingRate: 0.85 }
};
const MAX_CHARS = 400;

module.exports = async (req, res) => {
  if (req.query.diag === 'names') return res.json({ env: process.env.VERCEL_ENV, names: Object.keys(process.env).filter(k => /TTS|GOOGLE/i.test(k)) }); // זמני: שמות בלבד, בלי ערכים
  const v = VOICES[req.query.lang], text = String(req.query.text || '').trim();
  if (!v || !text || text.length > MAX_CHARS) return res.status(400).end();
  const key = process.env.GOOGLE_TTS_API_KEY || process.env.VITE_GOOGLE_TTS_API_KEY; // השם השני: כמו בפרויקטים של Vite (כאן הוא לא נחשף לדפדפן)
  if (!key) return res.status(503).end();
  try {
    const r = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: v.languageCode, name: v.name },
        audioConfig: { audioEncoding: 'MP3', speakingRate: v.speakingRate }
      })
    });
    if (!r.ok) return res.status(502).end();
    const { audioContent } = await r.json();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, immutable');
    res.end(Buffer.from(audioContent, 'base64'));
  } catch (e) {
    res.status(502).end();
  }
};
