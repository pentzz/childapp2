# 🌐 חיבור ngrok לשרת הפיתוח

## 📍 כתובות השרת

השרת שלך פועל על:

### Local (מחשב מקומי):
```
http://localhost:3006
```

### Network (רשת מקומית):
```
http://10.0.0.2:3006
http://172.20.128.1:3006
```

---

## 🚀 הפעלת ngrok

### שלב 1: התקנת ngrok (אם עוד לא מותקן)

1. **הורד את ngrok:**
   - לך ל-https://ngrok.com/download
   - הורד את הגרסה ל-Windows
   - חלץ את הקובץ `ngrok.exe`

2. **הוסף לנתיב (אופציונלי):**
   ```cmd
   move ngrok.exe C:\Windows\System32\
   ```

3. **הירשם לחשבון (חינם):**
   - לך ל-https://dashboard.ngrok.com/signup
   - קבל את ה-authtoken

4. **הזן את ה-authtoken:**
   ```cmd
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```

---

### שלב 2: הפעלת ngrok

פתח terminal **חדש** (אל תסגור את השרת!) והרץ:

```cmd
ngrok http 3006
```

או עם דומיין מותאם אישית (אם יש לך):
```cmd
ngrok http 3006 --domain=your-domain.ngrok-free.app
```

---

### שלב 3: קבלת הכתובת הציבורית

אחרי הפעלת ngrok, תראה משהו כזה:

```
ngrok

Session Status                online
Account                       your-account (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abcd-1234-5678.ngrok-free.app -> http://localhost:3006

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**הכתובת הציבורית שלך היא:**
```
https://abcd-1234-5678.ngrok-free.app
```

העתק את הכתובת הזו - זו הכתובת לבדיקה חיצונית!

---

## 🔧 הגדרות נוספות

### חיבור עם subdomain קבוע (דורש חשבון בתשלום):
```cmd
ngrok http 3006 --subdomain=childapp
```

אז תקבל: `https://childapp.ngrok.io`

### חיבור עם אימות (הגנה על השרת):
```cmd
ngrok http 3006 --basic-auth="username:password"
```

### חיבור עם הגבלת אזורים:
```cmd
ngrok http 3006 --region=eu
```

אזורים זמינים: us, eu, ap, au, sa, jp, in

---

## 📊 ממשק ניטור של ngrok

ngrok מספק ממשק web מקומי לניטור:

```
http://127.0.0.1:4040
```

פתח את הכתובת הזו בדפדפן כדי לראות:
- כל הבקשות שמגיעות
- Headers
- Response times
- Status codes
- ועוד...

---

## ⚠️ חשוב לדעת

### חשבון חינמי (Free):
- ✅ כתובת HTTPS ציבורית
- ✅ Unlimited requests
- ⚠️ URL משתנה בכל פעם שמפעילים
- ⚠️ מגבלת bandwidth
- ⚠️ דף אזהרה לפני כניסה (אפשר לדלג)

### חשבון בתשלום (Pro/Premium):
- ✅ subdomain קבוע
- ✅ ללא דף אזהרה
- ✅ יותר bandwidth
- ✅ Custom domains
- ✅ IP whitelisting

---

## 🧪 בדיקה

אחרי שהפעלת את ngrok:

1. **בדוק מקומית:**
   ```
   http://localhost:3006
   ```
   צריך לעבוד! ✅

2. **בדוק דרך ngrok:**
   ```
   https://your-ngrok-url.ngrok-free.app
   ```
   צריך להראות את אותו האתר! ✅

3. **בדוק מטלפון/מחשב אחר:**
   - שלח את ה-URL של ngrok למישהו
   - או פתח בטלפון
   - האתר צריך להיפתח! ✅

---

## 🔒 אבטחה עם Supabase

אם אתה משתמש ב-ngrok עם Supabase, תצטרך להוסיף את ה-URL של ngrok ל-allowed origins:

1. **לך ל-Supabase Dashboard**
2. **Settings -> API**
3. **Scroll ל-"Site URL"**
4. **הוסף את ה-URL של ngrok:**
   ```
   https://your-ngrok-url.ngrok-free.app
   ```

5. **Redirect URLs:**
   ```
   https://your-ngrok-url.ngrok-free.app/**
   ```

---

## 🛑 עצירת ngrok

כדי לעצור את ngrok:
- לחץ `Ctrl+C` בחלון ה-terminal של ngrok

השרת המקומי ימשיך לרוץ, רק ה-tunnel יסגר.

---

## 📋 סקריפט מהיר

צור קובץ `start-ngrok.bat` עם התוכן:

```batch
@echo off
echo Starting ngrok tunnel to port 3006...
ngrok http 3006
pause
```

כעת פשוט הפעל את הקובץ הזה בכל פעם! 🚀

---

## 🎯 סיכום - צ'קליסט

- [ ] התקנתי את ngrok
- [ ] הזנתי את ה-authtoken
- [ ] השרת פועל על http://localhost:3006
- [ ] הפעלתי `ngrok http 3006` בטרמינל נפרד
- [ ] קיבלתי כתובת ציבורית (https://...)
- [ ] העתקתי את הכתובת
- [ ] פתחתי את הכתובת בדפדפן - עובד!
- [ ] (אופציונלי) הוספתי את ה-URL ל-Supabase allowed origins

---

## 🌍 הכתובת שלך לבדיקה

**השרת רץ על:** `http://localhost:3006`

**אחרי הפעלת ngrok, תקבל משהו כמו:**
```
https://1a2b-3c4d-5e6f.ngrok-free.app
```

**שלח את הכתובת הזו למי שצריך לבדוק את האתר!** 🎉

---

**נהנה מ-ngrok! זה הכלי הכי מהיר לבדיקות חיצוניות! 🚀**
