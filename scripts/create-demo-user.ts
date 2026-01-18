import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { coupleProfiles } from '../shared/schema';

async function createDemoUser() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client);

  const [couple] = await db.insert(coupleProfiles).values({
    email: 'qazifotoreel@gmail.com',
    displayName: 'Demo Brudepar'
  }).onConflictDoNothing().returning();

  console.log('Demo couple created:', couple || 'Already exists');
  await client.end();
}

createDemoUser().catch(console.error);
