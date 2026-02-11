# Admin Preview-Modus

## Oversikt

Admin Preview-modus er en funksjonalitet som lar administratorer se og teste Evendi-appen fra brudepar eller leverandør-perspektivet. Dette gjør det enklere å:

- Forstå brukeropplevelsen
- Finne og reprodusere bugs
- Verifisere at innholdfiltre og tillatelser fungerer
- Teste nye funksjoner før lansering
- Gjennomgå UI/UX fra brukerperspektivet

## Hvordan bruke

### 1. Fra Admin-dashbordet
1. Logg inn som admin
2. I admin-dashbordet (AdminDashboardScreen) finner du en ny meny-knapp: **"Preview-modus"** (eye-ikon)
3. Klikk på den for å åpne AdminPreviewScreen

### 2. I Preview-skjermen
Du ser to alternativer:

#### Brudepar-visning
- **Ikon:** ❤️ (hjerte)
- **Farge:** Rosa (#FF6B9D)
- **Hva du ser:** 
  - Eksempel-data fra brudepar
  - Antall tilgjengelige leverandører
  - Antall inspirasjon-foto tilgjengelig
- **Knapper:**
  - "Last data" - Henter eksempel-data for brudepar-rollen
  - "Gå inn" - Navigerer til full brudepar-app (Main-navigasjonen)

#### Leverandør-visning
- **Ikon:** 💼 (veske)
- **Farge:** Blå (#4A90E2)
- **Hva du ser:**
  - Eksempel-data fra en leverandør
  - Antall inspirasjon-post
  - Antall aktive tilbud
  - Antall meldinger
- **Knapper:**
  - "Last data" - Henter eksempel-data for leverandør-rollen
  - "Gå inn" - Navigerer til full leverandør-app (VendorDashboard)

## Backend-Endepunkter

### GET /api/admin/preview/couple
Henter eksempel-data og statistikk for brudepar-perspektivet.

**Response:**
```json
{
  "role": "couple",
  "description": "Brudepar-visning",
  "context": {
    "sampleCouple": { ...coupleData },
    "availableVendors": 150,
    "availableInspirations": 2400
  },
  "tips": [...]
}
```

### GET /api/admin/preview/vendor
Henter eksempel-data og statistikk for leverandør-perspektivet.

**Response:**
```json
{
  "role": "vendor",
  "description": "Leverandør-visning",
  "context": {
    "sampleVendor": { ...vendorData },
    "vendorInspirations": 45,
    "vendorOffers": 12,
    "vendorMessages": 8
  },
  "tips": [...]
}
```

## Brukstilfeller

### 1. Testing av nye funksjoner
```
Scenario: Du har implementert en ny "Leverandør-søk"-funksjon
1. Åpne Admin Preview
2. Klikk "Gå inn" på Brudepar-visning
3. Test søk-funksjonen fra brudepar-perspektivet
4. Logg ut for å returnere til admin
```

### 2. Reprodusering av bruker-rapporterte bugs
```
Scenario: Brudepar rapporterer at de ikke ser inspirasjon-bilder
1. Åpne Admin Preview
2. Last data for Brudepar
3. Se hvor mange inspirasjon-bilder som er tilgjengelig
4. Gå inn i Brudepar-visning og sjekk bildevisningen
5. Identifiser problemet
```

### 3. Verifisering av abonnement-restriksjoner
```
Scenario: Du har oppdatert subscription_tiers med nye feature-flags
1. Åpne Admin Preview for Leverandør
2. Se statistikk over vendor-funksjoner
3. Logg inn som leverandør med ulik tier
4. Verifiser at feature flags blir iverksatt korrekt
```

### 4. Gjennomgang av UI/UX
```
Scenario: Design team ønsker å reviewe brukeropplevelsen
1. Åpne Admin Preview
2. Gå inn i Brudepar-visning
3. Gjennomgå brukerflyt og interface
4. Gi feedback på design og usability
```

## Navigasjon

### Hvis du "Gå inn" i preview-modus

**Brudepar-visning:**
- Du blir navigert til Main (brudepar-dashbordet)
- Du får full tilgang til alle brudepar-funksjoner
- Du kan navigere normalt gjennom appen

**Leverandør-visning:**
- Du blir navigert til VendorDashboard (leverandør-dashbordet)
- Du får full tilgang til alle leverandør-funksjoner
- Du kan navigere normalt gjennom appen

**For å returnere til Admin:**
- Logg ut fra appen (Logout-knapp)
- Du blir returnert til login-skjermen
- Logg inn igjen med admin-nøkkel

## Tips

1. **Data-lasting:** "Last data" gir deg informasjon, "Gå inn" gir deg full app-tilgang
2. **Rask testing:** Hvis du bare vil se statistikk, klikk "Last data" uten å gå inn
3. **Realtime testing:** Gå inn i preview-modus for å teste faktiske brukerflyt
4. **Samme bruker:** Preview bruker eksempel-data, ikke dine egne bruker-kontoer
5. **Admin-kontekst:** Når du logger ut fra preview, må du logge inn som admin igjen

## Feilsøking

**"Kunne ikke laste preview-visning"**
- Sjekk at serveren kjører
- Verifiser at admin-nøkkelen er korrekt
- Sjekk nettverksforbindelsen

**"Feil ved navigering"**
- Logg ut og inn igjen som admin
- Prøv å åpne Admin Preview på nytt
- Sjekk app-logger for detaljer

**Data vises ikke når jeg "Laster data"**
- Det kan være at det ikke finnes noen eksempel-data i databasen
- Opprett test-data via andre admin-skjermer (leverandør, brudepar, etc.)
- Data vil da dukke opp i preview

## Implementeringsdetaljer

### Frontend (client/)
- **Screen:** `AdminPreviewScreen.tsx`
- **Navigation:** Registrert i `RootStackNavigator.tsx` som "AdminPreview"
- **Menu:** Lagt til i `AdminDashboardScreen.tsx` adminSections-array

### Backend (server/)
- **Routes:** Lagt til i `routes.ts` som `/api/admin/preview/couple` og `/api/admin/preview/vendor`
- **Auth:** Bruker eksisterende `checkAdminAuth()` for sikkerhet
- **Data:** Henter eksempel-data fra database og aggregerer statistikk

## Fremtids-forbedringer

- [ ] Eksport av bruker-aktivitets-logs for analyse
- [ ] Mulighet for å bytte bruker-konto innen preview
- [ ] Snapshot av statistikk over tid
- [ ] A/B testing av UI-endringer
- [ ] Performance-profiling fra bruker-perspektivet
