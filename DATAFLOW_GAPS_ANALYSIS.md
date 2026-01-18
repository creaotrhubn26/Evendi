# Wedflow App: Workflow Gaps & Data Flow Issues

## Critical Issues

### 1. **Missing Cascade Delete Constraints** ⚠️ CRITICAL
**Location:** Database schema (`shared/schema.ts`)

**Problem:** Foreign key relationships lack proper cascade delete configuration. If a parent record is deleted, orphaned child records remain:
- Deleting a `vendor` leaves orphaned `inspirations`, `deliveries`, `vendorProducts`, `vendorOffers`
- Deleting an `inspirationCategory` leaves orphaned `inspirations`
- Deleting a `couple` leaves orphaned `conversations`, `messages`, `coupleVendorContracts`
- Deleting a `delivery` leaves orphaned `deliveryItems`
- Deleting a `conversation` leaves orphaned `messages`
- Deleting a `vendorOffer` leaves orphaned `vendorOfferItems`

**Impact:** Database corruption, orphaned data consuming storage, queries returning broken references

**Fix Needed:** Add `onDelete: 'cascade'` to all Drizzle foreign key definitions

---

### 2. **Dual Storage System - Race Conditions** 🔴 HIGH PRIORITY
**Location:** `server/routes.ts` (lines 24-36)

**Problem:** Session management uses both in-memory Maps AND database:
```typescript
const VENDOR_SESSIONS: Map<string, VendorSession> = new Map();
const COUPLE_SESSIONS: Map<string, CoupleSessionCache> = new Map();
```

**Issues:**
- In-memory cache can diverge from database on server restart
- Session cleanup only runs hourly - expired sessions may remain in memory
- No synchronization mechanism between cache and DB
- Multi-server deployments would break (each server has separate cache)

**Impact:** 
- Users logged out on server restart
- Session data inconsistency between requests
- Session expiry enforcement is unreliable

**Workflows Affected:**
- Vendor login sessions
- Couple login sessions
- Admin authentication

---

### 3. **Weak Authentication - No Password Hashing** 🔴 CRITICAL
**Location:** `server/routes.ts` (line 45)

```typescript
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}
```

**Problem:** SHA256 without salt is cryptographically weak and vulnerable to rainbow table attacks

**Impact:** Password breaches have minimal protection

---

### 4. **Missing Transaction Boundaries** 🟠 MEDIUM
**Location:** Multiple API endpoints (`server/routes.ts`)

**Problem:** Multi-step operations lack transaction atomicity:
- Creating offer + updating conversation (lines 2300+)
- Creating vendor contract + sending notifications (lines 4350+)
- Accepting offer + creating contract (implicit workflow)

If server crashes mid-operation, data becomes inconsistent:
- Offer created but conversation not updated
- Contract created but notifications not sent

**Affected Workflows:**
- Offer acceptance → contract creation
- Inquiry conversion → conversation creation
- Schedule updates → vendor notifications

---

### 5. **Orphaned Message Handling** 🟠 MEDIUM
**Location:** `server/routes.ts` (Message deletion endpoints)

**Problem:** Messages reference conversations/vendors but have no ON DELETE CASCADE:
- If conversation is deleted, messages remain orphaned
- If vendor is deleted, vendor messages remain

Additionally, soft-delete fields exist (`deletedByVendor`, `deletedByCouple`) but hard deletion also possible, creating inconsistent states

**Workflow Issue:** Conversation deletion workflow is unclear - what happens to existing messages?

---

### 6. **Session Token Not Revoked on Logout** 🟠 MEDIUM
**Location:** `server/routes.ts` (lines 1062-1070, 300-306)

```typescript
app.post("/api/couples/logout", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    COUPLE_SESSIONS.delete(token); // Only in-memory deletion!
    await db.delete(coupleSessions).where(eq(coupleSessions.token, token)); // DB deletion
  }
  res.json({ message: "Logget ut" });
});
```

**Problem:** Token could theoretically be replayed if request fails to delete from DB

**Better Approach:** Use token blacklist or explicit "revoked tokens" table

---

### 7. **Missing Vendor Status Verification Across Workflows** 🟠 MEDIUM
**Location:** Multiple endpoints (`server/routes.ts`)

**Problem:** Many endpoints accept vendor interactions without verifying `vendor.status = "approved"`:
- Vendor can send messages even if rejected/pending
- Vendor can create offers while pending approval
- Vendor can upload inspirations while pending

**Workflow Issue:** Vendors in "pending" or "rejected" status can still interact with couples

---

### 8. **No Idempotency Keys** 🟠 MEDIUM
**Location:** All POST/PATCH endpoints

**Problem:** Duplicate requests could create duplicate records:
- Sending the same message twice creates two message records
- Creating offer twice creates duplicates
- Accepting offer twice might create duplicate contracts

**Missing:** Idempotency-key headers for critical operations

---

### 9. **Incomplete Data Validation for Cross-Resources** 🟡 LOW-MEDIUM
**Location:** Multiple endpoints

**Issues:**
- Creating conversation from inquiry doesn't verify `inspirationId` still exists
- Updating vendor contract doesn't verify `vendorId` and `coupleId` relationship
- Creating offer items with `productId` doesn't validate product belongs to vendor

```typescript
// Example: No validation that product belongs to vendor
const [product] = await db.select().from(vendorProducts)
  .where(eq(vendorProducts.id, productId)); // Should also check vendorId!
```

---

### 10. **Broken Notification Workflow** 🟡 MEDIUM
**Location:** `server/routes.ts` (Schedule event notifications)

**Problem:** 
- Function `notifyVendorsOfChangeInternal()` is called (lines 3424, 3380) but not exported from main `registerRoutes`
- Unclear what happens with these notifications
- No verification that vendors actually received notifications

**Workflow Issues:**
- Vendors might not be notified of schedule/speech changes
- No retry mechanism if notification fails

---

### 11. **Admin Authentication Not Persisted** 🟡 LOW-MEDIUM
**Location:** `client/screens/AdminDashboardScreen.tsx`

**Problem:** Admin key stored only in component state, lost on app restart
- No persistent session like vendor/couple
- Admin must re-authenticate each time app opens

---

### 12. **Couple Login Doesn't Validate Email Format on Mobile** 🟡 LOW
**Location:** `client/screens/CoupleLoginScreen.tsx`

**Problem:** Uses simple password field but couples use email-based login (no actual passwords). UX confusion:
- Field labeled "password" 
- Schema allows empty password strings
- Validation schema accepts optional password

---

### 13. **Missing Soft-Delete Patterns Inconsistency** 🟡 LOW-MEDIUM
**Location:** Multiple tables

**Issue:** Some tables use soft-delete (messages with `deletedByVendor`/`deletedByCouple`), others use hard delete:
- Inconsistent query patterns needed
- Queries must check deleted flags for messages but not for other entities
- Risk of accidentally exposing deleted data

---

### 14. **Schedule Event & Speech Update Notifications** 🟡 LOW
**Location:** `server/routes.ts` (lines 3300-3400)

**Problem:** When couple updates schedule/speeches, vendors are notified but:
- No way for vendors to acknowledge receipt
- Notifications appear but no action tracking
- Couple has no way to verify vendor saw the change

---

### 15. **Guest Table Assignment Workflow Missing Validation** 🟡 LOW
**Location:** `shared/schema.ts` (lines ~700-750)

**Problem:** Tables and guests can be assigned but:
- No validation that guest count doesn't exceed table capacity
- No validation that guest exists before assigning to table
- No transaction ensuring atomic assignment

---

## Workflow Gaps

### Gap 1: Vendor Approval Status Transitions Unclear
**Locations:** Vendor registration, admin approval

**Issue:** 
- Vendor goes pending → approved (or rejected)
- No workflow for re-application after rejection
- No workflow for approval expiration
- No status: "suspended" or "reactivation needed"

---

### Gap 2: Offer Expiration Handling Missing
**Location:** `server/routes.ts` (vendorOffers table has `validUntil` field)

**Issue:**
- No background job to mark expired offers as "expired"
- No notification when offer expires
- Couples might accept expired offers

---

### Gap 3: Incomplete Guest Invitation Workflow
**Location:** Guest management endpoints

**Issue:**
- `guestInvitations` table exists but workflow unclear
- No RSVP tracking mentioned
- No invitation resend logic
- No decline handling

---

### Gap 4: Review Reminder Timing Unclear
**Location:** `server/routes.ts` (lines 5000+)

**Issue:**
- Reminders sent manually via API
- No automatic scheduling
- No way to track review request history
- Contract must be marked "completed" manually before reminder

---

### Gap 5: Contract Completion Workflow Missing
**Location:** `coupleVendorContracts` table

**Issue:**
- `completedAt` field exists but no endpoint to mark contract as completed
- Review system requires `completed` status but unclear when this is set
- Could be manual or automatic - not defined

---

### Gap 6: Message Reminder (Anti-Ghosting) Incomplete
**Location:** `messageReminders` table, no corresponding API endpoints

**Issue:**
- Table exists but no endpoints to create/manage reminders
- Workflow completely absent from codebase
- Feature appears half-implemented

---

### Gap 7: Inspiration Inquiry to Conversation Workflow
**Location:** `server/routes.ts` (lines 1455-1520)

**Issue:**
- Creating conversation from inquiry checks authorization but doesn't verify couple owns the inquiry
- Orphaned inquiries from deleted vendors aren't handled
- No way to mark inquiry as "converted to conversation"

---

## Data Flow Issues

### Issue 1: No Request Logging/Audit Trail
**Location:** All endpoints

**Missing:** 
- Who made what changes?
- When were critical actions taken?
- Audit trail for compliance

---

### Issue 2: Error Messages Expose System Details
**Location:** Many endpoints

**Examples:**
- Database errors shown to client
- Missing resource errors might leak business logic
- Should return generic errors to client

---

### Issue 3: Unvalidated File/URL Uploads
**Location:** Deliveries, inspirations, vendor images

**Issues:**
- URLs not validated to be accessible
- No file type validation
- No size limits
- External URLs could be tracked/monitored

---

## Recommendations Priority

### 🔴 CRITICAL (Fix Immediately)
1. Add CASCADE DELETE to all foreign keys
2. Replace SHA256 with bcrypt password hashing
3. Fix session management (remove in-memory cache or add synchronization)

### 🟠 HIGH (Fix in Next Sprint)
4. Add transaction boundaries to multi-step operations
5. Verify vendor approval status in all vendor endpoints
6. Implement idempotency for critical POST operations
7. Add cross-resource validation

### 🟡 MEDIUM (Fix Before Production Release)
8. Implement notification tracking/acknowledgement
9. Add background jobs for offer expiration handling
10. Complete guest invitation workflow
11. Complete message reminder workflow
12. Document and implement contract completion workflow

### 💡 NICE TO HAVE
13. Add audit logging
14. Implement soft-delete consistently
15. Add admin session persistence
16. Improve error messages for security
