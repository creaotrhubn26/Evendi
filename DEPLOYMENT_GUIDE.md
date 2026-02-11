# Evendi - Deployment Guide

## Pre-Deployment Checklist

### 1. Review Changes
- [ ] Review all changes in `FIXES_IMPLEMENTED.md`
- [ ] Review schema changes in `shared/schema.ts`
- [ ] Review password hashing changes in `server/routes.ts`
- [ ] Verify no breaking changes for existing clients

### 2. Backup Database
```bash
# PostgreSQL backup
pg_dump -h YOUR_HOST -U YOUR_USER YOUR_DATABASE > backup_$(date +%Y%m%d).sql

# Verify backup
wc -l backup_*.sql
```

---

## Deployment Steps

### Step 1: Install New Dependencies
```bash
npm install bcryptjs
npm ci  # Install all dependencies from lock file
```

### Step 2: Database Schema Migration
```bash
# Generate migration for new vendorSessions table
npm run db:push

# Verify migration success
psql -h YOUR_HOST -U YOUR_USER YOUR_DATABASE -c \
  "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='vendor_sessions';"
```

### Step 3: Deploy Application
```bash
# Build server
npm run server:build

# Or run in development mode
npm run server:dev
```

### Step 4: Verify Deployment
```bash
# Test vendor login endpoint
curl -X POST http://localhost:5000/api/vendors/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@vendor.com","password":"testpassword"}'

# Should return error (vendor doesn't exist) or success with session token
# If it returns session token with bcrypt verification working ✅

# Test admin statistics
curl -X GET http://localhost:5000/api/admin/statistics \
  -H "Authorization: Bearer YOUR_ADMIN_KEY"

# Should return statistics without errors ✅
```

---

## Post-Deployment Configuration

### Set Up Scheduled Jobs

These jobs need to run periodically. Choose one method:

#### Option A: Cron Jobs (Linux/macOS)
```bash
# Edit crontab
crontab -e

# Add these lines:

# Expire old offers every day at midnight
0 0 * * * curl -X POST https://your-domain.com/api/admin/jobs/expire-offers \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json"

# Process message reminders every hour
0 * * * * curl -X POST https://your-domain.com/api/admin/jobs/process-message-reminders \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json"

# Optional: Clean expired sessions weekly (couple sessions still use in-memory cleanup)
0 2 * * 0 curl -X POST https://your-domain.com/api/admin/jobs/cleanup-sessions \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json"
```

#### Option B: GitHub Actions (Recommended)
Create `.github/workflows/scheduled-jobs.yml`:
```yaml
name: Evendi Scheduled Jobs

on:
  schedule:
    # Expire offers daily at midnight UTC
    - cron: '0 0 * * *'
    # Process message reminders every hour
    - cron: '0 * * * *'

jobs:
  expire-offers:
    if: github.event.schedule == '0 0 * * *'
    runs-on: ubuntu-latest
    steps:
      - name: Expire old offers
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/admin/jobs/expire-offers \
            -H "Authorization: Bearer ${{ secrets.ADMIN_KEY }}" \
            -H "Content-Type: application/json"

  process-reminders:
    if: github.event.schedule == '0 * * * *'
    runs-on: ubuntu-latest
    steps:
      - name: Process message reminders
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/admin/jobs/process-message-reminders \
            -H "Authorization: Bearer ${{ secrets.ADMIN_KEY }}" \
            -H "Content-Type: application/json"
```

#### Option C: External Service (AWS Lambda, Google Cloud Functions, etc.)
Create a Lambda function that calls the endpoints:
```javascript
exports.handler = async (event) => {
  const adminKey = process.env.ADMIN_KEY;
  const appUrl = process.env.APP_URL;
  
  try {
    // Expire offers
    if (event.source === 'expire-offers') {
      const response = await fetch(`${appUrl}/api/admin/jobs/expire-offers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminKey}`,
          'Content-Type': 'application/json'
        }
      });
      return await response.json();
    }
    
    // Process reminders
    if (event.source === 'process-reminders') {
      const response = await fetch(`${appUrl}/api/admin/jobs/process-message-reminders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminKey}`,
          'Content-Type': 'application/json'
        }
      });
      return await response.json();
    }
  } catch (error) {
    console.error('Job failed:', error);
    throw error;
  }
};
```

---

## Testing Guide

### Test 1: Vendor Login & Bcrypt
```bash
# 1. Register a vendor (this hashes password)
curl -X POST http://localhost:5000/api/vendors \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@photographer.com",
    "password": "SecurePassword123",
    "businessName": "Test Photography",
    "categoryId": "some-category-id"
  }'

# 2. Try to login
curl -X POST http://localhost:5000/api/vendors/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@photographer.com",
    "password": "SecurePassword123"
  }'

# Expected: Returns { vendor: {...}, sessionToken: "..." } ✅

# 3. Try with wrong password
curl -X POST http://localhost:5000/api/vendors/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@photographer.com",
    "password": "WrongPassword"
  }'

# Expected: Returns { error: "Ugyldig e-post eller passord" } ✅
```

### Test 2: Session Persistence
```bash
# 1. Get session token from login
TOKEN=$(curl -X POST http://localhost:5000/api/vendors/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@photographer.com","password":"SecurePassword123"}' \
  | grep -o '"sessionToken":"[^"]*' | cut -d'"' -f4)

# 2. Use token for authenticated request
curl -X GET http://localhost:5000/api/vendor/products \
  -H "Authorization: Bearer $TOKEN"

# Expected: Returns products list ✅

# 3. Restart server
# (Kill and restart the process)

# 4. Try same token again
curl -X GET http://localhost:5000/api/vendor/products \
  -H "Authorization: Bearer $TOKEN"

# Expected: Still works! ✅ (Session persisted to database)
```

### Test 3: Offer Expiration
```bash
# 1. Create vendor offer with past expiration date
curl -X POST http://localhost:5000/api/vendor/offers \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "coupleId": "some-couple-id",
    "title": "Photography Package",
    "totalAmount": 50000,
    "validUntil": "2025-01-15T23:59:59Z",
    "items": [...]
  }'

# 2. Run expiration job
curl -X POST http://localhost:5000/api/admin/jobs/expire-offers \
  -H "Authorization: Bearer $ADMIN_KEY"

# Expected: { message: "1 tilbud marked som utløpt", updated: 1 } ✅

# 3. Check offer status changed to "expired"
# (Query database or check offer details)
```

### Test 4: CASCADE DELETE
```bash
# 1. Create a test vendor and related data
# (vendor → inspiration → inspirationMedia)

# 2. Delete the vendor
curl -X DELETE http://localhost:5000/api/admin/vendors/{vendor-id} \
  -H "Authorization: Bearer $ADMIN_KEY"

# 3. Verify child records are deleted
psql -c "SELECT COUNT(*) FROM inspirations WHERE vendor_id='test-vendor-id';"

# Expected: 0 ✅ (Child records automatically deleted)
```

### Test 5: Contract Completion Workflow
```bash
# 1. Complete a vendor contract
curl -X POST http://localhost:5000/api/couple/vendor-contracts/{contract-id}/complete \
  -H "Authorization: Bearer $COUPLE_TOKEN"

# Expected: { id: ..., status: "completed", completedAt: "2025-01-17T..." } ✅

# 2. Now couple can leave a review
curl -X POST http://localhost:5000/api/couple/reviews \
  -H "Authorization: Bearer $COUPLE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": "...",
    "rating": 5,
    "title": "Excellent service",
    "body": "Great photographer!"
  }'

# Expected: Review created successfully ✅
```

---

## Monitoring & Logging

### Monitor Scheduled Jobs
```bash
# Check job execution logs
tail -f /var/log/evendi/jobs.log

# Or from GitHub Actions dashboard
# Settings → Actions → All workflows → Evendi Scheduled Jobs
```

### Monitor Database
```bash
# Check vendor sessions
psql -c "SELECT COUNT(*) FROM vendor_sessions WHERE expires_at > NOW();"

# Check active expired offers
psql -c "SELECT COUNT(*) FROM vendor_offers WHERE status='expired';"

# Check pending message reminders
psql -c "SELECT COUNT(*) FROM message_reminders WHERE status='pending' AND scheduled_for <= NOW();"
```

### Monitor Application
```bash
# Check for errors in logs
grep -i "error" /var/log/evendi/app.log | tail -20

# Monitor password hashing performance (should be ~100ms)
# Look for slow auth endpoints in access logs
tail -f /var/log/evendi/access.log | grep login
```

---

## Rollback Plan

If something goes wrong:

### Rollback Code
```bash
# Revert to previous version
git revert HEAD

# Rebuild and restart
npm run server:build
systemctl restart evendi  # or your restart command
```

### Rollback Database
```bash
# Restore from backup
psql -h YOUR_HOST -U YOUR_USER YOUR_DATABASE < backup_20250117.sql

# Or delete new table if safe
psql -c "DROP TABLE IF EXISTS vendor_sessions CASCADE;"
```

### Check Session Status
```bash
# Existing vendor sessions will be invalid after code rollback
# Users will need to login again - this is OK and expected
```

---

## Success Criteria

After deployment, verify:

- [ ] ✅ Vendor login works with bcrypt (test with test vendor)
- [ ] ✅ Vendor sessions persist after server restart
- [ ] ✅ Expired offers are detected and marked as expired
- [ ] ✅ Couples can complete contracts
- [ ] ✅ Message reminders are processed
- [ ] ✅ CASCADE DELETE works (delete vendor, children deleted)
- [ ] ✅ No errors in logs related to new features
- [ ] ✅ Scheduled jobs complete successfully

---

## Support

If deployment fails:

1. Check logs: `grep -i error /var/log/evendi/*.log`
2. Verify database connection: `psql -c "SELECT 1;"`
3. Verify bcryptjs installed: `npm list bcryptjs`
4. Verify migrations applied: `psql -c "SELECT * FROM vendor_sessions LIMIT 0;"`
5. Restart application: `systemctl restart evendi`

For issues, contact the development team with:
- Error message from logs
- Output of `npm list`
- Output of database schema check
