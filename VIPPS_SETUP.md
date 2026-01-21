# VIPPS Payment Integration Setup

## Quick Start

Du har nå VIPPS test-miljøet konfigurert for betalingsintegrasjon.

### 1. **Legg inn VIPPS Credentials**

I `.env.local` (eller `.env` for production), legg inn:

```env
VIPPS_CLIENT_ID=your_test_client_id
VIPPS_CLIENT_SECRET=your_test_client_secret
VIPPS_MERCHANT_SERIAL_NUMBER=123456
VIPPS_AUTH_TOKEN=generate_a_random_token_for_callbacks
VIPPS_CALLBACK_URL=https://your-domain.com/api/vipps/callback
VIPPS_REDIRECT_URL=https://your-domain.com/payment-success
```

### 2. **Test Payment Flow**

**API Endpoints:**

```bash
# 1. Initiate checkout
curl -X POST http://localhost:5000/api/vendor/subscription/checkout \
  -H "Authorization: Bearer YOUR_VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tierId": "TIER_ID"}'

# Response:
# {
#   "paymentId": "payment-123",
#   "paymentUrl": "https://apitest.vipps.no/...",
#   "amount": 149,
#   "tierName": "Starter"
# }

# 2. Check payment status
curl http://localhost:5000/api/vendor/subscription/payment-status/WF-ABC123-123456789 \
  -H "Authorization: Bearer YOUR_VENDOR_TOKEN"

# Response:
# {
#   "status": "pending|succeeded|failed",
#   "amount": 14900,
#   "vippsStatus": "RESERVED|CAPTURED|FAILED",
#   "paidAt": "2026-01-21T12:00:00Z"
# }
```

### 3. **Subscription Tiers Setup**

Før vendors kan kjøpe abonnement, må du opprette tiers:

```bash
# Admin: Create subscription tier
curl -X POST http://localhost:5000/api/admin/subscription/tiers \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "starter",
    "displayName": "Starter",
    "description": "Perfect for new vendors",
    "priceNok": 149,
    "sortOrder": 1,
    "isActive": true,
    "maxInspirationPhotos": 10,
    "maxMonthlyVideoMinutes": 0,
    "maxStorageGb": 5,
    "hasAdvancedAnalytics": false,
    "hasPrioritizedSearch": false,
    "hasCustomLandingPage": false,
    "hasApiAccess": false,
    "hasVippsPaymentLink": false,
    "hasCustomBranding": false,
    "commissionPercentage": 3,
    "stripeFeePercentage": 0
  }'
```

### 4. **Payment Webhook Handling**

Når betaling er gjort, mottar systemet en webhook fra VIPPS på:
```
POST /api/vipps/callback
```

Webhooks blir automatisk prosessert og:
- Oppdaterer betalingsstatus
- Oppretter/oppdaterer vendor subscription
- Aktiverer feature access basert på tier

### 5. **VIPPS Test Cards**

Bruk disse test-kortene i VIPPS testmiljøet:

| Kort | Status |
|------|--------|
| 4111 1111 1111 1111 | ✅ Godkjent |
| 4000 0000 0000 0002 | ❌ Avslått |
| 5555 5555 5555 4444 | ✅ Godkjent |

**Test mobil:** `4712345678` (default test number)

### 6. **API Reference**

#### Vendor Endpoints
```
POST /api/vendor/subscription/checkout
GET  /api/vendor/subscription/current
GET  /api/vendor/subscription/tiers
GET  /api/vendor/subscription/usage-limits
GET  /api/vendor/subscription/payment-status/:orderId
POST /api/vendor/subscription/track-usage
POST /api/vendor/subscription/check-feature
```

#### Admin Endpoints
```
GET  /api/admin/subscription/tiers
POST /api/admin/subscription/tiers
PATCH /api/admin/subscription/tiers/:id
GET  /api/admin/subscription/vendors
POST /api/admin/subscription/payments/:orderId/capture
POST /api/admin/subscription/payments/:orderId/refund
GET  /api/admin/subscription/payments/:vendorId
GET  /api/admin/subscription/usage/:vendorId
```

### 7. **Payment Statuses**

```
pending    → Betaling initialisert, venter på VIPPS
succeeded  → Betaling mottatt og captured
failed     → Betaling avslått
refunded   → Betaling refundert
```

### 8. **Feature Access**

Basert på subscription tier:

```json
{
  "has_advanced_analytics": true,
  "has_prioritized_search": true,
  "has_custom_landing_page": false,
  "max_inspiration_photos": -1,
  "max_storage_gb": 50
}
```

Sjekk feature access:
```bash
curl -X POST http://localhost:5000/api/vendor/subscription/check-feature \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"feature": "advanced_analytics"}'
```

---

**Next Steps:**
1. ✅ VIPPS service setup - DONE
2. ✅ Payment endpoints - DONE
3. 🔲 Create subscription UI for vendors
4. 🔲 Feature enforcement in app
5. 🔲 Admin payment management dashboard
