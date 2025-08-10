// /src/App.jsx
import React, { useState } from 'react';
import Header from './components/Header';
import TradeCard from './components/TradeCard';
import AlertFeed from './components/AlertFeed';
import MarketSentiment from './components/MarketSentiment';
import SkeletonLoader from './components/SkeletonLoader';
import { getPolygonCalls, getUWFlow } from './api/market';

// Simple scoring: blends IV (lower better), bid/ask spread (tighter better), and flow hits (if available)
function scoreCall({ iv, bid, ask }, flowHits) {
  const spread = (ask ?? 0) - (bid ?? 0);
  const ivScore = iv ? Math.max(0, 10 - Math.min(100, iv) / 10) : 7.5; // lower IV => higher score
  const spreadScore = spread > 0 ? Math.max(0, 10 - spread * 10) : 8;  // tighter spread => higher score
  const flowScore = Math.min(10, 7 + (flowHits || 0) * 0.6);           // each hit bumps score
  const s = (ivScore * 0.4) + (spreadScore * 0.3) + (flowScore * 0.3);
  return s.toFixed(1);
}

export default function App() {
  const [symbol, setSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [flowFeed, setFlowFeed] = useState([]);
  const [flowNote, setFlowNote] = useState(''); // shows when UW flow is unavailable

  const fetchData = async () => {
    setFlowNote('');
    setFlowFeed([]);
    setCards([]);
    try {
      setLoading(true);

      // 1) Fetch Polygon calls snapshot
      const poly = await getPolygonCalls(symbol, 150);

      // Normalize Polygon snapshot results into a flat list
      const items = (poly?.results || []).map((r) => {
        const o = r?.details || r;         // contract metadata
        const greeks = r?.greeks || {};    // greeks (if provided on your plan)
        const iv = greeks?.iv ?? r?.implied_volatility;
        const bid = r?.last_quote?.bid ?? r?.day?.bid ?? null;
        const ask = r?.last_quote?.ask ?? r?.day?.ask ?? null;
        const strike = o?.strike_price ?? o?.strike ?? r?.strike_price;
        const exp = o?.expiration_date ?? o?.expiration;
        return { symbol, strike, expiry: exp, iv, bid, ask };
      }).filter(x => x.strike && x.expiry);

      // 2) Try to fetch Unusual Whales flow (non-fatal if missing)
      let flows = [];
      try {
        const flow = await getUWFlow(symbol); // our client helper returns {data: []} when UW_API_KEY is missing
        flows = (flow?.data || flow?.results || []).map((f, i) => ({
          id: i,
          text: f?.text || `${symbol} flow ${f?.type || ''} prem ${f?.premium || ''}`,
          time: f?.time || new Date().toLocaleTimeString(),
          strikeHint: f?.strike || undefined,
        }));
        if (!flows.length) {
          setFlowNote('Flow disabled — add UW_API_KEY in Netlify to enable Unusual Whales overlays.');
        }
      } catch (err) {
        // If any unexpected error, keep going with Polygon-only
        setFlowNote('Flow unavailable right now — showing Polygon data only.');
        flows = [];
      }

      setFlowFeed(flows.slice(0, 10));

      // 3) Enrich Polygon contracts with basic "flow hits" by checking strike text mentions
      const enriched = items.map(it => {
        const hits = flows.filter(f => {
          // try exact strike match first, else loose text includes on rounded strike
          if (f.strikeHint) return Number(f.strikeHint) === Math.round(it.strike);
          return f.text?.includes(`${Math.round(it.strike)}`);
        }).length;

        return {
          ...it,
          score: scoreCall(it, hits),
          tags: hits ? ['Unusual Flow'] : []
        };
      });

      // 4) Sort by score and take top N
      setCards(enriched.sort((a,b) => parseFloat(b.score) - parseFloat(a.score)).slice(0, 8));
    } catch (e) {
      alert(e.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#12121c]">
      <Header />

      <div className="p-6 space-y-4 text-white">
        {/* Controls */}
        <div className="bg-[#1e1e2f] p-4 rounded-2xl flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <label className="text-sm block mb-1">Ticker</label>
            <input
              value={symbol}
              onChange={e => setSymbol(e.target.value.toUpperCase())}
              className="w-full bg-[#12121c] rounded px-3 py-2 outline-none"
              placeholder="AAPL"
            />
          </div>
          <button
            onClick={fetchData}
            className="bg-blue-600 px-4 py-2 rounded self-start md:self-auto"
          >
            Scan Calls
          </button>
        </div>

        {/* Optional banner if UW flow is unavailable */}
        {flowNote && (
          <div className="bg-yellow-600/20 border border-yellow-600 text-yellow-200 text-sm px-3 py-2 rounded">
            {flowNote}
          </div>
        )}

        {/* Top Calls */}
        <div>
          <h2 className="font-semibold mb-2">🔥 Top Call Opportunities</h2>
          {loading ? (
            <SkeletonLoader count={4} />
          ) : (
            <div className="flex gap-4 overflow-x-auto">
              {cards.map((c, i) => (
                <TradeCard
                  key={i}
                  ticker={symbol}
                  score={c.score}
                  expiry={c.expiry}
                  strike={c.strike}
                  iv={c.iv}
                  bid={c.bid}
                  ask={c.ask}
                  tags={c.tags}
                />
              ))}
              {!cards.length && (
                <div className="text-sm text-gray-400 p-4">
                  No calls found yet. Try another ticker or scan again.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Flow Highlights (will be empty until you add UW_API_KEY) */}
        <AlertFeed items={flowFeed} />
        <MarketSentiment />
      </div>
    </div>
  );
}
