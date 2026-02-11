# Subscription System - Complete Implementation Guide

## ✅ Completed Features

### 1. Trial System
- **30-day trial period** starting from vendor registration
- **Automatic pause** when trial expires (status: "trialing" → "paused")
- **Progressive FOMO messaging** based on days remaining:
  - **7+ days**: Green badge with ✨ emoji
  - **≤7 days**: Orange warning with ⏰ emoji  
  - **≤3 days**: Red alert with ⚠️ emoji
- **Access restrictions** for paused subscriptions (403 responses)

### 2. Payment Flow
- **VendorPaymentScreen**: Full payment UI with:
  - Subscription tier details
  - Feature list with benefits
  - "What you'll lose" section (FOMO)
  - Social proof (50+ vendors)
  - Vipps integration ready
- **Dashboard banners**: Dynamic payment/trial status banners
- **Navigation**: Integrated in RootStackNavigator

### 3. Access Control
- **checkVendorSubscriptionAccess()** function:
  - Validates subscription exists
  - Blocks paused subscriptions
  - Auto-pauses expired trials
  - Returns detailed error responses
- **Protected endpoints**:
  - `POST /api/vendor/inspirations`
  - `POST /api/vendor/products`
  - `POST /api/vendor/offers`
  - `POST /api/vendor/deliveries`

### 4. Automated Tasks (Cron Jobs)
- **Daily at 09:00 UTC**: Check for expired trials
  - Pauses expired subscriptions
  - Sends in-app notifications
- **Daily at 10:00 UTC**: Send trial reminders
  - **7 days before**: "⏰ 7 dager til prøveperioden utløper"
  - **3 days before**: "⚠️ Siste sjanse - 3 dager igjen!"
  - **1 day before**: "🚨 SISTE DAG - Prøveperioden utløper i morgen!"

### 5. FOMO & Scarcity Messaging
All messaging emphasizes **benefits lost** rather than brutal penalties:

#### Payment Banner (Paused)
```
⏸️ Tilgangen din er satt på pause
Du går glipp av nye henvendelser, showcase-visninger og potensielle kunder

💔 Ingen showcase-visninger • 📭 Meldinger deaktivert • 🚫 Nye henvendelser blokkert

[Reaktiver] →
```

#### Payment Banner (Expiring)
```
⏰ Kun X dager igjen!
Sikre din plass og fortsett å motta henvendelser fra brudepar

[Sikre plass] →
```

#### Trial Banner (≤7 days)
```
⏰ X dager igjen - sikre din plass nå
Trykk for å se hva du mister
```

On tap shows:
```
Om X dager mister du tilgang til:

• 📸 Showcase-galleriet ditt
• 💬 Alle aktive samtaler
• 📨 Nye henvendelser fra brudepar
• 📊 Statistikk og innsikt

Sikre din plass nå for kun XXX NOK/mnd!
```

---

## 🔧 Setup Instructions

### Environment Variables (.env)
```bash
# Admin authentication for cron jobs
ADMIN_CRON_SECRET=your-secure-admin-secret-here

# Database
DATABASE_URL=your-neon-postgres-url

# Vipps (optional - ready for future integration)
VIPPS_CLIENT_ID=your-vipps-client-id
VIPPS_CLIENT_SECRET=your-vipps-client-secret
VIPPS_SUBSCRIPTION_KEY=your-vipps-subscription-key
```

### Installation
```bash
# Already installed
npm install node-cron @types/node-cron
```

### Server Startup
The cron jobs initialize automatically when the server starts:
```bash
npm run server:dev  # Development
npm run server:prod # Production
```

You should see:
```
[CRON] Initializing subscription cron jobs...
[CRON] ✅ Expired trials check scheduled (daily at 09:00 UTC)
[CRON] ✅ Trial reminders scheduled (daily at 10:00 UTC)
[CRON] All subscription cron jobs initialized
```

---

## 📡 API Endpoints

### Public Endpoints

#### `GET /api/subscription/tiers`
Returns all active subscription tiers (no auth required).

**Response:**
```json
[
  {
    "id": "tier-id",
    "name": "basic",
    "displayName": "Basis",
    "description": "Perfekt for mindre leverandører",
    "priceNok": 499,
    "features": {
      "maxPhotos": 10,
      "analytics": false,
      "prioritizedInSearch": false
    }
  }
]
```

### Vendor Endpoints (Auth Required)

#### `POST /api/vendors/register`
Register new vendor with trial subscription.

**Request:**
```json
{
  "companyName": "Blomster AS",
  "contactName": "Ola Nordmann",
  "email": "ola@blomster.no",
  "phone": "+4712345678",
  "password": "securePassword123",
  "tierId": "tier-id"
}
```

**Response:**
```json
{
  "message": "Registrering vellykket! Din søknad er under behandling. Du får 30 dager gratis prøveperiode.",
  "vendor": { ... }
}
```

#### `GET /api/vendor/subscription/status`
Get vendor's subscription status.

**Response:**
```json
{
  "subscription": {
    "id": "sub-id",
    "status": "trialing",
    "currentPeriodEnd": "2024-02-15T00:00:00Z"
  },
  "tier": {
    "displayName": "Basis",
    "priceNok": 499,
    "features": { ... }
  },
  "daysRemaining": 15,
  "needsPayment": false,
  "isTrialing": true,
  "isPaused": false
}
```

### Admin Endpoints (Admin Auth Required)

#### `POST /api/admin/subscriptions/check-expired-trials`
Check and pause expired trials (called by cron).

**Response:**
```json
{
  "expiredCount": 3,
  "paused": [
    {
      "vendorId": "vendor-1",
      "subscriptionId": "sub-1",
      "tierName": "Basis"
    }
  ]
}
```

#### `POST /api/admin/subscriptions/send-trial-reminders`
Send reminders for expiring trials (called by cron).

**Response:**
```json
{
  "reminders7d": 5,
  "reminders3d": 2,
  "reminders1d": 1
}
```

---

## 🎨 Frontend Components

### VendorDashboardScreen
- **Payment Banner**: Shows when `needsPayment = true`
  - Red background when paused
  - Orange background when expiring
  - Feature loss enumeration
  - "Reaktiver" or "Sikre plass" button
  
- **Trial Banner**: Shows when `isTrialing = true` and not needing payment
  - Progressive color (green → orange)
  - Interactive tap to see feature loss details
  - Auto-refresh every 60 seconds

### VendorPaymentScreen
New modal screen with:
- Subscription tier details
- Price display
- Feature list
- "What you'll lose" section
- Social proof
- Vipps payment button (ready for integration)

---

## 🔐 Access Control

### Protected Endpoints
The following vendor endpoints now require an active subscription:
```typescript
// Pattern used in all protected endpoints:
app.post("/api/vendor/[resource]", async (req, res) => {
  const vendorId = await checkVendorAuth(req, res);
  if (!vendorId) return;
  
  // NEW: Check subscription access
  if (!(await checkVendorSubscriptionAccess(vendorId, res))) return;
  
  // ... rest of endpoint logic
});
```

### Error Responses
When access is denied, endpoints return `403 Forbidden` with details:

**No subscription:**
```json
{
  "error": "Ingen aktivt abonnement",
  "requiresPayment": true
}
```

**Paused subscription:**
```json
{
  "error": "Abonnement satt på pause",
  "message": "Ditt abonnement er satt på pause. Betal for å fortsette å bruke Evendi.",
  "requiresPayment": true,
  "isPaused": true
}
```

**Expired trial:**
```json
{
  "error": "Prøveperiode utløpt",
  "requiresPayment": true,
  "trialExpired": true
}
```

---

## 🧪 Testing

### Manual Cron Trigger
For testing without waiting for scheduled time:

```typescript
import { manualTriggers } from './server/cron-subscriptions';

// Check expired trials
await manualTriggers.checkExpiredTrials();

// Send trial reminders
await manualTriggers.sendTrialReminders();
```

### Test Scenarios

#### 1. Trial Expiration Flow
1. Create vendor with 30-day trial
2. Update `currentPeriodEnd` to yesterday in database
3. Trigger `checkExpiredTrials()`
4. Verify subscription status changes to "paused"
5. Verify in-app notification created
6. Verify vendor can't create inspirations/products

#### 2. Trial Reminders
1. Create vendor with trial expiring in 7 days
2. Trigger `sendTrialReminders()`
3. Verify 7-day reminder notification created
4. Check notification title: "⏰ 7 dager til prøveperioden utløper"
5. Repeat for 3-day and 1-day scenarios

#### 3. Payment Flow
1. Navigate to VendorPaymentScreen
2. Review tier details and pricing
3. Click "Sikre plass med Vipps"
4. Confirm payment dialog
5. (Currently shows Vipps integration pending)

---

## 📊 Database Schema

### vendorSubscriptions
```sql
CREATE TABLE vendor_subscriptions (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  tier_id UUID NOT NULL REFERENCES subscription_tiers(id),
  status TEXT NOT NULL, -- "trialing", "active", "paused", "cancelled"
  current_period_end TIMESTAMP NOT NULL,
  paused_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### subscriptionTiers
```sql
CREATE TABLE subscription_tiers (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_nok INTEGER NOT NULL,
  features JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📋 Next Steps (Optional Enhancements)

### 1. Email Notifications ⏳
Currently using in-app notifications only. To add email:
```typescript
// In server/cron-subscriptions.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({ ... });

async function sendTrialExpiryEmail(vendor, subscription, tier) {
  await transporter.sendMail({
    from: 'no-reply@evendi.no',
    to: vendor.email,
    subject: '⚠️ Prøveperioden utløper snart',
    html: `... HTML template ...`
  });
}
```

### 2. Vipps Payment Integration ✅ (Backend Ready)
Backend endpoint exists: `/api/subscription/vipps/initiate`

Frontend just needs to handle the response and redirect to Vipps URL.

### 3. Subscription Management Screen 🔜
Allow vendors to:
- View current subscription details
- Upgrade/downgrade tiers
- View payment history
- Cancel subscription

### 4. Analytics Dashboard 📊
Track conversion metrics:
- Trial-to-paid conversion rate
- Payment banner click-through rate
- Reminder effectiveness
- Churn rate by tier

---

## 🎯 Key Success Metrics

### Conversion Psychology
- ✅ Progressive urgency (7d → 3d → 1d)
- ✅ Benefit-focused messaging (not brutal)
- ✅ Specific feature enumeration
- ✅ Social proof ("50+ vendors")
- ✅ Emoji-enhanced engagement
- ✅ Norwegian cultural tone

### Technical Reliability
- ✅ Automated trial expiration
- ✅ Access restrictions enforced
- ✅ Graceful error handling
- ✅ Real-time status updates (60s refresh)
- ✅ Transactional consistency

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Set `ADMIN_CRON_SECRET` in environment variables
- [ ] Verify database migrations are applied
- [ ] Test cron jobs manually
- [ ] Verify Vipps credentials (if using)

### Post-deployment
- [ ] Monitor cron job logs for first 3 days
- [ ] Verify expired trial checks run daily
- [ ] Verify reminders are sent correctly
- [ ] Check notification delivery
- [ ] Monitor 403 error rates

### Monitoring
```bash
# Check cron execution
grep "CRON" server.log | tail -20

# Check subscription pauses
grep "Paused expired trial" server.log

# Check reminder sends
grep "Trial reminder sent" server.log
```

---

## 📞 Support & Troubleshooting

### Common Issues

#### Cron jobs not running
**Symptom**: No cron logs in server output
**Solution**: Verify `initializeSubscriptionCrons()` is called in `server/index.ts`

#### Access denied after payment
**Symptom**: 403 errors even with active subscription
**Solution**: Check subscription status in database, ensure `status = "active"`

#### Reminders not sending
**Symptom**: No notifications created
**Solution**: 
1. Check `currentPeriodEnd` dates in database
2. Verify date calculations in cron logic
3. Check notification table for errors

---

## 📄 License & Credits

**System**: Evendi Subscription Management
**Author**: Implementation completed as per requirements
**Date**: 2024
**Version**: 1.0.0

**Technologies**:
- Node.js + Express
- PostgreSQL (Neon)
- Drizzle ORM
- node-cron
- React Native + Expo
- TanStack Query

---

*End of Documentation*
