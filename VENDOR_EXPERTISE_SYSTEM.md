# Vendor Expertise & Advanced Matching System

## Overview

This document outlines the vendor expertise system and couple preferences matching. This enables Evendi to:

1. **Vendor-side**: Declare expertise in specific event types (weddings, conferences, seminars, etc.)
2. **Couple-side**: Express event preferences and needs during onboarding
3. **Matching**: Find relevant vendors using keyword search + expertise matching

## Database Schema

### New Tables

#### 1. `vendor_expertise` 
Tracks which event types each vendor specializes in.

```sql
CREATE TABLE vendor_expertise (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,  -- "wedding", "conference", "seminar", etc.
  corporate_subcategory TEXT,  -- "professional_strategic", "social_relational", etc.
  years_experience INTEGER,
  events_completed INTEGER DEFAULT 0,
  typical_guest_count_min INTEGER,
  typical_guest_count_max INTEGER,
  budget_tier TEXT,  -- "budget_friendly", "mid_range", "premium", "luxury"
  is_verified BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX idx_vendor_expertise_vendor_event ON vendor_expertise(vendor_id, event_type);
CREATE INDEX idx_vendor_expertise_event_type ON vendor_expertise(event_type);
```

#### 2. `vendor_b2b_preferences`
Corporate event handling capabilities.

```sql
CREATE TABLE vendor_b2b_preferences (
  id UUID PRIMARY KEY,
  vendor_id UUID UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
  handles_corporate_events BOOLEAN DEFAULT FALSE,
  min_attendees INTEGER,
  max_attendees INTEGER,
  corporate_specializations TEXT,  -- JSON: ["professional_strategic", "social_relational"]
  handles_international BOOLEAN DEFAULT FALSE,
  languages TEXT,
  handles_last_minute BOOLEAN DEFAULT FALSE,
  has_client_references BOOLEAN DEFAULT FALSE,
  corporate_notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX idx_vendor_b2b_vendor ON vendor_b2b_preferences(vendor_id);
```

#### 3. `couple_preferences`
Couple event needs and preferences.

```sql
CREATE TABLE couple_preferences (
  id UUID PRIMARY KEY,
  couple_id UUID UNIQUE REFERENCES couple_profiles(id) ON DELETE CASCADE,
  
  -- Event Planning
  estimated_guest_count INTEGER,
  event_date TEXT,
  event_location TEXT,
  event_location_country TEXT DEFAULT 'Norway',
  
  -- Budget
  estimated_budget_min INTEGER,
  estimated_budget_max INTEGER,
  budget_currency TEXT DEFAULT 'NOK',
  
  -- Vendor Selection
  preferred_vendor_ids TEXT,  -- JSON array
  vendor_preferences JSONB,  -- { "eco_friendly": true, "local": true }
  
  -- B2B Event Info
  is_b2b_event BOOLEAN DEFAULT FALSE,
  corporate_event_type TEXT,  -- "conference", "seminar", etc.
  corporate_attendee_type TEXT,  -- "employees", "clients", etc.
  
  -- Special Needs
  special_requirements TEXT,
  requires_accessibility BOOLEAN DEFAULT FALSE,
  accessibility_notes TEXT,
  has_dietary_requirements BOOLEAN DEFAULT FALSE,
  has_international_guests BOOLEAN DEFAULT FALSE,
  languages TEXT,  -- comma-separated
  cultural_traditions TEXT,  -- comma-separated
  
  completed_onboarding BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX idx_couple_preferences_couple ON couple_preferences(couple_id);
CREATE INDEX idx_couple_preferences_b2b ON couple_preferences(is_b2b_event);
```

#### 4. `vendor_search_index` (Denormalized)
Fast search index for vendor discovery.

```sql
CREATE TABLE vendor_search_index (
  id UUID PRIMARY KEY,
  vendor_id UUID UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
  search_text TEXT NOT NULL,  -- Full searchable text
  event_types TEXT,  -- "wedding,conference,seminar"
  keywords TEXT,  -- Comma-separated: "photography,eco-friendly,drone"
  vendor_tier TEXT,
  region TEXT,
  search_rank INTEGER DEFAULT 0,
  indexed_at TIMESTAMP
);

CREATE INDEX idx_vendor_search_vendor ON vendor_search_index(vendor_id);
CREATE INDEX idx_vendor_search_text ON vendor_search_index(search_text);
CREATE INDEX idx_vendor_search_events ON vendor_search_index(event_types);
CREATE INDEX idx_vendor_search_keywords ON vendor_search_index(keywords);
```

## API Endpoints

### Vendor Management

#### Create/Update Vendor Expertise
```
POST /api/vendor/expertise
{
  "eventType": "conference",
  "corporateSubcategory": "professional_strategic",
  "yearsExperience": 5,
  "eventsCompleted": 23,
  "typicalGuestCountMin": 100,
  "typicalGuestCountMax": 500,
  "budgetTier": "mid_range",
  "description": "Specialized in tech conferences with interactive sessions"
}
```

#### Update B2B Preferences
```
POST /api/vendor/b2b-preferences
{
  "handlesCorporateEvents": true,
  "minAttendees": 50,
  "maxAttendees": 1000,
  "corporateSpecializations": ["professional_strategic", "social_relational"],
  "handlesInternational": true,
  "languages": "Norwegian, English, Swedish",
  "handlesLastMinute": true,
  "hasClientReferences": true,
  "corporateNotes": "Experience with multinational companies"
}
```

### Couple Management

#### Create/Update Couple Preferences
```
POST /api/couple/preferences
{
  "estimatedGuestCount": 150,
  "eventDate": "2026-06-15",
  "eventLocation": "Oslo",
  "estimatedBudgetMin": 500000,
  "estimatedBudgetMax": 800000,
  "isB2BEvent": true,
  "corporateEventType": "conference",
  "corporateAttendeeType": "industry_professionals",
  "specialRequirements": "Need AV equipment for presentations",
  "hasInternationalGuests": true,
  "languages": "Norwegian, English",
  "culturalTraditions": "norway"
}
```

### Search & Discovery

#### Advanced Vendor Search
```
GET /api/vendors/search?q=conference&eventType=conference&budget=mid_range&guestCount=200&location=Oslo

Response:
{
  "vendors": [
    {
      "id": "...",
      "businessName": "Conference Experts AS",
      "category": {...},
      "expertise": {
        "eventTypes": ["conference", "seminar"],
        "yearsExperience": 8,
        "eventsCompleted": 45
      },
      "b2b": {
        "handlesCorporateEvents": true,
        "minAttendees": 100,
        "maxAttendees": 1000
      },
      "matchScore": 0.95,  // Relevance to couple's needs
      "matchReasons": [
        "Specializes in conferences",
        "Handles 150+ attendees",
        "Within budget range"
      ]
    }
  ],
  "total": 12
}
```

#### Vendor Recommendations for Couple
```
GET /api/couple/vendor-recommendations

Uses couple_preferences to recommend vendors:
- Filters by event type expertise
- Considers budget compatibility
- Checks capacity
- Returns ranked results
```

#### Keyword Search
```
GET /api/vendors/search?q=eco-friendly+catering&location=Oslo

Full-text search across:
- Vendor name
- Business description
- Keywords (photography, drone, eco-friendly, etc.)
- Event types
```

## Vendor Onboarding Flow

### Step 1: Initial Registration
- Existing: Email, password, business name, category
- NEW: Select primary event type(s)

### Step 2: Expertise Declaration
- NEW: For each event type, specify:
  - Years of experience
  - Events completed
  - Typical guest count range
  - Budget tier
  - Description

### Step 3: B2B Preferences (if applicable)
- NEW: If category handles corporate events:
  - Min/max attendees
  - Corporate event specializations
  - International experience
  - Languages
  - Last-minute availability

### Step 4: Advanced Profile Details
- Existing: Category-specific details (venue capacity, catering min/max, etc.)
- NEW: Keywords/expertise tags

## Couple Onboarding Flow

### Step 1: Event Type Selection
- Existing: Personal (wedding, birthday, etc.) or Corporate (conference, seminar, etc.)
- NEW: Better categorization based on event-types.ts

### Step 2: Event Details
- NEW: Guest count estimate, event date, location, budget

### Step 3: Preferences & Needs
- NEW: Special requirements, accessibility, dietary needs, cultural traditions

### Step 4: Vendor Matching Setup
- NEW: Preferred vendor characteristics (eco-friendly, local, award-winning, etc.)

## Matching Algorithm

### Score Calculation

```typescript
function calculateMatchScore(couple: CouplePreferences, vendor: Vendor): MatchResult {
  let score = 0;
  let reasons: string[] = [];
  
  // 1. Event Type Match (40%)
  const eventTypeMatch = vendorHasExpertise(vendor, couple.eventType);
  if (eventTypeMatch) {
    score += 40;
    reasons.push(`Specializes in ${couple.eventType}`);
  }
  
  // 2. Capacity Match (30%)
  if (couple.estimatedGuestCount) {
    const capacityMatch = vendorCanHandle(vendor, couple.estimatedGuestCount);
    if (capacityMatch) {
      score += 30;
      reasons.push(`Can handle ${couple.estimatedGuestCount} guests`);
    }
  }
  
  // 3. Budget Match (20%)
  if (couple.estimatedBudgetMax) {
    const budgetTier = getBudgetTier(couple.estimatedBudgetMax);
    const vendorExpertise = vendor.expertise.find(e => e.eventType === couple.eventType);
    if (vendorExpertise?.budgetTier === budgetTier) {
      score += 20;
      reasons.push(`Within budget tier: ${budgetTier}`);
    }
  }
  
  // 4. Location Match (10%)
  if (couple.eventLocation && vendor.location) {
    if (sameRegion(couple.eventLocation, vendor.location)) {
      score += 10;
      reasons.push(`Local to ${couple.eventLocation}`);
    }
  }
  
  // 5. Bonus: Special Characteristics
  if (couple.vendorPreferences?.eco_friendly && vendor.isEcoFriendly) {
    score += 5;
    reasons.push("Eco-friendly");
  }
  if (couple.hasInternationalGuests && vendor.b2b?.handlesInternational) {
    score += 5;
    reasons.push("Handles international events");
  }
  
  return {
    score: Math.min(score, 100),
    reasons,
    matchPercentage: Math.min(score, 100)
  };
}
```

## Key Benefits

### For Vendors
1. **Better lead quality** - Receive inquiries from couples seeking their expertise
2. **Profile completeness** - Show what they specialize in, not just category
3. **B2B opportunities** - Can register as corporate event specialists
4. **Credibility** - Years of experience, events completed, verified expertise

### For Couples
1. **Better discovery** - Find vendors by expertise not just category
2. **Keyword search** - Search "conference" and find all conference specialists
3. **Matching** - Get recommendations based on their needs
4. **Confidence** - See vendor credentials and experience

### For Evendi
1. **Higher conversion** - Better matching = more bookings
2. **Less friction** - Couples find vendors faster
3. **B2B market** - Open new revenue stream from corporate event planning
4. **Market insights** - Understand vendor expertise distribution

## Implementation Checklist

- [ ] Add new tables to schema.ts
- [ ] Create Drizzle migration
- [ ] Update vendor registration screens to collect expertise
- [ ] Create vendor expertise management screen
- [ ] Create couple preferences onboarding screen
- [ ] Implement API endpoints for CRUD operations
- [ ] Implement advanced search with keyword matching
- [ ] Implement matching algorithm
- [ ] Build search/recommendations UI
- [ ] Update seed data with sample expertise and B2B preferences
- [ ] Add admin screens to verify vendor expertise claims
- [ ] Add analytics for matching success rates

## Search Index Maintenance

The `vendor_search_index` table should be updated via triggers or background job:

```sql
-- Trigger to update search index when vendor or expertise changes
CREATE TRIGGER update_vendor_search_index
AFTER INSERT OR UPDATE ON vendor_expertise
FOR EACH ROW
EXECUTE FUNCTION refresh_vendor_search_index();

-- Jobs to periodically rebuild search ranks based on popularity/reviews
```

This enables fast full-text search without expensive queries on the main vendor tables.
