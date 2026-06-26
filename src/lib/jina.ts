export async function scrapeWebsite(url: string): Promise<string> {
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'text' },
      signal: AbortSignal.timeout(20_000),
    });

    if (res.status === 429) {
      // Rate limited — wait longer each retry
      const delay = (attempt + 1) * 2000;
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    if (!res.ok) throw new Error(`Jina scrape failed: ${res.status}`);

    const text = await res.text();
    return text.slice(0, 10_000);
  }

  throw new Error('Jina scrape failed after retries: rate limited');
}
