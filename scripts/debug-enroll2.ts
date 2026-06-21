import 'dotenv/config';

const API_KEY = process.env.INSTANTLY_API_KEY!;
const CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID!;
const BASE = 'https://api.instantly.ai/api/v2';

async function probe(method: string, path: string, body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  console.log(`${method} ${path} → ${res.status}: ${text.slice(0, 200)}`);
}

async function main() {
  const testEmail = `enroll-test-${Date.now()}@gmail.com`;
  console.log('Test email:', testEmail);

  // Step 1: create lead without campaign_id first
  console.log('\n=== Step 1: Create lead (no campaign_id) ===');
  const createRes = await fetch(`${BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      email: testEmail,
      first_name: 'Enroll',
      last_name: 'Test',
      company_name: 'Test Co',
      custom_variables: { subject_1: 'test', body_1: 'test body' },
    }),
  });
  const created = await createRes.json();
  console.log('Created lead id:', created.id, 'status:', createRes.status);

  // Step 2: try various enrollment endpoints
  console.log('\n=== Step 2: Probe enrollment endpoints ===');
  await probe('POST', `/campaign/${CAMPAIGN_ID}/leads`, { leads: [{ email: testEmail }] });
  await probe('POST', `/lead/add`, { campaign_id: CAMPAIGN_ID, email: testEmail });
  await probe('POST', `/campaigns/${CAMPAIGN_ID}/leads/add`, { emails: [testEmail] });
  await probe('PATCH', `/campaigns/${CAMPAIGN_ID}`, { lead_emails: [testEmail] });

  if (created.id) {
    await probe('PATCH', `/leads/${created.id}`, {
      campaign_id: CAMPAIGN_ID,
      status: 0,
    });
  }
}

main().catch(console.error);
