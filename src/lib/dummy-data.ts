export type ProspectStatus = "pending" | "scraping" | "generating" | "ready" | "pushed";

export interface EmailStep {
  step: number;
  subject: string;
  body: string;
  delayDays: number;
}

export interface Prospect {
  id: string;
  name: string;
  email: string;
  company: string;
  websiteUrl: string;
  status: ProspectStatus;
  brief?: string;
  sequence?: EmailStep[];
  createdAt: string;
}

export const DUMMY_PROSPECTS: Prospect[] = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah@linearapp.io",
    company: "Linear",
    websiteUrl: "https://linear.app",
    status: "ready",
    brief:
      "Linear is a modern project management tool built for high-performing software teams. They emphasize speed and keyboard-first workflows. Recently raised Series B. Pain point: teams switching from Jira cite slow load times and complex setup as their top frustrations — Linear positions directly against this.",
    sequence: [
      {
        step: 1,
        subject: "Linear's speed obsession → a thought",
        body: `Hi Sarah,

Noticed Linear's obsession with sub-100ms interactions — impressive engineering discipline.

We work with a few SaaS teams who were running cold outreach at scale but losing hours to manual prospect research before each send. Built a tool that does the research and writes the first draft automatically.

Worth a 15-min call to see if it fits your sales workflow?

Best,
Alex`,
        delayDays: 0,
      },
      {
        step: 2,
        subject: "Re: Linear's speed obsession → a thought",
        body: `Hi Sarah,

Just following up on my last note.

One of our customers (a B2B SaaS in the dev tooling space) went from 2 hours of research per prospect to 4 minutes. They're now sending 10x the volume with better reply rates.

Happy to share the specifics if useful.

Alex`,
        delayDays: 3,
      },
      {
        step: 3,
        subject: "Closing the loop",
        body: `Hi Sarah,

Last note — I'll leave it here.

If personalized outreach at scale ever becomes a priority for the Linear team, happy to help.

Link to book time: [calendar link]

Best,
Alex`,
        delayDays: 7,
      },
    ],
    createdAt: "2025-06-14T10:00:00Z",
  },
  {
    id: "2",
    name: "Marcus Webb",
    email: "marcus@retool.com",
    company: "Retool",
    websiteUrl: "https://retool.com",
    status: "ready",
    brief:
      "Retool is a low-code internal tool builder targeting engineering and operations teams. Strong enterprise traction. Recent signals: launched Retool Mobile and Retool Workflows. Likely pain: sales teams at companies using Retool need to reach enterprise buyers who are skeptical of low-code.",
    sequence: [
      {
        step: 1,
        subject: "Retool Workflows launch caught my eye",
        body: `Hi Marcus,

The Workflows launch last month looked like a smart move — internal automation is where Retool's moat deepens.

I help B2B sales teams automate the research + writing layer of cold outreach. Given Retool's enterprise focus, thought it might resonate.

Open to a quick chat?

Alex`,
        delayDays: 0,
      },
      {
        step: 2,
        subject: "Quick follow-up",
        body: `Hi Marcus,

Following up briefly — wanted to share that a dev-tools company similar to Retool (enterprise, 50+ person sales team) is using our tool to cut prospect research from 90 min to 8 min per batch.

Happy to walk you through the setup if curious.

Alex`,
        delayDays: 4,
      },
      {
        step: 3,
        subject: "Last note",
        body: `Hi Marcus,

I'll keep this short — last follow-up.

If the team ever wants to scale outreach without scaling headcount, I'd love to help. Feel free to grab time: [calendar link]

Alex`,
        delayDays: 7,
      },
    ],
    createdAt: "2025-06-14T11:30:00Z",
  },
  {
    id: "3",
    name: "Priya Nair",
    email: "priya@vercel.com",
    company: "Vercel",
    websiteUrl: "https://vercel.com",
    status: "pushed",
    brief:
      "Vercel is the infrastructure platform for frontend developers. Strong developer-first brand. Recently focused on enterprise expansion with SSO, audit logs, and compliance features.",
    sequence: [
      {
        step: 1,
        subject: "Vercel's enterprise push → outreach angle",
        body: `Hi Priya,

Vercel's move upmarket (SSO, audit logs, compliance) is a classic developer-to-enterprise play.

Those deals require a different outreach strategy — longer cycles, multiple stakeholders, personalized by role. We help sales teams automate exactly that research layer.

Worth exploring?

Alex`,
        delayDays: 0,
      },
      {
        step: 2,
        subject: "Re: Vercel's enterprise push",
        body: `Hi Priya,

Quick follow-up. One infrastructure company we work with is booking 3x more enterprise meetings using hyper-personalized sequences per account.

Happy to show you the workflow in 20 min.

Alex`,
        delayDays: 3,
      },
      {
        step: 3,
        subject: "Closing the loop",
        body: `Hi Priya,

Last message — appreciate your time.

If enterprise outreach personalization ever becomes a priority, I'm here: [calendar link]

Alex`,
        delayDays: 7,
      },
    ],
    createdAt: "2025-06-13T09:00:00Z",
  },
  {
    id: "4",
    name: "James Okafor",
    email: "james@supabase.io",
    company: "Supabase",
    websiteUrl: "https://supabase.com",
    status: "generating",
    createdAt: "2025-06-15T14:00:00Z",
  },
  {
    id: "5",
    name: "Elena Rossi",
    email: "elena@figma.com",
    company: "Figma",
    websiteUrl: "https://figma.com",
    status: "scraping",
    createdAt: "2025-06-15T14:05:00Z",
  },
  {
    id: "6",
    name: "Tom Bradley",
    email: "tom@stripe.com",
    company: "Stripe",
    websiteUrl: "https://stripe.com",
    status: "pending",
    createdAt: "2025-06-15T14:10:00Z",
  },
  {
    id: "7",
    name: "Aisha Kamara",
    email: "aisha@notion.so",
    company: "Notion",
    websiteUrl: "https://notion.so",
    status: "pushed",
    createdAt: "2025-06-13T16:00:00Z",
  },
];

export const DUMMY_STATS = {
  totalProspects: 7,
  sequencesGenerated: 4,
  pushedToInstantly: 2,
  avgReplyRate: "14%",
  avgOpenRate: "61%",
};
