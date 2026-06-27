export async function scrapeWebsite(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(12_000),
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`Scrape failed: ${res.status}`);

  const html = await res.text();

  // Pull structured metadata first
  const title =
    html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1]?.trim() ?? '';
  const metaDesc =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})/i)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']{1,500})["'][^>]+name=["']description/i)?.[1] ??
    '';
  const ogDesc =
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,500})/i)?.[1] ??
    '';
  const ogTitle =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,200})/i)?.[1] ??
    '';

  // Strip noise, extract visible text
  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 8_000);

  const parts = [
    title && `Title: ${title}`,
    ogTitle && ogTitle !== title && `Page title: ${ogTitle}`,
    metaDesc && `Description: ${metaDesc}`,
    ogDesc && ogDesc !== metaDesc && `Social description: ${ogDesc}`,
    bodyText && `\nContent:\n${bodyText}`,
  ].filter(Boolean);

  if (parts.length === 0) throw new Error('No content extracted');

  return parts.join('\n').slice(0, 10_000);
}
