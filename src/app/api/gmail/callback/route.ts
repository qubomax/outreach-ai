import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');
  const userId = req.nextUrl.searchParams.get('state');

  console.log('[gmail/callback] code:', !!code, 'error:', error, 'userId:', userId);

  if (error || !code || !userId) {
    console.error('[gmail/callback] missing params', { error, hasCode: !!code, userId });
    return NextResponse.redirect(`${appUrl}/settings?gmail_error=1`);
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/gmail/callback`,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error('[gmail/callback] token exchange failed:', body);
    return NextResponse.redirect(`${appUrl}/settings?gmail_error=2`);
  }

  const tokens = await tokenRes.json();
  console.log('[gmail/callback] got tokens, has refresh_token:', !!tokens.refresh_token);

  // Get Gmail address via OpenID userinfo (requires openid + email scope)
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profileBody = await profileRes.text();
  const profile = profileRes.ok ? JSON.parse(profileBody) : null;
  const gmailEmail = profile?.email ?? null;
  console.log('[gmail/callback] gmail email:', gmailEmail, 'profile status:', profileRes.status, profileBody.slice(0, 200));

  const expiry = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  try {
    await db
      .update(users)
      .set({
        gmailEmail,
        gmailAccessToken: tokens.access_token,
        gmailRefreshToken: tokens.refresh_token ?? null,
        gmailTokenExpiry: expiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    console.log('[gmail/callback] DB updated for user', userId);
  } catch (err) {
    console.error('[gmail/callback] DB update failed:', err);
    return NextResponse.redirect(`${appUrl}/settings?gmail_error=3`);
  }

  return NextResponse.redirect(`${appUrl}/settings?gmail_connected=1`);
}
