#!/bin/bash
set -e
echo "Starting Vercel deployment..."
npx vercel --prod
echo "Deployment complete!"
