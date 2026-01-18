# Wedflow Data Flow - Visual Problem Map

## Session Management Issue

```
CURRENT (Problematic):
┌─────────────────────────────────────────────────────┐
│ Client Browser/App                                   │
│ (Stores session token in AsyncStorage)              │
└────────────────┬────────────────────────────────────┘
                 │ Bearer Token in Headers
                 ▼
┌──────────────────────────────────────────────────────┐
│ Express Server (Single Instance)                      │
├──────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐ │
│ │ In-Memory Session Cache (Map)                     │ │
│ │ - VENDOR_SESSIONS: Map<token, VendorSession>    │ │
│ │ - COUPLE_SESSIONS: Map<token, CoupleCache>      │ │
│ │ - Cleaned hourly                                 │ │
│ │ - LOST ON SERVER RESTART                         │ │
│ └──────────────────────────────────────────────────┘ │
│                    ▲                                  │
│                    │ 5% of requests check DB          │
│                    ▼                                  │
│ ┌──────────────────────────────────────────────────┐ │
│ │ PostgreSQL Database (coupleSessions table)       │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘

PROBLEMS:
❌ Cache diverges from DB
❌ Multi-server setup breaks (each server has separate cache)
❌ Stale sessions in memory for up to 1 hour
❌ No synchronization mechanism
```

---

## Foreign Key Cascade Delete Issues

```
VENDOR TABLE (id: UUID)
    │
    ├──references()──▶ inspirations (vendorId)           ❌ NO CASCADE
    │
    ├──references()──▶ deliveries (vendorId)            ❌ NO CASCADE
    │
    ├──references()──▶ vendorProducts (vendorId)         ❌ NO CASCADE
    │
    ├──references()──▶ vendorOffers (vendorId)           ❌ NO CASCADE
    │
    ├──references()──▶ inspirationInquiries (vendorId)   ❌ NO CASCADE
    │
    └──references()──▶ vendorReviews (vendorId)          ❌ NO CASCADE

IF VENDOR IS DELETED:
┌─────────────────────────────────────────────────────┐
│ Orphaned Records (Lost References)                  │
├─────────────────────────────────────────────────────┤
│ - 50 inspirations still reference deleted vendor_id │
│ - 20 deliveries point to null vendor               │
│ - 100 vendor products abandoned                     │
│ - 30 pending offers floating                        │
│ - Messages still reference orphaned convos          │
└─────────────────────────────────────────────────────┘

QUERY IMPACT:
- SELECT * FROM inspirations causes referential integrity violation
- Foreign key constraints not enforced
- Database grows with unreferenced data
```

---

## Transaction Boundary Issues - Offer Acceptance Workflow

```
USER: Couple accepts vendor offer

CURRENT (NO TRANSACTION):
┌────────────────────────────────────────────────────┐
│ Step 1: Update VendorOffer status = "accepted"     │
└────────────────────────────────────────────────────┘
                    ▼
         (⚠️ SERVER CRASH HERE)
                    ▼
┌────────────────────────────────────────────────────┐
│ Step 2: Create VendorContract record               │
└────────────────────────────────────────────────────┘
                    ▼
         (⚠️ SERVER CRASH HERE)
                    ▼
┌────────────────────────────────────────────────────┐
│ Step 3: Send notification to vendor                │
└────────────────────────────────────────────────────┘

FAILURE SCENARIO:
- Step 1 succeeds, Step 2-3 fail
- Offer shows as "accepted" in UI
- No contract exists in database
- Vendor never notified
- Couple thinks service is bought, vendor doesn't know

RESULT: Lost sale, customer support issue, data inconsistency
```

---

## Missing Cascade Deletes - Ripple Effects

```
DELETE DELIVERY (id: 12345)
                 │
                 ├──HAS MANY───▶ deliveryItems (id: A, B, C)
                 │              (Orphaned - still exist)
                 │
                 └──HAS MANY───▶ messages 
                               (if referenced by conversations)
                               (Orphaned - still exist)

Later: App queries delivery items for delivery 12345
      ❌ Returns empty or error (records exist but unreferenced)
      ❌ Database has wasted storage for orphaned items
      ❌ No referential integrity

SCALE PROBLEM:
- 1000 vendors × 50 avg deliveries = 50,000 delivery items
- If vendors deleted: 50,000 orphaned records accumulate
- Database grows, queries slow, backup size increases
```

---

## Authentication Flow - Password Hashing Issue

```
CURRENT (INSECURE):
┌─────────────────────────────────────────────────────┐
│ User Password: "MyWeddingPassword2024!"             │
└──────────────────────┬──────────────────────────────┘
                       │ SHA256 (NO SALT)
                       ▼
┌─────────────────────────────────────────────────────┐
│ Stored: a7f3d1e2b4c5a9f8d6e7c8b9a0f1e2d3a4b5c6d7   │
└─────────────────────────────────────────────────────┘

VULNERABILITY:
┌─────────────────────────────────────────────────────┐
│ Attacker obtains DB dump                            │
│ Uses precomputed rainbow table (free online)        │
│ Matches hash in milliseconds                        │
│                                                      │
│ Result: All passwords cracked instantly             │
└─────────────────────────────────────────────────────┘

PROPER (SHOULD BE):
┌─────────────────────────────────────────────────────┐
│ User Password: "MyWeddingPassword2024!"             │
└──────────────────────┬──────────────────────────────┘
                       │ bcrypt (WITH SALT + COST)
                       ▼
┌─────────────────────────────────────────────────────┐
│ Stored: $2b$12$R9h2cIPz0gi.URNN3g3h2OPST...       │
│         (Includes salt + cost factor)               │
└─────────────────────────────────────────────────────┘

PROTECTION:
- Slow by design (100ms+ per password)
- Rainbow tables useless
- Adaptive cost as computers faster
```

---

## Workflow Gap: Vendor Approval Status

```
USER STORY: Vendor applies, gets rejected, wants to reapply

CURRENT WORKFLOW:
┌──────────────┐
│   pending    │ ──[admin approves]──▶ ┌──────────────┐
│   (applied)  │                      │  approved    │
└──────────────┘                      └──────────────┘
      │
      └──[admin rejects]──▶ ┌──────────────┐
                            │  rejected    │
                            └──────────────┘
                                   │
                                   └─ DEAD END ❌
                                   
What now?
- Can vendor reapply? (NO WORKFLOW)
- Can admin un-reject? (NO ENDPOINT)
- How long until auto-cleanup? (UNDEFINED)
- Can vendor interact while rejected? (UNDEFINED)

MISSING STATES:
- "reapplication_pending" (retry after rejection)
- "suspended" (temporary deactivation)
- "reactivation_requested" (after suspension)
- "approved_expires_on" (date-based approval)
```

---

## Unfinished Feature: Message Reminders (Anti-Ghosting)

```
Database has table:
┌────────────────────────────────────────────┐
│ message_reminders                          │
├────────────────────────────────────────────┤
│ id, conversationId, reminderDate, status   │
│ createdAt, sentAt, ...                     │
└────────────────────────────────────────────┘

CODE SEARCH RESULTS:
- ❌ NO API endpoint to create reminder
- ❌ NO API endpoint to list reminders
- ❌ NO background job to send reminders
- ❌ NO notification sent to couple when reminder fires
- ❌ NO way to clear reminder after response
- ❌ Table structure defined but feature incomplete

STATUS: Abandoned/Half-implemented feature
```

---

## Offer Expiration Issue

```
OFFER LIFECYCLE:

CREATE OFFER
    │
    ├─ validUntil = "2024-01-20T15:30:00Z"
    │
    └─ status = "pending"
           │
           ├─ [couple accepts] ──▶ status = "accepted" ✓
           │
           └─ [couple declines] ──▶ status = "declined" ✓
           
❌ MISSING: What if validUntil date passes?
   - Status still "pending"
   - UI might still show as active
   - Couple can accept expired offer
   - Vendor assumes it's still valid

NO WORKFLOW:
- No background job checking validUntil
- No automatic status update to "expired"
- No notification to couple that offer expired
- No notification to vendor that offer was ignored

CONSEQUENCE:
┌──────────────────────────────────────────┐
│ Vendor: "Why is 2 week old offer accepted?│
│ Couple: "I thought offer was still valid" │
│ Support: "Why weren't you notified?"      │
└──────────────────────────────────────────┘
```

---

## Idempotency Problem - Duplicate Requests

```
USER: Taps "Send Message" button

FAST CONNECTION:                     SLOW CONNECTION:
[Send] ──▶ Success ──▶ Done          [Send] ──▶ (loading...)
                                           ├─ [Tap again]
                                           └─ Two requests sent

SERVER RECEIVES:
REQUEST 1: "Hello, can you..."       REQUEST 2: "Hello, can you..."

NO IDEMPOTENCY KEY CHECK:
┌─────────────────────────────────────────┐
│ INSERT message 1: ✓ Success            │
│ INSERT message 2: ✓ Success            │
└─────────────────────────────────────────┘

USER SEES:
- Two identical messages from same sender
- No indication one is duplicate
- Other user confused

SHOULD HAVE:
┌─────────────────────────────────────────┐
│ REQUEST 1 (id-abc123): ✓ Stored        │
│ REQUEST 2 (id-abc123): ✓ Idempotent   │
│                        (returns same)   │
│                                         │
│ Result: Only one message created        │
└─────────────────────────────────────────┘

AFFECTED CRITICAL OPERATIONS:
- Creating messages (medium impact)
- Creating offers (high impact)
- Accepting offers → creating contracts (high impact)
- Sending invitations (high impact)
```

---

## Summary: Risk Heatmap

```
┌──────────────────────┬──────────────┬────────────────┐
│ Issue                │ Severity     │ User Impact    │
├──────────────────────┼──────────────┼────────────────┤
│ No CASCADE DELETE    │ 🔴 CRITICAL  │ Data corruption│
│ Password hashing     │ 🔴 CRITICAL  │ Security       │
│ Session sync         │ 🔴 CRITICAL  │ Auth failures  │
│ Missing transactions │ 🟠 HIGH      │ Lost data      │
│ Vendor status check  │ 🟠 HIGH      │ Unauthorized   │
│ Offer expiration     │ 🟡 MEDIUM    │ Confusion      │
│ Contract completion  │ 🟡 MEDIUM    │ Workflow block │
│ Idempotency         │ 🟡 MEDIUM    │ Duplicates     │
│ Message reminders    │ 🟡 MEDIUM    │ Feature missing│
└──────────────────────┴──────────────┴────────────────┘

RECOMMENDATIONS:
1. Fix critical issues IMMEDIATELY before production
2. Add transactions to all multi-step operations
3. Document all undefined workflows
4. Complete half-finished features
5. Add integration tests for workflows
```
