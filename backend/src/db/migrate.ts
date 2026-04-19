import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pool from './index';

const runMigration = async () => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  console.log('Running database migration...');
  const client = await pool.connect();
  try {
    await client.query(schema);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

runMigration().catch((err) => {
  console.error(err);
  process.exit(1);
});
