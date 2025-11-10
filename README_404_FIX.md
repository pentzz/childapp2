# 🚨 תיקון בעיית 404 - קריאה מהירה

## הבעיה
האתר מחזיר **404 Not Found** כשניגשים ל-`/dev` או כל route אחר.

## מה קרה?
הקובץ `.htaccess` **קיים ב-`dist/`** אבל לא הועתק לשרת.

## 🔧 הפתרון (בחר אחד):

### אופציה 1️⃣: הרץ את הסקריפט (מומלץ)
```bash
./deploy-fix-htaccess.sh
```

### אופציה 2️⃣: העתק ידנית דרך FTP/cPanel
1. פתח את cPanel/FTP
2. עבור ל-`/home/childapp2.srv989497.hstgr.cloud/public_html/`
3. צור קובץ `.htaccess` עם התוכן מ-`dist/.htaccess`

### אופציה 3️⃣: דרך SSH
```bash
scp dist/.htaccess user@server:/home/childapp2.srv989497.hstgr.cloud/public_html/
ssh user@server "chmod 644 /home/childapp2.srv989497.hstgr.cloud/public_html/.htaccess"
```

---

## 📚 מדריכים מפורטים

- **תיקון מיידי**: [`FIX_404_NOW.md`](./FIX_404_NOW.md)
- **הוראות מלאות**: [`DEPLOYMENT_INSTRUCTIONS.md`](./DEPLOYMENT_INSTRUCTIONS.md)

---

## ✅ איך לדעת שזה עבד?

נסה:
- https://childapp2.srv989497.hstgr.cloud/dev ← צריך לעבוד!
- https://childapp2.srv989497.hstgr.cloud/any-url ← צריך לעבוד!

אם עדיין 404, קרא את [`FIX_404_NOW.md`](./FIX_404_NOW.md) 📖
