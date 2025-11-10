# 🎯 מתקן את ה-404? התחל כאן!

## 📖 קריאה ראשונה - 2 דקות

האתר מחזיר **404** כי הקובץ `.htaccess` לא הועתק לשרת.

---

## ⚡ תיקון מהיר (3 צעדים)

### 1. משוך את הקוד החדש
```bash
git pull origin main
```

### 2. בנה את הפרויקט
```bash
npm run build
```
✅ הסקריפט יבדוק אוטומטית ש-.htaccess קיים

### 3. בחר איך להעלות:

#### אופציה א' - אוטומטי (מומלץ):
```bash
npm run deploy
```

#### אופציה ב' - סקריפט:
```bash
./deploy-fix-htaccess.sh
```

#### אופציה ג' - ידני דרך cPanel/FTP:
1. פתח cPanel
2. עבור ל-`public_html`
3. העלה את **כל** תיקיית `dist/` (כולל `.htaccess`)

---

## 📚 מדריכים מפורטים

| קובץ | מה זה? |
|------|--------|
| [`PULL_AND_DEPLOY.md`](./PULL_AND_DEPLOY.md) | הוראות משיכה והעלאה מהירות |
| [`README_404_FIX.md`](./README_404_FIX.md) | סקירה כללית של התיקון |
| [`FIX_404_NOW.md`](./FIX_404_NOW.md) | פתרונות מפורטים לכל סוג שרת |
| [`DEPLOYMENT_INSTRUCTIONS.md`](./DEPLOYMENT_INSTRUCTIONS.md) | הדרכה מלאה |

---

## 🧪 בדיקה שהתיקון עבד

נסה את ה-URLs הבאים - כולם צריכים לעבוד:

✅ https://childapp2.srv989497.hstgr.cloud/
✅ https://childapp2.srv989497.hstgr.cloud/dev
✅ https://childapp2.srv989497.hstgr.cloud/any-url

אם יש 404 - קרא [`FIX_404_NOW.md`](./FIX_404_NOW.md)

---

## 🔧 סקריפטים שנוספו

| סקריפט | פקודה | מה זה עושה |
|--------|-------|------------|
| Build + וידוא | `npm run build` | בונה ובודק ש-.htaccess קיים |
| Deploy | `npm run deploy` | בונה ומעלה אוטומטית לשרת |
| בדיקה בלבד | `node verify-build.js` | בודק ש-dist/ מוכן |

---

**זהו! עכשיו תמשוך, תבנה, ותעלה 🚀**

אם יש בעיות, פתח issue או קרא את המדריכים המפורטים.
