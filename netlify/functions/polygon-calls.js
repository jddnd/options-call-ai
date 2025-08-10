// /netlify/functions/polygon-calls.js (patched)
export const handler = async (event) => {
  try {
    const symbol = event.queryStringParameters?.symbol;
    const limit = event.queryStringParameters?.limit || '200';
    const apiKey = process.env.POLYGON_API_KEY;

    if (!symbol) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing ?symbol=' }) };
    }
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing POLYGON_API_KEY env var' }) };
    }

    const url = new URL(`https://api.polygon.io/v3/snapshot/options/${encodeURIComponent(symbol.toUpperCase())}`);
    url.searchParams.set('contract_type', 'call');
    url.searchParams.set('limit', limit);
    url.searchParams.set('apiKey', apiKey);

    const res = await fetch(url.toString());
    const text = await res.text();

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Polygon API error', status: res.status, body: text })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: text
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || String(e) }) };
  }
};