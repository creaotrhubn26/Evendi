#!/bin/bash
cd /workspaces/wedflow

echo "📝 Committing changes..."
git add vercel.json
git commit -m "Fix Vercel config: use npx expo export and npm ci"

echo "🚀 Deploying to Vercel..."
npx vercel --prod > vercel-redeploy.log 2>&1

echo "✅ Done! Check vercel-redeploy.log for details"
