# Workflow Gaps Analysis 🔍

## Current Status
✅ **Database Schema:** Complete
- Inventory columns added to `vendor_products` (track_inventory, available_quantity, reserved_quantity, booking_buffer)
- `vendor_availability` table created with proper indexes
- Migrations generated and applied to production database

❌ **Business Logic Implementation:** INCOMPLETE

---

## Critical Workflow Gaps

### 1. **Offer Creation - NO INVENTORY CHECKING** ⚠️
**File:** `server/routes.ts` (line 3788)

**Current Issue:**
- POST `/api/vendor/offers` creates offers WITHOUT checking inventory availability
- No validation that requested quantity ≤ available quantity
- No reservation of quantities when offers are created
- System will allow overbooking

**Required Implementation:**
```typescript
// Before creating offer:
1. Get couple's wedding date
2. Fetch all pending/accepted offers for SAME product on SAME date
3. Calculate reserved quantity for that date
4. Check: available = availableQuantity - reservedForDate - bookingBuffer
5. If requested > available → return error with available count
6. If OK → proceed with offer creation
```

---

### 2. **Offer Response - NO INVENTORY UPDATES** ⚠️
**File:** `server/routes.ts` (search: "respond to offer")

**Current Issue:**
- POST `/api/couple/offers/:id/respond` doesn't update inventory
- When offer accepted: should decrement `availableQuantity`
- When offer declined: should release any held reservation
- No transaction safety (risk of double-booking)

**Required Implementation:**
```typescript
On Accept:
1. Get all items in offer
2. For each item with tracking enabled:
   - availableQuantity -= quantity
   - Create contract with quantity

On Decline:
1. No updates needed (no global reservation)
2. Just mark offer as declined
```

---

### 3. **Offer Deletion - NO CLEANUP** ⚠️
**File:** `server/routes.ts` (search: "DELETE.*offers")

**Current Issue:**
- DELETE `/api/vendor/offers/:id` doesn't check if offer was pending
- If offer was accepted, deletion should prevent losing inventory
- If offer was pending (should never delete), could lose tracked reservations

**Required Implementation:**
```typescript
Before deletion:
1. Get offer status
2. If status = "accepted":
   - Prevent deletion (offer is locked)
   - Or allow only with admin override
3. Log deletion for audit trail
4. If status = "pending":
   - Check if any inventory was reserved
   - Add back to availableQuantity if needed
```

---

### 4. **Frontend - NO INVENTORY DISPLAY** ⚠️
**Files:** Multiple screens

**Current Issue:**
- Product list doesn't show current availability
- Offer creation screen doesn't show inventory warnings
- Vendors can't see what's in stock vs reserved
- Couples can't see if items are available

**Required Implementation:**
```typescript
ProductListScreen:
- Show "Stock: X" next to each product
- Color code: 
  - Green: > buffer
  - Orange: > 0 but < buffer
  - Red: 0 available

OfferCreateScreen:
- Show available quantity in product selection
- Warn if selecting limited items
- Show "Only 5 available" type messages
- Prevent submitting over-stock requests

VendorProductScreen:
- Show current inventory at top
- Display pending reservations
- Show accepted contracts
- Calculate: available = total - reserved - buffer
```

---

### 5. **Vendor Availability Calendar - NOT WIRED** ⚠️
**File:** `vendor_availability` table exists but...

**Current Issue:**
- Table created but NO UI to populate it
- NO API endpoints to create/read availability
- NO integration with offer creation
- Availability dates not checked anywhere

**Required Implementation:**
```typescript
API Endpoints:
- POST /api/vendor/availability (create/bulk create)
- GET /api/vendor/availability?vendor=X&startDate=Y&endDate=Z
- PATCH /api/vendor/availability/:id
- DELETE /api/vendor/availability/:id

UI Components:
- Vendor availability calendar (mark dates as blocked/limited)
- When creating offer: check if date is available
- Show availability warnings to couples

Business Logic:
- When creating offer for a date:
  1. Check vendor_availability.status for that date
  2. Check max_bookings limit for that date
  3. Block offers if status = "blocked"
```

---

### 6. **Product Management - PARTIAL IMPLEMENTATION** ⚠️
**File:** Unclear if ProductCreateScreen has inventory fields

**Issues to Verify:**
- Can vendors enable/disable inventory tracking?
- Can they set available_quantity?
- Can they set booking_buffer?
- Does UI show calculated "available for booking"?

**Required:**
```typescript
ProductCreateScreen must have:
- ☐ Toggle: "Track Inventory"
- ☐ Input: "Total Available"
- ☐ Input: "Booking Buffer" (with explanation)
- ☐ Display: "X available for booking" (calculated)
- ☐ When editing: Show current reserved quantities
```

---

### 7. **Contract & Delivery - NO INVENTORY DEDUCTION** ⚠️
**Files:** Delivery creation, contract acceptance

**Issues:**
- When contract is fulfilled, should availableQuantity decrease?
- When delivery is marked complete, should update availability?
- No audit trail of inventory changes

**Required:**
```typescript
On Contract Acceptance:
- availableQuantity -= order quantity
- Create audit log entry

On Delivery Completion:
- Verify inventory was deducted
- Update delivery status only
```

---

### 8. **No Transactions or Rollback** ⚠️

**Critical Risk:**
- Multiple concurrent offers could cause double-booking
- Inventory checks + creation not atomic
- No locking mechanism

**Required:**
```typescript
Use database transactions:
- BEGIN TRANSACTION
- Check availability
- Create offer
- Update inventory
- COMMIT or ROLLBACK

Or use optimistic locking with version column
```

---

## Implementation Priority

### 🔴 CRITICAL (Prevents Overbooking)
1. Inventory checking in offer creation
2. Inventory updates on offer accept/decline
3. Transaction safety for inventory operations

### 🟠 HIGH (Prevents Data Loss)
4. Vendor availability calendar endpoints + UI
5. Contract/Delivery inventory integration
6. Inventory bounds checking & validation

### 🟡 MEDIUM (Better UX)
7. Frontend inventory display
8. Product management inventory fields
9. Offer deletion safeguards

### 🟢 LOW (Nice to Have)
10. Audit logging for inventory changes
11. Inventory analytics/reports
12. Forecasting based on pending offers

---

## Quick Implementation Checklist

### Backend
- [ ] Add inventory check to `POST /api/vendor/offers`
- [ ] Add inventory update to offer response handler
- [ ] Add inventory update to contract acceptance
- [ ] Create vendor availability API endpoints
- [ ] Add transaction wrapper to inventory operations
- [ ] Add error handling with available quantity in responses

### Frontend
- [ ] Add inventory fields to ProductCreateScreen
- [ ] Show availability on product list
- [ ] Show warnings in OfferCreateScreen
- [ ] Create vendor availability calendar UI
- [ ] Add inventory display to vendor dashboard

### Database
- [ ] Add unique constraint validation (booking_buffer ≤ available_quantity)
- [ ] Add triggers to prevent negative available_quantity
- [ ] Consider adding audit table for inventory changes

---

## Files Needing Updates
1. `server/routes.ts` - Multiple offer/contract endpoints
2. `client/screens/ProductCreateScreen.tsx` - Inventory fields
3. `client/screens/OfferCreateScreen.tsx` - Availability display
4. `client/screens/VendorProductsScreen.tsx` - Inventory summary
5. `shared/schema.ts` - Already updated ✅
6. Migration scripts - Already applied ✅

---

## Implementation Status Summary

### What's Done ✅
```
Database Schema & Migrations
├── vendor_products columns added ✅
│   ├── track_inventory ✅
│   ├── available_quantity ✅
│   ├── reserved_quantity ✅
│   └── booking_buffer ✅
├── vendor_availability table created ✅
│   ├── Table definition ✅
│   ├── Indexes (3x) ✅
│   └── Foreign keys ✅
└── All migrations applied to production ✅

TypeScript Types & Schemas
├── Drizzle ORM definitions ✅
├── Validation schemas ✅
└── Type exports ✅

Frontend UI
├── ProductCreateScreen ✅
│   ├── Toggle inventory tracking ✅
│   ├── Input total available ✅
│   ├── Input booking buffer ✅
│   └── Display calculated availability ✅
└── Form saves to API ✅
```

### What's Missing ❌
```
Backend Inventory Logic
├── Offer Creation (POST /api/vendor/offers) ❌
│   ├── NO inventory availability check ❌
│   ├── NO quantity reservation ❌
│   └── NO date-aware calculation ❌
├── Offer Response (POST /api/couple/offers/:id/respond) ❌
│   ├── NO inventory update on accept ❌
│   ├── NO inventory update on decline ❌
│   └── NO transaction safety ❌
├── Offer Deletion (DELETE /api/vendor/offers/:id) ❌
│   ├── NO cleanup checks ❌
│   └── NO inventory release ❌
└── Vendor Availability ❌
    ├── NO API endpoints for CRUD ❌
    ├── NO date checking logic ❌
    └── NO availability blocking ❌

Frontend Display
├── OfferCreateScreen ❌
│   ├── NO availability warnings ❌
│   ├── NO stock indicators ❌
│   └── NO date display ❌
├── Product List ❌
│   ├── NO stock display ❌
│   └── NO availability badges ❌
└── Vendor Dashboard ❌
    └── NO inventory summary ❌

Data Constraints & Safety
├── No negative quantity prevention ❌
├── No atomic transactions ❌
├── No audit logging ❌
└── No double-booking protection ❌
```

---

## Critical Path to Production-Ready

### If Only Preventing Overbooking (Minimum Viable):
1. ✅ Database schema (DONE)
2. ✅ Frontend UI fields (DONE)  
3. ❌ Add inventory check to offer creation (4 hours)
4. ❌ Add inventory update to offer response (3 hours)
5. ❌ Basic transaction wrapping (2 hours)

**Time: ~9 hours to "safe" status**

### If Adding Full Features (Recommended):
1. ✅ Database schema (DONE)
2. ✅ Frontend UI fields (DONE)
3. ❌ Offer creation inventory checks (4 hours)
4. ❌ Offer response inventory updates (3 hours)
5. ❌ Vendor availability calendar API (5 hours)
6. ❌ Vendor availability calendar UI (4 hours)
7. ❌ Offer creation with availability display (3 hours)
8. ❌ Contract/Delivery inventory updates (2 hours)
9. ❌ Transaction safety & error handling (2 hours)
10. ❌ Testing & edge cases (4 hours)

**Time: ~32 hours to full feature completeness**

### Recommended Starting Point (MVP):
- [ ] Implement offer creation inventory checks (high risk)
- [ ] Implement offer response updates (prevents data loss)
- [ ] Add basic error messages with available counts
- [ ] Later: Add frontend display, vendor availability, full features

