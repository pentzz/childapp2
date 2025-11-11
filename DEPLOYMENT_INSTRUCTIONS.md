# 🚀 הוראות העלאה לשרת

## ⚠️ חשוב מאוד!

כשאתה מעלה את הקבצים לשרת, **חובה** להעלות את **כל** הקבצים מתוך תיקיית `dist/`:

### 📋 רשימת קבצים חובה:

```bash
dist/
├── .htaccess          # ⚠️ קריטי! זה הקובץ שמתקן את ה-404
├── index.html
├── assets/            # כל התיקייה
├── manifest.json
├── service-worker.js
├── offline.html
├── logo.png
├── _redirects
└── vercel.json
```

## 🔧 פתרון בעיית 404

### אם עדיין יש 404:

#### 1. **בדוק שה-.htaccess הועלה**
```bash
# חבר ל-SSH של השרת
ssh user@childapp2.srv989497.hstgr.cloud

# בדוק שהקובץ קיים
ls -la /home/childapp2.srv989497.hstgr.cloud/public_html/.htaccess

# אם הקובץ לא קיים, העתק ידנית:
cp dist/.htaccess /home/childapp2.srv989497.hstgr.cloud/public_html/
```

#### 2. **בדוק הרשאות**
```bash
# הקובץ צריך להיות קריא:
chmod 644 /home/childapp2.srv989497.hstgr.cloud/public_html/.htaccess
```

#### 3. **בדוק תצורת Apache**
```bash
# הקובץ .htaccess עובד רק אם מופעל AllowOverride
# בקובץ httpd.conf או apache2.conf צריך להיות:

<Directory "/home/childapp2.srv989497.hstgr.cloud/public_html">
    AllowOverride All
</Directory>
```

#### 4. **אם אין גישת SSH - יצירה ידנית**

צור קובץ `.htaccess` בתיקיית השורש של האתר עם התוכן הבא:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>

ErrorDocument 404 /index.html
```

#### 5. **אם השרת משתמש ב-nginx (לא Apache)**

צור קובץ תצורה:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location /dev {
    try_files $uri $uri/ /index.html;
}
```

## 🧪 בדיקה

לאחר ההעלאה, בדוק:

```bash
# URL ראשי
https://childapp2.srv989497.hstgr.cloud/

# URL עם /dev
https://childapp2.srv989497.hstgr.cloud/dev

# כל URL אחר
https://childapp2.srv989497.hstgr.cloud/any-route
```

כל ה-URLs צריכים להחזיר את index.html ולא 404!

## 📞 תמיכה

אם עדיין יש בעיה, בדוק:
1. ✅ שהקובץ .htaccess קיים בשרת
2. ✅ שההרשאות נכונות (644)
3. ✅ שApache מאפשר .htaccess (AllowOverride All)
4. ✅ שהשרת משתמש ב-Apache ולא nginx

---

**הכל מוכן! תעלה את dist/ לשרת ותהנה! 🎉**
