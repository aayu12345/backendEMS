const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_L1ecnWH2mJQT@ep-mute-cell-ahksssaf.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  await client.connect();
  console.log("Connected to DB, dropping tables...");
  
  await client.query('DROP TABLE IF EXISTS attendance_records CASCADE');
  await client.query('DROP TABLE IF EXISTS employees CASCADE');
  await client.query('DROP TABLE IF EXISTS departments CASCADE');
  await client.query('DROP TABLE IF EXISTS users CASCADE');
  await client.query('DROP TABLE IF EXISTS payroll CASCADE');
  
  console.log("All tables dropped successfully.");
  await client.end();
}

run().catch(console.error);
