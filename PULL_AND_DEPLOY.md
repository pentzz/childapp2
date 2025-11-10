# 🚀 משיכה מ-GitHub והעלאה לשרת

## הוראות מהירות (ב-Cursor)

### 1️⃣ משוך את השינויים מ-GitHub
```bash
git pull origin main
```

### 2️⃣ בנה את הפרויקט
```bash
npm run build
```
הסקריפט יבדוק אוטומטית ש-.htaccess קיים!

### 3️⃣ העלה לשרת

#### אופציה א': דרך הסקריפט
```bash
npm run deploy
```

#### אופציה ב': ידנית
```bash
./deploy-fix-htaccess.sh
```

---

## ✅ תוצאה צפויה

אחרי ההעלאה, כל ה-URLs הבאים צריכים לעבוד:
- ✅ https://childapp2.srv989497.hstgr.cloud/
- ✅ https://childapp2.srv989497.hstgr.cloud/dev
- ✅ https://childapp2.srv989497.hstgr.cloud/any-url

---

## 🔧 אם עדיין יש 404

1. בדוק שהקובץ הועתק:
   ```bash
   ssh user@server ls -la /path/to/public_html/.htaccess
   ```

2. קרא את המדריכים:
   - [`README_404_FIX.md`](./README_404_FIX.md) - קריאה מהירה
   - [`FIX_404_NOW.md`](./FIX_404_NOW.md) - פתרון מפורט
   - [`DEPLOYMENT_INSTRUCTIONS.md`](./DEPLOYMENT_INSTRUCTIONS.md) - הדרכה מלאה

---

**זהו! עכשיו תמשוך ותעלה 🎉**
