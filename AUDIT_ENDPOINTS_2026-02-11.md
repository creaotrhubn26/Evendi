# Endpoint Audit (2026-02-11)

## Scope
Targeted review of high-traffic and state-changing endpoints in [server/routes.ts](server/routes.ts), with emphasis on auth consistency, subscription gating, idempotency, and inventory/workflow integrity.

Reviewed areas:
- Vendor auth/session + subscription guard
- Vendor inquiries
- Vendor/couple messages
- Vendor availability and offers
- Couple offer responses + vendor contacts
- Couple vendor contracts

## Summary
Core auth and workflow checks are present, and several state transitions are correctly wrapped in transactions. Remaining gaps are missing idempotency or concurrency guards around offer creation and acceptance paths, plus inconsistent auth usage in a few legacy endpoints.

## Findings
### High
- Inconsistent auth patterns enable cache-only validation on some endpoints. For example, [server/routes.ts](server/routes.ts#L6109-L6142) relies on `VENDOR_SESSIONS` without a DB fallback or vendor status check, while other endpoints use `checkVendorAuth` and enforce `vendor.status === "approved"` in [server/routes.ts](server/routes.ts#L1320-L1370). This can lead to divergent auth behavior across endpoints and possible access under stale cache conditions.

### Medium
- Offer creation is not wrapped in a transaction with inventory reservation. The inventory availability checks for `POST /api/vendor/offers` are done before insert and without row locking, so concurrent creates can oversell the same items/date. See [server/routes.ts](server/routes.ts#L4822-L4990).
- Offer acceptance uses a transaction and checks status, but it does not enforce a single-winner conditional update on the offer row. Two simultaneous accept requests could both pass the status check before the transaction update. See [server/routes.ts](server/routes.ts#L5886-L6042).
- `checkVendorSubscriptionAccess` returns `true` on errors to avoid breaking functionality, which can bypass subscription gating under transient DB failures. See [server/routes.ts](server/routes.ts#L1342-L1401).

### Low
- Availability bulk updates accept unvalidated date strings and do not normalize or validate date formats, which can produce inconsistent data. See [server/routes.ts](server/routes.ts#L4577-L4668).
- Offer response endpoints hand-roll auth instead of using `checkCoupleAuth`, which increases maintenance risk and diverging behavior. See [server/routes.ts](server/routes.ts#L5886-L6105).

## Observations (Positive)
- Vendor auth uses DB-backed session validation and enforces approved vendor status. See [server/routes.ts](server/routes.ts#L1320-L1370).
- Offer acceptance and contract cancellation use transactions to keep inventory and contract state consistent. See [server/routes.ts](server/routes.ts#L5886-L6042) and [server/routes.ts](server/routes.ts#L8369-L8437).
- Vendor availability checks block offer creation on blocked dates and enforce max bookings. See [server/routes.ts](server/routes.ts#L4861-L4939).

## Full Endpoint Checklist (Expanded)
Legend: Auth = Public | `checkVendorAuth` | `checkCoupleAuth` | `checkAdminAuth` | admin secret header | custom token flow.

### Public, Diagnostics, Weather, and Vendor Catalog
- Diagnostics + test: `/api/diagnostics`, `/api/test-query/:id` (Admin auth). See [server/routes.ts](server/routes.ts#L1167-L1209).
- Weather + travel: `/api/weather`, `/api/weather/travel` (Public; input validation; external API). See [server/routes.ts](server/routes.ts#L200-L358).
- CreatorHub weather bridge: `/api/evendi/weather-location/*` (Auth + allow-list + path-couple match; admin-only for sync-from-project). See [server/routes.ts](server/routes.ts#L254-L304).
- Vendor travel from venue: `/api/vendors/:vendorId/travel-from-venue` (Couple auth; couple-scoped). See [server/routes.ts](server/routes.ts#L312-L344).
- Brreg search + vendor categories: `/api/brreg/search`, `/api/vendor-categories` (Public). See [server/routes.ts](server/routes.ts#L464-L526).
- Subscription tiers: `/api/subscription/tiers` (Public). See [server/routes.ts](server/routes.ts#L527-L540).
- Vendor listing + matching: `/api/vendors`, `/api/vendors/matching` (Public; filters and sorting). See [server/routes.ts](server/routes.ts#L897-L1126).

### Vendor Auth and Sessions
- Vendor register/login/logout: `/api/vendors/register`, `/api/vendors/login`, `/api/vendors/google-login`, `/api/vendors/logout` (Public; validation; DB session creation). See [server/routes.ts](server/routes.ts#L678-L854).
- Vendor session validation: `/api/vendor/session` (Bearer token; DB session + approved status). See [server/routes.ts](server/routes.ts#L864-L897).
- Vendor auth helper + subscription gate: `checkVendorAuth`, `checkVendorSubscriptionAccess` (DB session + approved status; subscription gate returns true on error). See [server/routes.ts](server/routes.ts#L1214-L1401).

### Vendor Profile, Features, and Category Details
- Vendor profile: `/api/vendor/profile` GET/PATCH (Auth + subscription gate on PATCH). See [server/routes.ts](server/routes.ts#L1404-L1529).
- Vendor subscription status: `/api/vendor/subscription/status` (Auth). See [server/routes.ts](server/routes.ts#L1443-L1500).
- Vendor category details: `/api/vendor/category-details` GET/PATCH (Auth + subscription gate on PATCH). See [server/routes.ts](server/routes.ts#L1539-L1589).
- Vendor features + allowed categories: `/api/vendor/features`, `/api/vendor/allowed-categories` (Auth). See [server/routes.ts](server/routes.ts#L2452-L2480).

### Vendor Deliveries
- Delivery CRUD: `/api/vendor/deliveries` GET/POST/PATCH/DELETE (Auth + subscription gate on writes; ownership checks). See [server/routes.ts](server/routes.ts#L1609-L1785).
- Delivery access + tracking: `/api/deliveries/:accessCode`, `/api/delivery-track` (Public; access code; tracking counters). See [server/routes.ts](server/routes.ts#L1818-L1905).
- Vendor delivery tracking + notify: `/api/vendor/delivery-tracking/:deliveryId`, `/api/vendor/delivery-notify` (Auth; ownership check). See [server/routes.ts](server/routes.ts#L1906-L2026).

### Inspirations + Inquiries
- Inspirations catalog: `/api/inspiration-categories`, `/api/inspirations` (Public). See [server/routes.ts](server/routes.ts#L2027-L2064).
- Vendor inspirations CRUD: `/api/vendor/inspirations` GET/POST/PATCH/DELETE (Auth + subscription gate; ownership + allowed categories). See [server/routes.ts](server/routes.ts#L2066-L2244).
- Admin moderation: `/api/admin/inspirations`, `/api/admin/inspirations/:id/approve|reject` (Admin auth). See [server/routes.ts](server/routes.ts#L2277-L2321).
- Admin vendor features/categories: `/api/admin/vendors/:id/features`, `/api/admin/vendors/:id/inspiration-categories` (Admin auth). See [server/routes.ts](server/routes.ts#L2343-L2448).
- Inquiry flow: `/api/inspirations/:id/inquiry` (Public; validation; vendor feature check). See [server/routes.ts](server/routes.ts#L2496-L2541).
- Vendor inquiries: `/api/vendor/inquiries`, `/api/vendor/inquiries/:id/status` (Auth + subscription gate on status update; ownership checks). See [server/routes.ts](server/routes.ts#L2543-L2589).

### Couple Auth + Core Profile
- Couple login/logout/me/projects/dashboard: `/api/couples/login`, `/api/couples/logout`, `/api/couples/me`, `/api/couples/projects*`, `/api/couples/dashboard` (Custom cache + DB validation; public login). See [server/routes.ts](server/routes.ts#L2621-L2888).
- Couple vendors + conversations lists: `/api/couples/vendors`, `/api/couples/conversations` (Auth). See [server/routes.ts](server/routes.ts#L2939-L3008).

### Conversations + Messages
- Vendor conversations + messages: `/api/vendor/conversations*`, `/api/vendor/messages*` (Auth; subscription gate on sends/edits; ownership checks). See [server/routes.ts](server/routes.ts#L3010-L3800).
- Couple messages: `/api/couples/messages` POST and `/api/couples/messages/:id` PATCH/DELETE (Auth; validation + ownership). See [server/routes.ts](server/routes.ts#L3161-L3662).
- Typing + read receipts: `/api/vendor/conversations/:id/typing`, `/api/couples/conversations/:id/typing`, `/api/conversations/:id/mark-read` (Auth). See [server/routes.ts](server/routes.ts#L3597-L4198).
- Conversation details + reminders: `/api/vendor/conversations/:id/details`, `/api/vendor/conversations/:id/schedule-reminder`, `/api/vendor/message-reminders*` (Auth + subscription gate for schedule/cancel). See [server/routes.ts](server/routes.ts#L4219-L4382).

### Vendor Admin Chat
- Vendor-admin chat: `/api/vendor/admin/conversation`, `/api/vendor/admin/messages` GET/POST (Auth + subscription gate on POST). See [server/routes.ts](server/routes.ts#L3332-L3380).
- Admin vendor-admin chat: `/api/admin/vendor-admin-conversations*` (Admin auth). See [server/routes.ts](server/routes.ts#L3436-L3529).

### Vendor Products, Availability, Offers
- Products CRUD: `/api/vendor/products*` (Auth + subscription gate on writes; soft delete). See [server/routes.ts](server/routes.ts#L4403-L4520).
- Availability calendar: `/api/vendor/availability*` and `/api/vendors/:vendorId/availability` (Auth for vendor endpoints; public lookup). See [server/routes.ts](server/routes.ts#L4547-L4786).
- Offers CRUD: `/api/vendor/offers*` (Auth + subscription gate on writes; inventory checks). See [server/routes.ts](server/routes.ts#L4786-L5060).

### Vendor Planner + Venue + Seating
- Vendor planner app settings: `/api/vendor/planner/:kind` (Auth; JSON storage). See [server/routes.ts](server/routes.ts#L5060-L5136).
- Couple venue planner + seating: `/api/couple/venue/:kind`, `/api/couple/venue/seating` (Custom couple auth helper). See [server/routes.ts](server/routes.ts#L5160-L5441).
- Vendor venue planner + seating: `/api/vendor/venue/:kind`, `/api/vendor/venue/seating` (Auth). See [server/routes.ts](server/routes.ts#L5536-L5790).
- Vendor site visits: `/api/vendor/site-visits`, `/api/vendor/site-visits/:id` (Auth; ownership). See [server/routes.ts](server/routes.ts#L5810-L5884).

### Couple Offers + Vendor Contacts
- Couple offer response + offer list: `/api/couple/offers/:id/respond`, `/api/couple/offers` (Custom auth flow; transaction on accept). See [server/routes.ts](server/routes.ts#L5886-L6105).
- Vendor contacts: `/api/vendor/contacts` (Cache-only auth; no DB fallback). See [server/routes.ts](server/routes.ts#L6110-L6142).

### Admin Settings + Statistics + Preview
- Settings + stats: `/api/admin/settings` GET/PUT, `/api/admin/statistics` (Settings GET is public; others admin auth). See [server/routes.ts](server/routes.ts#L6154-L6195).
- Preview + impersonation: `/api/admin/preview/*` (Admin auth; cache-only sessions for impersonation). See [server/routes.ts](server/routes.ts#L6233-L6363).

### Admin Maintenance + Categories
- Jobs: `/api/admin/jobs/expire-offers` (Admin auth). See [server/routes.ts](server/routes.ts#L6435-L6482).
- Categories CRUD: `/api/admin/inspiration-categories*`, `/api/admin/vendor-categories*` (Admin auth). See [server/routes.ts](server/routes.ts#L6484-L6568).
- Admin vendor CRUD: `/api/admin/vendors/:id` PUT/DELETE (Admin auth). See [server/routes.ts](server/routes.ts#L6641-L6668).

### Coordinators + Guests + Invitations
- Coordinator invitations: `/api/couple/coordinators*` (Auth). See [server/routes.ts](server/routes.ts#L6671-L6758).
- Guest invitations: `/api/couple/guest-invitations*` (Auth; schema validation on POST). See [server/routes.ts](server/routes.ts#L6781-L6880).
- Guest RSVP public: `/api/guest/invite/:token`, `/api/guest/invite/:token/respond`, `/invite/:token` (Public). See [server/routes.ts](server/routes.ts#L6898-L7115).
- Coordinator access: `/api/coordinator/access/:token`, `/api/coordinator/access-by-code` (Public; token or code). See [server/routes.ts](server/routes.ts#L7117-L7190).

### Schedule + Speeches + Tables
- Couple schedule events: `/api/couple/schedule-events*` (Auth; vendor notifications). See [server/routes.ts](server/routes.ts#L7218-L7352).
- Coordinator read-only: `/api/coordinator/schedule-events`, `/api/coordinator/couple-profile`, `/api/coordinator/seating` (Coordinator auth). See [server/routes.ts](server/routes.ts#L7415-L7471).
- Couple speeches: `/api/speeches*` (Auth; public read if unauth). See [server/routes.ts](server/routes.ts#L3949-L4144).
- Couple guests + tables: `/api/couple/guests*`, `/api/couple/tables*` (Auth; ownership checks). See [server/routes.ts](server/routes.ts#L7471-L7777).
- Vendor seating view: `/api/vendor/couple/:coupleId/tables` (Auth + contract). See [server/routes.ts](server/routes.ts#L7803-L7899).
- Coordinator editing: `/api/coordinator/:token/schedule-events*`, `/api/coordinator/:token/speeches*` (Coordinator auth + permissions). See [server/routes.ts](server/routes.ts#L7932-L8232).

### Contracts + Notifications + Schedule Access
- Couple vendor contracts: `/api/couple/vendor-contracts*` (Auth; transaction on cancel). See [server/routes.ts](server/routes.ts#L8281-L8478).
- Notifications: `/api/vendor/notifications*`, `/api/couple/notifications` (Auth). See [server/routes.ts](server/routes.ts#L8505-L8572).
- Vendor schedule access: `/api/vendor/couple-schedule/:coupleId`, `/api/vendor/schedule-suggestions`, `/api/vendor/couple-contracts` (Auth + contract). See [server/routes.ts](server/routes.ts#L8592-L8718).
- Activity log: `/api/couple/activity-log` (Auth). See [server/routes.ts](server/routes.ts#L8750-L8771).

### Reviews, Feedback, and Contracts
- Reviews: `/api/couple/reviewable-contracts`, `/api/couple/reviews*`, `/api/vendors/:vendorId/reviews`, `/api/vendor/reviews`, `/api/vendor/reviews/:reviewId/response` (Auth for couple/vendor; public for vendor reviews). See [server/routes.ts](server/routes.ts#L8771-L9323).
- Vendor contracts review reminders: `/api/vendor/contracts`, `/api/vendor/contracts/:contractId/review-reminder`, `/api/vendor/contracts/:id/complete` (Auth + subscription gate on reminders/completion). See [server/routes.ts](server/routes.ts#L9296-L10011).
- Feedback: `/api/couple/feedback`, `/api/vendor/feedback`, `/api/admin/feedback*` (Auth for couple/vendor; admin secret header for admin). See [server/routes.ts](server/routes.ts#L9323-L9400).
- Admin review moderation: `/api/admin/reviews/:id`, `/api/admin/reviews/pending` (Admin secret header). See [server/routes.ts](server/routes.ts#L9400-L9557).

### Checklist + Budget + Planning Modules
- Checklist (couple + admin): `/api/checklist*`, `/api/admin/checklists*` (Auth for couple; admin secret for admin). See [server/routes.ts](server/routes.ts#L9628-L10213).
- Budget: `/api/couple/budget/settings`, `/api/couple/budget/items*` (Auth). See [server/routes.ts](server/routes.ts#L10236-L10537).
- Dress: `/api/couple/dress*` (Auth). See [server/routes.ts](server/routes.ts#L10555-L10890).
- Important people: `/api/couple/important-people*`, `/api/vendor/couple/:coupleId/important-people` (Auth; vendor access via contract or conversation). See [server/routes.ts](server/routes.ts#L10890-L11615).
- Photo shots: `/api/couple/photo-shots*` (Auth). See [server/routes.ts](server/routes.ts#L10908-L11175).
- Hair & makeup: `/api/couple/hair-makeup*` (Auth). See [server/routes.ts](server/routes.ts#L11175-L11345).
- Transport: `/api/couple/transport*` (Auth). See [server/routes.ts](server/routes.ts#L11345-L11495).
- Flowers: `/api/couple/flowers*` (Auth). See [server/routes.ts](server/routes.ts#L11495-L11655).
- Catering: `/api/couple/catering*` (Auth). See [server/routes.ts](server/routes.ts#L11655-L11935).
- Cake: `/api/couple/cake*` (Auth). See [server/routes.ts](server/routes.ts#L11935-L12000).
- Photographer/Videographer/Music/Planner: `/api/couple/photographer*`, `/api/couple/videographer*`, `/api/couple/music*`, `/api/couple/planner*` (Auth). See [server/routes.ts](server/routes.ts#L12000-L12550).

### FAQ, App Settings, Whats New, Video Guides
- FAQ: `/api/faq/:category`, `/api/admin/faq*` (Public read; admin auth). See [server/routes.ts](server/routes.ts#L12550-L12710).
- App settings: `/api/app-settings*`, `/api/admin/app-settings*` (Public read; admin auth). See [server/routes.ts](server/routes.ts#L12710-L12910).
- What's New: `/api/whats-new/:category`, `/api/admin/whats-new*` (Public read; admin auth). See [server/routes.ts](server/routes.ts#L12910-L13005).
- Video guides: `/api/video-guides*`, `/api/admin/video-guides*` (Public read; admin auth). See [server/routes.ts](server/routes.ts#L12000-L13028).

### Partner/Join and Wedding Role Invites
- Wedding role invites: `/api/couple/wedding-invites*` (Auth). See [server/routes.ts](server/routes.ts#L11880-L12000).
- Partner join: `/api/partner/validate-code`, `/api/partner/join`, `/api/partner/access/:token` (Public; invite code validation). See [server/routes.ts](server/routes.ts#L12000-L12390).

### CreatorHub Bridge
- Vendor CreatorHub bridge: `/api/vendor/creatorhub-bridge`, `/api/vendor/timeline-comments*`, `/api/vendor/timeline-events*` (Auth; conversation or vendor access checks). See [server/routes.ts](server/routes.ts#L10034-L10822).

## Matrix (Condensed)
| Endpoint or Group | Auth | Validation | Transaction | Key Risks |
| --- | --- | --- | --- | --- |
| `/api/vendor/offers` POST | `checkVendorAuth` + subscription gate | Schema parse + inventory checks | No | Concurrent offers can oversell inventory/date; no row-level lock. See [server/routes.ts](server/routes.ts#L4822-L4990). |
| `/api/couple/offers/:id/respond` | Custom token flow | Status check | Yes | Concurrent accepts can double-accept without conditional update. See [server/routes.ts](server/routes.ts#L5886-L6042). |
| `/api/vendor/contacts` | Cache-only | Minimal | No | Cache-only auth, no DB fallback or vendor status check. See [server/routes.ts](server/routes.ts#L6110-L6142). |
| `/api/vendor/messages` POST | `checkVendorAuth` + subscription gate | Basic body check | No | No idempotency; relies on conversation ownership only. See [server/routes.ts](server/routes.ts#L3275-L3331). |
| `/api/vendor/availability/bulk` | `checkVendorAuth` | Basic checks | No | Date string format not normalized/validated. See [server/routes.ts](server/routes.ts#L4626-L4668). |
| `/api/vendor/session` | Bearer token | DB session + vendor status | No | OK; consistent with vendor auth helper. See [server/routes.ts](server/routes.ts#L864-L897). |
| `/api/couples/login` | Public | Schema parse | No | OK; auth cache is separate from vendor auth. See [server/routes.ts](server/routes.ts#L2621-L2744). |
| `/api/admin/preview/*` | `checkAdminAuth` | Basic | No | Impersonation seeds cache-only sessions. See [server/routes.ts](server/routes.ts#L6233-L6363). |
| `/api/vendor/deliveries` POST/PATCH | `checkVendorAuth` + subscription gate | Schema parse | No | Multiple inserts; no transaction around delivery + items. See [server/routes.ts](server/routes.ts#L1630-L1713). |
| `/api/vendor/delivery-notify` | `checkVendorAuth` | Basic | No | Conversation creation + message insert not transactional. See [server/routes.ts](server/routes.ts#L1955-L2026). |
| `/api/checklist/:id` PATCH | `checkCoupleAuth` | Schema parse | No | Creates reminder side-effect without transaction. See [server/routes.ts](server/routes.ts#L9884-L10011). |

## Remediation Backlog (Short)
1. Standardize session validation to avoid cache-only auth on vendor/couple endpoints. Start with `/api/vendor/contacts` and preview impersonation sessions. See [server/routes.ts](server/routes.ts#L6110-L6142) and [server/routes.ts](server/routes.ts#L6233-L6363).
2. Add conditional updates for offer acceptance and inventory-reservation safety (e.g., `WHERE status = 'pending'` and row-level locking or serialized transaction). See [server/routes.ts](server/routes.ts#L4822-L4990) and [server/routes.ts](server/routes.ts#L5886-L6042).
3. Wrap multi-step writes in transactions where partial updates can occur (deliveries + items, delivery notify, checklist reminder create). See [server/routes.ts](server/routes.ts#L1630-L1713), [server/routes.ts](server/routes.ts#L1955-L2026), [server/routes.ts](server/routes.ts#L9884-L10011).
4. Tighten subscription gate error handling to avoid fail-open behavior. See [server/routes.ts](server/routes.ts#L1342-L1401).
5. Normalize and validate date inputs for availability endpoints. See [server/routes.ts](server/routes.ts#L4577-L4668).

## Recommendations
1. Standardize auth enforcement by routing all vendor and couple endpoints through `checkVendorAuth`/`checkCoupleAuth` and add DB fallback where cache-only is used.
2. Add idempotency or conditional update guards for offer acceptance (e.g., `WHERE status = 'pending'`) and consider wrapping offer creation + inventory reservation in a transaction.
3. Tighten subscription gating by failing closed (or at least logging and alerting) when `checkVendorSubscriptionAccess` encounters errors.
4. Validate and normalize date inputs for availability endpoints to avoid inconsistent date storage.

## Coverage Notes
This audit now includes a full endpoint-by-endpoint checklist for [server/routes.ts](server/routes.ts).
