import 'dotenv/config';

const API_KEY = process.env.INSTANTLY_API_KEY!;
const CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID!;
const BASE = 'https://api.instantly.ai/api/v2';

async function findLead(email: string) {
  // Search using campaign_id since that's what worked before
  const res = await fetch(`${BASE}/leads/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ campaign_id: CAMPAIGN_ID, limit: 50 }),
  });
  const data = await res.json();
  return (data.items ?? []).find((l: any) => l.email === email);
}

async function tryPatchLead(leadId: string) {
  console.log('\n=== PATCH lead with campaign_id ===');
  const res = await fetch(`${BASE}/leads/${leadId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ campaign_id: CAMPAIGN_ID }),
  });
  console.log('Status:', res.status);
  console.log('Response:', await res.text());
}

async function tryVerifyEndpoints() {
  const paths = [
    `/campaigns/${CAMPAIGN_ID}/lead`,
    `/campaigns/${CAMPAIGN_ID}/leads/bulk`,
    `/lead-campaigns`,
    `/campaigns/${CAMPAIGN_ID}/add-leads`,
  ];

  for (const path of paths) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({ email: 'probe@example.com' }),
    });
    console.log(`POST ${path} → ${res.status}`);
  }
}

async function main() {
  console.log('=== Probing alternative enroll endpoints ===');
  await tryVerifyEndpoints();

  console.log('\n=== Finding fresh test lead ===');
  // Look through all leads in the campaign list to find one of ours
  const res = await fetch(`${BASE}/leads/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ campaign_id: CAMPAIGN_ID, limit: 50 }),
  });
  const data = await res.json();
  const items = data.items ?? [];
  console.log(`Found ${items.length} leads in campaign list`);

  const freshLead = items.find((l: any) => l.email?.startsWith('fresh-test-'));
  if (freshLead) {
    console.log('Fresh lead found, id:', freshLead.id);
    await tryPatchLead(freshLead.id);
  } else {
    console.log('Fresh lead not in campaign list. Checking next page...');
    // Try with next_starting_after if there are more
    if (data.next_starting_after) {
      const res2 = await fetch(`${BASE}/leads/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({ campaign_id: CAMPAIGN_ID, limit: 50, starting_after: data.next_starting_after }),
      });
      const data2 = await res2.json();
      const fresh2 = (data2.items ?? []).find((l: any) => l.email?.startsWith('fresh-test-'));
      if (fresh2) {
        console.log('Fresh lead on page 2, id:', fresh2.id);
        await tryPatchLead(fresh2.id);
      } else {
        console.log('Fresh test lead not found on any page - confirms it was NOT enrolled in this campaign');
      }
    }
  }
}

main().catch(console.error);
