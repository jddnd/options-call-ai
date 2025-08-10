// /netlify/functions/polygon-calls.js
import fetch from 'node-fetch';

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

export const handler = async (event) => {
  try {
    const symbol = event.queryStringParameters?.symbol;
    const limit = event.queryStringParameters?.limit || '200';
    if (!symbol) return { statusCode: 400, body: JSON.stringify({ error: 'Missing ?symbol=' }) };
    if (!POLYGON_API_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'Missing POLYGON_API_KEY' }) };

    // Snapshot options chain (calls) for an underlying
    const url = new URL(`https://api.polygon.io/v3/snapshot/options/${encodeURIComponent(symbol.toUpperCase())}`);
    url.searchParams.set('contract_type', 'call');
    url.searchParams.set('limit', limit);
    url.searchParams.set('apiKey', POLYGON_API_KEY);

    const res = await fetch(url.toString());
    const data = await res.json();

    return {
      statusCode: res.ok ? 200 : res.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};