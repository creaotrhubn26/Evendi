# Workflow/Data Flow Audit (2026-02-11)

Scope: targeted re-check of schema FK behaviors, auth/session handling, and password hashing in server routes.

## Verified Improvements
- Password hashing uses bcrypt with per-password salts via `hashPassword()` in [server/routes.ts](server/routes.ts#L49-L56) (bcrypt imported in [server/routes.ts](server/routes.ts#L6)).

## Resolved in This Pass
1. **In-memory session cache removed**
   - Vendor and couple auth now rely on DB sessions (no in-process cache). See [server/routes.ts](server/routes.ts).

2. **FKs now include explicit onDelete behavior**
   - Added `set null` and `restrict` rules for the four audited FKs. See [shared/schema.ts](shared/schema.ts).

3. **Reminders now require couple auth and ownership**
   - Reminders are scoped to a `coupleId` and protected by `checkCoupleAuth()`. See [shared/schema.ts](shared/schema.ts) and [server/routes.ts](server/routes.ts).
   - Migration completed: [migrations/0035_add_reminder_couple_id.sql](migrations/0035_add_reminder_couple_id.sql).

4. **Speech endpoints require auth and couple scoping**
   - All speech CRUD + reorder require `checkCoupleAuth()` and filter by `coupleId`. See [server/routes.ts](server/routes.ts).

5. **Admin auth consistency**
   - Admin feedback/reviews/checklists now use `checkAdminAuth()`. See [server/routes.ts](server/routes.ts).

6. **Admin vendor deletion transaction**
   - Vendor delete flow is now wrapped in a transaction. See [server/routes.ts](server/routes.ts).

7. **Checklist update + reminder creation transactional**
   - Reminder creation and checklist update now run in a single transaction. See [server/routes.ts](server/routes.ts).

8. **Weather-location proxy allow-list + admin-only sync**
   - Proxy now allows only known endpoints/methods and blocks unknown paths. Sync-from-project is admin-only. See [server/routes.ts](server/routes.ts).

9. **App settings allow-list and admin auth tightened**
   - Public app settings now return only allow-listed keys; admin settings require auth. See [server/routes.ts](server/routes.ts) and [client/hooks/useDesignSettings.ts](client/hooks/useDesignSettings.ts).

10. **CreatorHub timeline access hardened**
   - Vendor timeline comments/events require conversation-based access checks. Partner timeline join uses correct CreatorHub user linkage and comment columns. See [server/routes.ts](server/routes.ts).

11. **Invite and coordinator code hardening**
   - Partner invite codes rate-limited and lengthened; join no longer overrides role. Coordinator access-by-code now rate-limited, enforces expiry, and uses stronger codes. See [server/routes.ts](server/routes.ts).

12. **Guest RSVP and delivery tracking validation**
   - RSVP requires boolean attendance and blocks re-submission. Delivery tracking requires access code, active status, and item ownership; vendor bridge filters private comments. See [server/routes.ts](server/routes.ts).

## Notes (Not Re-verified in This Pass)
- Transaction boundaries for multi-step workflows: present in parts of [server/routes.ts](server/routes.ts#L5187), but full coverage not audited.
- Vendor approval gating across endpoints and idempotency keys: not audited in this pass.

## Recommended Next Actions
1. If needed, run a broader endpoint audit focused on idempotency and approval gating.
