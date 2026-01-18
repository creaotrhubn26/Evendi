import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { 
  vendors, 
  inspirations, 
  inspirationMedia, 
  deliveries, 
  deliveryItems,
  vendorProducts 
} from '../shared/schema';
import { eq } from 'drizzle-orm';

const VENDOR_ID = 'a1af85b7-4e59-4598-985f-cd3fbb2a070c';

// Real wedding videography images from Unsplash
const weddingImages = {
  ceremony: [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200',
    'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200',
  ],
  reception: [
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200',
  ],
  couple: [
    'https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200',
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200',
    'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200',
  ],
  details: [
    'https://images.unsplash.com/photo-1522057306606-8d84afe86e0a?w=1200',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200',
    'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1200',
  ],
};

async function createMockData() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client);

  console.log('Creating mock data for Norwedfilm...\n');

  // 1. Create Showcases (Inspirations)
  console.log('📸 Creating showcases...');
  
  const showcases = [
    {
      vendorId: VENDOR_ID,
      categoryId: 'eaf6b2d3-683f-4031-a588-d12bc262c291', // Bryllupsbilder
      title: 'Romantisk bryllupsfilm - Sara & Erik',
      description: 'En vakker sommerdag på Holmenkollen ble rammen for Sara og Eriks bryllup. Vi fanget de magiske øyeblikkene fra vielsen i kapellet til den villeste dansen på festen.',
      coverImageUrl: weddingImages.ceremony[0],
      priceSummary: 'Fra 25.000 kr',
      priceMin: 25000,
      priceMax: 45000,
      currency: 'NOK',
      websiteUrl: 'https://norwedfilm.no/portfolio/sara-erik',
      inquiryEmail: 'contact@norwedfilm.no',
      ctaLabel: 'Se full film',
      ctaUrl: 'https://vimeo.com/norwedfilm/sara-erik',
      allowInquiryForm: true,
      status: 'approved',
    },
    {
      vendorId: VENDOR_ID,
      categoryId: 'be3e5706-8355-4172-af8a-ae353d96db07', // Lokaler
      title: 'Vintereventyr på Frognerseteren',
      description: 'Maria og Jons vinterbryllup var som hentet fra et eventyr. Snødekte trær, varme peisilden og en kjærlighetshistorie som rørte alle tilstede.',
      coverImageUrl: weddingImages.couple[0],
      priceSummary: 'Fra 30.000 kr',
      priceMin: 30000,
      priceMax: 55000,
      currency: 'NOK',
      websiteUrl: 'https://norwedfilm.no/portfolio/maria-jon',
      inquiryEmail: 'contact@norwedfilm.no',
      ctaLabel: 'Be om tilbud',
      allowInquiryForm: true,
      status: 'approved',
    },
    {
      vendorId: VENDOR_ID,
      categoryId: 'eaf6b2d3-683f-4031-a588-d12bc262c291', // Bryllupsbilder
      title: 'Sommerbryllup ved sjøen',
      description: 'Linnea og Magnus valgte en intim feiring ved familiens sommersted. Solnedgang over fjorden og lyden av bølger skapte den perfekte atmosfæren.',
      coverImageUrl: weddingImages.reception[0],
      priceSummary: 'Fra 22.000 kr',
      priceMin: 22000,
      priceMax: 40000,
      currency: 'NOK',
      websiteUrl: 'https://norwedfilm.no/portfolio/linnea-magnus',
      inquiryEmail: 'contact@norwedfilm.no',
      allowInquiryForm: true,
      status: 'approved',
    },
  ];

  for (const showcase of showcases) {
    const [inserted] = await db.insert(inspirations).values(showcase).returning();
    console.log(`  ✓ Created: ${showcase.title}`);
    
    // Add media to each showcase
    const mediaItems = [
      { inspirationId: inserted.id, type: 'image', url: weddingImages.ceremony[Math.floor(Math.random() * 3)], caption: 'Vielsen', sortOrder: 0 },
      { inspirationId: inserted.id, type: 'image', url: weddingImages.couple[Math.floor(Math.random() * 3)], caption: 'Brudeparet', sortOrder: 1 },
      { inspirationId: inserted.id, type: 'image', url: weddingImages.reception[Math.floor(Math.random() * 3)], caption: 'Festen', sortOrder: 2 },
      { inspirationId: inserted.id, type: 'image', url: weddingImages.details[Math.floor(Math.random() * 3)], caption: 'Detaljer', sortOrder: 3 },
    ];
    
    await db.insert(inspirationMedia).values(mediaItems);
  }

  // 2. Create Products
  console.log('\n🎬 Creating products...');
  
  const products = [
    {
      vendorId: VENDOR_ID,
      title: 'Highlights Film',
      description: 'En 3-5 minutters filmopplevelse som fanger de viktigste øyeblikkene fra dagen. Perfekt for å dele på sosiale medier og gjenoppleve magien.',
      unitPrice: 15000,
      unitType: 'stk',
      imageUrl: weddingImages.ceremony[1],
      categoryTag: 'Film',
    },
    {
      vendorId: VENDOR_ID,
      title: 'Full Bryllupsfilm',
      description: 'Komplett dokumentar av hele bryllupsdagen, fra forberedelser til siste dans. 20-40 minutter med alle de verdifulle øyeblikkene.',
      unitPrice: 25000,
      unitType: 'stk',
      imageUrl: weddingImages.reception[1],
      categoryTag: 'Film',
    },
    {
      vendorId: VENDOR_ID,
      title: 'Premium Pakke',
      description: 'Alt inkludert: Highlights film, full bryllupsfilm, drone-opptak, og eksklusive behind-the-scenes klipp. To fotografer hele dagen.',
      unitPrice: 45000,
      unitType: 'stk',
      imageUrl: weddingImages.couple[1],
      categoryTag: 'Pakke',
    },
    {
      vendorId: VENDOR_ID,
      title: 'Drone-opptak',
      description: 'Spektakulære luftopptak av lokalet og omgivelsene. Gir filmen et cinematisk preg og viser den vakre rammen for deres dag.',
      unitPrice: 5000,
      unitType: 'stk',
      imageUrl: weddingImages.details[0],
      categoryTag: 'Tillegg',
    },
    {
      vendorId: VENDOR_ID,
      title: 'Same Day Edit',
      description: 'Overrask gjestene med en 2-3 minutters film av dagen som vises under middagen. En uforglemmelig opplevelse for alle.',
      unitPrice: 12000,
      unitType: 'stk',
      imageUrl: weddingImages.ceremony[2],
      categoryTag: 'Tillegg',
    },
  ];

  for (const product of products) {
    await db.insert(vendorProducts).values(product);
    console.log(`  ✓ Created: ${product.title} - ${product.unitPrice} NOK`);
  }

  // 3. Create Deliveries (completed projects)
  console.log('\n📦 Creating deliveries...');
  
  const deliveryData = [
    {
      vendorId: VENDOR_ID,
      coupleName: 'Kristine & Thomas',
      coupleEmail: 'kristine.t@example.com',
      title: 'Bryllupsfilm August 2025',
      description: 'Vakker sommerbryllup på Bygdøy. Film klar for nedlasting.',
      weddingDate: '2025-08-15',
      status: 'active',
      items: [
        { type: 'image', label: 'Forside bilde', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800', description: 'Hovedbilde fra bryllupet' },
        { type: 'image', label: 'Vielsen', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800', description: 'Fra seremonien' },
        { type: 'image', label: 'Brudepar', url: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800', description: 'Portrett av brudeparet' },
        { type: 'video', label: 'Highlights Film (4K)', url: 'https://vimeo.com/example1', description: '4 minutter highlights' },
        { type: 'video', label: 'Full Film (4K)', url: 'https://vimeo.com/example2', description: '35 minutter komplett film' },
        { type: 'gallery', label: 'Stillbilder fra filmen', url: 'https://photos.google.com/example', description: '50 utvalgte stillbilder' },
        { type: 'download', label: 'Last ned alle filer', url: 'https://drive.google.com/example', description: 'ZIP-fil med alt materiale' },
      ],
    },
    {
      vendorId: VENDOR_ID,
      coupleName: 'Ingrid & Markus',
      coupleEmail: 'ingrid.m@example.com',
      title: 'Vinterbryllup Januar 2026',
      description: 'Romantisk vinterbryllup i Nordmarka. Under redigering.',
      weddingDate: '2026-01-10',
      status: 'active',
      items: [
        { type: 'image', label: 'Teaser bilde', url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800', description: 'Forsmak på filmen' },
        { type: 'image', label: 'Vinterlandskap', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', description: 'Vakker vinterbakgrunn' },
        { type: 'video', label: 'Teaser (sniktitt)', url: 'https://vimeo.com/example3', description: '1 minutt teaser' },
        { type: 'website', label: 'Prosjektstatus', url: 'https://norwedfilm.no/status/ingrid-markus', description: 'Se fremdrift' },
      ],
    },
  ];

  for (const delivery of deliveryData) {
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { items, ...deliveryValues } = delivery;
    
    const [insertedDelivery] = await db.insert(deliveries).values({
      ...deliveryValues,
      accessCode,
    }).returning();
    
    console.log(`  ✓ Created: ${delivery.coupleName} - Kode: ${accessCode}`);
    
    // Add delivery items
    for (let i = 0; i < items.length; i++) {
      await db.insert(deliveryItems).values({
        deliveryId: insertedDelivery.id,
        ...items[i],
        sortOrder: i,
      });
    }
  }

  console.log('\n✅ Mock data created successfully!');
  console.log('\nNorwedfilm now has:');
  console.log('  - 3 showcases with images');
  console.log('  - 5 products/packages');
  console.log('  - 2 client deliveries');
  
  await client.end();
}

createMockData().catch(console.error);
