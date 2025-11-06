#!/usr/bin/env bash
set -euo pipefail

# נתוני אתר
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_NAME="$(basename "$REPO_DIR" .git)"
DOMAIN="${REPO_NAME}.srv989497.hstgr.cloud"
WEBROOT="/home/${DOMAIN}/public_html"

# 🔥 קריאת משתני סביבה לפני ה-build
ENV_FILE="/var/repo/${REPO_NAME}.env"
if [ -f "$ENV_FILE" ]; then
  echo "📋 Loading environment variables from $ENV_FILE"
  set -a
  source "$ENV_FILE"
  set +a
  echo "✅ Environment variables loaded:"
  echo "   VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-NOT SET}"
  echo "   VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY:+SET (hidden)}"
  echo "   VITE_GEMINI_API_KEY=${VITE_GEMINI_API_KEY:+SET (hidden)}"
else
  echo "⚠️  Warning: $ENV_FILE not found. Supabase variables may not be set."
fi

# checkout ל-tmp
TMP="$(mktemp -d /tmp/${REPO_NAME}.XXXXXX)"
trap 'rm -rf "$TMP"' EXIT

git --work-tree="$TMP" --git-dir="$REPO_DIR" checkout -f main

# אם יש package.json — נבנה (npm/pnpm/yarn)
cd "$TMP"
if [ -f package.json ]; then
  if command -v pnpm >/dev/null 2>&1; then PM=pnpm
  elif command -v yarn >/dev/null 2>&1; then PM=yarn
  else PM=npm
  fi

  $PM install --silent
  
  # 🔥 יצירת קובץ .env.production לפני ה-build
  if [ -f "$ENV_FILE" ]; then
    echo "📝 Creating .env.production file for Vite build..."
    echo "   Source file: $ENV_FILE"
    echo "   Target file: $TMP/.env.production"
    
    # העתק את הקובץ
    cp "$ENV_FILE" "$TMP/.env.production"
    
    # 🔥 וודא שהקובץ נוצר
    if [ ! -f "$TMP/.env.production" ]; then
      echo "❌ ERROR: Failed to create .env.production file!"
      exit 1
    fi
    
    echo "✅ .env.production file created successfully"
    
    # 🔥 וודא שכל המשתנים הנדרשים קיימים
    echo "📋 Verifying required environment variables:"
    if grep -q "^VITE_SUPABASE_URL=" "$TMP/.env.production"; then
      echo "   ✅ VITE_SUPABASE_URL found"
    else
      echo "   ❌ VITE_SUPABASE_URL NOT found in $ENV_FILE"
      echo "   ⚠️  This will cause Supabase connection to fail!"
    fi
    if grep -q "^VITE_SUPABASE_ANON_KEY=" "$TMP/.env.production"; then
      echo "   ✅ VITE_SUPABASE_ANON_KEY found"
    else
      echo "   ❌ VITE_SUPABASE_ANON_KEY NOT found in $ENV_FILE"
      echo "   ⚠️  This will cause Supabase connection to fail!"
    fi
    if grep -q "^VITE_GEMINI_API_KEY=" "$TMP/.env.production"; then
      echo "   ✅ VITE_GEMINI_API_KEY found"
    else
      echo "   ⚠️  VITE_GEMINI_API_KEY not found in $ENV_FILE"
    fi
    
    # 🔥 הצג את תוכן הקובץ (ללא ערכים)
    echo "📋 .env.production file contents (first 5 lines, values hidden):"
    head -5 "$TMP/.env.production" | sed 's/=.*/=***HIDDEN***/' || echo "   (file is empty or cannot be read)"
    
    # 🔥 וודא שהקובץ לא ריק
    if [ ! -s "$TMP/.env.production" ]; then
      echo "❌ ERROR: .env.production file is empty!"
      exit 1
    fi
  else
    echo "❌ ERROR: $ENV_FILE not found. Cannot create .env.production"
    echo "   Expected location: $ENV_FILE"
    echo "⚠️  Creating empty .env.production (build may fail!)"
    touch "$TMP/.env.production"
  fi
  
  # 🔥 וודא שמשתני הסביבה עדיין מוגדרים לפני ה-build
  if [ -f "$ENV_FILE" ]; then
    echo "🔄 Reloading environment variables before build..."
    set -a
    source "$ENV_FILE"
    set +a
    
    # 🔥 וודא שהמשתנים מוגדרים
    if [ -z "${VITE_SUPABASE_URL:-}" ]; then
      echo "❌ ERROR: VITE_SUPABASE_URL is not set!"
    else
      echo "✅ VITE_SUPABASE_URL is set (length: ${#VITE_SUPABASE_URL})"
    fi
    if [ -z "${VITE_SUPABASE_ANON_KEY:-}" ]; then
      echo "❌ ERROR: VITE_SUPABASE_ANON_KEY is not set!"
    else
      echo "✅ VITE_SUPABASE_ANON_KEY is set (length: ${#VITE_SUPABASE_ANON_KEY})"
    fi
    if [ -z "${VITE_GEMINI_API_KEY:-}" ]; then
      echo "⚠️  Warning: VITE_GEMINI_API_KEY is not set"
    else
      echo "✅ VITE_GEMINI_API_KEY is set (length: ${#VITE_GEMINI_API_KEY})"
    fi
  fi
  
  if grep -q "\"build\":" package.json; then
    echo "🔨 Building with environment variables..."
    
    # 🔥 וודא ש-.env.production קיים לפני ה-build
    if [ ! -f "$TMP/.env.production" ]; then
      echo "❌ ERROR: .env.production file not found before build!"
      echo "   Expected location: $TMP/.env.production"
      echo "   Current directory: $(pwd)"
      echo "   Files in current directory:"
      ls -la | head -10
      exit 1
    fi
    
    # 🔥 בדוק את תוכן הקובץ (ללא ערכים)
    echo "📋 Final verification of .env.production before build:"
    echo "   File exists: $(test -f "$TMP/.env.production" && echo 'YES' || echo 'NO')"
    echo "   File size: $(wc -c < "$TMP/.env.production" 2>/dev/null || echo '0') bytes"
    echo "   File location: $TMP/.env.production"
    echo "   Current directory: $(pwd)"
    if grep -q "^VITE_SUPABASE_URL=" "$TMP/.env.production"; then
      echo "   ✅ VITE_SUPABASE_URL found in .env.production"
    else
      echo "   ❌ VITE_SUPABASE_URL NOT found in .env.production"
    fi
    if grep -q "^VITE_SUPABASE_ANON_KEY=" "$TMP/.env.production"; then
      echo "   ✅ VITE_SUPABASE_ANON_KEY found in .env.production"
    else
      echo "   ❌ VITE_SUPABASE_ANON_KEY NOT found in .env.production"
    fi
    if grep -q "^VITE_GEMINI_API_KEY=" "$TMP/.env.production"; then
      echo "   ✅ VITE_GEMINI_API_KEY found in .env.production"
    else
      echo "   ⚠️  VITE_GEMINI_API_KEY NOT found in .env.production"
    fi
    
    # 🔥 הרץ build עם משתני סביבה
    echo "🚀 Starting Vite build..."
    echo "   Working directory: $(pwd)"
    echo "   .env.production location: $TMP/.env.production"
    $PM run build
    
    # 🔥 בדוק אם ה-build הצליח
    if [ $? -ne 0 ]; then
      echo "❌ ERROR: Build failed!"
      exit 1
    fi
    
    echo "✅ Build completed successfully"
  fi

  # יעד נפוץ ל-Vite
  if [ -d dist ]; then
    echo "📦 Copying dist files to $WEBROOT..."
    rm -rf "${WEBROOT:?}/"*
    mkdir -p "$WEBROOT"
    cp -r dist/* "$WEBROOT"/
    
    # 🔥 וודא הרשאות נכונות לקבצים
    chmod -R 755 "$WEBROOT"
    find "$WEBROOT" -type f -exec chmod 644 {} \;
    find "$WEBROOT" -type d -exec chmod 755 {} \;
    
    # 🔥 וודא שהתיקייה assets קיימת ונגישה
    if [ -d "$WEBROOT/assets" ]; then
      chmod -R 755 "$WEBROOT/assets"
      echo "✅ Assets directory permissions set"
    else
      echo "⚠️  Warning: assets directory not found in dist"
    fi
    
    echo "✅ Files copied and permissions set"
  else
    # fallback: כל התוכן
    echo "⚠️  Warning: dist directory not found, copying all files..."
    rm -rf "${WEBROOT:?}/"*
    mkdir -p "$WEBROOT"
    shopt -s dotglob
    cp -r ./* "$WEBROOT"/
    chmod -R 755 "$WEBROOT"
  fi
else
  # אין package.json — פשוט לפרוס קבצים
  rm -rf "${WEBROOT:?}/"*
  mkdir -p "$WEBROOT"
  shopt -s dotglob
  cp -r ./* "$WEBROOT"/
fi

echo "Build & deploy DONE to $WEBROOT"

