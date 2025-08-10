// /netlify/functions/uw-flow.js
import fetch from 'node-fetch';

const UW_API_KEY = process.env.UW_API_KEY;
const UW_BASE = process.env.UW_BASE || 'https://api.unusualwhales.com'; // placeholder base

export const handler = async (event) => {
  try {
    const symbol = event.queryStringParameters?.symbol;
    if (!symbol) return { statusCode: 400, body: JSON.stringify({ error: 'Missing ?symbol=' }) };
    if (!UW_API_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'Missing UW_API_KEY' }) };

    // NOTE: Replace endpoint path with the correct UW flow endpoint for your plan
    const url = new URL(`${UW_BASE}/v1/flow`);
    url.searchParams.set('symbol', symbol.toUpperCase());
    url.searchParams.set('type', 'call'); // filter calls
    // additional filters could be added here

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${UW_API_KEY}` }
    });

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