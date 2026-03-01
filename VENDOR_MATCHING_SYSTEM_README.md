# Evendi Smart Vendor Matching System

## 📋 Overview

This document describes the complete **Vendor Expertise & Couple Preferences Matching System** for Evendi. This system intelligently matches couples/clients with vendors based on:

- **Event Type Expertise** (wedding, conference, seminar, etc.)
- **Budget Alignment** (price range matching)
- **Capacity Fit** (guest count compatibility)
- **Location Proximity** (geographic distance)
- **Event Vibe** (style/atmosphere preferences)
- **Reviews & Ratings** (past client satisfaction)
- **Service Type** (B2C personal/B2B corporate)

## 🎯 Problem Statement

**Before This System:**
- Couples browse all vendors in a category (e.g., 50 photographers)
- No way to specify "I need wedding photography" vs "conference photography"
- Vendors can't indicate their true specialization
- Generic search results don't reflect couple's specific needs
- Low conversion (takes time to find right vendor)

**After This System:**
- Couple specifies: "Wedding photography, €3k-5k, intimate vibe, Oslo"
- System ranks vendors by match quality (1-100 score)
- Perfect matches appear first with explanations
- Vendors with expertise get visibility
- High conversion (couples find exactly what they need)

## 🏗️ Architecture Overview

### Three Main Components

#### 1. **Vendor Expertise System**
Vendors answer: "What event types do I handle?"
- Wedding, confirmation, birthday, engagement, baby shower
- Conference, seminar, summer party, Christmas party, team building
- Product launch, trade fair, corporate anniversary, awards

For each event type:
- Years of experience
- Number of completed events  
- Is this a core offering? (specialization flag)

Plus: B2C vs B2B preferences and guest count ranges

#### 2. **Couple Preferences System**
Couples specify: "What do I need?"
- Event type (wedding, conference, etc.)
- Budget range (min-max)
- Guest count
- Desired vibe (intimate, luxurious, professional, playful, etc.)
- Location and travel radius
- Which vendor categories

#### 3. **Matching Algorithm**
System calculates: "Which vendors are best for this couple?"
- 7-factor scoring algorithm
- Weighted by importance
- Returns vendors sorted by match quality
- Explains why each vendor matches

### Data Flow

```
VENDOR REGISTRATION
  ↓
VENDOR EXPERTISE SETUP (event types, experience, B2C/B2B)
  ↓
Store: vendorEventTypeExpertise, vendorCategoryPreferences
  ↓
         COUPLE REGISTRATION
           ↓
         COUPLE PREFERENCES SETUP (event type, budget, vibe)
           ↓
         Store: coupleEventPreferences
           ↓
COUPLE SEARCHES FOR VENDORS
           ↓
MATCHING ALGORITHM RUNS
  - Load couple preferences
  - Load all approved vendors
  - Calculate 7-factor match scores
  - Cache results (24 hour validity)
           ↓
RANKED RESULTS DISPLAYED
  - Vendors sorted 1-100 score
  - Match reasons shown
  - Couple clicks vendor → sends inquiry
```

## 📊 Matching Algorithm Details

### Seven Scoring Factors

| Factor | Weight | Importance | How It Works |
|--------|--------|-----------|-------------|
| Event Type | 25% | ⭐⭐⭐ Critical | Does vendor handle this event type? Years of experience? Specialized? |
| Category | 20% | ⭐⭐⭐ Critical | Does vendor handle B2C (personal) or B2B (corporate)? |
| Budget | 20% | ⭐⭐⭐ Critical | Is vendor's price range within couple's budget? |
| Capacity | 15% | ⭐⭐ Important | Can vendor handle the guest count? |
| Location | 10% | ⭐ Nice-to-have | How far is vendor? Same city (100), region (80), far (40) |
| Vibe | 5% | ⭐ Nice-to-have | Do keywords in vendor description match couple's vibe? |
| Reviews | 5% | ⭐ Nice-to-have | What's vendor's average rating? |

### Score Bands

- **95-100:** Perfect match (exactly what couple needs)
- **80-94:** Great match (very good fit with minor gaps)
- **60-79:** Good match (meets core needs, some compromises)
- **40-59:** Possible match (handles category, but gaps exist)
- **Below 40:** Poor match (probably not ideal)

### Example Calculation

**Couple Profile:**
- Event: Wedding
- Budget: €150k-250k
- Guests: 80
- Vibe: Elegant, professional, intimate
- Location: Oslo, 50km radius

**Vendor Profile:**
- Oslo Elegante Catering
- Event types: Wedding (8 years, 120 events, specialized)
- B2C: Yes (20-200 guests)
- Price: €150k-300k
- Description: "Elegant, professional catering for intimate weddings"
- Reviews: 4.8/5 stars
- Location: Oslo

**Match Calculation:**
```
Event Type:    95/100  (specialized, many events) × 0.25 = 23.75
Category:     100/100  (handles B2C weddings)     × 0.20 = 20.00
Budget:       100/100  (€150k-250k within range)  × 0.20 = 20.00
Capacity:     100/100  (80 guests in 20-200)     × 0.15 = 15.00
Location:     100/100  (same city)               × 0.10 = 10.00
Vibe:          95/100  ("elegant","professional") × 0.05 =  4.75
Reviews:       96/100  (4.8/5 average)           × 0.05 =  4.80
                                                 ─────────────
                                        TOTAL = 98/100 🥇
```

**Display to Couple:**
```
🥇 Oslo Elegante Catering (98/100 - Excellent Match!)

✓ Specialized in wedding catering (8 years, 120 events)
✓ Handles your exact guest count (80 within 20-200)
✓ Perfect price alignment (€150k-250k)
✓ Shares your vibe (elegant, professional)
✓ Local in Oslo (no travel costs)
✓ Outstanding reviews (4.8/5 stars)
```

## 🗄️ Database Schema

### Five New Tables

#### vendorEventTypeExpertise
```sql
- vendorId (FK → vendors)
- eventType (enum: wedding, conference, etc.)
- yearsExperience (int)
- completedEvents (int)
- isSpecialized (boolean)
- notes (text)
- createdAt, updatedAt
```

#### vendorCategoryPreferences
```sql
- vendorId (FK → vendors)
- handleB2C (boolean) - personal events?
- handleB2B (boolean) - corporate events?
- b2bSubCategories (json) - professional, social, external, hr
- minGuestCountB2C (int)
- maxGuestCountB2C (int)
- minGuestCountB2B (int)
- maxGuestCountB2B (int)
- b2cDetails (json) - notes, specialties
- b2bDetails (json) - notes, specialties
- createdAt, updatedAt
```

#### coupleEventPreferences
```sql
- coupleId (FK → coupleProfiles)
- eventType (enum: wedding, conference, etc.)
- eventCategory (enum: personal, corporate)
- guestCount (int)
- budgetMin (int)
- budgetMax (int)
- currency (string, default: NOK)
- eventLocation (string) - city/region
- eventLocationRadius (int) - km
- desiredEventVibe (json array) - intimate, luxurious, etc.
- specialRequirements (text)
- vendorPreferences (json) - categories wanted
- createdAt, updatedAt
```

#### coupleVendorSearches (Analytics)
```sql
- coupleId (FK → coupleProfiles)
- vendorId (FK → vendors) - null if just search
- searchQuery (string)
- eventType (enum)
- clickedVendorId (FK → vendors) - null unless clicked
- createdAt
```

#### vendorMatchScores (Cache)
```sql
- vendorId (FK → vendors)
- coupleId (FK → coupleProfiles)
- overallScore (0-100)
- eventTypeMatch (0-100)
- budgetMatch (0-100)
- capacityMatch (0-100)
- locationMatch (0-100)
- vibeMatch (0-100)
- reviewScore (0-100)
- matchReasons (json array)
- warnings (json array)
- calculatedAt (timestamp)
- expiresAt (timestamp) - 24 hours
```

## 🔌 API Endpoints

### Vendor Expertise
```
POST   /api/vendor/expertise
       Add/update vendor expertise for event type
       Input: vendorId, eventType, yearsExperience, completedEvents, isSpecialized

GET    /api/vendor/expertise/:vendorId
       Get all expertise for a vendor

DELETE /api/vendor/expertise/:expertiseId
       Remove expertise record

POST   /api/vendor/category-preferences
       Set vendor's B2C/B2B preferences
       Input: vendorId, handleB2C, handleB2B, b2bSubCategories, guestRanges

GET    /api/vendor/category-preferences/:vendorId
       Get vendor's B2C/B2B preferences
```

### Couple Preferences
```
POST   /api/couple/preferences
       Save couple's event preferences
       Input: All fields from coupleEventPreferences

GET    /api/couple/preferences/:coupleId
       Get couple's preferences
```

### Matching & Search
```
GET    /api/couple/vendor-matches?coupleId=X&limit=20&categoryId=Y
       Get ranked vendors matching couple
       Returns: Array of vendors with match scores and reasons

GET    /api/vendor/:vendorId/match-details/:coupleId
       Get detailed breakdown for specific vendor-couple pair
       Returns: All 7 score components with explanations
```

## 🎨 User Flows

### Vendor Flow

```
1. VENDOR REGISTERS
   - Email, password
   - Business name, category
   - Status: pending admin approval

2. ADMIN APPROVES
   - Status changes to "approved"

3. VENDOR EXPERTISE ONBOARDING (NEW!)
   - Screen A: Select event types
     - For each: years experience, completed events, specialized?
     - Save to vendorEventTypeExpertise table
   
   - Screen B: B2C vs B2B preferences
     - Toggle: Handle personal events? (B2C)
     - Toggle: Handle corporate events? (B2B)
     - If B2B: select sub-categories
     - Set guest count ranges
     - Save to vendorCategoryPreferences table

4. PROFILE COMPLETE
   - Now searchable by couples
   - Can edit expertise/preferences anytime

5. COUPLE SEARCHES
   - Vendor appears in results (if match exists)
   - Match score shows expertise fit
   - Couple clicks → views vendor profile → sends inquiry
```

### Couple Flow

```
1. COUPLE REGISTERS
   - Email, password
   - Names, relationship
   - Status: registered

2. LOGIN
   - Select event type at login screen
   - "What type of event are you planning?"

3. PREFERENCES ONBOARDING (NEW!)
   - Screen 1: Confirm event type (+ B2B sub-category if applicable)
   - Screen 2: Event details (guests, budget, date, location)
   - Screen 3: Desired vibe (multi-select: intimate, luxurious, etc.)
   - Screen 4: Vendor categories wanted (photographer, catering, etc.)
   - Screen 5: Special requirements (text area, optional)
   - Save to coupleEventPreferences table

4. DASHBOARD
   - Browse vendors or use search
   - Click "Find Vendors" → See ranked matches

5. VENDOR DISCOVERY
   - Get: GET /api/couple/vendor-matches
   - System calculates 7-factor scores
   - Results sorted best-first (98/100, 92/100, 85/100, etc.)

6. CLICK VENDOR
   - Get: GET /api/vendor/:vendorId/match-details
   - Show detailed match breakdown
   - All 7 components explained
   - View full profile

7. SEND INQUIRY
   - Conversation created
   - Vendor notified
   - Negotiation begins
```

## 🚀 Implementation Status

### ✅ COMPLETE (Backend Foundation)
- Database schema with 5 new tables
- Matching algorithm service (7 factors, weighted scoring)
- TypeScript types & Zod validation schemas
- Full documentation and guides

### 🔄 IN PROGRESS (API Layer)
- API routes file ready to create
- Endpoints specification complete
- Authentication middleware needed

### 🏗️ TO DO (Frontend Implementation)
- Vendor expertise onboarding screens
- Couple preferences onboarding screens
- Vendor search results display
- Match details breakdown display
- Integration with login flows

### 📊 TO DO (Analytics & Admin)
- Track vendor searches
- Analytics dashboard
- Admin oversight tools

## 📈 Benefits

### For Couples/Clients
- ✅ Find perfect vendor in seconds
- ✅ See exactly why vendor is recommended
- ✅ High confidence in recommendations
- ✅ Faster booking process
- ✅ Better event outcomes

### For Vendors
- ✅ Get found by right client type
- ✅ Reduce unsuitable inquiries
- ✅ Showcase expertise visibility
- ✅ Better quality leads
- ✅ More bookings

### For Evendi
- ✅ Intelligent platform (not just directory)
- ✅ Better conversion rates
- ✅ Higher user satisfaction
- ✅ Rich data for analytics
- ✅ Competitive advantage
- ✅ Scales to new event types easily

## 🔧 Technical Stack

**Backend:**
- Node.js + Express
- PostgreSQL + Drizzle ORM
- TypeScript for type safety
- Zod for validation

**Frontend:**
- React Native Web
- TypeScript
- Navigation routing

**Database:**
- Neon PostgreSQL
- 5 new tables with proper indexing
- 24-hour caching strategy

## 📚 Documentation Reference

### Core Files (Already Complete)
- [/workspaces/wedflow/shared/schema.ts](shared/schema.ts) - Database (lines 2179-2240, 2343-2390)
- [/workspaces/wedflow/shared/vendor-matching.ts](shared/vendor-matching.ts) - Algorithm (500+ lines)
- [/workspaces/wedflow/shared/event-types.ts](shared/event-types.ts) - 20+ event types

### Implementation Guides
- [VENDOR_EXPERTISE_MATCHING_IMPLEMENTATION.md](VENDOR_EXPERTISE_MATCHING_IMPLEMENTATION.md) - Complete system walkthrough
- [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md) - Step-by-step tasks
- [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md) - Get started immediately

## 🎓 Key Concepts

**Event Types:** The 20+ event types (wedding, conference, seminar, summer party, etc.) that vendors can specialize in and couples can be planning.

**B2C vs B2B:** 
- B2C = Personal events (weddings, birthdays, confirmations)
- B2B = Corporate events (conferences, team building, product launches)
- Vendors can handle one, both, or neither

**Match Score:** 0-100 number indicating how well vendor fits couple's needs. Calculated from 7 factors.

**Expertise:** How many years vendor has done an event type, how many completed events, whether they're specialized.

**Preferences:** What couple wants: event type, budget, vibe, location, vendors needed.

**Cache:** Match scores calculated once, stored for 24 hours. Invalidated when vendor/couple makes changes.

## ✨ Future Enhancements

After initial implementation:
- ML-based vibe matching (learn from past inquiries)
- Availability integration with vendor calendars
- Dynamic pricing suggestions
- Inquiry success prediction
- Vendor recommendation to couples
- A/B testing on match algorithms
- Geographic clustering optimization
- Seasonal demand patterns

## 🤝 Support

**Questions?**
- Check QUICK_START_GUIDE.md for common questions
- See VENDOR_EXPERTISE_MATCHING_IMPLEMENTATION.md for detailed examples
- Review IMPLEMENTATION_CHECKLIST.md for step-by-step tasks

**Issues?**
- All tables and schema already created ✅
- Matching algorithm tested and verified ✅
- Types and validation schemas ready ✅
- Just need to create API routes and UI screens

---

## 🚀 Ready to Implement?

Start here:
1. Read [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)
2. Create API routes from [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)
3. Test with curl commands
4. Build vendor onboarding UI
5. Build couple preferences UI
6. Build search & discovery
7. Run end-to-end tests

**Estimated time: 15-20 hours for complete production-ready system**

---

**System Architecture: COMPLETE ✅**
**Backend Foundation: COMPLETE ✅**
**Ready for Implementation: YES 🚀**
