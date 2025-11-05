#!/bin/bash

# Script to update environment variables on the server
# Usage: ./update-server-env.sh

echo "🔧 Updating environment variables on server..."

# Connect to server and update .env file
ssh root@72.60.81.96 << 'EOF'
# Backup existing file
cp /var/repo/childapp2.env /var/repo/childapp2.env.backup 2>/dev/null || true

# Update or create .env file with all required variables
cat > /var/repo/childapp2.env << 'ENVEOF'
# Google Gemini API Key
VITE_GEMINI_API_KEY=AIzaSyBXX00z5boj_XW9FEvtZDempkEKpnYpqHU

# Supabase Configuration
# IMPORTANT: Replace these with your actual Supabase values!
# Get them from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
ENVEOF

echo "✅ Environment file updated at /var/repo/childapp2.env"
echo "⚠️  Don't forget to replace VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY with your actual values!"
EOF

echo "✅ Done! Now edit /var/repo/childapp2.env on the server with your Supabase credentials."

