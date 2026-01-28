# Couple Seating Chart Integration Guide

## Overview
Couples can use the interactive SeatingChart component in their VenueScreen's "Bord" (Seating) tab to plan and manage table layouts for their wedding.

## Current State
- **VenueScreen.tsx** has a seating tab that navigates to a "TableSeating" screen
- **SeatingChart.tsx** component is already available and used by vendors
- **Endpoints**: Couple venue endpoints mirror vendor endpoints with `/api/couple/venue/*` pattern

## Integration Steps

### 1. Add Endpoints for Couple Seating (Server)

**File**: `server/routes.ts`

Add these endpoints after the couple venue endpoints (around line 4300-4350):

```typescript
// Couple seating endpoints
app.get("/api/couple/venue/seating", async (req: Request, res: Response) => {
  const coupleId = await checkCoupleAuth(req, res);
  if (!coupleId) return;
  try {
    const settings = await getAppSettings(coupleId);
    const seating = settings?.coupleVenueSeating || { tables: [], guests: [] };
    return res.json(seating);
  } catch (error) {
    console.error("Error fetching couple seating:", error);
    res.status(500).json({ error: "Kunne ikke hente seating" });
  }
});

app.post("/api/couple/venue/seating", async (req: Request, res: Response) => {
  const coupleId = await checkCoupleAuth(req, res);
  if (!coupleId) return;
  try {
    const payload = req.body || { tables: [], guests: [] };
    await setAppSettings(coupleId, { coupleVenueSeating: payload });
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error saving couple seating:", error);
    res.status(500).json({ error: "Kunne ikke lagre seating" });
  }
});
```

### 2. Update VenueScreen Seating Tab

**File**: `client/screens/VenueScreen.tsx`

Replace the `renderSeatingTab()` function to use the interactive SeatingChart:

```typescript
import { SeatingChart, Table, Guest } from '@/components/SeatingChart';

// Add state for seating
const [seatingTables, setSeatingTables] = useState<Table[]>([]);
const [seatingGuests, setSeatingGuests] = useState<Guest[]>([]);

// Add seating query
const seatingQuery = useQuery<{ tables: Table[]; guests: Guest[] }>({
  queryKey: ["/api/couple/venue/seating", coupleId],
  enabled: !!coupleId,
  queryFn: async () => {
    const res = await fetch(new URL("/api/couple/venue/seating", getApiUrl()).toString(), {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    if (!res.ok) return { tables: [], guests: [] };
    return res.json();
  },
  onSuccess: (data) => {
    setSeatingTables(data.tables || []);
    setSeatingGuests(data.guests || []);
  },
});

// Handlers for seating changes
const handleSeatingTablesChange = (tables: Table[]) => {
  setSeatingTables(tables);
  persistSeating(tables, seatingGuests);
};

const handleSeatingGuestsChange = (guests: Guest[]) => {
  setSeatingGuests(guests);
  persistSeating(seatingTables, guests);
};

const persistSeating = async (tables: Table[], guests: Guest[]) => {
  if (!sessionToken) return;
  const payload = { tables, guests };
  queryClient.setQueryData(["/api/couple/venue/seating", coupleId], payload);
  
  await fetch(new URL("/api/couple/venue/seating", getApiUrl()).toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

// Update render function
const renderSeatingTab = () => (
  <View style={{ flex: 1 }}>
    {seatingQuery.isLoading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    ) : (
      <SeatingChart
        tables={seatingTables}
        guests={seatingGuests}
        onTablesChange={handleSeatingTablesChange}
        onGuestsChange={handleSeatingGuestsChange}
        editable={true}
      />
    )}
  </View>
);
```

### 3. Link Guest List to Seating

To auto-populate guests from the couple's guest list:

```typescript
// Query guest list
const guestListQuery = useQuery<Guest[]>({
  queryKey: ["/api/couple/guests"],
  enabled: !!coupleId,
  queryFn: async () => {
    const res = await fetch(new URL("/api/couple/guests", getApiUrl()).toString(), {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    if (!res.ok) return [];
    return res.json();
  },
});

// Use in seating
<SeatingChart
  tables={seatingTables}
  guests={guestListQuery.data || seatingGuests}
  onTablesChange={handleSeatingTablesChange}
  onGuestsChange={handleSeatingGuestsChange}
  editable={true}
/>
```

## Features Couples Get

✅ **Interactive Table Editor**
- Drag and drop tables on canvas
- Add/edit table names, capacity, shape, and notes
- Delete tables easily

✅ **Guest Assignment**
- Assign guests to specific tables
- See capacity usage (visual indicators)
- Track unassigned guests

✅ **Table Shapes**
- Round tables (standard)
- Rectangular tables
- Long tables (for buffet or high-top seating)

✅ **Real-time Sync**
- Changes save immediately to server
- React Query handles caching
- Offline support via appSettings backfill

✅ **Visual Feedback**
- Haptics for interactions
- Color indicators for full tables
- Animated transitions

## User Workflow

1. **Open Planning Screen** → Navigate to "Lokale" (Venue)
2. **Click Seating Tab** → See interactive chart
3. **Add Tables** → Plus button in side panel
4. **Assign Guests** → Long-press tables to open editor
5. **Drag Tables** → Position on canvas
6. **Save Automatically** → All changes persist

## Testing the Integration

```bash
# Test couple seating endpoints
curl -s -X POST http://localhost:5000/api/couple/venue/seating \
  -H "Authorization: Bearer <COUPLE_SESSION_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
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
      {"id": "guest1", "name": "Anna"},
      {"id": "guest2", "name": "Jonas"}
    ]
  }'

# Get seating
curl -s http://localhost:5000/api/couple/venue/seating \
  -H "Authorization: Bearer <COUPLE_SESSION_TOKEN>"
```

## Database Migration (Optional Future)

When migrating from appSettings to Drizzle tables, add:

```sql
CREATE TABLE couple_venue_seating (
  id BIGSERIAL PRIMARY KEY,
  couple_id BIGINT REFERENCES couples(id) ON DELETE CASCADE,
  tables JSONB NOT NULL DEFAULT '[]',
  guests JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_couple_venue_seating ON couple_venue_seating(couple_id);
```

Then backfill with:
```typescript
const backfillCoupleSeating = async (coupleId: string) => {
  const settings = await getAppSettings(coupleId);
  if (settings?.coupleVenueSeating) {
    await db.insert(coupleVenueSeating)
      .values({
        coupleId: parseInt(coupleId),
        tables: settings.coupleVenueSeating.tables || [],
        guests: settings.coupleVenueSeating.guests || [],
      })
      .onConflictDoUpdate({ ... });
  }
};
```

## Summary

Couples now have **the same interactive seating chart as vendors**, allowing them to:
- Plan table layouts during planning phase
- Share layouts with vendors
- Modify seating arrangements post-booking
- Track guest assignments in real-time
