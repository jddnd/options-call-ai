// /src/api/market.js
export async function getPolygonCalls(symbol, limit = 200) {
  const res = await fetch(`/.netlify/functions/polygon-calls?symbol=${encodeURIComponent(symbol)}&limit=${limit}`);
  if (!res.ok) throw new Error('Polygon calls fetch failed');
  return res.json();
}

export async function getUWFlow(symbol) {
  const res = await fetch(`/.netlify/functions/uw-flow?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error('Unusual Whales flow fetch failed');
  return res.json();
}