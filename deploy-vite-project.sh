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
  
  # 🔥 וודא שמשתני הסביבה עדיין מוגדרים לפני ה-build
  if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
  fi
  
  if grep -q "\"build\":" package.json; then
    echo "🔨 Building with environment variables..."
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

