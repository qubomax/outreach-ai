import 'dotenv/config';

const API_KEY = process.env.INSTANTLY_API_KEY!;
const CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID!;
const BASE = 'https://api.instantly.ai/api/v2';

async function listAllLists() {
  console.log('\n=== All lead lists in workspace ===');
  const res = await fetch(`${BASE}/lists?limit=20`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

async function tryAddToList(listId: string) {
  console.log(`\n=== Trying POST /lists/${listId}/leads ===`);
  const res = await fetch(`${BASE}/lists/${listId}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      leads: [{ email: `list-test-${Date.now()}@example.com`, first_name: 'List', last_name: 'Test' }],
    }),
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}

async function tryAlternativeLeadEndpoints() {
  const testEmail = `alt-test-${Date.now()}@example.com`;

  // Try v1 endpoint
  console.log('\n=== Trying v1 lead endpoint ===');
  const res1 = await fetch(`https://api.instantly.ai/api/v1/lead/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: API_KEY,
      campaign_id: CAMPAIGN_ID,
      email: testEmail,
      first_name: 'Alt',
      last_name: 'Test',
      custom_variables: { subject_1: 'test', body_1: 'test body' },
    }),
  });
  console.log('v1 Status:', res1.status);
  const text1 = await res1.text();
  console.log('v1 Response:', text1);
}

async function main() {
  await listAllLists();
  await tryAlternativeLeadEndpoints();
}

main().catch(console.error);
