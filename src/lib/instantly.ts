const INSTANTLY_BASE = 'https://api.instantly.ai/api/v2';

export async function pushLeadToCampaign(
  apiKey: string,
  campaignId: string,
  lead: {
    email: string;
    firstName: string;
    lastName: string;
    company: string;
    personalization: string;
  }
): Promise<void> {
  const res = await fetch(`${INSTANTLY_BASE}/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      campaign_id: campaignId,
      email: lead.email,
      first_name: lead.firstName,
      last_name: lead.lastName,
      company_name: lead.company,
      personalization: lead.personalization,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instantly push failed: ${res.status} ${text}`);
  }
}
