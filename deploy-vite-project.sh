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
    # העתק את הקובץ
    cp "$ENV_FILE" "$TMP/.env.production"
    
    # 🔥 וודא שכל המשתנים הנדרשים קיימים
    if ! grep -q "^VITE_SUPABASE_URL=" "$TMP/.env.production"; then
      echo "⚠️  Warning: VITE_SUPABASE_URL not found in $ENV_FILE"
    fi
    if ! grep -q "^VITE_SUPABASE_ANON_KEY=" "$TMP/.env.production"; then
      echo "⚠️  Warning: VITE_SUPABASE_ANON_KEY not found in $ENV_FILE"
    fi
    if ! grep -q "^VITE_GEMINI_API_KEY=" "$TMP/.env.production"; then
      echo "⚠️  Warning: VITE_GEMINI_API_KEY not found in $ENV_FILE"
    fi
    
    echo "✅ .env.production created with environment variables"
    echo "📋 .env.production contents (first 3 lines):"
    head -3 "$TMP/.env.production" | sed 's/=.*/=***HIDDEN***/'
  else
    echo "❌ ERROR: $ENV_FILE not found. Cannot create .env.production"
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
    $PM run build
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

