// /netlify/functions/polygon-calls.js (snapshot with fallback to reference)
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

    // Try rich snapshot (quotes/iv/greeks)
    const snapURL = new URL(`https://api.polygon.io/v3/snapshot/options/${encodeURIComponent(symbol.toUpperCase())}`);
    snapURL.searchParams.set('contract_type', 'call');
    snapURL.searchParams.set('limit', limit);
    snapURL.searchParams.set('apiKey', apiKey);

    const snapRes = await fetch(snapURL.toString());
    const snapText = await snapRes.text();

    if (snapRes.ok) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: snapText
      };
    }

    // Fallback: reference list (metadata only)
    const refURL = new URL('https://api.polygon.io/v3/reference/options/contracts');
    refURL.searchParams.set('underlying_ticker', symbol.toUpperCase());
    refURL.searchParams.set('contract_type', 'call');
    refURL.searchParams.set('expired', 'false');
    refURL.searchParams.set('limit', '200');
    refURL.searchParams.set('apiKey', apiKey);

    const refRes = await fetch(refURL.toString());
    const refText = await refRes.text();

    if (refRes.ok) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          mode: 'reference',
          status: 'OK',
          results: JSON.parse(refText)?.results || []
        })
      };
    }

    return {
      statusCode: snapRes.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Polygon API error', status: snapRes.status, body: snapText })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || String(e) }) };
  }
};