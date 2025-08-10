// /src/api/market.js
export async function getPolygonCalls(symbol, limit = 200) {
  const url = `/.netlify/functions/polygon-calls?symbol=${encodeURIComponent(symbol)}&limit=${limit}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    let details;
    try { details = JSON.parse(text); } catch { details = { body: text }; }
    throw new Error(`Polygon calls failed: ${details?.error || details?.body || res.status}`);
  }
  try { return JSON.parse(text); } catch { throw new Error('Invalid JSON from Polygon function'); }
}

export async function getUWFlow(symbol) {
  const url = `/.netlify/functions/uw-flow?symbol=${encodeURIComponent(symbol)}`;
  const res = await fetch(url);
  const text = await res.text();

  // If UW key is missing, just return empty flow so UI keeps working
  if (res.status === 500 && text.includes('Missing UW_API_KEY')) {
    return { data: [] };
  }

  if (!res.ok) {
    let details;
    try { details = JSON.parse(text); } catch { details = { body: text }; }
    throw new Error(`UW flow failed: ${details?.error || details?.body || res.status}`);
  }
  try { return JSON.parse(text); } catch { throw new Error('Invalid JSON from UW function'); }
}
