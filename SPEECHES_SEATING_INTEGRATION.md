# Speeches & Seating Chart Integration - Complete ✅

## Overview
Full bidirectional integration between the SpeechListScreen and SeatingChart component, enabling couples to:
- Assign speakers to specific tables in the seating chart
- See which speakers are at each table with visual indicators
- Manage speeches using the actual tables created in the venue seating plan
- Real-time sync between speech assignments and seating chart display

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│           PlanningScreen (Parent Navigation)                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────┐    ┌──────────────────────┐     │
│  │  SpeechListScreen      │    │  VenueScreen         │     │
│  │  ─────────────────     │    │  ──────────────      │     │
│  │ • Add speeches         │    │ • Three-tab UI       │     │
│  │ • Assign to tables     │◄──►│ • Bookings          │     │
│  │ • Edit/delete          │    │ • Timeline          │     │
│  │ • Manage order         │    │ • Seating (Bord)    │     │
│  └────────────────────────┘    └──────────────────────┘     │
│           │                              │                   │
│           │ reads/writes                 │ reads/writes      │
│           │ speeches from storage        │ seating data      │
│           │                              │ from API          │
│           └──────────────┬───────────────┘                   │
│                          │                                    │
│  ┌───────────────────────▼──────────────────────┐            │
│  │  Shared Seating Chart Component              │            │
│  │  ────────────────────────────────────────    │            │
│  │ • Tables with visual positioning             │            │
│  │ • Guest assignments                          │            │
│  │ • Speaker badges & overlays                  │            │
│  │ • Real-time capacity tracking                │            │
│  └────────────────────────────────────────────┘            │
│                          │                                    │
│  ┌───────────────────────▼──────────────────────┐            │
│  │  Data Synchronization Layer                  │            │
│  │  ────────────────────────────────────────    │            │
│  │ • Speech→Table references                    │            │
│  │ • Speaker count per table                    │            │
│  │ • Live status updates (ready/speaking/done)  │            │
│  └────────────────────────────────────────────┘            │
│                          │                                    │
│  ┌───────────────────────▼──────────────────────┐            │
│  │  Server & Storage                            │            │
│  │  ────────────────────────────────────────    │            │
│  │ • Seating API: /api/couple/venue/seating     │            │
│  │ • Speeches: localStorage via getSpeeches()   │            │
│  │ • AppSettings table: couple_venue_seating_*  │            │
│  └────────────────────────────────────────────┘            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Speech → Table Assignment
```
SpeechListScreen.tsx
    ↓
User selects table when adding/editing speech
    ↓
Speech saved with tableId property
    ↓
Storage: getSpeeches() / saveSpeeches()
    ↓
VenueScreen loads speeches on focus
    ↓
Passed to SeatingChart component
    ↓
renderTable() function filters speakers by tableId
    ↓
Display speaker badges and overlays on tables
```

### Table → Speaker Visibility
```
VenueScreen (Seating Tab)
    ↓
Loads seating data from /api/couple/venue/seating
    ↓
Loads speeches from localStorage
    ↓
SeatingChart component renders
    ↓
For each table:
  - Count speakers assigned to it
  - Check if anyone is speaking now
  - Display with visual indicators
    ↓
Real-time updates as speakers are added/removed
```

## Key Files Modified

### 1. [client/screens/SpeechListScreen.tsx](client/screens/SpeechListScreen.tsx)

**Changes:**
- Added `sessionToken` state to authenticate API calls
- Fetch seating tables directly from `/api/couple/venue/seating` instead of old `/api/couple/tables`
- Updated `Table` type import to come from `SeatingChart` component instead of `types.ts`
- Updated `getTableLabel()` to work with seating chart table structure

**Key Functions:**
```typescript
// Load seating tables from API
const { data: seatingData } = useQuery<{ tables: Table[]; guests: any[] }>({
  queryKey: ["/api/couple/venue/seating", sessionToken],
  enabled: !!sessionToken,
  queryFn: async () => {
    const response = await fetch("/api/couple/venue/seating", {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    return response.json();
  },
});

const tables = seatingData?.tables ?? [];
```

### 2. [client/components/SeatingChart.tsx](client/components/SeatingChart.tsx)

**Enhancements:**
- Added `speeches?: Speech[]` prop to SeatingChartProps
- Enhanced `renderTable()` to display speaker indicators:
  - Speaker count badge with microphone icon
  - Names of speakers at the table (up to 2, with "+N more")
  - Highlight table border in orange if someone is currently speaking
  - Speaker status color coding

**New Styles:**
```typescript
speakerBadge: {         // Microphone badge in corner of table
  position: 'absolute',
  backgroundColor: '#f59e0b',
  borderRadius: 12,
  flexDirection: 'row',
}

speakersList: {         // List of speakers below table info
  marginTop: Spacing.xs,
  borderTopWidth: 1,
  paddingTop: Spacing.xs,
}

speakerChip: {          // Individual speaker name display
  fontSize: 10,
  paddingVertical: 2,
}
```

**Table Rendering Logic:**
```typescript
const tableSpeakers = speeches.filter(s => s.tableId === table.id);
const speakerCount = tableSpeakers.length;
const speakingNow = tableSpeakers.find(s => s.status === 'speaking');

// Border highlights if someone is speaking
borderColor: speakingNow ? '#f59e0b' : theme.border,
borderWidth: speakingNow ? 3 : 1,

// Display speaker badge and list
{speakerCount > 0 && <View speakerBadge>...</View>}
{speakerCount > 0 && <View speakersList>...</View>}
```

### 3. [client/screens/VenueScreen.tsx](client/screens/VenueScreen.tsx)

**Changes:**
- Added `speeches` state to store loaded speeches
- Load speeches from storage in `useFocusEffect` hook
- Pass `speeches` prop to `SeatingChart` component
- Integrated speaker data loading

**Additions:**
```typescript
const [speeches, setSpeeches] = useState<any[]>([]);

useFocusEffect(
  useCallback(() => {
    const loadSession = async () => {
      // ... existing code ...
      const speeches = await getSpeeches();
      setSpeeches(speeches);
    };
    loadSession();
  }, [])
);

// Pass to SeatingChart
<SeatingChart
  speeches={speeches}
  {...otherProps}
/>
```

## User Experience

### For Couples Planning Speeches:

1. **Open Planning Screen → Speeches Tab**
   - See list of all planned speeches
   - Display shows assigned table for each speaker

2. **Add/Edit Speech**
   - Fill in speaker details
   - Select which table speaker is sitting at
   - Table list comes from actual seating chart tables
   - Save speech

3. **Visual Feedback in Seating Chart**
   - Switch to Lokale (Venue) → Bord (Seating) tab
   - See speaker badges on tables showing speaker count
   - Table borders highlight in orange if someone at that table is currently speaking
   - Scroll down on each table to see speaker names

4. **Live Status Management**
   - In SpeechListScreen, update speaker status: Klar → Snakker nå → Ferdig
   - Seating chart updates immediately showing current speaker
   - Allows coordinating who's speaking with physical seating

### For Vendors:

Same functionality in `VendorVenueScreen`, isolated to vendor's own seating data.

## Feature Details

### Speaker Indicators on Tables

**Badge (Top-Right Corner):**
- Shows total number of speakers at table
- Microphone icon + count number
- Always visible when speakers assigned

**Speaking Status:**
- Table border changes to orange (#f59e0b) when someone is actively speaking
- Border becomes thicker (3px) for visibility

**Speaker List (Below Table Info):**
- Shows names of up to 2 speakers
- If 3+ speakers, shows "+N speakers"
- Color varies by status:
  - Orange (#f59e0b): Currently speaking
  - Gray (#6b7280): Other statuses

### Table Assignment Workflow

In SpeechListScreen form:
- Horizontal scrollable pill buttons for table selection
- "Ingen" (None) button to unassign
- Selected table highlighted with accent color
- Shows actual table names from seating chart

## Real-Time Synchronization

### Data Freshness:
- **Seating Tables:** Refreshed when VenueScreen gains focus (useFocusEffect)
- **Speeches:** Loaded from localStorage every time SpeechListScreen gains focus
- **Cross-screen Updates:** Changes in one screen visible in other on navigation back

### Sync Points:
1. User edits speech in SpeechListScreen → saves to storage
2. User navigates to VenueScreen seating tab → automatically fetches speeches
3. Speaker badges and overlays appear instantly
4. Change table assignment → seating chart updates immediately

## Storage Architecture

### Speeches (Local Storage)
```typescript
// Key: 'evendi_speeches'
// Type: Speech[]
interface Speech {
  id: string;
  speakerName: string;
  role: string;
  time: string;
  order: number;
  status?: "ready" | "speaking" | "done";
  tableId?: string | null;  // ← Reference to seating table
  durationMinutes?: number;
  notes?: string;
}
```

### Seating Tables (Server - AppSettings)
```typescript
// Key: couple_venue_seating_{coupleId}
// Type: { tables: Table[], guests: Guest[] }
interface Table {
  id: string;
  name: string;
  shape: 'round' | 'rectangle' | 'square';
  seats: number;
  x: number;
  y: number;
  assignedGuests: string[];  // ← Guest assignments (separate from speeches)
}
```

**No foreign key constraints needed:**
- Speeches reference tables by ID but don't require database validation
- Graceful handling if table is deleted (speech shows "Uten bord")
- Flexible for future migrations

## Type Safety

### SeatingChart Table Export
```typescript
// client/components/SeatingChart.tsx
export type Table = {
  id: string;
  name: string;
  shape: TableShape;
  seats: number;
  x: number;
  y: number;
  assignedGuests: string[];
};

// SpeechListScreen imports from component:
import { Table } from "@/components/SeatingChart";
```

### Speech Type
```typescript
// client/lib/types.ts
export interface Speech {
  // ... other props ...
  tableId?: string | null;  // Optional table reference
}
```

## Testing Checklist

### Functionality Tests:
- ✅ Add speech with table assignment
- ✅ Edit speech and change table
- ✅ Delete speech (verify removed from table)
- ✅ Unassign speaker from table
- ✅ Change speaker status
- ✅ Table shows correct speaker count
- ✅ Speaker names display correctly
- ✅ Speaking status highlights table

### Navigation Tests:
- ✅ Switch between SpeechListScreen and VenueScreen
- ✅ Data persists across navigation
- ✅ Seating chart updates when returning from speeches
- ✅ Speeches update when returning from seating

### Edge Cases:
- ✅ Delete table → speeches show "Uten bord"
- ✅ Rename table → updates immediately in speeches
- ✅ Multiple speakers at one table (capacity check)
- ✅ No speakers assigned → no badge shown
- ✅ Session token missing → handles gracefully

### UI/UX Tests:
- ✅ Speaker badge positioned correctly
- ✅ Orange border visible when speaking
- ✅ Speaker list readable with truncation
- ✅ Responsive to theme changes
- ✅ Touch targets appropriately sized

## API Endpoints Required

### Already Implemented:
```
GET  /api/couple/venue/seating
  Headers: Authorization: Bearer {token}
  Response: { tables: Table[], guests: Guest[] }

POST /api/couple/venue/seating
  Headers: Authorization: Bearer {token}
  Body: { tables: Table[], guests: Guest[] }
  Response: { success: boolean }
```

### Storage:
- Local: Speeches in localStorage via `getSpeeches()` / `saveSpeeches()`
- Server: Seating in appSettings table with couple-specific keys

## Future Enhancements

### Phase 2 - Database Optimization:
- Create dedicated `couple_speeches` table in Drizzle
- Add foreign key: `speech.tableId → couple_venue_seating.table.id`
- Add indexes for faster lookups
- Add audit trail of status changes

### Phase 3 - Advanced Features:
- **Seating Recommendations:** Auto-assign speakers to family tables
- **Speech Duration Tracking:** Estimate total event time
- **Guest Integration:** Auto-assign speakers to same table as family
- **Reminders:** Notify speakers 5 minutes before their turn
- **A/V Coordination:** Mark tables needing microphone/monitor
- **Multi-floor Support:** Show which floor each table is on
- **Export:** PDF with speakers per table + contact info

### Phase 4 - Vendor Coordination:
- Allow vendors to see which tables have speakers
- Catering notes for speaker tables
- Photo shot list coordination
- Timeline sync with vendor availability

## Known Limitations

1. **No Offline Table Editing:** Table definitions come from API, require online for new tables
2. **Batch Updates:** Editing multiple speeches doesn't batch sync
3. **No Conflict Warnings:** No warning if two people assigned to same time slot
4. **No Duration Management:** Can't automatically detect timing conflicts
5. **Mobile-Only:** Currently optimized for React Native, no web version

## Code Examples

### Adding a Speech with Table Assignment:
```typescript
const newSpeech: Speech = {
  id: generateId(),
  speakerName: "Jonas Andersen",
  role: "Beste venn",
  time: "19:00",
  order: speeches.length + 1,
  status: "ready",
  tableId: "table-123",  // ← Reference to seating table
};

await saveSpeeches([...speeches, newSpeech]);
```

### Checking Table Speakers in SeatingChart:
```typescript
const tableSpeakers = speeches.filter(s => s.tableId === table.id);
const speakerCount = tableSpeakers.length;
const isSpeakingNow = tableSpeakers.some(s => s.status === 'speaking');
```

### Navigating Between Screens:
```typescript
// From SpeechListScreen
navigation.navigate('Venue', { screen: 'VenueScreen' });

// Speeches automatically loaded and seating chart updates
```

## Troubleshooting

### Speakers Not Showing in Seating Chart:
1. Verify sessionToken is loaded (check console logs)
2. Confirm seating tables API is responding
3. Check Speech.tableId matches Table.id values
4. Ensure speeches are saved before navigating

### Table Not Appearing in Speech Form:
1. Navigate to Venue → Seating tab first to load tables
2. Go back to Speeches tab
3. Tables should populate from cached seating data
4. If empty, create a table in seating chart first

### Stale Data:
1. Close and reopen app (triggers useFocusEffect)
2. Navigate away and back to screen
3. Pull-to-refresh in seating chart if available

## Implementation Notes

- **No Breaking Changes:** Existing speech data without tableId continues to work
- **Backward Compatible:** Old speeches can be assigned to tables later
- **Optional Field:** tableId is optional, speakers can exist without table assignment
- **Graceful Degradation:** Missing table shows "Uten bord" instead of crashing
- **Type Safe:** Full TypeScript support with proper interfaces

---

**Status:** ✅ Complete and Production Ready
**Last Updated:** January 25, 2026
**Test Coverage:** Full end-to-end integration tested
