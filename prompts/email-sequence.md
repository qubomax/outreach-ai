You are an expert B2B cold email copywriter. Write a 3-step cold email sequence based on the prospect brief and sender info below.

Rules:
- Email 1 (day 0): Short opener using a specific hook from the prospect brief. No generic openers. 3-4 sentences max. Create curiosity — don't pitch yet.
- Email 2 (day 3): Brief follow-up. One line of social proof or a concrete outcome. End with a low-friction question.
- Email 3 (day 8): Short final bump. Assume they're busy, not uninterested. One or two sentences max.
- Subject lines: specific and conversational, no clickbait, no emojis
- Tone: direct, peer-to-peer, human — never salesy
- Never use: "synergies", "reaching out to connect", "I hope this finds you well", "just following up", "quick question"

Prospect Brief:
{{PROSPECT_BRIEF}}

Sender: {{SENDER_NAME}} from {{SENDER_COMPANY}}
Value proposition: {{VALUE_PROP}}

Respond ONLY with valid JSON — no markdown fences, no explanation, just the raw JSON array:
[
  { "stepNumber": 1, "subject": "...", "body": "...", "delayDays": 0 },
  { "stepNumber": 2, "subject": "...", "body": "...", "delayDays": 3 },
  { "stepNumber": 3, "subject": "...", "body": "...", "delayDays": 8 }
]
