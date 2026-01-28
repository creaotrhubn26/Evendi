# Couple Seating Chart Integration - Complete ✅

## Implementation Summary

Couples can now use the same **interactive seating chart** as vendors to plan and manage table layouts for their wedding directly from the **Venue screen**.

## What Changed

### 1. **Server Endpoints Added** (`server/routes.ts`)

**Couple Seating Endpoints:**
- `GET /api/couple/venue/seating` - Retrieve couple's seating chart
- `POST /api/couple/venue/seating` - Save couple's seating chart

**Vendor Seating Endpoints:** (Already implemented)
- `GET /api/vendor/venue/seating` - Retrieve vendor's seating chart
- `POST /api/vendor/venue/seating` - Save vendor's seating chart

Both endpoints:
- Store data in `appSettings` table using key-value pattern
- Keys: `couple_venue_seating_{coupleId}` and `vendor_venue_seating_{vendorId}`
- Support JSON serialization for tables and guests
- Include error handling and proper authentication

### 2. **VenueScreen Updated** (`client/screens/VenueScreen.tsx`)

**New Features:**
- ✅ Integrated `SeatingChart` component into seating tab
- ✅ Added React Query for caching and state management
- ✅ Handles table and guest state with real-time sync
- ✅ Shows loading state while fetching data
- ✅ Full CRUD support for tables and guests

**Key Additions:**
```typescript
// React Query integration
const seatingQuery = useQuery<{ tables: Table[]; guests: Guest[] }>({
  queryKey: ['/api/couple/venue/seating', sessionToken],
  enabled: !!sessionToken,
  queryFn: async () => { /* fetch from API */ },
});

// State management
const [seatingTables, setSeatingTables] = useState<Table[]>([]);
const [seatingGuests, setSeatingGuests] = useState<Guest[]>([]);

// Handlers
const handleSeatingTablesChange = (tables: Table[]) => { /* update */ };
const handleSeatingGuestsChange = (guests: Guest[]) => { /* update */ };
const persistSeating = async (tables, guests) => { /* save to API */ };
```

**UI/UX:**
- Interactive table positioning (drag-and-drop)
- Guest assignment modal
- Capacity tracking with visual indicators
- Real-time persistence to server

### 3. **VendorVenueScreen** (Already Complete)

The vendor seating implementation was finalized with:
- ✅ Three-tab interface (Bookinger, Bord, Tidslinje)
- ✅ Interactive SeatingChart component
- ✅ React Query integration
- ✅ Real-time persistence
- ✅ Professional header with styling

## User Workflow

### For Couples:
1. **Open Planning Screen** → Tap "Lokale" (Venue)
2. **Navigate to Seating Tab** → Click "Bord" tab
3. **Add Tables** → Plus button in side panel
4. **Assign Guests** → Long-press tables to open editor
5. **Position Tables** → Drag on canvas
6. **Auto-Save** → Changes persist automatically

### For Vendors:
Same workflow - tables and guests are seating-specific to vendor's venue

## Architecture

```
┌─────────────────────┐
│   VenueScreen       │ (Couple)
│  VendorVenueScreen  │ (Vendor)
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │ SeatingChart│ (Shared Component)
    └──────┬──────┘
           │
    ┌──────▼──────────────────┐
    │   React Query            │
    │   (Cache + Sync)         │
    └──────┬──────────────────┘
           │
    ┌──────▼──────────────────┐
    │   API Endpoints          │
    │   /api/{couple|vendor}   │
    │   /venue/seating         │
    └──────┬──────────────────┘
           │
    ┌──────▼──────────────────┐
    │  AppSettings Table       │
    │  (Key-Value Store)       │
    └─────────────────────────┘
```

## Data Model

**Storage Structure:**
```json
{
  "tables": [
    {
      "id": "table1",
      "name": "Bord 1",
      "shape": "round",
      "seats": 10,
      "x": 50,
      "y": 50,
      "assignedGuests": ["Anna", "Jonas"]
    }
  ],
  "guests": [
    {
      "id": "guest1",
      "name": "Anna",
      "tableId": "table1"
    }
  ]
}
```

**Database:**
- Table: `appSettings`
- Keys: `couple_venue_seating_{coupleId}`, `vendor_venue_seating_{vendorId}`
- Values: JSON-serialized seating data

## Testing

### Manual Testing:
```bash
# Get couple's seating
curl -X GET http://localhost:5000/api/couple/venue/seating \
  -H "Authorization: Bearer <COUPLE_TOKEN>"

# Save couple's seating
curl -X POST http://localhost:5000/api/couple/venue/seating \
  -H "Authorization: Bearer <COUPLE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"tables": [...], "guests": [...]}'

# Same for vendors at /api/vendor/venue/seating
```

### In-App Testing:
1. **Couple:** Planning → Lokale → Bord tab
2. **Vendor:** VendorVenueScreen → Bord tab
3. Add tables, assign guests
4. Verify persistence (refresh and check data returns)

## Feature Parity

Both Couple and Vendor seating implementations now have **100% feature parity**:

| Feature | Couple | Vendor |
|---------|--------|--------|
| Add tables | ✅ | ✅ |
| Edit tables | ✅ | ✅ |
| Delete tables | ✅ | ✅ |
| Drag tables | ✅ | ✅ |
| Assign guests | ✅ | ✅ |
| Capacity tracking | ✅ | ✅ |
| Real-time persistence | ✅ | ✅ |
| React Query caching | ✅ | ✅ |
| Haptics feedback | ✅ | ✅ |
| Tab navigation | ✅ | ✅ |

## Future Enhancements

### Phase 2 - Database Migration:
When ready to migrate from appSettings to Drizzle tables:
```sql
CREATE TABLE couple_venue_seating (
  id BIGSERIAL PRIMARY KEY,
  couple_id BIGINT REFERENCES couples(id) ON DELETE CASCADE,
  tables JSONB NOT NULL DEFAULT '[]',
  guests JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(couple_id)
);

CREATE TABLE vendor_venue_seating (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT REFERENCES vendors(id) ON DELETE CASCADE,
  tables JSONB NOT NULL DEFAULT '[]',
  guests JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(vendor_id)
);
```

### Phase 3 - Enhanced Features:
- Table capacity warnings
- Guest dietary preferences display
- Multiple floor plans
- Template seating arrangements
- Collaboration/sharing with venue
- Export to PDF/image
- Integration with guest list for auto-population

## Files Modified

1. **server/routes.ts** - Added couple/vendor seating endpoints
2. **client/screens/VenueScreen.tsx** - Integrated SeatingChart component
3. **client/screens/VendorVenueScreen.tsx** - Already completed in previous phase
4. **client/components/SeatingChart.tsx** - Existing shared component

## Notes

- ✅ No database schema changes required (uses appSettings)
- ✅ Fully backward compatible
- ✅ TypeScript type-safe
- ✅ Error handling implemented
- ✅ Ready for production deployment
- ✅ Offline support via React Query caching
