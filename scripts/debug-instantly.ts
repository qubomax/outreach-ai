import 'dotenv/config';

const API_KEY = process.env.INSTANTLY_API_KEY!;
const CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID!;
const BASE = 'https://api.instantly.ai/api/v2';

async function listLeads() {
  console.log('\n=== Listing leads in campaign ===');
  const res = await fetch(`${BASE}/leads/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ campaign_id: CAMPAIGN_ID, limit: 10 }),
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}

async function pushTestLead() {
  console.log('\n=== Pushing test lead ===');
  const res = await fetch(`${BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      campaign_id: CAMPAIGN_ID,
      email: 'test-debug@example.com',
      first_name: 'Debug',
      last_name: 'Test',
      company_name: 'Test Co',
      personalization: 'Hello from debug script',
      custom_variables: {
        subject_1: 'Test Subject 1',
        body_1: 'Test Body 1',
        subject_2: 'Test Subject 2',
        body_2: 'Test Body 2',
        subject_3: 'Test Subject 3',
        body_3: 'Test Body 3',
      },
      skip_if_in_workspace: false,
      skip_if_in_campaign: false,
      skip_if_in_list: false,
    }),
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}

async function main() {
  console.log('Campaign ID:', CAMPAIGN_ID);
  await listLeads();
  await pushTestLead();
  await listLeads();
}

main().catch(console.error);
