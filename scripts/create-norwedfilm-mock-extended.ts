import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { 
  vendors, 
  vendorProducts,
  vendorOffers,
  vendorOfferItems,
  conversations,
  messages,
  coupleProfiles,
  coupleVendorContracts,
  vendorReviews,
} from '../shared/schema';
import { eq } from 'drizzle-orm';

const VENDOR_ID = 'a1af85b7-4e59-4598-985f-cd3fbb2a070c';

// Wedding images for products
const productImages = [
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
  'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=800',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
];

async function createExtendedMockData() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client);

  console.log('Creating extended mock data for Norwedfilm...\n');

  // 1. Create more products
  console.log('🎬 Creating additional products...');
  
  const newProducts = [
    {
      vendorId: VENDOR_ID,
      title: 'Forlovelsesfilm',
      description: 'Fortell deres kjærlighetshistorie med en vakker forlovelsesfilm. 2-3 minutter med romantiske scener fra deres favorittsted.',
      unitPrice: 8000,
      unitType: 'stk',
      imageUrl: productImages[0],
      categoryTag: 'Film',
    },
    {
      vendorId: VENDOR_ID,
      title: 'Gjestebok Video',
      description: 'Vi setter opp en videoboks der gjestene kan legge igjen hilsener. Alt redigeres sammen til en uforglemmelig gavefilm.',
      unitPrice: 6000,
      unitType: 'stk',
      imageUrl: productImages[1],
      categoryTag: 'Tillegg',
    },
    {
      vendorId: VENDOR_ID,
      title: 'USB-minnepinne',
      description: 'Alle filmene levert på en elegant USB-minnepinne i trekasse. Perfekt som gave eller for sikker oppbevaring.',
      unitPrice: 1500,
      unitType: 'stk',
      imageUrl: productImages[2],
      categoryTag: 'Tillegg',
    },
    {
      vendorId: VENDOR_ID,
      title: 'Ekstra timer filming',
      description: 'Utvid dekningsperioden med ekstra timer. Fanger forberedelser, cocktailtime eller afterparty.',
      unitPrice: 3500,
      unitType: 'time',
      imageUrl: productImages[3],
      categoryTag: 'Tillegg',
    },
    {
      vendorId: VENDOR_ID,
      title: 'Fotobok Design',
      description: 'Vi designer en eksklusiv fotobok med stillbilder fra filmen. 30 sider i premium kvalitet.',
      unitPrice: 4500,
      unitType: 'stk',
      imageUrl: productImages[4],
      categoryTag: 'Tillegg',
    },
    {
      vendorId: VENDOR_ID,
      title: 'Super 8 Effekt',
      description: 'Legg til nostalgisk Super 8 vintage-look på utvalgte deler av filmen. Tidløst og romantisk.',
      unitPrice: 2500,
      unitType: 'stk',
      imageUrl: productImages[5],
      categoryTag: 'Tillegg',
    },
  ];

  const insertedProducts: Array<{ id: string; title: string; unitPrice: number }> = [];
  
  for (const product of newProducts) {
    const [inserted] = await db.insert(vendorProducts).values(product).returning();
    insertedProducts.push({ id: inserted.id, title: product.title, unitPrice: product.unitPrice });
    console.log(`  ✓ Created: ${product.title} - ${product.unitPrice} NOK`);
  }

  // Get existing products for offers
  const existingProducts = await db.select().from(vendorProducts).where(eq(vendorProducts.vendorId, VENDOR_ID));
  console.log(`  Found ${existingProducts.length} total products`);

  // 2. Create test couple profiles for offers and reviews
  console.log('\n👫 Creating test couples...');
  
  const testCouples = [
    { email: 'emma.olsen@example.com', displayName: 'Emma & Lars', weddingDate: '2026-06-15', password: 'not-used' },
    { email: 'sofia.berg@example.com', displayName: 'Sofia & Anders', weddingDate: '2026-08-22', password: 'not-used' },
    { email: 'ida.hansen@example.com', displayName: 'Ida & Jonas', weddingDate: '2026-05-30', password: 'not-used' },
    { email: 'nora.nilsen@example.com', displayName: 'Nora & Henrik', weddingDate: '2025-09-10', password: 'not-used' },
    { email: 'maja.pedersen@example.com', displayName: 'Maja & Oscar', weddingDate: '2025-07-20', password: 'not-used' },
  ];

  const coupleIds: string[] = [];
  
  for (const couple of testCouples) {
    // Check if couple already exists
    const existing = await db.select().from(coupleProfiles).where(eq(coupleProfiles.email, couple.email));
    if (existing.length > 0) {
      coupleIds.push(existing[0].id);
      console.log(`  ⏭ Exists: ${couple.displayName}`);
    } else {
      const [inserted] = await db.insert(coupleProfiles).values(couple).returning();
      coupleIds.push(inserted.id);
      console.log(`  ✓ Created: ${couple.displayName}`);
    }
  }

  // 3. Create conversations and messages
  console.log('\n💬 Creating conversations and messages...');
  
  const conversationData = [
    {
      coupleIndex: 0, // Emma & Lars
      messages: [
        { senderType: 'couple', body: 'Hei! Vi så den vakre bryllupsfilmen deres på Instagram og lurer på priser for bryllup i juni?' },
        { senderType: 'vendor', body: 'Hei Emma og Lars! Så hyggelig å høre fra dere 😊 Vi har flere pakker tilgjengelig. Når er bryllupet deres?' },
        { senderType: 'couple', body: 'Bryllupet er 15. juni 2026 på Bygdøy. Vi tenker ca 80 gjester.' },
        { senderType: 'vendor', body: 'Så fint! Bygdøy er et fantastisk sted for filming. Jeg sender dere et tilbud med våre mest populære pakker.' },
        { senderType: 'couple', body: 'Tusen takk! Vi gleder oss til å se på det.' },
      ],
    },
    {
      coupleIndex: 1, // Sofia & Anders  
      messages: [
        { senderType: 'couple', body: 'Hallo! Har dere ledig kapasitet i august 2026?' },
        { senderType: 'vendor', body: 'Hei Sofia og Anders! Ja, vi har fortsatt noen datoer ledige i august. Hvilken dato har dere sett for dere?' },
        { senderType: 'couple', body: '22. august. Vi gifter oss på Holmenkollen.' },
        { senderType: 'vendor', body: 'Perfekt, den datoen er ledig! Holmenkollen er et av våre favorittsteder å filme - utsikten er bare fantastisk. Skal jeg sende over et tilbud?' },
        { senderType: 'couple', body: 'Ja takk! Vi er interessert i highlights film + drone.' },
        { senderType: 'vendor', body: 'Flott kombinasjon! Drone-opptak på Holmenkollen blir helt magisk. Sender tilbud i løpet av dagen.' },
      ],
    },
    {
      coupleIndex: 2, // Ida & Jonas
      messages: [
        { senderType: 'couple', body: 'Vi fikk anbefalt dere av venner som giftet seg i fjor. Veldig imponert over arbeidet deres!' },
        { senderType: 'vendor', body: 'Tusen takk, så hyggelig å høre! Hvem var det som anbefalte oss?' },
        { senderType: 'couple', body: 'Det var Mari og Thomas fra vinterbryllupet i januar.' },
        { senderType: 'vendor', body: 'Å, Mari og Thomas! De var så utrolig hyggelige å jobbe med. Hva kan vi hjelpe dere med?' },
      ],
    },
  ];

  for (const convData of conversationData) {
    const coupleId = coupleIds[convData.coupleIndex];
    
    // Create conversation
    const [conversation] = await db.insert(conversations).values({
      coupleId,
      vendorId: VENDOR_ID,
      status: 'active',
      vendorUnreadCount: convData.messages.filter(m => m.senderType === 'couple').length > 0 ? 1 : 0,
      coupleUnreadCount: convData.messages.filter(m => m.senderType === 'vendor').length > 0 ? 1 : 0,
    }).returning();
    
    console.log(`  ✓ Created conversation with ${testCouples[convData.coupleIndex].displayName}`);
    
    // Add messages with realistic timestamps
    const baseTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    for (let i = 0; i < convData.messages.length; i++) {
      const msg = convData.messages[i];
      const msgTime = new Date(baseTime + (i * 2 * 60 * 60 * 1000)); // 2 hours apart
      
      await db.insert(messages).values({
        conversationId: conversation.id,
        senderType: msg.senderType,
        senderId: msg.senderType === 'couple' ? coupleId : VENDOR_ID,
        body: msg.body,
        createdAt: msgTime,
        readAt: i < convData.messages.length - 1 ? msgTime : null, // Last message unread
      });
    }
  }

  // 4. Create offers (tilbud)
  console.log('\n📋 Creating offers...');
  
  const highlightsProduct = existingProducts.find(p => p.title === 'Highlights Film');
  const fullFilmProduct = existingProducts.find(p => p.title === 'Full Bryllupsfilm');
  const premiumProduct = existingProducts.find(p => p.title === 'Premium Pakke');
  const droneProduct = existingProducts.find(p => p.title === 'Drone-opptak');
  const sameDayProduct = existingProducts.find(p => p.title === 'Same Day Edit');

  const offersData = [
    {
      coupleId: coupleIds[0], // Emma & Lars
      title: 'Bryllupspakke - Standard',
      message: 'Hei Emma og Lars! Her er vårt tilbud for deres bryllup 15. juni. Pakken inkluderer highlights film og full bryllupsfilm med to fotografer.',
      status: 'pending',
      validUntil: new Date('2026-02-15'),
      items: [
        { productId: highlightsProduct?.id, title: 'Highlights Film', unitPrice: 15000, quantity: 1 },
        { productId: fullFilmProduct?.id, title: 'Full Bryllupsfilm', unitPrice: 25000, quantity: 1 },
      ],
    },
    {
      coupleId: coupleIds[1], // Sofia & Anders
      title: 'Bryllupspakke - Med drone',
      message: 'Hei Sofia og Anders! Som avtalt, her er tilbudet med highlights film og drone-opptak for bryllupet på Holmenkollen.',
      status: 'pending',
      validUntil: new Date('2026-03-01'),
      items: [
        { productId: highlightsProduct?.id, title: 'Highlights Film', unitPrice: 15000, quantity: 1 },
        { productId: droneProduct?.id, title: 'Drone-opptak', unitPrice: 5000, quantity: 1 },
      ],
    },
    {
      coupleId: coupleIds[3], // Nora & Henrik - accepted
      title: 'Premium Bryllupspakke',
      message: 'Gratulerer med valget! Vi gleder oss veldig til å dokumentere deres store dag.',
      status: 'accepted',
      acceptedAt: new Date('2025-06-01'),
      validUntil: new Date('2025-07-01'),
      items: [
        { productId: premiumProduct?.id, title: 'Premium Pakke', unitPrice: 45000, quantity: 1 },
        { productId: sameDayProduct?.id, title: 'Same Day Edit', unitPrice: 12000, quantity: 1 },
      ],
    },
    {
      coupleId: coupleIds[4], // Maja & Oscar - completed
      title: 'Komplett bryllupspakke',
      message: 'Takk for et fantastisk samarbeid! Filmen er nå klar.',
      status: 'accepted',
      acceptedAt: new Date('2025-04-15'),
      validUntil: new Date('2025-05-15'),
      items: [
        { productId: fullFilmProduct?.id, title: 'Full Bryllupsfilm', unitPrice: 25000, quantity: 1 },
        { productId: droneProduct?.id, title: 'Drone-opptak', unitPrice: 5000, quantity: 1 },
      ],
    },
  ];

  const offerIds: string[] = [];

  for (const offerData of offersData) {
    const totalAmount = offerData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    
    const [offer] = await db.insert(vendorOffers).values({
      vendorId: VENDOR_ID,
      coupleId: offerData.coupleId,
      title: offerData.title,
      message: offerData.message,
      status: offerData.status,
      totalAmount,
      currency: 'NOK',
      validUntil: offerData.validUntil,
      acceptedAt: offerData.acceptedAt,
    }).returning();
    
    offerIds.push(offer.id);
    console.log(`  ✓ Created: ${offerData.title} - ${totalAmount} NOK (${offerData.status})`);
    
    // Add offer items
    for (let i = 0; i < offerData.items.length; i++) {
      const item = offerData.items[i];
      await db.insert(vendorOfferItems).values({
        offerId: offer.id,
        productId: item.productId,
        title: item.title,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.unitPrice * item.quantity,
        sortOrder: i,
      });
    }
  }

  // 5. Create contracts for accepted offers
  console.log('\n📄 Creating contracts...');
  
  const contractsData = [
    { coupleId: coupleIds[3], offerId: offerIds[2], status: 'active', vendorRole: 'Videograf' },
    { coupleId: coupleIds[4], offerId: offerIds[3], status: 'completed', vendorRole: 'Videograf', completedAt: new Date('2025-08-01') },
  ];

  const contractIds: string[] = [];

  for (const contract of contractsData) {
    const [inserted] = await db.insert(coupleVendorContracts).values({
      vendorId: VENDOR_ID,
      ...contract,
    }).returning();
    contractIds.push(inserted.id);
    console.log(`  ✓ Created contract (${contract.status})`);
  }

  // 6. Create reviews (anmeldelser)
  console.log('\n⭐ Creating reviews...');
  
  const reviewsData = [
    {
      contractId: contractIds[1], // Maja & Oscar - completed contract
      coupleId: coupleIds[4],
      rating: 5,
      title: 'Fantastisk opplevelse fra start til slutt!',
      body: 'Norwedfilm overgikk alle våre forventninger! Andreas var utrolig profesjonell og diskret under hele bryllupet. Han fanget øyeblikk vi ikke engang visste skjedde. Filmen fikk oss til å gråte av glede. Anbefales på det varmeste!',
      isAnonymous: false,
      isApproved: true,
      approvedAt: new Date('2025-08-15'),
    },
    {
      contractId: contractIds[0], // Nora & Henrik - active contract (can still leave review)
      coupleId: coupleIds[3],
      rating: 5,
      title: 'Ekte kunstnere med kamera',
      body: 'Vi er så takknemlige for at vi valgte Norwedfilm. De forstod virkelig hva vi ønsket og leverte en film som perfekt fanger essensen av dagen vår. Kvaliteten er kinoverdig!',
      isAnonymous: false,
      isApproved: true,
      approvedAt: new Date('2025-10-01'),
    },
  ];

  for (const review of reviewsData) {
    await db.insert(vendorReviews).values({
      vendorId: VENDOR_ID,
      ...review,
    });
    console.log(`  ✓ Created review: "${review.title}" - ${review.rating}⭐`);
  }

  // Summary
  console.log('\n✅ Extended mock data created successfully!');
  console.log('\nNorwedfilm now has:');
  console.log(`  - ${newProducts.length} additional products (${existingProducts.length + newProducts.length} total)`);
  console.log(`  - ${conversationData.length} conversations with messages`);
  console.log(`  - ${offersData.length} offers (tilbud)`);
  console.log(`  - ${contractsData.length} contracts`);
  console.log(`  - ${reviewsData.length} reviews (anmeldelser)`);
  
  await client.end();
}

createExtendedMockData().catch(console.error);
