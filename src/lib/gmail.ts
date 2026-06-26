import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

interface GmailTokens {
  accessToken: string;
  refreshToken: string | null;
  expiry: Date | null;
}

async function refreshAccessToken(userId: string, refreshToken: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();

  const expiry = data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null;
  await db
    .update(users)
    .set({ gmailAccessToken: data.access_token, gmailTokenExpiry: expiry, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return data.access_token;
}

async function getValidAccessToken(userId: string, tokens: GmailTokens): Promise<string | null> {
  const isExpired = tokens.expiry && tokens.expiry < new Date(Date.now() + 60_000);
  if (!isExpired) return tokens.accessToken;
  if (!tokens.refreshToken) return null;
  return refreshAccessToken(userId, tokens.refreshToken);
}

function makeRawEmail(opts: {
  to: string;
  from: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
}): string {
  const lines = [
    `To: ${opts.to}`,
    `From: ${opts.from}`,
    `Subject: ${opts.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
  ];
  if (opts.inReplyTo) lines.push(`In-Reply-To: ${opts.inReplyTo}`);
  if (opts.references) lines.push(`References: ${opts.references}`);
  lines.push('', opts.body);

  return Buffer.from(lines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendEmail(
  userId: string,
  tokens: GmailTokens,
  opts: {
    to: string;
    from: string;
    subject: string;
    body: string;
    threadId?: string;
    inReplyTo?: string;
    references?: string;
  }
): Promise<{ messageId: string; threadId: string } | null> {
  const accessToken = await getValidAccessToken(userId, tokens);
  if (!accessToken) return null;

  const raw = makeRawEmail(opts);
  const payload: Record<string, string> = { raw };
  if (opts.threadId) payload.threadId = opts.threadId;

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error('Gmail send failed:', await res.text());
    return null;
  }

  const data = await res.json();
  return { messageId: data.id, threadId: data.threadId };
}

export async function hasReply(
  userId: string,
  tokens: GmailTokens,
  threadId: string
): Promise<boolean> {
  const accessToken = await getValidAccessToken(userId, tokens);
  if (!accessToken) return false;

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=minimal`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return false;
  const data = await res.json();
  // Thread has more than 1 message = someone replied
  return (data.messages?.length ?? 0) > 1;
}
