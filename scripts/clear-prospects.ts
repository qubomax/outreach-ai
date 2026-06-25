import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const { db } = await import('../src/lib/db');
  const { prospects, emailSequences, campaigns } = await import('../src/lib/db/schema');
  await db.delete(emailSequences);
  await db.delete(campaigns);
  await db.delete(prospects);
  // Never delete users — clears plans, billing, and API keys
  console.log('Cleared all tables.');
  process.exit(0);
}

main();
