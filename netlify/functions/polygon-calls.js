// /netlify/functions/polygon-quotes.js
// Fetch last NBBO for a list of option contracts (comma-separated)
export const handler = async (event) => {
  try {
    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing POLYGON_API_KEY env var' }) };
    }

    const list = (event.queryStringParameters?.contracts || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (!list.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing ?contracts=O:...' }) };
    }

    // Do calls in parallel on the server (fewer client roundtrips)
    const results = await Promise.all(list.map(async (ctr) => {
      // Polygon Last NBBO for options
      // https://api.polygon.io/v2/last/nbbo/O:{contract}
      const url = new URL(`https://api.polygon.io/v2/last/nbbo/${encodeURIComponent(ctr)}`);
      url.searchParams.set('apiKey', apiKey);

      const res = await fetch(url.toString());
      const text = await res.text();
      if (!res.ok) {
        return { contract: ctr, error: text || String(res.status) };
      }
      let data;
      try { data = JSON.parse(text); } catch { data = null; }
      const bid = data?.results?.bid?.price ?? null;
      const ask = data?.results?.ask?.price ?? null;

      return { contract: ctr, bid, ask };
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ results })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || String(e) }) };
  }
};
