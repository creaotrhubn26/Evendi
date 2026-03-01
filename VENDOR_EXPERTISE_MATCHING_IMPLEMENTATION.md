# Vendor Expertise & Couple Preferences Matching System

## Overview

This document describes the complete flow for:
1. **Vendor Onboarding with Expertise Selection**
2. **Couple Event Preferences Onboarding**
3. **Smart Vendor Matching Algorithm**
4. **System Integration Points**

All components sync with `/workspaces/wedflow/shared/event-types.ts` to ensure consistent event categories.

---

## Part 1: Vendor Onboarding Flow

### Step 1: Vendor Registration (Existing)
- Vendor fills: Email, password, business name, organization number, category
- Stored in: `vendors` table
- Status: "pending" (awaits admin approval)

### Step 2: Admin Approves Vendor
- Admin reviews vendor registration in admin dashboard
- Admin accepts vendor → Status changes to "approved"
- **NEW**: Admin can set initial event type expertise

### Step 3: Vendor Completes Expertise Onboarding
**Stores in: `vendorEventTypeExpertise` table**

Vendor is presented with multi-select screens:

#### Screen A: Choose Event Types They Handle
```
"Which event types do you have expertise in?"

☑ Wedding (personal)
☐ Confirmation (personal)
☐ Birthday (personal)
☐ Engagement (personal)
☐ Conference (corporate - professional/strategic)
☐ Seminar (corporate - professional/strategic)
☐ Summer Party (corporate - social/relational)
☐ Christmas Party (corporate - social/relational)
☐ Team Building (corporate - social/relational)
☐ Product Launch (corporate - external-facing)
☐ Trade Fair (corporate - external-facing)
... and more
```

For EACH selected event type, vendor fills:
- Years of experience with this event type
- Number of completed events
- Is this a core offering? (toggle: "This is a core offering")
- Notes: "We specialize in intimate weddings (20-80 guests)"

**Data saved:**
```typescript
{
  vendorId: "...",
  eventType: "wedding",
  yearsExperience: 8,
  completedEvents: 47,
  isSpecialized: true,
  notes: "Intimate weddings, 20-80 guests, focus on vendor coordination"
}
```

#### Screen B: B2C vs B2B Preferences
**Stores in: `vendorCategoryPreferences` table**

```
"Do you handle personal events? (B2C)"
→ Yes / No (toggles handleB2C)
   If Yes:
   - Min guest count: [  ] (e.g., 5)
   - Max guest count: [  ] (e.g., 300)
   - Add notes: "We love small, intimate gatherings"

"Do you handle corporate events? (B2B)"
→ Yes / No (toggles handleB2B)
   If Yes:
   - Which types? (checkboxes):
     ☑ Professional & Strategic (conferences, seminars, kickoffs)
     ☑ Social & Relationship (parties, team building)
     ☐ External-facing (product launch, trade fairs)
     ☐ HR & Internal (anniversary, awards)
   
   - Min guest count: [  ] (e.g., 20)
   - Max guest count: [  ] (e.g., 1000)
   - Add notes: "Corporate catering, professional setup, cleanup included"
```

**Data saved:**
```typescript
{
  vendorId: "...",
  handleB2C: true,
  handleB2B: true,
  b2bSubCategories: ["professional_strategic", "social_relational"],
  minGuestCountB2C: 5,
  maxGuestCountB2C: 300,
  minGuestCountB2B: 20,
  maxGuestCountB2B: 1000,
  b2cDetails: {
    notes: "We love small, intimate gatherings",
    specialties: ["intimate", "personal"]
  },
  b2bDetails: {
    notes: "Corporate catering, professional setup, cleanup included",
    specialties: ["conferences", "team building"]
  }
}
```

### Result
Vendor profile now contains:
- Which event types they handle ✅
- Expertise level per event type ✅
- B2C vs B2B preferences ✅
- Guest count ranges ✅
- Specialized notes ✅

**Data is now searchable for matching!**

---

## Part 2: Couple Event Preferences Onboarding

### Timing
When couple signs up or on their first login after signup

### Flow

#### Screen 1: Tell Us About Your Event
```
"What type of event are you planning?"

Select one:
◯ Wedding
◯ Confirmation
◯ Birthday
◯ Engagement
◯ Baby Shower
◯ Conference
◯ Seminar
◯ Summer Party
◯ Christmas Party
...
```

**If they select a B2B event (conference, seminar, etc.):**
```
"What kind of corporate event?"

Select one:
◯ Professional & Strategic (competence building, strategy, goals)
◯ Social & Relationship (team building, culture, well-being)
◯ External-facing (PR, branding, product launch)
◯ HR & Internal (team anniversaries, awards, celebrations)
```

#### Screen 2: Event Details
```
"How many guests do you expect?"
[  ] guests (e.g., 50)

"What's your budget?"
Min: [  ] NOK
Max: [  ] NOK

"When is your event?"
[Date picker]

"Where will the event be?"
[  ] City/Region (e.g., "Oslo")
  and "How far should vendors travel?"
  [  ] km (default: 50km)
```

#### Screen 3: What Vibe Are You Going For?
```
"Select all that apply:"

☑ Intimate
☑ Luxurious
☐ Playful
☐ Professional
☐ Rustic
☐ Modern
☐ Elegant
☐ Casual
... and more
```

#### Screen 4: What Vendors Do You Need?
```
"Which vendors are you looking for?" (select multiple)

☑ Photographer
☑ Catering
☑ Venue
☐ Florist
☐ Music
☐ Cake
☐ Hair & Makeup
... and more
```

**Store as:** `vendorPreferences.categories: ["photographer", "catering", "venue"]`

### Data Saved
**Stores in: `coupleEventPreferences` table**

```typescript
{
  coupleId: "...",
  eventType: "wedding",
  eventCategory: "personal",
  guestCount: 60,
  budgetMin: 100000,
  budgetMax: 250000,
  currency: "NOK",
  eventLocation: "Oslo",
  eventLocationRadius: 50,
  desiredEventVibe: ["intimate", "luxurious", "elegant"],
  specialRequirements: null,
  vendorPreferences: {
    categories: ["photographer", "catering", "venue"],
    languages: ["no", "en"]
  }
}
```

---

## Part 3: Smart Vendor Matching

### When Matching Happens
1. Couple searches for vendors → "Find catering for wedding"
2. System retrieves all caterers
3. For each vendor:
   - Load their expertise and preferences
   - Calculate match score against couple's preferences
   - Rank by match score
   - Show couples sorted results

### Matching Algorithm
**File:** `/workspaces/wedflow/shared/vendor-matching.ts`

#### Match Score Components (0-100 each):

1. **Event Type Match (25% weight)** ⭐ Most important
   - Does vendor handle this event type? (wedding, conference, etc.)
   - Years of experience
   - Number of completed events
   - Is it specialized?
   → Score: 0-100

2. **Category Match (20% weight)**
   - Is it B2C or B2B?
   - Does vendor handle this category?
   → Score: 0 (doesn't match) or 100 (perfect match)

3. **Budget Match (20% weight)**
   - Does vendor's price range overlap with couple's budget?
   - Perfect overlap = 100
   - Partial overlap = proportional score
   - No overlap = 0
   → Score: 0-100

4. **Capacity Match (15% weight)**
   - Is the guest count within vendor's limits?
   - Within range = 100
   - Outside range = penalized
   → Score: 0-100

5. **Location Match (10% weight)**
   - Same city = 100
   - Same region = 80
   - Different region = 40-60
   → Score: 0-100

6. **Vibe Match (5% weight)**
   - Does vendor description contain couple's vibe keywords?
   - % of vibes matched
   → Score: 0-100

7. **Review Match (5% weight)**
   - Average rating from past clients
   → Score: 0-100

#### Overall Score Calculation
```
Overall = 
  (eventTypeScore × 0.25) +
  (categoryScore × 0.20) +
  (budgetScore × 0.20) +
  (capacityScore × 0.15) +
  (locationScore × 0.10) +
  (vibeScore × 0.05) +
  (reviewScore × 0.05)

Total: 0-100
```

#### Match Reasons
System generates human-readable reasons:
- "Specialized expertise in wedding photography"
- "Perfect price range alignment"
- "Local photographer - same city"
- "Excellent reviews from past couples"

#### Warnings
If issues detected:
- "Vendor does not have wedding experience"
- "Budget may be too low for this vendor"
- "Guest count may exceed vendor's capacity"

### Result Display
```
🥇 Oslo Wedding Photography (Score: 92/100)
   ✓ Specialized expertise in weddings (8 years, 47 events)
   ✓ Personal events specialist
   ✓ Perfect price alignment
   ✓ Local photographer - same city
   ✓ Excellent reviews (4.8/5 stars)
   
   View Profile → Send Inquiry →

🥈 Creative Moments Photography (Score: 78/100)
   ✓ Wedding expertise (5 years, 23 events)
   ✓ Price within budget
   ⚠ Covers Oslo area but based 40km away
   ✓ Great reviews (4.6/5 stars)
   
   View Profile → Send Inquiry →
```

---

## Part 4: System Integration

### Database Tables
```
1. vendorEventTypeExpertise
   - Which event types vendor handles
   - Experience level per type
   - Specialization flag

2. vendorCategoryPreferences  
   - B2C vs B2B handling
   - Sub-category preferences
   - Guest count ranges

3. coupleEventPreferences
   - Event type & category
   - Budget & guest count
   - Location & vibe preferences
   - Desired vendor categories

4. coupleVendorSearches
   - Track what couples search for
   - Analytics for improving matching

5. vendorMatchScores (cached)
   - Pre-calculated match scores
   - Expires for recalculation
```

### API Routes (To Be Implemented)

```
# Vendor Expertise
POST   /api/vendor/expertise
  → Add/update event type expertise

GET    /api/vendor/expertise/:vendorId
  → Retrieve vendor's expertise

PUT    /api/vendor/expertise/:expertiseId
  → Update expertise record

POST   /api/vendor/category-preferences
  → Set B2C/B2B preferences

# Couple Preferences
POST   /api/couple/preferences
  → Save couple's event preferences

GET    /api/couple/preferences/:coupleId
  → Retrieve couple's preferences

# Matching
GET    /api/couple/vendor-search?eventType=wedding&category=photographer
  → Get ranked vendors

POST   /api/couple/vendor-search
  → Log search query

GET    /api/couple/vendor/:vendorId/match-details
  → Show detailed match breakdown
```

### Frontend Screens (To Be Created)

**Vendor Side:**
- `VendorExpertiseOnboarding.tsx` - Multi-screen expertise setup
- `VendorCategoryPreferences.tsx` - B2C/B2B configuration

**Couple Side:**
- `CouplePreferencesOnboarding.tsx` - Multi-screen preferences setup
- `VendorSearchResults.tsx` - Display ranked vendors with match info
- `VendorMatchBreakdown.tsx` - Show detailed score breakdown

### Sync with Event Types
All event type references use:
```typescript
import { EVENT_TYPES, EVENT_CATEGORIES, CORPORATE_SUB_CATEGORIES } from "@shared/event-types";
```

Ensures:
- ✅ Consistent terminology across system
- ✅ Single source of truth for categories
- ✅ Easy to add new event types
- ✅ Translations (Norwegian/English) centralized

---

## Part 5: Example Matching Scenario

### Scenario: Bride Looking for Wedding Catering

**Couple Profile:**
- Event type: "wedding"
- Category: "personal"
- Guest count: 80
- Budget: 150,000-250,000 NOK
- Location: "Oslo"
- Radius: 50km
- Desired vibes: ["elegant", "professional", "luxurious"]
- Vendor needed: "Catering"

**System Searches:**
Find all vendors with:
- Category = "Catering"
- `vendorEventTypeExpertise.eventType` = "wedding"
- `vendorCategoryPreferences.handleB2C` = true

**Candidate Found - Vendor A:**
```
Name: Oslo Elegante Catering
Event Types: wedding (8 years, 120 completed, specialized)
B2C: Yes (20-200 guests)
B2B: Yes (100-500 guests)
Price: 150k-300k NOK per event
Description: "Elegant, professional catering for weddings and corporate events"
Reviews: 4.8/5 stars, 47 reviews
Location: "Oslo"
```

**Match Calculation:**
- Event Type Match: 95/100 (specialized, many events)
- Category Match: 100/100 (handles weddings, B2C)
- Budget Match: 100/100 (150k-250k overlaps 150k-300k)
- Capacity Match: 100/100 (80 guests within 20-200 range)
- Location Match: 100/100 (same city)
- Vibe Match: 95/100 ("elegant" + "professional" match description)
- Review Match: 96/100 (4.8/5 average)

**Overall Score:**
```
(95×0.25) + (100×0.20) + (100×0.20) + (100×0.15) + 
(100×0.10) + (95×0.05) + (96×0.05) = 98/100
```

**Displayed to Couple:**
```
🥇 Oslo Elegante Catering (98/100 - Excellent Match!)
   ✓ Specialized in wedding catering (8 years, 120 events)
   ✓ Personal event expert - handles your exact guest count
   ✓ Perfect price alignment with your budget
   ✓ Based in Oslo - no travel costs
   ✓ Your desired vibe (elegant, professional) matches perfectly
   ✓ Outstanding reviews (4.8/5 from 47 couples)
   
   [View Profile] [Send Inquiry]
```

Bride clicks "Send Inquiry" → Gets prepped message about elegant catering for 80-person wedding → Vendor notified

---

## Implementation Checklist

- [x] Database schema with expertise tables
- [x] Matching algorithm with weighted scoring
- [ ] API routes for expertise management
- [ ] API routes for couple preferences
- [ ] API routes for vendor search & matching
- [ ] Vendor onboarding screens (expertise + preferences)
- [ ] Couple onboarding screens (preferences)
- [ ] Vendor search results display
- [ ] Admin dashboard for vendor management
- [ ] Analytics tracking vendor search patterns
- [ ] Recalculation logic for match scores (cache expiry)
- [ ] Background job to pre-calculate popular searches

---

## Benefits of This System

✅ **For Couples/Clients:**
- Find vendors in 5 seconds by typing "wedding photographer"
- See only relevant matches sorted by fit quality
- Understand why vendor is recommended ("Specialized in weddings, 50 events, your budget, same city")

✅ **For Vendors:**
- Get found by right client type automatically
- Reduce time spent on unsuitable inquiries
- Showcase expertise and specialization
- Better quality leads

✅ **For Evendi:**
- Smart, intelligent platform (not just a directory)
- Better matching = higher conversion & satisfaction
- Rich data for analytics
- Scalable to new event types (add to event-types.ts → automatically works in matching)

---

## Success Metrics

Track:
- Click-through rate from search results to vendor profile
- Inquiry conversion rate (search → inquiry sent)
- Couple-vendor match satisfaction ratings
- Number of completed events through Evendi matches
- Average event satisfaction (post-event survey)
