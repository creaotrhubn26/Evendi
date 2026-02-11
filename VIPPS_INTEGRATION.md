# Vipps Recurring - Implementasjonsguide for Evendi

## Official Vipps Resources

**Brand Guidelines & Components:**
https://brand.vippsmobilepay.com/document/61#/branding/online

**Checkout Button Component:**
- Web: `<vipps-mobilepay-button>` component
- Script: https://checkout.vipps.no/checkout-button/v1/vipps-checkout-button.js

**On-Site Messaging Badge:**
- Web: `<vipps-mobilepay-badge>` component  
- Script: https://checkout.vipps.no/on-site-messaging/v1/vipps-osm.js

## Valg av Vipps-løsning

### ✅ Vipps Recurring (Faste avtaler)
**Dette er riktig løsning for Evendi's abonnementssystem.**

**Fordeler:**
- 🔄 Automatisk månedlig trekk
- 📱 Kunden administrerer abonnement i Vipps-appen
- 🔁 Automatic retry ved betalingsfeil
- ⏸️ Pause/gjenoppta/kanseller funksjoner
- 💳 Ingen kortnummer - alt håndteres via Vipps

**Hvordan det funker:**
1. Vendor klikker "Start abonnement"
2. Redirects til Vipps (app eller web)
3. Vendor godkjenner fast avtale (agreement)
4. Første betaling trekkes umiddelbart
5. Månedlige trekk skjer automatisk
6. Status oppdateres via webhooks

---

## Vipps Design Guidelines

### Offisielle retningslinjer

Vipps har **strenge** designretningslinjer som **må** følges:

#### 1. **Farge**
```css
Vipps Orange: #FF5B24
Hvit bakgrunn på logo
```

#### 2. **Knapp-design**
- Orange bakgrunn (#FF5B24)
- Hvit tekst
- Vipps-logo i hvit boks
- Tekst: "Betal med Vipps" eller "Start abonnement"
- Avrundede hjørner (4-8px radius)

#### 3. **Logo**
- **MÅ** lastes fra Vipps CDN eller offisielle assets
- Skal **ikke** modifiseres eller re-kreeres
- Hvit logo på orange bakgrunn ELLER orange logo på hvit bakgrunn

#### 4. **Tekst**
Godkjente formuleringer:
- ✅ "Betal med Vipps"
- ✅ "Start abonnement med Vipps"
- ✅ "Fortsett med Vipps"
- ❌ "Vipps-betaling" (feil)
- ❌ "Pay with Vipps" (engelsk - kun om hele appen er engelsk)

---

## Implementasjon

### Backend API Setup

#### 1. **Credentials (fra Vipps Developer Portal)**
```bash
# .env
VIPPS_CLIENT_ID=your-client-id
VIPPS_CLIENT_SECRET=your-client-secret
VIPPS_SUBSCRIPTION_KEY=your-subscription-key
VIPPS_MERCHANT_SERIAL_NUMBER=your-msn

# Test vs Production
VIPPS_ENV=test  # eller 'production'
```

#### 2. **API Base URLs**
```typescript
const VIPPS_BASE_URL = process.env.VIPPS_ENV === 'production'
  ? 'https://api.vipps.no'
  : 'https://apitest.vipps.no';
```

#### 3. **Create Agreement Endpoint**
```typescript
// server/routes.ts
app.post("/api/subscription/vipps/create-agreement", async (req, res) => {
  const vendorId = await checkVendorAuth(req, res);
  if (!vendorId) return;

  const { subscriptionId } = req.body;

  // Get subscription and tier details
  const [subscription] = await db.select()
    .from(vendorSubscriptions)
    .innerJoin(subscriptionTiers, eq(vendorSubscriptions.tierId, subscriptionTiers.id))
    .where(eq(vendorSubscriptions.id, subscriptionId));

  // Get Vipps access token
  const tokenResponse = await fetch(`${VIPPS_BASE_URL}/accesstoken/get`, {
    method: 'POST',
    headers: {
      'client_id': process.env.VIPPS_CLIENT_ID,
      'client_secret': process.env.VIPPS_CLIENT_SECRET,
      'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY,
    },
  });
  
  const { access_token } = await tokenResponse.json();

  // Create recurring agreement
  const agreementResponse = await fetch(
    `${VIPPS_BASE_URL}/recurring/v2/agreements`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantAgreementUrl: `https://evendi.no/vendor/subscription/agreement/${subscriptionId}`,
        merchantRedirectUrl: `https://evendi.no/vendor/subscription/callback`,
        phoneNumber: subscription.vendor.phone, // Optional
        interval: 'MONTH',
        intervalCount: 1,
        isApp: false, // Set to true if using in-app redirect
        pricing: {
          type: 'LEGACY',
          amount: subscription.tier.priceNok * 100, // Øre (cents)
          currency: 'NOK',
        },
        productDescription: `${subscription.tier.displayName} - Evendi Vendor`,
        productName: subscription.tier.displayName,
      }),
    }
  );

  const agreementData = await agreementResponse.json();

  // Store agreement ID in database
  await db.update(vendorSubscriptions)
    .set({ 
      vippsAgreementId: agreementData.agreementId,
      updatedAt: new Date(),
    })
    .where(eq(vendorSubscriptions.id, subscriptionId));

  res.json({
    agreementId: agreementData.agreementId,
    vippsConfirmationUrl: agreementData.vippsConfirmationUrl,
  });
});
```

#### 4. **Webhook Handler**
```typescript
app.post("/api/subscription/vipps/webhook", async (req, res) => {
  // Vipps sends webhooks for agreement and charge events
  const { event, agreementId, chargeId, status } = req.body;

  if (event === 'AGREEMENT_ACTIVATED') {
    // Update subscription to active
    await db.update(vendorSubscriptions)
      .set({ 
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(vendorSubscriptions.vippsAgreementId, agreementId));
  }

  if (event === 'CHARGE_FAILED') {
    // Handle failed payment
    await db.update(vendorSubscriptions)
      .set({ 
        status: 'past_due',
        updatedAt: new Date(),
      })
      .where(eq(vendorSubscriptions.vippsAgreementId, agreementId));

    // Send notification to vendor
  }

  res.status(200).send('OK');
});
```

#### 5. **Create Monthly Charge (Cron Job)**
```typescript
// Run monthly to create charges for all active agreements
app.post("/api/admin/subscriptions/create-monthly-charges", async (req, res) => {
  if (!checkAdminAuth(req, res)) return;

  const activeSubscriptions = await db.select()
    .from(vendorSubscriptions)
    .innerJoin(subscriptionTiers, eq(vendorSubscriptions.tierId, subscriptionTiers.id))
    .where(eq(vendorSubscriptions.status, 'active'));

  for (const sub of activeSubscriptions) {
    // Get Vipps access token
    const tokenResponse = await fetch(`${VIPPS_BASE_URL}/accesstoken/get`, {
      method: 'POST',
      headers: {
        'client_id': process.env.VIPPS_CLIENT_ID,
        'client_secret': process.env.VIPPS_CLIENT_SECRET,
        'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY,
      },
    });
    
    const { access_token } = await tokenResponse.json();

    // Create charge
    const now = new Date();
    const dueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days

    await fetch(
      `${VIPPS_BASE_URL}/recurring/v2/agreements/${sub.vippsAgreementId}/charges`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json',
          'Idempotency-Key': `${sub.id}-${now.toISOString()}`,
        },
        body: JSON.stringify({
          amount: sub.tier.priceNok * 100,
          currency: 'NOK',
          description: `${sub.tier.displayName} - ${now.toLocaleDateString('no-NO', { month: 'long', year: 'numeric' })}`,
          due: dueDate.toISOString(),
          retryDays: 5,
        }),
      }
    );
  }

  res.json({ success: true });
});
```

---

### Frontend Implementation

#### Frontend Implementation

#### React Native (Expo) - Current Implementation

For React Native/Expo apps, vi kan ikke bruke web components direkte. Isteden bruker vi:

1. **Custom branded button** (allerede implementert)
   - Vipps-farget knapp (#FF5B24)
   - Offisiell Vipps MobilePay logo
   - Navigerer til betalingsside

2. **Deep linking til Vipps**
   ```typescript
   const handleVippsPayment = async () => {
     try {
       const response = await fetch("/api/subscription/vipps/initiate", {
         method: "POST",
         headers: {
           Authorization: `Bearer ${vendorToken}`,
         },
         body: JSON.stringify({ subscriptionId }),
       });
       
       const { vippsUrl } = await response.json();
       
       // Open Vipps app or web
       await Linking.openURL(vippsUrl);
     } catch (error) {
       Alert.alert("Feil", error.message);
     }
   };
   ```

#### Web Version (If Needed)

Hvis du lager en web-versjon (via `expo export --platform web`), kan du bruke Vipps' offisielle web components:

```html
<!-- Add to HTML head -->
<script
  async
  type="text/javascript"
  src="https://checkout.vipps.no/checkout-button/v1/vipps-checkout-button.js"
></script>

<script
  async
  type="text/javascript"
  src="https://checkout.vipps.no/on-site-messaging/v1/vipps-osm.js"
></script>

<!-- Add to body where payment is -->
<vipps-mobilepay-button
  brand="vipps"
  language="no"
  rounded="true"
  verb="pay"
  branded="true"
  data-order-id="order-123">
</vipps-mobilepay-button>

<!-- Optional: Badge for messaging -->
<vipps-mobilepay-badge
  brand="vipps"
  language="no"
  variant="gray">
</vipps-mobilepay-badge>
```

### Current Implementation (VendorPaymentScreen.tsx)
```tsx
// Vipps-branded button following guidelines
<Pressable
  style={styles.vippsButton} // Orange #FF5B24
  onPress={handleVippsPayment}
>
  <View style={styles.vippsButtonContent}>
    <View style={styles.vippsLogoContainer}>
      {/* White box with Vipps logo */}
      <ThemedText style={styles.vippsLogoText}>vipps</ThemedText>
    </View>
    <ThemedText style={styles.vippsButtonText}>
      Start abonnement
    </ThemedText>
  </View>
</Pressable>
```

#### Improved with Real Logo
```tsx
// Add Vipps logo to assets/images/vipps-logo.png
// Download from: https://www.vipps.no/developer/design-guidelines/

<View style={styles.vippsLogoContainer}>
  <Image 
    source={require('@/assets/images/vipps-logo.png')}
    style={{ width: 60, height: 20 }}
    resizeMode="contain"
  />
</View>
```

---

## Database Schema Tillegg

```sql
ALTER TABLE vendor_subscriptions
ADD COLUMN vipps_agreement_id TEXT,
ADD COLUMN last_charge_date TIMESTAMP,
ADD COLUMN next_charge_date TIMESTAMP;
```

---

## Vipps Brand Guidelines Compliance

### Farger
- **Primary Orange:** `#FF5B24` ✅
- **Accent Blue:** `#5A78FF` (for secondary)

### Knapp Design
- ✅ Orange bakgrunn (#FF5B24)
- ✅ Hvit tekst (kontrast minimum WCAG AA)
- ✅ Offisiell Vipps MobilePay logo
- ✅ Avrundede hjørner (8px)
- ✅ Minimum padding rundt logo
- ✅ Skygge for dybde

### Logo
- ✅ Bruker offisiell SVG: `VippsMobilePay_Logo_Primary_RGB_Black.svg`
- ✅ Vises i hvit container
- ✅ Ikke modifisert eller re-skapt
- ✅ Respektive minimum størrelse

### Tekst
Godkjente formuleringer:
- ✅ "Start abonnement" (Vipps)
- ✅ "Reaktiver abonnement" 
- ✅ "Sikker betaling med Vipps Recurring"

### Spacing & Clear Space
- ✅ Minimum 16px gap mellom elementer
- ✅ 14px padding rundt logo
- ✅ Konsistent med Vipps brand guidelines

---
Vipps har et test-miljø med test-brukere:

**Test Phone Numbers:**
- 40000000 - 49999999 (godkjenner alle betalinger)

**Test MSN:**
Du får en test Merchant Serial Number fra Vipps Developer Portal

**Testing Flow:**
1. Start agreement i test-modus
2. Bruk test-telefonnummer
3. Godkjenn i Vipps test-app eller web
4. Verifiser webhook mottas
5. Verifiser subscription aktiveres

---

## Ressurser

### Offisielle Vipps-lenker

**Developer Portal:**
https://developer.vippsmobilepay.com/

**Recurring API Docs:**
https://developer.vippsmobilepay.com/docs/APIs/recurring-api/

**Design Guidelines:**
https://developer.vippsmobilepay.com/docs/design-guidelines/vipps-design-guidelines/

**Logo Assets:**
https://developer.vippsmobilepay.com/docs/design-guidelines/vipps-design-guidelines/#vipps-logo

**Test App:**
https://developer.vippsmobilepay.com/docs/test-environment/

---

## Vipps vs Alternativer

| Feature | Vipps Recurring | Stripe | Paddle |
|---------|----------------|--------|--------|
| Norsk marked | ✅ Dominerer | ⚠️ Mindre utbredt | ⚠️ Mindre utbredt |
| Mobilbetaling | ✅ Optimalt | ❌ Krever kort | ❌ Krever kort |
| Automatisk trekk | ✅ Native | ✅ God | ✅ God |
| Kundeopplevelse | ✅ Kjent/trygt | ⚠️ Internasjonal | ⚠️ Internasjonal |
| Integrasjon | ⚠️ Middels | ✅ Enkel | ✅ Veldig enkel |
| Avgifter | ~2.5% | 2.9% + 2kr | 5% + mva |
| Norsk support | ✅ | ❌ | ❌ |

**Konklusjon:** For norske B2B-kunder (vendors) er Vipps det beste valget. De kjenner det, stoler på det, og har det allerede installert.

---

## Neste Steg - Implementasjonsplan

### 1. Registrering hos Vipps (1-2 uker)
- [ ] Registrer firma hos Vipps
- [ ] Få Merchant Serial Number (MSN)
- [ ] Få API credentials (test + prod)
- [ ] Verifiser test-tilgang

### 2. Backend Implementation (2-3 dager)
- [ ] Legg til credentials i .env
- [ ] Implementer token-henting
- [ ] Implementer create agreement endpoint
- [ ] Implementer webhook handler
- [ ] Implementer monthly charge cron
- [ ] Test med Vipps test-miljø

### 3. Frontend Implementation (1 dag)
- [ ] Last ned Vipps logo-assets
- [ ] Implementer Vipps-branded button
- [ ] Håndter redirect til/fra Vipps
- [ ] Vise success/error meldinger
- [ ] Test med test-brukere

### 4. Database (1 time)
- [ ] Migrer vipps_agreement_id felt
- [ ] Migrer charge date felter
- [ ] Test queries

### 5. Testing (2 dager)
- [ ] Test full flow med test-bruker
- [ ] Test webhook delivery
- [ ] Test failed payments
- [ ] Test agreement cancellation
- [ ] Load testing

### 6. Produksjon (1 dag)
- [ ] Bytt til prod credentials
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Monitor første betalinger
- [ ] Verifiser webhooks funker

**Total tid:** Ca. 1-2 uker + Vipps godkjenning

---

## Kostnader

**Vipps Recurring:**
- Oppsett: 0 kr (self-service)
- Månedsavgift: 0-500 kr (avhenger av volum)
- Transaksjon: ~2.5% av beløp
- Minimum: 1 kr per transaksjon

**Eksempel (50 vendors à 499 kr/mnd):**
- Månedlig omsetning: 24,950 kr
- Vipps-avgift (2.5%): ~625 kr
- Netto: 24,325 kr

---

*Denne guiden gir deg alt du trenger for å implementere Vipps Recurring i Evendi. Følg retningslinjene nøye for best brukeropplevelse og compliance med Vipps' krav.*
