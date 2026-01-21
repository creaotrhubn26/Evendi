import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

(async () => {
  try {
    const result = await pool.query(
      'UPDATE couple_profiles SET password = $1 WHERE email = $2 RETURNING id, email, display_name',
      ['$2a$10$sEUO4HSek/MLNN7th5kTEO0J2itD1IPCjvGBsgeDyT1vAd2ZHQRxO', 'danielqazi89@gmail.com']
    );
    if (result.rows.length > 0) {
      console.log('Successfully updated couple password');
      console.log('Email:', result.rows[0].email);
      console.log('Display Name:', result.rows[0].display_name);
    } else {
      console.log('No couple found with that email');
    }
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
})();
