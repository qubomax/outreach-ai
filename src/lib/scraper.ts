export async function scrapeWebsite(url: string): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY is not set');

  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Firecrawl failed: ${res.status} ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  if (!json.success) throw new Error(`Firecrawl error: ${json.error ?? 'unknown'}`);

  const markdown: string = json.data?.markdown ?? '';
  if (!markdown) throw new Error('Firecrawl returned empty content');

  return markdown.slice(0, 10_000);
}
