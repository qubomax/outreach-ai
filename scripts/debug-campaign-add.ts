import 'dotenv/config';

const API_KEY = process.env.INSTANTLY_API_KEY!;
const CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID!;
const BASE = 'https://api.instantly.ai/api/v2';

async function getCampaignDetails() {
  console.log('\n=== Campaign details ===');
  const res = await fetch(`${BASE}/campaigns/${CAMPAIGN_ID}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

async function tryAddLeadToCampaign() {
  console.log('\n=== Trying POST /campaigns/{id}/leads ===');
  const res = await fetch(`${BASE}/campaigns/${CAMPAIGN_ID}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      leads: [{ email: 'test-debug@example.com' }],
    }),
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}

async function tryMoveLeadToCampaign() {
  console.log('\n=== Trying PATCH lead to add campaign ===');
  // First get the lead ID
  const listRes = await fetch(`${BASE}/leads/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ email: 'test-debug@example.com', limit: 1 }),
  });
  const listData = await listRes.json();
  const lead = listData.items?.[0];
  if (!lead) { console.log('Lead not found'); return; }
  console.log('Lead ID:', lead.id, 'current campaign/list:', lead.list_id);

  const res = await fetch(`${BASE}/leads/${lead.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ campaign_id: CAMPAIGN_ID }),
  });
  const text = await res.text();
  console.log('PATCH status:', res.status);
  console.log('PATCH response:', text);
}

async function main() {
  await getCampaignDetails();
  await tryAddLeadToCampaign();
  await tryMoveLeadToCampaign();
}

main().catch(console.error);
