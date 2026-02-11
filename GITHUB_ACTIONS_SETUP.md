# GitHub Actions Setup Guide

## Overview

The scheduled jobs for Evendi are configured using GitHub Actions. This guide walks through the setup process.

## Scheduled Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| Expire Old Offers | Daily at 00:00 UTC | Finds offers past their validUntil date and marks them as expired |
| Process Message Reminders | Every hour | Finds scheduled message reminders that are due and sends them |

## Setup Instructions

### Step 1: Add GitHub Repository Secrets

GitHub Actions needs two secrets to authenticate with your Evendi API:

1. **APP_URL**: Your Evendi application URL
2. **ADMIN_KEY**: Your admin API key for authentication

#### How to Add Secrets:

1. Go to your GitHub repository: `https://github.com/creaotrhubn26/evendi`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

#### Secret 1: APP_URL
- **Name**: `APP_URL`
- **Value**: Your Evendi application URL (e.g., `https://evendi.example.com`)
- Click **Add secret**

#### Secret 2: ADMIN_KEY
- **Name**: `ADMIN_KEY`
- **Value**: Your admin API authentication key
  - Generate this key or use your existing admin token
  - This key will be sent in the `Authorization: Bearer` header
- Click **Add secret**

### Step 2: Verify Secrets Configuration

```bash
# You won't see the secret values, but you'll see the names listed
# In GitHub: Settings → Secrets and variables → Actions
```

Expected output:
```
✓ APP_URL
✓ ADMIN_KEY
```

### Step 3: Test Scheduled Jobs (Optional)

You can manually trigger the jobs to verify they work:

1. Go to **Actions** tab in your GitHub repository
2. Click **Evendi Scheduled Jobs** workflow
3. Click **Run workflow**
4. Select job type: `all`, `expire-offers`, or `process-reminders`
5. Click **Run workflow**

View the logs to see if jobs executed successfully.

### Step 4: Automatic Execution

Jobs will now run automatically on schedule:

- **Offer Expiration**: Every day at midnight UTC
  - Check logs: **Actions** → **Evendi Scheduled Jobs** → Daily run
  
- **Message Reminders**: Every hour (on the hour)
  - Check logs: **Actions** → **Evendi Scheduled Jobs** → Hourly run

---

## Workflow File Details

**Location**: `.github/workflows/scheduled-jobs.yml`

### Schedule Configuration

```yaml
on:
  schedule:
    # Daily at 00:00 UTC
    - cron: '0 0 * * *'
    # Hourly at :00
    - cron: '0 * * * *'
  # Manual trigger via GitHub UI
  workflow_dispatch:
```

### Job Configuration

#### Expire Offers Job
- **Triggers**: 
  - Daily schedule (0 0 * * *)
  - Manual dispatch with `expire-offers` selected
- **Endpoint**: `POST /api/admin/jobs/expire-offers`
- **Headers**: 
  - `Authorization: Bearer {ADMIN_KEY}`
  - `Content-Type: application/json`
- **Timeout**: 30 seconds

#### Process Reminders Job
- **Triggers**: 
  - Hourly schedule (0 * * * *)
  - Manual dispatch with `process-reminders` selected
- **Endpoint**: `POST /api/admin/jobs/process-message-reminders`
- **Headers**: 
  - `Authorization: Bearer {ADMIN_KEY}`
  - `Content-Type: application/json`
- **Timeout**: 30 seconds

---

## Monitoring & Logging

### View Job Logs

1. Go to your repository: `https://github.com/creaotrhubn26/evendi`
2. Click **Actions** tab
3. Click **Evendi Scheduled Jobs**
4. Click the specific run to view logs
5. Expand each job to see detailed output

### Example Log Output

**Success**:
```
Starting offer expiration job...
{
  "message": "5 tilbud marked som utløpt",
  "updated": 5
}
Status: 200
✅ Offer expiration job completed successfully at 2025-01-17 00:00:00 UTC
```

**Failure**:
```
Starting offer expiration job...
curl: (7) Failed to connect to evendi.example.com port 443: Connection timed out
❌ Offer expiration job failed at 2025-01-17 00:00:00 UTC
```

### Check Job Status

- ✅ Green checkmark: Job succeeded
- ❌ Red X: Job failed
- ⏳ Yellow circle: Job in progress
- ⊘ Gray circle: Job skipped

---

## Troubleshooting

### Issue: Jobs not running on schedule

**Possible Causes**:
1. Repository is private and Actions not enabled
2. Secrets not configured correctly
3. Workflow file syntax error

**Solution**:
1. Check **Settings** → **Actions** → Enable Actions
2. Verify secrets: **Settings** → **Secrets and variables** → **Actions**
3. Check workflow syntax in `.github/workflows/scheduled-jobs.yml`

### Issue: 401 Unauthorized

**Cause**: Invalid `ADMIN_KEY`

**Solution**:
1. Verify ADMIN_KEY is set correctly in GitHub secrets
2. Check key hasn't expired
3. Generate new key if needed
4. Update secret in GitHub

### Issue: 404 Not Found

**Cause**: Invalid `APP_URL` or endpoint doesn't exist

**Solution**:
1. Verify APP_URL is correct (no trailing slash)
2. Check endpoints exist: `/api/admin/jobs/expire-offers`, `/api/admin/jobs/process-message-reminders`
3. Verify application is running and accessible

### Issue: Connection timeout

**Cause**: Application server unreachable or taking too long

**Solution**:
1. Check application is running
2. Verify firewall rules allow GitHub Actions IPs
3. Check application logs for errors
4. Increase timeout in workflow file if needed

---

## Alternative: Manual Cron Setup (Linux/macOS)

If you prefer not to use GitHub Actions, you can set up cron jobs on your server:

```bash
# Edit crontab
crontab -e

# Add these lines:

# Daily at midnight
0 0 * * * curl -X POST https://your-domain.com/api/admin/jobs/expire-offers \
  -H "Authorization: Bearer YOUR_ADMIN_KEY"

# Every hour
0 * * * * curl -X POST https://your-domain.com/api/admin/jobs/process-message-reminders \
  -H "Authorization: Bearer YOUR_ADMIN_KEY"
```

---

## Testing Jobs Manually

### Test Offer Expiration

```bash
curl -X POST https://your-domain.com/api/admin/jobs/expire-offers \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "message": "X tilbud marked som utløpt",
  "updated": X
}
```

### Test Message Reminders

```bash
curl -X POST https://your-domain.com/api/admin/jobs/process-message-reminders \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "message": "X message reminders sent",
  "processed": X
}
```

---

## Next Steps

1. ✅ Complete: Add secrets to GitHub
2. ⏳ Verify: Test jobs via manual dispatch
3. ⏳ Monitor: Check logs after first scheduled run
4. ⏳ Adjust: Modify schedules if needed

---

**Last Updated**: 2025-01-17
**Workflow File**: `.github/workflows/scheduled-jobs.yml`
**Documentation**: This file
