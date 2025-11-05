# 🔧 תיקון Redirect ל-localhost

## ⚠️ הבעיה:

אחרי התחברות, המשתמש מועבר ל-`http://localhost:3000/#` במקום לכתובת השרת.

## 🔴 הפתרון:

### שלב 1: עדכון Redirect URLs ב-Supabase Dashboard

1. **לכי ל-Supabase Dashboard:**
   - https://supabase.com/dashboard
   - בחרי את הפרויקט שלך

2. **לכי ל-Authentication → URL Configuration:**
   - Settings → Authentication → URL Configuration

3. **הוסיפי את כתובת השרת ל-Redirect URLs:**
   ```
   https://childapp2.srv989497.hstgr.cloud
   https://childapp2.srv989497.hstgr.cloud/
   https://childapp2.srv989497.hstgr.cloud/#
   https://childapp2.srv989497.hstgr.cloud/?#*
   ```

4. **הסירי את localhost (אם יש):**
   - הסירי את `http://localhost:3000`
   - הסירי את `http://localhost:3000/#`

5. **שמרי את השינויים**

---

### שלב 2: עדכון Site URL ב-Supabase

1. **ב-Authentication → URL Configuration:**
   - מצאי את **"Site URL"**
   - שנה את זה ל:
   ```
   https://childapp2.srv989497.hstgr.cloud
   ```

2. **שמרי את השינויים**

---

### שלב 3: Deploy מחדש

הקוד כבר עודכן, אבל צריך לעשות deploy מחדש:

```bash
git push production main
```

---

## ✅ אחרי זה:

1. האפליקציה תתחבר ל-Supabase
2. אחרי התחברות, המשתמש יועבר לכתובת השרת (לא localhost)
3. הכל יעבוד כמו שצריך!

---

## 📝 הערות:

- **Redirect URLs** חייבים לכלול את כתובת השרת
- **Site URL** צריך להיות כתובת השרת
- **localhost** צריך להיות רק בפיתוח מקומי

