import 'dotenv/config';

const API_KEY = process.env.INSTANTLY_API_KEY!;
const CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID!;

async function main() {
  const testEmail = `fresh-test-${Date.now()}@example.com`;
  console.log('Pushing fresh lead:', testEmail);

  const res = await fetch('https://api.instantly.ai/api/v2/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      campaign_id: CAMPAIGN_ID,
      email: testEmail,
      first_name: 'Fresh',
      last_name: 'Test',
      company_name: 'Test Co',
      personalization: 'Hey Fresh, this is a test.',
      custom_variables: {
        subject_1: 'fresh test subject 1',
        body_1: 'fresh test body 1',
        subject_2: 'fresh test subject 2',
        body_2: 'fresh test body 2',
        subject_3: 'fresh test subject 3',
        body_3: 'fresh test body 3',
      },
      skip_if_in_workspace: false,
      skip_if_in_campaign: false,
      skip_if_in_list: false,
    }),
  });

  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));
  console.log('\nNow check the Leads tab in Instantly for campaign OutreachAI — Test Batch 2');
  console.log('Does', testEmail, 'appear there?');
}

main().catch(console.error);
