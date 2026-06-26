export async function scrapeWebsite(url: string): Promise<string> {
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: { Accept: 'text/plain', 'X-Return-Format': 'text' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Jina scrape failed: ${res.status}`);
  const text = await res.text();
  return text.slice(0, 10_000);
}
