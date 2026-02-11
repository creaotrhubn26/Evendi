# Tradition-Based Onboarding & Timeline - Implementation Complete

## 🎯 Overview

Couples now select their cultural traditions during signup, and Evendi automatically adapts the entire planning experience - starting with a culturally-appropriate timeline that reflects their specific ceremonies and rituals.

## ✨ What's New

### For Couples - Tradition Selection During Signup

When couples create an account, they:
1. Enter email, password, and name
2. **NEW:** Select their cultural traditions from 8 options
3. Receive an auto-populated timeline matching their tradition
4. Can skip tradition selection and add it later

### Cultural Traditions Available

| Tradition | Icon | Timeline Events | Special Ceremonies |
|-----------|------|-----------------|-------------------|
| **Norge** 🇳🇴 | Norwegian flag | 10 events | Kransekake, Brudevalsen, Hardingfele |
| **Sverige** 🇸🇪 | Swedish flag | 10 events | Prinsesstårta, Glass-klinking |
| **Danmark** 🇩🇰 | Danish flag | 10 events | Bryllupskringle, Polterabend, Taler og sange |
| **Hindu** 🕉️ | Om symbol | 12 events | Saptapadi, Mehndi, Kanyadaan, Sindoor, Vidai |
| **Sikh** ☬ | Khanda | 13 events | Anand Karaj, Laavan (4 rounds), Palla, Karah Parshad, Doli |
| **Muslim** ☪️ | Crescent | 11 events | Nikah, Mehr, Walima, Rukhsati, Mehndi |
| **Jødisk** ✡️ | Star of David | 12 events | Chuppah, Ketubah, Circling, Glass-knusing, Yichud, Hora |
| **Kinesisk** 🏮 | Lantern | 11 events | Te-seremoni, Røde konvolutter, Hongbao, Qipao |

## 🏗️ Technical Implementation

### 1. Client-Side Changes

#### CoupleLoginScreen.tsx
**New Features:**
- Tradition selection modal after signup form
- Visual tradition cards with cultural icons and colors
- Multi-select interface with check badges
- "Skip" option for couples who want to add traditions later
- Haptic feedback on selection

**Code Structure:**
```typescript
const CULTURAL_TRADITIONS = [
  { key: "norway", name: "Norge", icon: "🇳🇴", color: "#BA2020" },
  { key: "hindu", name: "Hindu", icon: "🕉️", color: "#FF6B35" },
  // ... 8 total traditions
];

// State management
const [selectedTraditions, setSelectedTraditions] = useState<string[]>([]);
const [showTraditionSelection, setShowTraditionSelection] = useState(false);

// Signup flow: Form → Tradition Selection → Server Request
if (isRegistering && selectedTraditions.length === 0) {
  setShowTraditionSelection(true); // Show modal
  return;
}
```

**UI/UX:**
- Full-screen modal with scrollable tradition list
- Each tradition shows flag/icon, name, and selection state
- Bottom action bar: "Hopp over" (Skip) | "Fortsett (X)" (Continue with X selected)
- Continue button disabled until at least one tradition is selected (or skipped)

### 2. Server-Side Changes

#### timeline-templates.ts (NEW FILE)
**Purpose:** Define tradition-specific timeline templates

**Structure:**
```typescript
export const TIMELINE_TEMPLATES: Record<string, TimelineTemplate[]> = {
  norway: [
    { time: "14:00", title: "Vielse", icon: "users", description: "..." },
    { time: "20:00", title: "Kransekake", icon: "heart", description: "..." },
    // ... 10 events total
  ],
  hindu: [
    { time: "09:00", title: "Saptapadi", icon: "heart", description: "De syv skritt rundt ilden" },
    { time: "11:00", title: "Mangalsutra", icon: "heart", description: "Hellig halskjede" },
    // ... 12 events total
  ],
  // ... all 8 traditions
};
```

**Event Icons:**
- `heart` - Love/ceremony moments
- `users` - Group ceremonies/guests
- `camera` - Photo sessions
- `coffee` - Meals/receptions
- `music` - Dancing/entertainment
- `sun` - Morning/sacred rituals
- `moon` - Evening/departure
- `star` - Special blessings/rituals

#### routes.ts Updates
**Couple Login Endpoint (`POST /api/couples/login`):**

**Before:**
```typescript
// Just created couple profile
const [newCouple] = await db.insert(coupleProfiles)
  .values({ email, displayName, password: hashedPassword })
  .returning();
```

**After:**
```typescript
// Create profile WITH traditions
const [newCouple] = await db.insert(coupleProfiles)
  .values({ 
    email, 
    displayName, 
    password: hashedPassword,
    selectedTraditions: selectedTraditions || null,
  })
  .returning();

// Auto-populate timeline for new users with tradition selection
if (isNewRegistration && selectedTraditions && selectedTraditions.length > 0) {
  const primaryTradition = selectedTraditions[0]; // Use first selected
  const template = TIMELINE_TEMPLATES[primaryTradition] || DEFAULT_TIMELINE;
  
  const timelineValues = template.map(event => ({
    coupleId: couple.id,
    time: event.time,
    title: event.title,
    icon: event.icon,
  }));

  await db.insert(scheduleEvents).values(timelineValues);
}
```

### 3. Database Schema

Already configured in previous implementation:
- `couple_profiles.selected_traditions` (TEXT[]) - Stores array of tradition keys

## 📊 Timeline Templates Breakdown

### Norwegian Wedding (norway)
**Duration:** 11 hours (10:00 - 21:00)
**Key Events:**
- 14:00 - Vielse (church ceremony)
- 15:00 - Fotosession
- 17:00 - Middag (dinner)
- 20:00 - **Kransekake** (traditional Norwegian tower cake)
- 20:30 - **Brudevalsen** (bridal waltz)

### Hindu Wedding (hindu)
**Duration:** 14 hours (06:00 - 20:00)
**Key Events:**
- 06:00 - **Ganesh Puja** (removing obstacles)
- 09:00 - **Saptapadi** (seven steps around sacred fire)
- 11:00 - **Mangalsutra** (sacred necklace)
- 12:00 - **Sindoor** (red powder in hair parting)
- 20:00 - **Vidai** (bride's farewell from home)

### Sikh Wedding (sikh)
**Duration:** 13 hours (07:00 - 20:00)
**Key Events:**
- 09:00 - **Milni** (families meeting)
- 10:00 - **Anand Karaj** (ceremony in Gurdwara)
- 11:00-11:45 - **Laavan** (4 rounds around Guru Granth Sahib)
- 12:30 - **Karah Parshad** (sacred sweet pudding)
- 13:00 - **Langar** (community meal)

### Muslim Wedding (muslim)
**Duration:** 13 hours (10:00 - 23:00)
**Key Events:**
- 17:00 - **Nikah** (Islamic marriage contract)
- 17:30 - **Mehr** (mandatory gift to bride)
- 20:00 - **Walima** (wedding feast)
- 23:00 - **Rukhsati** (bride's farewell)

### Jewish Wedding (jewish)
**Duration:** 12 hours (10:00 - 22:00)
**Key Events:**
- 16:15 - **Circling** (bride circles groom 7 times)
- 16:30 - **Ketubah** (marriage contract reading)
- 16:45 - **Sheva Brachot** (seven blessings)
- 17:00 - **Glass-knusing** (breaking the glass)
- 17:15 - **Yichud** (private moment for couple)
- 22:00 - **Hora** (traditional Jewish dance)

### Chinese Wedding (chinese)
**Duration:** 12 hours (07:00 - 19:00)
**Key Events:**
- 08:00 - **Brudgommen henter bruden** (door games)
- 09:00 - **Te-seremoni** (serving tea to elders)
- 11:00 - **Røde konvolutter** (Hongbao from elders)
- 15:00 - **8-retters bankett** (traditional feast)
- 16:00 - **Qipao** dress change

### Swedish Wedding (sweden)
**Duration:** 11 hours (10:00 - 21:00)
**Key Events:**
- 14:00 - Vigsel
- 17:00 - Middag
- 19:00 - **Tal** (speeches with glass clinking tradition)
- 20:00 - **Prinsesstårta** (princess cake)

### Danish Wedding (denmark)
**Duration:** 9 hours (10:00 - 19:00)
**Key Events:**
- 14:00 - Vielse
- 17:00 - Middag
- 19:00 - **Taler og sange** (speeches and songs)
- 20:00 - **Bryllupskringle** (pretzel-shaped cake)

## 🔄 User Flow

### New Couple Registration
```
1. Enter email, password, name
   ↓
2. Click "Registrer deg"
   ↓
3. [MODAL APPEARS] Select traditions
   ├─→ Select 1+ traditions → Click "Fortsett (X)"
   └─→ Click "Hopp over" to skip
   ↓
4. Server creates profile + auto-populates timeline
   ↓
5. Logged in → Navigate to Timeline screen
   ↓
6. See culturally-appropriate events already populated!
```

### Example: Hindu Couple Signup
```
User selects: Hindu + Indian
↓
Server creates timeline with:
- 06:00 Ganesh Puja
- 07:00 Madhuparka
- 08:00 Kanyadaan
- 09:00 Agni Poojan
- 10:00 Saptapadi ⭐ (Seven steps)
- 11:00 Mangalsutra
- 12:00 Sindoor
- ... and 5 more events
```

## 🎨 Visual Design

### Tradition Selection Modal

**Header:**
```
┌────────────────────────────────┐
│ Velg kulturelle tradisjoner    │
│ Vi tilpasser tidslinjen og     │
│ planleggingen basert på dine   │
│ valg                           │
└────────────────────────────────┘
```

**Tradition Cards:**
```
┌─────────────────────────────────┐
│ 🇳🇴  Norge              [✓]    │ ← Selected (red border)
├─────────────────────────────────┤
│ 🇸🇪  Sverige                   │ ← Not selected
├─────────────────────────────────┤
│ 🕉️   Hindu               [✓]    │ ← Selected (orange border)
├─────────────────────────────────┤
│ ☬   Sikh                        │
└─────────────────────────────────┘
```

**Footer:**
```
┌─────────────┬───────────────────┐
│ Hopp over   │ Fortsett (2)      │
└─────────────┴───────────────────┘
```

## 📈 Impact & Benefits

### For Couples
✅ **Instant value** - Timeline populated on day 1
✅ **Cultural relevance** - See ceremonies that matter to them
✅ **Time-saving** - No manual event creation
✅ **Educational** - Learn about their own traditions
✅ **Flexibility** - Can edit/add/remove events later

### For Vendors
✅ **Better matching** - Cultural expertise shown to relevant couples
✅ **Preparation** - Know what ceremonies to expect
✅ **Specialization** - Showcase tradition-specific services

### For Evendi
✅ **Differentiation** - Unique feature competitors don't have
✅ **Personalization** - App adapts to each couple
✅ **Engagement** - Couples see value immediately
✅ **Data** - Understand cultural wedding market
✅ **Growth** - Appeal to multicultural couples

## 🧪 Testing Scenarios

### Test 1: Norwegian Couple
```
1. Sign up with email/password
2. Select "Norge" tradition
3. Click "Fortsett (1)"
4. Navigate to Timeline screen
5. ✅ Verify: 10 Norwegian events (Kransekake, Brudevalsen, etc.)
```

### Test 2: Multi-Tradition Couple
```
1. Sign up
2. Select "Hindu" AND "Sikh"
3. Continue
4. ✅ Verify: Hindu timeline (primary tradition)
5. ✅ Verify: Can add Sikh events manually later
```

### Test 3: Skip Traditions
```
1. Sign up
2. Click "Hopp over"
3. Navigate to Timeline
4. ✅ Verify: Empty timeline (couple adds events manually)
```

### Test 4: Login (Existing User)
```
1. Login with existing credentials
2. ✅ Verify: No tradition modal (only for new registrations)
3. ✅ Verify: Existing timeline preserved
```

## 🔮 Future Enhancements

### Phase 1 - Enhanced Traditions (Next Sprint)
- [ ] Multi-tradition timeline merging (Hindu + Sikh ceremonies combined)
- [ ] Tradition-specific checklist items
- [ ] Cultural vendor recommendations based on tradition
- [ ] Timeline descriptions in multiple languages

### Phase 2 - Advanced Customization
- [ ] Edit tradition templates before applying
- [ ] Save custom traditions for future couples
- [ ] Community-contributed tradition templates
- [ ] Regional variations (North Indian vs South Indian Hindu)

### Phase 3 - Smart Features
- [ ] AI suggestions based on tradition + location + guest count
- [ ] Automatic duration calculations per tradition
- [ ] Conflict detection (e.g., "Nikah usually 30min, yours is 2hrs")
- [ ] Photo shot list generator based on ceremonies

## 📝 Migration Notes

### For Existing Couples
- Already registered couples are **not affected**
- Their timelines remain unchanged
- They can add traditions later via TraditionsScreen
- They can manually populate timeline or use templates

### For Database
- No migration needed (selectedTraditions column already exists from previous implementation)
- Timeline events created on-demand during signup
- No data loss or breaking changes

## 🎓 Developer Guide

### Adding a New Tradition

**1. Update timeline-templates.ts:**
```typescript
export const TIMELINE_TEMPLATES: Record<string, TimelineTemplate[]> = {
  // ... existing traditions
  newTradition: [
    { time: "10:00", title: "Ceremony Name", icon: "heart", description: "..." },
    // ... more events
  ],
};
```

**2. Update CoupleLoginScreen.tsx:**
```typescript
const CULTURAL_TRADITIONS = [
  // ... existing traditions
  { key: "newTradition", name: "Display Name", icon: "🎭", color: "#HEXCOLOR" },
];
```

**3. Update TraditionsScreen.tsx:**
```typescript
const TRADITIONS: Record<string, { name: string; color: string; traditions: Tradition[] }> = {
  // ... existing traditions
  newTradition: {
    name: "Display Name",
    color: "#HEXCOLOR",
    traditions: [
      { id: "t1", title: "Tradition 1", description: "...", details: "...", icon: "icon-name" },
      // ... more traditions
    ],
  },
};
```

### Customizing Timeline Templates

**Timing Guidelines:**
- Morning ceremonies: 06:00 - 12:00
- Afternoon ceremonies: 12:00 - 18:00
- Evening events: 18:00 - 00:00
- Buffer: 30-60min between major events

**Icon Selection:**
- `heart` - Emotional/romantic moments
- `users` - Group/family ceremonies
- `camera` - Photo opportunities
- `coffee` - Food/refreshments
- `music` - Entertainment/dancing
- `sun` - Sacred/morning rituals
- `moon` - Evening/farewell
- `star` - Blessings/special rituals

## 📦 Files Modified

### Client
- `client/screens/CoupleLoginScreen.tsx` - Added tradition selection modal
  - New state: `selectedTraditions`, `showTraditionSelection`
  - New handlers: `toggleTradition`, `handleContinueWithTraditions`, `handleSkipTraditions`
  - New UI: Modal with scrollable tradition cards
  - Sends `selectedTraditions` to server

### Server
- `server/routes.ts` - Updated couple login endpoint
  - Import timeline templates
  - Accept `selectedTraditions` from request
  - Auto-populate timeline for new registrations
  - Store traditions in couple profile

- `server/timeline-templates.ts` - **NEW FILE**
  - 8 cultural timeline templates
  - 1 default template
  - TypeScript interfaces for type safety

### Database
- No changes (already configured in previous implementation)

## 🎉 Summary

Couples now experience a **personalized, culturally-aware planning journey from day one**. By selecting their traditions during signup, they receive:

1. **Auto-populated timeline** with culturally-appropriate ceremonies
2. **Immediate value** without manual data entry
3. **Educational content** about their traditions
4. **Better vendor matching** (from previous implementation)
5. **Flexible planning** that respects their cultural identity

This feature positions Evendi as the **only wedding planning app that truly understands multicultural weddings** from the moment couples join.
