# 🎨 מדריך התקנה - מערכת ניהול תוכן (CMS) לדף הבית

## ✅ מה בוצע עכשיו?

הוספנו מערכת CMS מלאה לדף הבית שמאפשרת למנהל הראשי (ofirbaranesad@gmail.com) לערוך **הכל** בדף הבית:

### תכונות שהוספו:
1. ✏️ **עריכת טקסט** - כל כותרת, תת-כותרת, תיאור וכפתור
2. 🖼️ **העלאת תמונות** - לוגו, תמונות showcase, אווטרים של המלצות
3. 🎨 **ממשק עריכה אינטואיטיבי** - hover מעל תוכן ולחיצה על כפתור ✏️
4. 💾 **שמירה אוטומטית** - הכל נשמר ישירות ל-Supabase
5. 🔒 **הרשאות מלאות** - רק המנהל הראשי יכול לערוך

---

## 📋 שלבי ההתקנה

### שלב 1: הרצת סקריפטים ב-Supabase

יש להריץ 2 סקריפטים ב-Supabase Dashboard:

#### 1.1 הגדרת Storage Bucket
```sql
-- פתח את: setup_storage_bucket.sql
-- העתק והדבק ב-SQL Editor
-- לחץ RUN
```

הסקריפט יוצר:
- Bucket בשם `public-images` לאחסון תמונות
- הרשאות העלאה למשתמשים מחוברים
- הרשאות צפייה למבקרים

#### 1.2 הגדרת טבלת תוכן
```sql
-- פתח את: landing_page_cms.sql
-- העתק והדבק ב-SQL Editor
-- לחץ RUN
```

הסקריפט יוצר:
- טבלה `landing_page_content` עם כל התוכן
- RLS policies (רק admins יכולים לערוך)
- תוכן ברירת מחדל לכל הסעיפים
- Triggers לעדכון timestamps

---

### שלב 2: בדיקה שהכל עובד

#### 2.1 התחבר כמנהל
1. פתח את האפליקציה: http://localhost:3005
2. התחבר עם: **ofirbaranesad@gmail.com**
3. אתה אמור לראות את דף הבית הרגיל

#### 2.2 הפעל מצב עריכה
1. שים לב לכפתור צף בפינה הימנית התחתונה: **✏️ מצב עריכה**
2. לחץ על הכפתור
3. הכפתור ישתנה ל: **✅ סיום עריכה**

#### 2.3 ערוך תוכן
1. **עבור עם העכבר** מעל כל תוכן (כותרת, טקסט, תמונה)
2. **כפתור ✏️ ירוד** יופיע מעל האלמנט
3. **לחץ על הכפתור**
4. **חלון עריכה ייפתח**:
   - לטקסט: תיבת טקסט גדולה
   - לתמונה: שדה URL + כפתור העלאה

#### 2.4 שמור שינויים
1. ערוך את התוכן
2. לחץ **שמור**
3. התוכן יתעדכן מיידית בדף

---

## 🎯 מה אפשר לערוך?

### סעיף Hero (למעלה)
- 🔤 `hero_title` - "גאון"
- 🔤 `hero_subtitle` - "של אמא"
- 🖼️ `hero_logo_url` - לוגו
- 🔤 `hero_description` - תיאור הפלטפורמה
- 🔤 `hero_cta_text` - טקסט הכפתור

### סעיף Features (מה אנחנו מציעים)
- 🔤 `features_title` - כותרת ראשית
- 🔤 `features_subtitle` - תת-כותרת
- **Feature 1:**
  - 🔤 `feature_1_icon` - אייקון (אימוג'י)
  - 🔤 `feature_1_title` - כותרת
  - 🔤 `feature_1_description` - תיאור
- **Feature 2:**
  - 🔤 `feature_2_icon`
  - 🔤 `feature_2_title`
  - 🔤 `feature_2_description`
- **Feature 3:**
  - 🔤 `feature_3_icon`
  - 🔤 `feature_3_title`
  - 🔤 `feature_3_description`

### סעיף How It Works (איך הקסם עובד)
- 🔤 `howitworks_title` - כותרת
- 🔤 `howitworks_subtitle` - תת-כותרת
- **צעד 1:**
  - 🔤 `step_1_number` - "01"
  - 🔤 `step_1_title`
  - 🔤 `step_1_description`
- **צעד 2:**
  - 🔤 `step_2_number`
  - 🔤 `step_2_title`
  - 🔤 `step_2_description`
- **צעד 3:**
  - 🔤 `step_3_number`
  - 🔤 `step_3_title`
  - 🔤 `step_3_description`

### סעיף Showcase (הצצה לעולם)
- 🔤 `showcase_title`
- 🔤 `showcase_subtitle`
- **Showcase 1:**
  - 🖼️ `showcase_1_image` - תמונה
  - 🔤 `showcase_1_title`
  - 🔤 `showcase_1_description`
- **Showcase 2:**
  - 🖼️ `showcase_2_image`
  - 🔤 `showcase_2_title`
  - 🔤 `showcase_2_description`

### סעיף Testimonials (הורים ממליצים)
- 🔤 `testimonials_title`
- 🔤 `testimonials_subtitle`
- **המלצה 1:**
  - 🔤 `testimonial_1_text` - הציטוט
  - 🖼️ `testimonial_1_avatar` - תמונת פרופיל
  - 🔤 `testimonial_1_name` - שם
  - 🔤 `testimonial_1_role` - תפקיד
- **המלצה 2:**
  - 🔤 `testimonial_2_text`
  - 🖼️ `testimonial_2_avatar`
  - 🔤 `testimonial_2_name`
  - 🔤 `testimonial_2_role`

---

## 📸 איך להעלות תמונות?

### אופציה 1: העלאה ישירה (מומלץ)
1. פתח את חלון העריכה לאלמנט תמונה
2. לחץ על **"בחר קובץ"**
3. בחר תמונה מהמחשב (עד 5MB)
4. התמונה תועלה אוטומטית ל-Supabase Storage
5. ה-URL יתעדכן אוטומטית

### אופציה 2: URL חיצוני
1. פתח את חלון העריכה
2. הדבק URL של תמונה (Unsplash, Imgur, וכו')
3. שמור

---

## 🔍 בדיקת תקינות

### ✅ הכל עובד אם:
1. ✔️ סקריפטים רצו בהצלחה ב-Supabase
2. ✔️ התחברת כ-ofirbaranesad@gmail.com
3. ✔️ רואה כפתור "מצב עריכה" בפינה
4. ✔️ כפתורי ✏️ מופיעים על hover
5. ✔️ חלון עריכה נפתח בלחיצה
6. ✔️ שינויים נשמרים ונשארים לאחר רענון

### ❌ בעיות אפשריות:

#### 1. "כפתור מצב עריכה לא מופיע"
- **סיבה:** לא מחובר או לא Admin
- **פתרון:** ודא שהתחברת עם ofirbaranesad@gmail.com

#### 2. "Error loading content"
- **סיבה:** הטבלה לא קיימת
- **פתרון:** הרץ את `landing_page_cms.sql`

#### 3. "שגיאה בשמירת התוכן"
- **סיבה:** בעיית הרשאות RLS
- **פתרון:** ודא ש-role = 'admin' בטבלת users

#### 4. "העלאת תמונה נכשלת"
- **סיבה:** ה-bucket לא קיים
- **פתרון:** הרץ את `setup_storage_bucket.sql`

---

## 🔐 אבטחה

### מי יכול לערוך?
- **רק** המשתמש ofirbaranesad@gmail.com
- **רק** אם ה-role שלו הוא 'admin'
- כפתור העריכה **לא מופיע** למשתמשים אחרים

### מי יכול לצפות?
- **כולם** - התוכן פומבי
- RLS policy מאפשרת SELECT לכולם
- רק UPDATE/INSERT/DELETE דורשים admin

---

## 📊 מבנה הנתונים

### טבלה: landing_page_content

| עמודה | סוג | תיאור |
|-------|-----|-------|
| id | SERIAL | מזהה ייחודי |
| section_key | TEXT | מפתח הסעיף (למשל: 'hero_title') |
| content_type | TEXT | 'text' או 'image' |
| content_value | TEXT | הערך בפועל |
| image_url | TEXT | URL לתמונה (אם רלוונטי) |
| display_order | INTEGER | סדר תצוגה |
| is_active | BOOLEAN | האם פעיל |
| created_at | TIMESTAMPTZ | תאריך יצירה |
| updated_at | TIMESTAMPTZ | תאריך עדכון |
| updated_by | UUID | מי עדכן |

---

## 🎨 התאמה אישית

### שינוי עיצוב כפתור העריכה
קובץ: `EditableContent.tsx`

```typescript
// שינוי צבע כפתור העריכה
background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'

// שינוי גודל
padding: '8px 12px'

// שינוי מיקום
top: '-10px', right: '-10px'
```

### שינוי עיצוב חלון העריכה
קובץ: `ContentEditor.tsx`

```typescript
// שינוי גודל חלון
maxWidth: '600px'

// שינוי צבעים
background: 'var(--surface-color)'
```

---

## 🚀 מוכן!

עכשיו יש לך:
- ✅ מערכת CMS מלאה
- ✅ יכולת עריכת כל תוכן בדף הבית
- ✅ העלאת תמונות
- ✅ ממשק נוח ואלגנטי
- ✅ שמירה אוטומטית ל-Supabase
- ✅ הרשאות מאובטחות

**פשוט הרץ את הסקריפטים ותתחיל לערוך! 🎉**

---

## 📞 תמיכה

אם משהו לא עובד:
1. בדוק את הקונסול (`F12`) לשגיאות
2. ודא שהסקריפטים רצו בהצלחה
3. ודא שאתה מחובר כמנהל
4. בדוק את ה-RLS policies ב-Supabase

---

**תאריך יצירה:** 31 אוקטובר 2025
**גרסה:** 1.0.0
**סטטוס:** ✅ מוכן לשימוש
