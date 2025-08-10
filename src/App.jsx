// /src/App.jsx
import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import TradeCard from './components/TradeCard';
import AlertFeed from './components/AlertFeed';
import MarketSentiment from './components/MarketSentiment';
import SkeletonLoader from './components/SkeletonLoader';
import { getPolygonCalls, getUWFlow, getPolygonQuotes } from './api/market';

// Simple scoring: blends IV (lower better), bid/ask spread (tighter better), and flow hits (if available)
function scoreCall({ iv, bid, ask }, flowHits) {
  const spread = (ask ?? 0) - (bid ?? 0);
  const ivScore = iv != null ? Math.max(0, 10 - Math.min(100, iv) / 10) : 7.5; // lower IV => higher
  const spreadScore = spread > 0 ? Math.max(0, 10 - spread * 10) : 8;          // tighter => higher
  const flowScore = Math.min(10, 7 + (flowHits || 0) * 0.6);                    // each hit bumps score
  const s = (ivScore * 0.4) + (spreadScore * 0.3) + (flowScore * 0.3);
  return s.toFixed(1);
}

// quick mock live alert generator (keeps UI lively until UW enabled)
function makeMockAlert(ticker) {
  const strikes = [90, 95, 100, 105, 110, 115, 120, 125];
  const prem = ['$200k', '$350k', '$500k', '$800k', '$1.2M'];
  const i = Math.floor(Math.random() * strikes.length);
  const j = Math.floor(Math.random() * prem.length);
  return {
    id: Date.now(),
    text: `🚨 ${ticker} ${strikes[i]}C sweep spotted · Premium ${prem[j]}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

export default function App() {
  const [symbol, setSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [flowFeed, setFlowFeed] = useState([]);
  const [flowNote, setFlowNote] = useState('');
  const [quotesNote, setQuotesNote] = useState('');
  const [useQuotes, setUseQuotes] = useState(true); // <-- toggle

  // lightweight live alerts that run even without UW (can be replaced when UW is added)
  useEffect(() => {
    const seed = [makeMockAlert(symbol)];
    setFlowFeed(seed);
    const t = setInterval(() => {
      setFlowFeed(prev => [makeMockAlert(symbol), ...prev].slice(0, 10));
    }, 8000);
    return () => clearInterval(t);
  }, [symbol]);

  const fetchData = async () => {
    setFlowNote('');
    setQuotesNote('');
    setCards([]);
    try {
      setLoading(true);

      // 1) Polygon (snapshot preferred; backend falls back to reference)
      const poly = await getPolygonCalls(symbol, 150);

      // Normalize results to items our UI understands
      let items;
      if (poly?.mode === 'reference') {
        // Reference: no quotes/iv—optionally enrich with quotes if allowed & toggle is ON
        const raw = (poly.results || [])
          .map((c) => ({
            symbol,
            strike: c?.strike_price ?? c?.strike ?? null,
            expiry: c?.expiration_date ?? c?.expiration ?? null,
            contract: c?.ticker || c?.contract || null,
            iv: null, bid: null, ask: null,
          }))
          .filter(x => x.strike && x.expiry && x.contract);

        // limit to keep it snappy
        const head = raw.slice(0, 24);

        if (useQuotes) {
          try {
            const contracts = head.map(x => x.contract);
            const quotes = await getPolygonQuotes(contracts);
            const map = new Map();
            (quotes?.results || []).forEach(q => { if (q?.contract) map.set(q.contract, q); });
            items = head.map(it => {
              const q = map.get(it.contract);
              return { ...it, bid: q?.bid ?? null, ask: q?.ask ?? null };
            });
          } catch (err) {
            // Not entitled (most common): keep going, just warn once
            setQuotesNote('Quotes disabled (plan/limits). Showing strikes only.');
            items = head;
          }
        } else {
          items = head; // user explicitly disabled quotes
        }
      } else {
        // Snapshot mode: we already have quotes/iv
        items = (poly?.results || [])
          .map((r) => {
            const o = r?.details || r;
            const greeks = r?.greeks || {};
            const iv = greeks?.iv ?? r?.implied_volatility ?? null;
            const bid = r?.last_quote?.bid ?? r?.day?.bid ?? null;
            const ask = r?.last_quote?.ask ?? r?.day?.ask ?? null;
            const strike = o?.strike_price ?? o?.strike ?? r?.strike_price;
            const exp = o?.expiration_date ?? o?.expiration;
            return { symbol, strike, expiry: exp, iv, bid, ask };
          })
          .filter(x => x.strike && x.expiry);
      }

      // 2) Try Unusual Whales (optional, non-fatal). When missing, mock alerts above keep UI alive.
      try {
        const flow = await getUWFlow(symbol);
        const flows = (flow?.data || flow?.results || []).map((f, i) => ({
          id: i,
          text: f?.text || `${symbol} flow ${f?.type || ''} prem ${f?.premium || ''}`,
          time: f?.time || new Date().toLocaleTimeString()
        }));
        if (flows.length) {
          // prepend UW events to the live feed we already show
          setFlowFeed(prev => [...flows.slice(0, 5), ...prev].slice(0, 10));
        } else {
          setFlowNote('Flow disabled — add UW_API_KEY in Netlify to enable Unusual Whales overlays.');
        }
      } catch {
        setFlowNote('Flow unavailable right now — showing Polygon data only.');
      }

      // 3) Score, sort, take top N
      const enriched = items.map(it => {
        // mock “flow hits” until UW enabled: none for now
        const hits = 0;
        return { ...it, score: scoreCall(it, hits), tags: [] };
      });

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

          {/* Quotes toggle */}
          <button
            onClick={() => setUseQuotes(v => !v)}
            className={`px-4 py-2 rounded self-start md:self-auto ${useQuotes ? 'bg-slate-600' : 'bg-slate-800 border border-slate-600'}`}
            title="Toggle fetching option quotes from Polygon"
          >
            {useQuotes ? 'Quotes: ON' : 'Quotes: OFF'}
          </button>

          <button
            onClick={fetchData}
            className="bg-blue-600 px-4 py-2 rounded self-start md:self-auto"
          >
            Scan Calls
          </button>
        </div>

        {/* Notes/Banners */}
        {quotesNote && (
          <div className="bg-blue-600/20 border border-blue-600 text-blue-200 text-sm px-3 py-2 rounded">
            {quotesNote}
          </div>
        )}
        {flowNote && (
          <div className="bg-yellow-600/20 border border-yellow-600 text-yellow-200 text-sm px-3 py-2 rounded">
            {flowNote}
          </div>
        )}

        {/* 🔥 Today’s Top Calls */}
        <div>
          <h2 className="font-semibold mb-2">🔥 Today&apos;s Top Calls</h2>
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

        {/* 🔔 Live Alerts (mock until UW is enabled) */}
        <AlertFeed title="🔔 Live Alerts" items={flowFeed} />

        {/* Market Sentiment */}
        <MarketSentiment />
      </div>
    </div>
  );
}
