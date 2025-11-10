#!/bin/bash

# 🚀 סקריפט העלאה מתוקן - כולל .htaccess
# מוודא שכל הקבצים, כולל קבצים נסתרים, מועתקים לשרת

set -e

echo "=========================================="
echo "🚀 העלאה לשרת עם תיקון .htaccess"
echo "=========================================="
echo ""

# בדיקה ש-dist קיים
if [ ! -d "dist" ]; then
    echo "❌ שגיאה: תיקיית dist לא קיימת!"
    echo "הרץ: npm run build"
    exit 1
fi

# בדיקה ש-.htaccess קיים ב-dist
if [ ! -f "dist/.htaccess" ]; then
    echo "❌ שגיאה: dist/.htaccess לא קיים!"
    echo "הרץ: npm run build שוב"
    exit 1
fi

echo "✅ dist/.htaccess קיים"
echo ""

# הצג תוכן של .htaccess
echo "📝 תוכן .htaccess שיועלה:"
echo "---"
head -15 dist/.htaccess
echo "..."
echo ""

# בקש פרטי שרת
echo "📡 פרטי שרת:"
read -p "שם משתמש SSH: " SSH_USER
read -p "כתובת שרת (לדוגמה: childapp2.srv989497.hstgr.cloud): " SSH_HOST
read -p "נתיב בשרת (לדוגמה: /home/childapp2.srv989497.hstgr.cloud/public_html): " REMOTE_PATH

echo ""
echo "🔄 מעלה קבצים לשרת..."
echo "מקור: dist/"
echo "יעד: $SSH_USER@$SSH_HOST:$REMOTE_PATH"
echo ""

# העלאה עם rsync כולל קבצים נסתרים
rsync -avz --include='.*' --progress dist/ $SSH_USER@$SSH_HOST:$REMOTE_PATH/

echo ""
echo "✅ העלאה הושלמה!"
echo ""

# בדוק ש-.htaccess הועתק
echo "🔍 בדיקת .htaccess בשרת..."
ssh $SSH_USER@$SSH_HOST "ls -la $REMOTE_PATH/.htaccess && echo '✅ .htaccess קיים בשרת!'"

echo ""
echo "🔧 מגדיר הרשאות..."
ssh $SSH_USER@$SSH_HOST "chmod 644 $REMOTE_PATH/.htaccess && echo '✅ הרשאות הוגדרו: 644'"

echo ""
echo "=========================================="
echo "🎉 סיימנו! האתר מוכן"
echo "=========================================="
echo ""
echo "🧪 בדוק את האתר:"
echo "   https://$SSH_HOST/"
echo "   https://$SSH_HOST/dev"
echo ""
echo "אם עדיין יש 404, ראה את הקובץ: FIX_404_NOW.md"
echo ""
