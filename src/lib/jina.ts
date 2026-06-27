export async function scrapeWebsite(url: string): Promise<string> {
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'text' },
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 429) {
      // Rate limited — short wait then retry
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    if (!res.ok) throw new Error(`Jina scrape failed: ${res.status}`);

    const text = await res.text();
    return text.slice(0, 10_000);
  }

  throw new Error('Jina scrape failed after retries: rate limited');
}
