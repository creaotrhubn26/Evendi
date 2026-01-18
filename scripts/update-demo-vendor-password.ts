import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { vendors } from '../shared/schema';
import { eq } from 'drizzle-orm';
import bcryptjs from 'bcryptjs';

async function updateDemoVendorPassword() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client);

  const password = 'demo1234';
  const salt = bcryptjs.genSaltSync(10);
  const hashedPassword = bcryptjs.hashSync(password, salt);

  const result = await db
    .update(vendors)
    .set({ password: hashedPassword })
    .where(eq(vendors.email, 'demo.vendor@wedflow.no'))
    .returning();

  console.log('Demo vendor password updated:', result.length > 0 ? 'Success' : 'Not found');
  
  await client.end();
}

updateDemoVendorPassword().catch(console.error);
