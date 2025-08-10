// /netlify/functions/uw-flow.js (graceful errors)
export const handler = async (event) => {
  try {
    const symbol = event.queryStringParameters?.symbol;
    const apiKey = process.env.UW_API_KEY;
    const base = process.env.UW_BASE || 'https://api.unusualwhales.com'; // confirm per your plan

    if (!symbol) return { statusCode: 400, body: JSON.stringify({ error: 'Missing ?symbol=' }) };
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'Missing UW_API_KEY env var' }) };

    // Replace path with your plan's endpoint
    const url = new URL(`${base}/v1/flow`);
    url.searchParams.set('symbol', symbol.toUpperCase());
    url.searchParams.set('type', 'call');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const text = await res.text();

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'UW API error', status: res.status, body: text })
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