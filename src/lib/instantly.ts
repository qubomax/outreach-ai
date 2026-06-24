const INSTANTLY_BASE = 'https://api.instantly.ai/api/v2';

export interface CampaignStats {
  emailsSent: number;
  openCount: number;
  openRate: number;
  replyCount: number;
  replyRate: number;
}

export async function getCampaignStats(
  apiKey: string,
  campaignId: string
): Promise<CampaignStats | null> {
  try {
    const startDate = '2024-01-01';
    const endDate = new Date().toISOString().split('T')[0];
    const res = await fetch(
      `${INSTANTLY_BASE}/analytics/campaign/summary?campaign_id=${campaignId}&start_date=${startDate}&end_date=${endDate}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const emailsSent = data.emails_sent ?? 0;
    const openCount = data.open_count ?? 0;
    const replyCount = data.reply_count ?? 0;
    return {
      emailsSent,
      openCount,
      openRate: emailsSent > 0 ? Math.round((openCount / emailsSent) * 100) : 0,
      replyCount,
      replyRate: emailsSent > 0 ? Math.round((replyCount / emailsSent) * 100) : 0,
    };
  } catch {
    return null;
  }
}

export interface EmailStep {
  subject: string;
  body: string;
  delayDays: number;
}

// Sets the campaign sequence template to use per-lead custom variables.
// Call once before pushing leads — safe to call multiple times (idempotent intent).
export async function setupCampaignSequence(
  apiKey: string,
  campaignId: string,
  steps: EmailStep[]
): Promise<void> {
  const res = await fetch(`${INSTANTLY_BASE}/campaigns/${campaignId}/sequences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      steps: steps.map((s, i) => ({
        type: 'email',
        delay: s.delayDays,
        variants: [
          {
            subject: `{{subject_${i + 1}}}`,
            body: `{{body_${i + 1}}}`,
          },
        ],
      })),
    }),
  });

  // Log but don't throw — push should still work even if template setup fails
  if (!res.ok) {
    const text = await res.text();
    console.warn(`Instantly sequence setup failed (non-fatal): ${res.status} ${text}`);
  }
}

export async function isLeadInCampaign(
  apiKey: string,
  campaignId: string,
  email: string
): Promise<boolean> {
  const res = await fetch(`${INSTANTLY_BASE}/leads/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ campaign: campaignId, email, limit: 1 }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return (data.items ?? []).length > 0;
}

export async function pushLeadToCampaign(
  apiKey: string,
  campaignId: string,
  lead: {
    email: string;
    firstName: string;
    lastName: string;
    company: string;
    emails: EmailStep[];
  }
): Promise<void> {
  const customVariables: Record<string, string> = {};
  lead.emails.forEach((step, i) => {
    customVariables[`subject_${i + 1}`] = step.subject;
    customVariables[`body_${i + 1}`] = step.body;
  });

  const res = await fetch(`${INSTANTLY_BASE}/leads/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      campaign_id: campaignId,
      leads: [
        {
          email: lead.email,
          first_name: lead.firstName,
          last_name: lead.lastName,
          company_name: lead.company,
          custom_variables: customVariables,
        },
      ],
      skip_if_in_workspace: false,
      skip_if_in_campaign: false,
      skip_if_in_list: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instantly push failed: ${res.status} ${text}`);
  }

  const result = await res.json();
  console.log(`Instantly push result: uploaded=${result.leads_uploaded} duplicates=${result.duplicated_leads} skipped=${result.skipped_count}`);
}
