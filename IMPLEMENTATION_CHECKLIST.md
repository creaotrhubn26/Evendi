# Implementation Checklist: Vendor Expertise & Matching System

## Phase 1: Backend Infrastructure (Database & APIs)
**Status: PARTIALLY COMPLETE**

### 1.1: Database Schema ✅
- [x] `vendorEventTypeExpertise` table created
- [x] `vendorCategoryPreferences` table created
- [x] `coupleEventPreferences` table created
- [x] `coupleVendorSearches` table created
- [x] `vendorMatchScores` table created
- [x] All tables indexed properly for performance
- [x] TypeScript types exported
- [x] Zod validation schemas created

**Files:**
- ✅ `/workspaces/wedflow/shared/schema.ts` - Schema definitions
- ✅ `/workspaces/wedflow/shared/vendor-matching.ts` - Matching algorithm

### 1.2: API Routes
- [ ] Create API routes file: `/workspaces/wedflow/server/routes/expertiseRoutes.ts`
  **Action:** Copy from `VENDOR_EXPERTISE_MATCHING_IMPLEMENTATION.md` → API Routes section
  
- [ ] Register routes in main Express app
  **File:** `/workspaces/wedflow/server/index.ts` or `/workspaces/wedflow/server/app.ts`
  **Action:** Add:
  ```typescript
  import expertiseRoutes from "./routes/expertiseRoutes";
  app.use(expertiseRoutes);
  ```

- [ ] Implement POST `/api/vendor/expertise`
  - Input: vendorId, eventType, yearsExperience, completedEvents, isSpecialized
  - Validation: `createVendorEventTypeExpertiseSchema`
  - Action: Insert/update `vendorEventTypeExpertise` table
  - Side effect: Invalidate `vendorMatchScores` cache

- [ ] Implement GET `/api/vendor/expertise/:vendorId`
  - Returns: All expertise records for vendor

- [ ] Implement POST `/api/vendor/category-preferences`
  - Input: vendorId, handleB2C, handleB2B, b2bSubCategories, guest ranges
  - Validation: `createVendorCategoryPreferencesSchema`
  - Action: Insert/update `vendorCategoryPreferences` table
  - Side effect: Invalidate cache

- [ ] Implement GET `/api/vendor/category-preferences/:vendorId`
  - Returns: B2C/B2B preferences for vendor

- [ ] Implement POST `/api/couple/preferences`
  - Input: coupleId, eventType, eventCategory, budget, guestCount, etc.
  - Validation: `createCoupleEventPreferencesSchema`
  - Action: Insert/update `coupleEventPreferences` table

- [ ] Implement GET `/api/couple/preferences/:coupleId`
  - Returns: Couple's event preferences

- [ ] Implement GET `/api/couple/vendor-matches?coupleId=X&limit=20`
  - Logic:
    1. Load couple's preferences
    2. Query all approved vendors (or filter by category)
    3. For each vendor:
       - Check if cached match score exists (within 24hrs)
       - If not, calculate fresh score using `calculateVendorMatch()`
       - Save/update cache
    4. Sort by overallScore descending
    5. Return ranked list
  - Output: Array of vendors with match scores and reasons

- [ ] Implement GET `/api/vendor/:vendorId/match-details/:coupleId`
  - Returns: Detailed breakdown of why this vendor matches this couple
  - Includes all individual score components

### 1.3: Authentication & Authorization
- [ ] Add auth middleware to protect:
  - POST `/api/vendor/expertise` - Only vendor's own data
  - POST `/api/vendor/category-preferences` - Only vendor's own data
  - POST `/api/couple/preferences` - Only couple's own data
  - GET `/api/couple/vendor-matches` - Only couple's own data

**Pattern:** 
```typescript
const vendorAuth = (req, res, next) => {
  const vendorId = req.session.vendor?.id;
  if (!vendorId) return res.status(401).json({error: "Unauthorized"});
  if (req.body.vendorId !== vendorId) return res.status(403).json({error: "Forbidden"});
  next();
};
app.post("/api/vendor/expertise", vendorAuth, ...);
```

---

## Phase 2: Frontend - Vendor Side
**Status: NOT STARTED**

### 2.1: Vendor Expertise Onboarding Screen
**File:** `/workspaces/wedflow/client/screens/VendorExpertiseOnboarding.tsx`

**Screens to create:**

#### Screen A: Event Type Selection
```
Title: "Which event types do you have expertise in?"
Type: Multi-select from EVENT_TYPES

For each selected:
  - yearsExperience: number input
  - completedEvents: number input
  - isSpecialized: toggle
  - notes: text area

Action on Save:
  POST /api/vendor/expertise for each event type
```

**Implementation steps:**
1. Import EVENT_TYPES from shared/event-types
2. Create multi-select component
3. For each selected, show expertise detail form
4. On submit, call POST /api/vendor/expertise
5. Handle loading states and errors
6. Show success message

**UI Reference:** Similar pattern to CoupleLoginScreen with event type selection

#### Screen B: B2C vs B2B Configuration
```
Title: "Who are your clients?"

Toggle: "I handle personal events (B2C)"
  If enabled:
    - Min guests: [  ]
    - Max guests: [  ]
    - Notes: [  ]

Toggle: "I handle corporate events (B2B)"
  If enabled:
    - Sub-category checkboxes:
      ☑ Professional & Strategic
      ☑ Social & Relational
      ☐ External-facing
      ☐ HR & Internal
    - Min guests: [  ]
    - Max guests: [  ]
    - Notes: [  ]

Action on Save:
  POST /api/vendor/category-preferences
```

**Implementation steps:**
1. Create toggle components for B2C and B2B
2. Show conditional form fields based on toggles
3. Map CORPORATE_SUB_CATEGORIES to checkboxes
4. On submit, call POST /api/vendor/category-preferences
5. Validate: must select at least B2C OR B2B

### 2.2: Update Vendor Profile Screen
**File:** `/workspaces/wedflow/client/screens/VendorProfileScreen.tsx`

**Changes needed:**
- Add "Edit Expertise" button
  - Opens VendorExpertiseOnboarding
  - Shows current expertise when editing
  - Allow add/remove expertise types

- Add "Edit B2C/B2B Preferences" button
  - Opens preferences screen
  - Shows current settings

- Display current expertise on profile
  ```
  "Expertise:"
  ✓ Wedding (8 years, 47 events, specialized)
  ✓ Engagement (5 years, 12 events)
  ✓ Corporate Events (B2B only) - Professional & Social
  ```

### 2.3: Integration with Vendor Registration
**File:** `/workspaces/wedflow/client/screens/VendorRegistrationScreen.tsx`

**Changes needed:**
- Add step after "Admin approved" → Expertise onboarding (required)
- Flow: Register → Wait for approval → On approval → Show expertise setup → Save expertise
- OR: Add expertise setup to registration form itself

---

## Phase 3: Frontend - Couple Side
**Status: NOT STARTED**

### 3.1: Couple Preferences Onboarding
**File:** `/workspaces/wedflow/client/screens/CouplePreferencesOnboarding.tsx`

**Multi-screen flow:**

#### Screen 1: Event Type Selection
```
"What type of event are you planning?"
Single select from EVENT_TYPES

If B2B event selected:
  → Show corporate sub-category selection
  (Professional, Social, External, HR)
```

#### Screen 2: Event Details
```
"Tell us about your event"

Guest count: [  ]
Budget min: [  ] NOK
Budget max: [  ] NOK
Event date: [Date picker]
Location: [  ] (city/region input)
Search radius: [  ] km (default 50)
```

#### Screen 3: Event Vibe
```
"What vibe are you going for?"
Multi-select from vibe options:
- Intimate
- Luxurious
- Professional
- Playful
- Rustic
- Modern
- Elegant
- Casual
etc.
```

#### Screen 4: Vendor Categories
```
"What vendors do you need?"
Multi-select from vendor categories:
- Photographer
- Catering
- Venue
- Florist
- Music
- Cake
- Hair & Makeup
etc.
```

#### Screen 5: Special Requirements
```
"Any special requirements?"
Text area for free-form requirements
(optional)
```

**Implementation steps:**
1. Create 5-screen flow component
2. Store in state: all preferences
3. On final submit: POST /api/couple/preferences
4. Handle loading and errors
5. On success: Navigate to vendor search

### 3.2: Couple Preferences Integration
**File:** `/workspaces/wedflow/client/screens/CoupleLoginScreen.tsx`

**Changes needed:**
- After login success:
  - Check if couple has preferences set
  - If no preferences: Show CouplePreferencesOnboarding before dashboard
  - If preferences exist: Go straight to dashboard

**Implementation:**
```typescript
useEffect(() => {
  if (isLoggedIn && !hasSetPreferences) {
    navigation.navigate("CouplePreferencesOnboarding");
  } else if (isLoggedIn) {
    navigation.navigate("Dashboard");
  }
}, [isLoggedIn, hasSetPreferences]);
```

### 3.3: Add Preferences Edit Screen
**File:** `/workspaces/wedflow/client/screens/CoupleSettingsScreen.tsx` or new file

**Features:**
- Button: "Edit Event Preferences"
- Opens CouplePreferencesOnboarding in edit mode
- Pre-fills current values
- Allow update preferences anytime

---

## Phase 4: Vendor Search & Discovery
**Status: NOT STARTED**

### 4.1: Vendor Search Results Screen
**File:** `/workspaces/wedflow/client/screens/VendorSearchResults.tsx`

**Features:**
- Display ranked vendors sorted by match score
- For each vendor show:
  ```
  [Match Score Badge: 92/100]
  Vendor Name
  Match reasons (3 key points)
  
  [View Profile] [Send Inquiry]
  ```

**Implementation:**
1. Call GET `/api/couple/vendor-matches?coupleId=X&limit=20`
2. Display results in FlatList
3. Handle loading, error, empty states
4. Add sorting/filtering options (by score, by distance, by reviews)

### 4.2: Vendor Match Details
**File:** `/workspaces/wedflow/client/screens/VendorMatchDetails.tsx`

**Features:**
- Show detailed breakdown when tapping vendor
- Display each score component:
  - Event Type Match (25%)
  - Category Match (20%)
  - Budget Match (20%)
  - Capacity Match (15%)
  - Location Match (10%)
  - Vibe Match (5%)
  - Reviews (5%)
- Show match reasons
- Show any warnings
- "Send Inquiry" button

**Implementation:**
1. Call GET `/api/vendor/:vendorId/match-details/:coupleId`
2. Render score breakdown
3. Show context for each score

### 4.3: Search Navigation
**File:** `/workspaces/wedflow/client/navigation/RootNavigator.tsx` or equivalent

**Add new screens:**
- VendorSearchResults
- VendorMatchDetails
- CouplePreferencesOnboarding

**Navigation flow:**
```
Dashboard → Search/Browse → VendorSearchResults → VendorMatchDetails → Send Inquiry
```

---

## Phase 5: Analytics & Admin
**Status: NOT STARTED**

### 5.1: Track Vendor Searches
**Endpoint:** POST `/api/couple/vendor-search` (log search)

**Implementation:**
- In VendorSearchResults, log the search query
- Use `coupleVendorSearches` table
- Track: searchQuery, eventType, filters used

### 5.2: Admin Dashboard Updates
**File:** `/workspaces/wedflow/client/screens/AdminDashboard.tsx`

**New admin features:**
- View vendor expertise by event type
- See which vendors handle which event types
- Monitor match quality metrics
- See popular vendor searches

---

## Phase 6: Testing
**Status: NOT STARTED**

### 6.1: API Testing
**File:** Create `/workspaces/wedflow/e2e/expertise-journey.spec.ts`

**Test scenarios:**
- [ ] Vendor adds expertise for "wedding"
- [ ] Vendor sets B2C/B2B preferences
- [ ] Couple sets preferences for wedding
- [ ] Search returns vendors matching couple
- [ ] Match scores calculated correctly
- [ ] Cached scores used when valid

### 6.2: UI Testing
- [ ] Vendor expertise onboarding works
- [ ] Couple preferences onboarding works
- [ ] Vendor search displays results
- [ ] Match details screen shows breakdown

### 6.3: E2E Testing
**File:** `/workspaces/wedflow/e2e/evendi-extreme-journey.spec.ts`

**Add tests:**
- [ ] Complete vendor expertise setup in onboarding
- [ ] Complete couple preferences in onboarding
- [ ] Search and find matching vendor
- [ ] View match details
- [ ] Send inquiry to vendor

---

## Installation & Setup

### Step 1: Register Routes
**File:** `/workspaces/wedflow/server/index.ts` or main Express app
```typescript
import expertiseRoutes from "./routes/expertiseRoutes";
app.use(expertiseRoutes);
```

### Step 2: Run Database Migrations
```bash
npm run migrate
# Previously: Create tables
```

### Step 3: Verify Database
```bash
psql -U neondb_owner -d neondb -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%expertise%' OR table_name LIKE '%preference%' OR table_name LIKE '%match%'
ORDER BY table_name;"
```

Should show:
- coupleEventPreferences
- coupleVendorSearches  
- vendorCategoryPreferences
- vendorEventTypeExpertise
- vendorMatchScores

### Step 4: Start Backend
```bash
npm run dev
# Server on http://localhost:5000
```

### Step 5: Test API
```bash
# Add vendor expertise
curl -X POST http://localhost:5000/api/vendor/expertise \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "vendor-123",
    "eventType": "wedding",
    "yearsExperience": 8,
    "completedEvents": 47,
    "isSpecialized": true
  }'

# Get vendor matches
curl http://localhost:5000/api/couple/vendor-matches?coupleId=couple-123
```

---

## Success Criteria

✅ **Phase 1: Backend Complete When:**
- [ ] All 5 API endpoints working
- [ ] Database queries return correct data
- [ ] Match scores calculated accurately
- [ ] Cache invalidation working

✅ **Phase 2: Vendor Front-End Complete When:**
- [ ] Vendor can add expertise for 3+ event types
- [ ] Vendor can set B2C/B2B preferences
- [ ] Preferences saved and retrieved correctly

✅ **Phase 3: Couple Front-End Complete When:**
- [ ] Couple can complete 5-screen preferences flow
- [ ] Preferences saved and retrieved correctly
- [ ] New couples see preferences screen after login

✅ **Phase 4: Search Complete When:**
- [ ] Vendor search shows ranked results
- [ ] Match details show accurate breakdowns
- [ ] Inquiry flow works end-to-end

✅ **Phase 5: Analytics Complete When:**
- [ ] All searches logged
- [ ] Admin can see popular searches
- [ ] Match quality metrics tracked

✅ **Full System When:**
- [ ] All E2E tests pass
- [ ] Vendor expertise → Couple search → Match → Inquiry works end-to-end
- [ ] Performance acceptable (search <500ms)
- [ ] No console errors or warnings

---

## Performance Notes

### Match Score Caching
- Cache expires after 24 hours
- Invalidated when:
  - Vendor adds/updates expertise
  - Vendor changes preferences
  - Couple updates preferences

### Query Optimization
- Index on: vendorId + eventType
- Index on: vendorId + coupleId (match scores)
- Index on: coupleId (preferences)
- Use LIMIT to prevent large result sets

### Scaling Considerations
- For 1000+ vendors: Batch calculate matches
- Consider: Pre-calculating popular searches
- Monitor: Average match calculation time
- Goal: <500ms per couple search

---

## File References

**Core Files:**
- `/workspaces/wedflow/shared/schema.ts` - Database
- `/workspaces/wedflow/shared/vendor-matching.ts` - Matching algorithm
- `/workspaces/wedflow/shared/event-types.ts` - Event type config

**To Create:**
- `/workspaces/wedflow/server/routes/expertiseRoutes.ts` - API routes
- `/workspaces/wedflow/client/screens/VendorExpertiseOnboarding.tsx` - Vendor UI
- `/workspaces/wedflow/client/screens/CouplePreferencesOnboarding.tsx` - Couple UI
- `/workspaces/wedflow/client/screens/VendorSearchResults.tsx` - Search UI
- `/workspaces/wedflow/client/screens/VendorMatchDetails.tsx` - Details UI

**To Update:**
- `/workspaces/wedflow/server/index.ts` - Register routes
- `/workspaces/wedflow/client/screens/VendorProfileScreen.tsx` - Add expertise UI
- `/workspaces/wedflow/client/screens/CoupleLoginScreen.tsx` - Add preferences flow

---

## Next Steps

**Immediate (Do This First):**
1. Create `/workspaces/wedflow/server/routes/expertiseRoutes.ts`
2. Register in main Express app
3. Test API endpoints with curl
4. Create E2E test for API endpoints

**Short Term (This Week):**
5. Create VendorExpertiseOnboarding screen
6. Create CouplePreferencesOnboarding screen
7. Test both onboarding flows in UI

**Medium Term (Next 1-2 weeks):**
8. Create VendorSearchResults screen
9. Create VendorMatchDetails screen
10. Integrate preferences into login flow
11. Complete E2E testing

**Long Term (Polish):**
12. Add analytics dashboard
13. Optimize performance
14. Add more matching factors
15. Deploy to production
