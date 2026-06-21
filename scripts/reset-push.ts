import { db } from '../src/lib/db';
import { emailSequences } from '../src/lib/db/schema';

async function main() {
  const rows = await db.update(emailSequences).set({ pushStatus: 'pending' }).returning({ id: emailSequences.id });
  console.log('Updated', rows.length, 'sequences to pending');
}

main().then(() => process.exit(0)).catch(console.error);
