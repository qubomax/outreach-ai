import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon("postgresql://neondb_owner:npg_bj7ZkBM0cUtN@ep-tiny-darkness-ai85nuje.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require");
  const res = await sql`UPDATE email_sequences SET push_status = 'pending' WHERE user_id = 'user_3FbhqwPrPGCBTyt6JtJ63J7VZgu' RETURNING id, step_number, push_status`;
  console.log('Updated:', res);
}
main();
