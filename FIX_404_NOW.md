# 🚨 תיקון מיידי לבעיית 404

## הבעיה
הקובץ `.htaccess` קיים ב-`dist/` אבל ככל הנראה **לא מועתק לשרת** או שהשרת לא קורא אותו.

## ✅ הפתרון המהיר (3 דקות)

### דרך 1: העתקה ידנית דרך cPanel/FTP

1. **התחבר ל-cPanel** או FTP של השרת
2. **עבור לתיקייה** `/home/childapp2.srv989497.hstgr.cloud/public_html/`
3. **צור קובץ חדש** בשם `.htaccess` (שים לב לנקודה בהתחלה!)
4. **העתק את התוכן הבא** לקובץ:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Don't rewrite files or directories that exist
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Rewrite everything else to index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Custom error pages
ErrorDocument 404 /index.html
```

5. **שמור** את הקובץ
6. **בדוק הרשאות**: הקובץ צריך להיות `644` (rw-r--r--)

### דרך 2: דרך SSH (אם יש לך גישה)

```bash
# התחבר לשרת
ssh user@childapp2.srv989497.hstgr.cloud

# עבור לתיקייה
cd /home/childapp2.srv989497.hstgr.cloud/public_html/

# צור את הקובץ
cat > .htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
ErrorDocument 404 /index.html
EOF

# קבע הרשאות
chmod 644 .htaccess

# בדוק שהקובץ קיים
ls -la .htaccess
```

### דרך 3: דרך סקריפט ההעלאה שלך

עדכן את סקריפט ההעלאה ב-Cursor כדי שהוא **יכלול גם קבצים נסתרים**:

```bash
# במקום
rsync -avz dist/ user@server:/path/

# השתמש ב
rsync -avz --include='.*' dist/ user@server:/path/
```

או:

```bash
# העתק מפורש את .htaccess
scp dist/.htaccess user@server:/home/childapp2.srv989497.hstgr.cloud/public_html/
```

---

## 🔍 בדיקה שהתיקון עבד

לאחר יצירת הקובץ, בדוק:

```bash
# בדפדפן:
https://childapp2.srv989497.hstgr.cloud/dev
https://childapp2.srv989497.hstgr.cloud/any-random-url

# או דרך curl:
curl -I https://childapp2.srv989497.hstgr.cloud/dev
# צריך להחזיר HTTP 200 ולא 404
```

---

## ⚠️ אם עדיין לא עובד

### בעיה אפשרית 1: Apache לא קורא .htaccess

בקובץ תצורת Apache (`httpd.conf` או `apache2.conf`), צריך להיות:

```apache
<Directory "/home/childapp2.srv989497.hstgr.cloud/public_html">
    AllowOverride All
</Directory>
```

אם זה `AllowOverride None`, שנה ל-`All` והפעל מחדש את Apache:

```bash
sudo systemctl restart apache2
```

### בעיה אפשרית 2: השרת משתמש ב-nginx

אם השרת משתמש ב-nginx (לא Apache), צריך תצורה אחרת.

צור/ערוך את `/etc/nginx/sites-available/childapp2`:

```nginx
server {
    server_name childapp2.srv989497.hstgr.cloud;
    root /home/childapp2.srv989497.hstgr.cloud/public_html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

ואז:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### בעיה אפשרית 3: mod_rewrite לא מופעל

```bash
# הפעל mod_rewrite:
sudo a2enmod rewrite
sudo systemctl restart apache2
```

---

## 📞 צריך עזרה?

אם אף אחד מהפתרונות לא עובד:

1. בדוק איזה שרת web רץ (Apache/nginx):
   ```bash
   ps aux | grep -E 'apache|nginx'
   ```

2. בדוק את ה-error log:
   ```bash
   tail -f /var/log/apache2/error.log
   # או
   tail -f /var/log/nginx/error.log
   ```

3. שלח לי את הפלט ואני אעזור!

---

**זה אמור לפתור! העתק את .htaccess לשרת ותהיה סבבה 🎉**
