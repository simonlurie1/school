# משבצת

תרגול מתמטיקה לכיתות א'–ו' לפי תוכנית הלימודים. אתר סטטי (HTML + JavaScript), בלי שלב build.

- `index.html` – הממשק: בחירת כיתה, נושאים, שאלות, סיכום והקראה קולית.
- `math.js` – מנוע השאלות לכל הכיתות (`window.MATH`).

## הרצה מקומית

```bash
python -m http.server 8000
```

ואז לפתוח http://localhost:8000

## פרסום

ב־Vercel: לייבא את הריפו, Framework Preset = Other, בלי build command. כל push ל־`main` מתפרסם אוטומטית.
