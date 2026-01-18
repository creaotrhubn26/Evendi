import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { vendors, vendorCategories } from '../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

async function createDemoVendor() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client);

  // Get the first category (usually "Fotograf")
  const categories = await db.select().from(vendorCategories).limit(1);
  if (categories.length === 0) {
    console.error('No vendor categories found. Run the server first to initialize categories.');
    await client.end();
    return;
  }

  const categoryId = categories[0].id;
  const password = 'norwed2024'; // Demo password
  const hashedPassword = hashPassword(password);

  const [vendor] = await db.insert(vendors).values({
    email: 'contact@norwedfilm.no',
    password: hashedPassword,
    businessName: 'Norwedfilm',
    organizationNumber: '929123456',
    categoryId: categoryId,
    description: 'Vi skaper tidløse bryllupsfilmer som fanger de ekte øyeblikkene og følelsene fra deres store dag. Profesjonell videografi for bryllup i hele Norge.',
    location: 'Oslo',
    phone: '+47 900 00 000',
    website: 'https://norwedfilm.no',
    priceRange: '20000-50000',
    status: 'approved', // Pre-approved for demo
  }).onConflictDoNothing().returning();

  console.log('Norwedfilm vendor created:', vendor || 'Already exists');
  console.log('\nLogin credentials:');
  console.log('Email: contact@norwedfilm.no');
  console.log('Password: norwed2024');
  
  await client.end();
}

createDemoVendor().catch(console.error);
