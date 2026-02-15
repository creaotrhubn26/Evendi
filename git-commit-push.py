#!/usr/bin/env python3
import subprocess
import os
import sys

os.chdir('/workspaces/wedflow')

print("📝 Git: Adding all changes...")
subprocess.run(['git', 'add', '-A'], check=True)

print("📝 Git: Showing status...")
result = subprocess.run(['git', 'status', '--short'], capture_output=True, text=True)
print(result.stdout)

print("📝 Git: Committing changes...")
commit_msg = "Fix Vercel deployment config and add diagnostic tools"
subprocess.run(['git', 'commit', '-m', commit_msg], check=True)

print("🚀 Git: Pushing to remote...")
subprocess.run(['git', 'push'], check=True)

print("✅ All changes committed and pushed successfully!")
