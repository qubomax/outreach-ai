import 'dotenv/config';

const API_KEY = process.env.INSTANTLY_API_KEY!;

async function main() {
  const res = await fetch('https://api.instantly.ai/api/v2/campaigns?limit=20', {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const data = await res.json();
  for (const c of data.items ?? []) {
    console.log(`${c.name} | ${c.status} | id: ${c.id}`);
  }
}

main().catch(console.error);
