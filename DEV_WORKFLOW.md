# זרימת עבודה - סביבות פיתוח וייצור

## סביבות

### 🚀 ייצור (Production)
- **URL**: https://childapp2.srv989497.hstgr.cloud/
- **ענף Git**: `main`
- **נתיב שרת**: `/home/childapp2.srv989497.hstgr.cloud/public_html/`
- **שימוש**: האתר הראשי שהמשתמשים רואים

### 🧪 פיתוח (Development)
- **URL**: https://childapp2.srv989497.hstgr.cloud/dev/
- **ענף Git**: `dev`
- **נתיב שרת**: `/home/childapp2.srv989497.hstgr.cloud/public_html/dev/`
- **שימוש**: בדיקות ושדרוגים לפני העברה לייצור

## חיבורים משותפים
שתי הסביבות משתמשות באותם משאבים:
- ✅ אותו מאגר Supabase
- ✅ אותם API Keys
- ✅ אותו קובץ `.env`

## זרימת עבודה

### 1️⃣ פיתוח והוספת תכונות חדשות

```bash
# עבור לענף dev
git checkout dev

# ערוך קבצים, הוסף תכונות...

# commit השינויים
git add .
git commit -m "הוספת תכונה חדשה"

# העלה לסביבת פיתוח
git push production dev
```

לאחר ה-push, האתר יבנה אוטומטית ב-https://childapp2.srv989497.hstgr.cloud/dev/

### 2️⃣ בדיקות באתר dev
- גש ל-https://childapp2.srv989497.hstgr.cloud/dev/
- בדוק שהכל עובד כמצופה
- וודא שהחיבור ל-Supabase תקין
- בדוק את כל התכונות החדשות

### 3️⃣ העברה לייצור (כשהכל עובד)

```bash
# חזור לענף main
git checkout main

# מזג את השינויים מ-dev
git merge dev

# העלה לייצור
git push production main
```

לאחר ה-push, האתר הראשי יתעדכן ב-https://childapp2.srv989497.hstgr.cloud/

### 4️⃣ תיקון חם (Hotfix) בייצור

אם צריך לתקן משהו דחוף בייצור:

```bash
# עבוד ישירות על main
git checkout main

# ערוך ותקן
git add .
git commit -m "תיקון דחוף"

# העלה לייצור
git push production main

# אל תשכח לעדכן גם את dev!
git checkout dev
git merge main
git push production dev
```

## פקודות שימושיות

### בדיקת ענף נוכחי
```bash
git branch
```

### רשימת כל הענפים
```bash
git branch -a
```

### מחיקת שינויים מקומיים
```bash
git checkout -- .
```

### ביטול commit אחרון (לפני push)
```bash
git reset HEAD~1
```

### צפייה בהיסטוריית commits
```bash
git log --oneline --graph --all
```

## מבנה השרת

```
/home/childapp2.srv989497.hstgr.cloud/
├── public_html/
│   ├── .env                    # משתנים גלובליים
│   ├── index.html              # ייצור
│   ├── logo.png
│   ├── assets/                 # ייצור
│   └── dev/
│       ├── .htaccess           # ניתוב SPA
│       ├── index.html          # פיתוח
│       ├── logo.png
│       └── assets/             # פיתוח
└── logs/
```

## Hooks

### Post-Receive (ראשי)
- **מיקום**: `/var/repo/childapp2.git/hooks/post-receive`
- **תפקיד**: מזהה את הענף ומפנה להוק המתאים

### Post-Receive-Main (ייצור)
- **מיקום**: `/var/repo/childapp2.git/hooks/post-receive-main`
- **תפקיד**: בונה ומפרוס את ענף `main` ל-`public_html/`

### Post-Receive-Dev (פיתוח)
- **מיקום**: `/var/repo/childapp2.git/hooks/post-receive-dev`
- **תפקיד**: בונה ומפרוס את ענף `dev` ל-`public_html/dev/`

## טיפים

### ✅ עשה (DO)
- תמיד פתח תכונות חדשות ב-`dev`
- בדוק ב-dev לפני העברה ל-main
- עשה commit עם הודעות ברורות
- שמור על main יציב

### ❌ אל תעשה (DON'T)
- אל תפתח תכונות ישירות ב-main
- אל תעלה קוד שלא נבדק ל-main
- אל תשכח לעדכן את dev אחרי hotfix ב-main
- אל תמחק קבצים חשובים כמו .env

## פתרון בעיות

### האתר לא נטען ב-/dev
1. בדוק שקובץ `.htaccess` קיים
2. וודא שהקבצים נבנו: `ssh root@72.60.81.96 "ls -la /home/childapp2.srv989497.hstgr.cloud/public_html/dev/"`

### Build נכשל
1. בדוק את הלוגים: `git push production dev 2>&1 | tee build.log`
2. וודא שהתלויות מעודכנות ב-`package.json`

### שגיאות Supabase
- שתי הסביבות משתמשות באותו DB - בדוק שה-connection strings תקינים

---

**תאריך יצירה**: 10 בנובמבר 2025
**עדכון אחרון**: 10 בנובמבר 2025
