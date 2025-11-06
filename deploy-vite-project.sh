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
    # Copy the env file to .env.production in the temp directory
    cp "$ENV_FILE" "$TMP/.env.production"
    
    # Verify the file was created and show its contents (first 100 chars of each line)
    if [ -f "$TMP/.env.production" ]; then
      echo "✅ .env.production created at: $TMP/.env.production"
      echo "📄 File contents preview:"
      head -n 3 "$TMP/.env.production" | sed 's/=.*/=***HIDDEN***/'
    else
      echo "❌ ERROR: Failed to create .env.production file!"
      exit 1
    fi
    
    # 🔥 וודא שמשתני הסביבה מוגדרים לפני ה-build
    echo "🔄 Reloading environment variables before build..."
    set -a
    source "$ENV_FILE"
    set +a
    
    # 🔥 Export explicit values to ensure they're available during build
    export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-}"
    export VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-}"
    export VITE_GEMINI_API_KEY="${VITE_GEMINI_API_KEY:-}"
    
    echo "✅ Environment variables exported:"
    echo "   VITE_SUPABASE_URL=${VITE_SUPABASE_URL:0:30}..."
    echo "   VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY:0:30}..."
    echo "   VITE_GEMINI_API_KEY=${VITE_GEMINI_API_KEY:0:20}..."
    
    # 🔥 Verify the .env.production file has the correct values
    echo "🔍 Verifying .env.production file..."
    if grep -q "VITE_SUPABASE_URL" "$TMP/.env.production"; then
      echo "✅ VITE_SUPABASE_URL found in .env.production"
    else
      echo "❌ ERROR: VITE_SUPABASE_URL not found in .env.production!"
    fi
    if grep -q "VITE_SUPABASE_ANON_KEY" "$TMP/.env.production"; then
      echo "✅ VITE_SUPABASE_ANON_KEY found in .env.production"
    else
      echo "❌ ERROR: VITE_SUPABASE_ANON_KEY not found in .env.production!"
    fi
  else
    echo "❌ ERROR: $ENV_FILE not found! Cannot build without environment variables."
    exit 1
  fi
  
  if grep -q "\"build\":" package.json; then
    echo "🔨 Building with environment variables..."
    
    # 🔥 CRITICAL: Reload environment variables one more time before build
    # This ensures they're available in the current shell context
    if [ -f "$ENV_FILE" ]; then
      echo "🔄 Final reload of environment variables before build..."
      set -a
      source "$ENV_FILE"
      set +a
      
      # Verify they're set
      echo "✅ Verifying environment variables are set:"
      if [ -n "${VITE_SUPABASE_URL:-}" ]; then
        echo "   ✅ VITE_SUPABASE_URL is set (length: ${#VITE_SUPABASE_URL})"
      else
        echo "   ❌ VITE_SUPABASE_URL is NOT set!"
      fi
      if [ -n "${VITE_SUPABASE_ANON_KEY:-}" ]; then
        echo "   ✅ VITE_SUPABASE_ANON_KEY is set (length: ${#VITE_SUPABASE_ANON_KEY})"
      else
        echo "   ❌ VITE_SUPABASE_ANON_KEY is NOT set!"
      fi
      if [ -n "${VITE_GEMINI_API_KEY:-}" ]; then
        echo "   ✅ VITE_GEMINI_API_KEY is set (length: ${#VITE_GEMINI_API_KEY})"
      else
        echo "   ❌ VITE_GEMINI_API_KEY is NOT set!"
      fi
    fi
    
    # 🔥 Run build with explicit environment variables
    # Export them explicitly to ensure they're available to the build process
    export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-}"
    export VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-}"
    export VITE_GEMINI_API_KEY="${VITE_GEMINI_API_KEY:-}"
    
    echo "🔨 Running build command with environment variables..."
    $PM run build
  fi

  # יעד נפוץ ל-Vite
  if [ -d dist ]; then
    rm -rf "${WEBROOT:?}/"*
    mkdir -p "$WEBROOT"
    cp -r dist/* "$WEBROOT"/
  else
    # fallback: כל התוכן
    rm -rf "${WEBROOT:?}/"*
    mkdir -p "$WEBROOT"
    shopt -s dotglob
    cp -r ./* "$WEBROOT"/
  fi
else
  # אין package.json — פשוט לפרוס קבצים
  rm -rf "${WEBROOT:?}/"*
  mkdir -p "$WEBROOT"
  shopt -s dotglob
  cp -r ./* "$WEBROOT"/
fi

echo "Build & deploy DONE to $WEBROOT"

