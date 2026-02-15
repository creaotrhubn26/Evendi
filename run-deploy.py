#!/usr/bin/env python3
import subprocess
import os
import sys

os.chdir('/workspaces/wedflow')
print("🚀 Starting Vercel deployment...")
print("=" * 60)
result = subprocess.run(['npx', 'vercel', '--prod'], capture_output=False, text=True)
print("=" * 60)
if result.returncode == 0:
    print("✅ Deployment completed successfully!")
else:
    print(f"❌ Deployment failed with exit code {result.returncode}")
sys.exit(result.returncode)
