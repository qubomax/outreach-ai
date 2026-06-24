import 'dotenv/config';
import { db } from '../src/lib/db';
import { prospects, emailSequences } from '../src/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { setupCampaignSequence, pushLeadToCampaign } from '../src/lib/instantly';

const API_KEY = process.env.INSTANTLY_API_KEY!;
const CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID!;

// Optional: filter by email passed as CLI arg, e.g. npx tsx scripts/push-to-instantly.ts noah@pipedrive.com
const targetEmail = process.argv[2]?.toLowerCase();

async function main() {
  const allProspects = await db.select().from(prospects);

  const targets = targetEmail
    ? allProspects.filter((p) => p.email.toLowerCase() === targetEmail)
    : allProspects.filter((p) => p.generateStatus === 'generated');

  if (targets.length === 0) {
    console.log(targetEmail ? `No prospect found with email: ${targetEmail}` : 'No generated prospects to push.');
    return;
  }

  console.log(`Pushing ${targets.length} prospect(s) to Instantly...\n`);

  for (const prospect of targets) {
    const steps = await db
      .select()
      .from(emailSequences)
      .where(eq(emailSequences.prospectId, prospect.id))
      .orderBy(asc(emailSequences.stepNumber));

    if (steps.length === 0) {
      console.log(`⚠  ${prospect.email} — no sequences found, skipping`);
      continue;
    }

    const emailSteps = steps.map((s) => ({
      subject: s.subject,
      body: s.body,
      delayDays: s.delayDays,
    }));

    try {
      await setupCampaignSequence(API_KEY, CAMPAIGN_ID, emailSteps);
      await pushLeadToCampaign(API_KEY, CAMPAIGN_ID, {
        email: prospect.email,
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        company: prospect.company,
        emails: emailSteps,
      });

      await db
        .update(emailSequences)
        .set({ pushStatus: 'pushed', updatedAt: new Date() })
        .where(eq(emailSequences.prospectId, prospect.id));

      console.log(`✓  ${prospect.firstName} ${prospect.lastName} <${prospect.email}> — pushed`);
    } catch (err) {
      console.error(`✗  ${prospect.email} — failed:`, err);
    }
  }

  console.log('\nDone.');
}

main().then(() => process.exit(0)).catch(console.error);
