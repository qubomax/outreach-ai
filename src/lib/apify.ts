const APIFY_BASE = 'https://api.apify.com/v2';
const ACTOR_ID = 'apify~website-content-crawler';

export async function startScrape(websiteUrl: string, apiKey: string): Promise<string> {
  const res = await fetch(`${APIFY_BASE}/acts/${ACTOR_ID}/runs?token=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startUrls: [{ url: websiteUrl }],
      maxCrawlDepth: 1,
      maxCrawlPages: 3,
      crawlerType: 'cheerio',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify start failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json.data.id as string;
}

export type ApifyRunStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ABORTED' | 'TIMED-OUT';

export async function getRunStatus(runId: string, apiKey: string): Promise<ApifyRunStatus> {
  const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${apiKey}`);
  if (!res.ok) throw new Error(`Apify status check failed: ${res.status}`);
  const json = await res.json();
  return json.data.status as ApifyRunStatus;
}

export async function getRunText(runId: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${apiKey}&fields=text&limit=10`
  );
  if (!res.ok) throw new Error(`Apify dataset fetch failed: ${res.status}`);
  const items: Array<{ text?: string }> = await res.json();
  const combined = items
    .map((item) => item.text ?? '')
    .join('\n\n')
    .slice(0, 10000);
  return combined;
}
