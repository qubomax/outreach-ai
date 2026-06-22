import { anthropic } from '../claude';

const SEQUENCE_PROMPT = `You are an expert B2B cold email copywriter. Write a 3-step cold email sequence based on the prospect brief and sender info below.

Rules:
- Email 1 (day 0): Short opener using a specific hook from the prospect brief. No generic openers. 3-4 sentences max. Create curiosity — don't pitch yet.
- Email 2 (day 3): Brief follow-up. One line of social proof or a concrete outcome. End with a low-friction question.
- Email 3 (day 8): Short final bump. Assume they're busy, not uninterested. One or two sentences max.
- Subject lines: specific and conversational, no clickbait, no emojis
- Tone: direct, peer-to-peer, human — never salesy
- Never use: "synergies", "reaching out to connect", "I hope this finds you well", "just following up", "quick question"
- Address the prospect by their actual first name ({{PROSPECT_FIRST_NAME}}) — never use placeholder text like [First Name]

Prospect Name: {{PROSPECT_FIRST_NAME}}
Prospect Brief:
{{PROSPECT_BRIEF}}

Sender: {{SENDER_NAME}} from {{SENDER_COMPANY}}
Value proposition: {{VALUE_PROP}}

Respond ONLY with valid JSON — no markdown fences, no explanation, just the raw JSON array:
[
  { "stepNumber": 1, "subject": "...", "body": "...", "delayDays": 0 },
  { "stepNumber": 2, "subject": "...", "body": "...", "delayDays": 3 },
  { "stepNumber": 3, "subject": "...", "body": "...", "delayDays": 8 }
]`;

interface EmailStep {
  stepNumber: number;
  subject: string;
  body: string;
  delayDays: number;
}

export async function generateSequence(
  prospectBrief: string,
  prospectFirstName: string,
  senderName: string,
  senderCompany: string,
  valueProp: string
): Promise<EmailStep[]> {
  const prompt = SEQUENCE_PROMPT
    .replace(/\{\{PROSPECT_FIRST_NAME\}\}/g, prospectFirstName)
    .replace('{{PROSPECT_BRIEF}}', prospectBrief)
    .replace('{{SENDER_NAME}}', senderName)
    .replace('{{SENDER_COMPANY}}', senderCompany)
    .replace('{{VALUE_PROP}}', valueProp);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected Claude response type');

  const text = content.text.trim();
  // Strip markdown fences if Claude adds them despite instructions
  const json = text.startsWith('```') ? text.replace(/```[a-z]*\n?/g, '').trim() : text;

  const steps = JSON.parse(json) as EmailStep[];

  // Safety net: replace any placeholder patterns Claude may still emit
  const placeholderRe = /\[First Name\]|\[NAME\]|\[name\]/gi;
  return steps.map((s) => ({
    ...s,
    subject: s.subject.replace(placeholderRe, prospectFirstName),
    body: s.body.replace(placeholderRe, prospectFirstName),
  }));
}
