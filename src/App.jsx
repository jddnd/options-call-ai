import React, { useState } from 'react';
import Header from './components/Header';
import TradeCard from './components/TradeCard';
import AlertFeed from './components/AlertFeed';
import MarketSentiment from './components/MarketSentiment';
import SkeletonLoader from './components/SkeletonLoader';
import { getPolygonCalls, getUWFlow, getPolygonQuotes } from './api/market';

function scoreCall({ iv, bid, ask }, flowHits) {
  const spread = (ask ?? 0) - (bid ?? 0);
  const ivScore = iv != null ? Math.max(0, 10 - Math.min(100, iv) / 10) : 7.5;
  const spreadScore = spread > 0 ? Math.max(0, 10 - spread * 10) : 8;
  const flowScore = Math.min(10, 7 + (flowHits || 0) * 0.6);
  const s = (ivScore * 0.4) + (spreadScore * 0.3) + (flowScore * 0.3);
  return s.toFixed(1);
}

export default function App() {
  const [symbol, setSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [flowFeed, setFlowFeed] = useState([]);
  const [flowNote, setFlowNote] = useState('');

  const fetchData = async () => {
    setFlowNote('');
    setFlowFeed([]);
    setCards([]);
    try {
      setLoading(true);

      const poly = await getPolygonCalls(symbol, 150);

      let items;
      if (poly?.mode === 'reference') {
        const raw = (poly.results || [])
          .map((c) => ({
            symbol,
            strike: c?.strike_price ?? c?.strike ?? null,
            expiry: c?.expiration_date ?? c?.expiration ?? null,
            contract: c?.ticker || c?.contract || null,
            iv: null, bid: null, ask: null,
          }))
          .filter(x => x.strike && x.expiry && x.contract);

        const head = raw.slice(0, 24);
        const contracts = head.map(x => x.contract);
        const quotes = await getPolygonQuotes(contracts);

        const quoteMap = new Map();
        (quotes?.results || []).forEach(q => {
          if (q?.contract) quoteMap.set(q.contract, q);
        });

        items = head.map(it => {
          const q = quoteMap.get(it.contract);
          return { ...it, bid: q?.bid ?? null, ask: q?.ask ?? null };
        });
      } else {
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

      let flows = [];
      try {
        const flow = await getUWFlow(symbol);
        flows = (flow?.data || flow?.results || []).map((f, i) => ({
          id: i,
          text: f?.text || `${symbol} flow ${f?.type || ''} prem ${f?.premium || ''}`,
          time: f?.time || new Date().toLocaleTimeString(),
          strikeHint: f?.strike || undefined,
        }));
        if (!flows.length) {
          setFlowNote('Flow disabled — add UW_API_KEY in Netlify to enable Unusual Whales overlays.');
        }
      } catch {
        setFlowNote('Flow unavailable right now — showing Polygon data only.');
        flows = [];
      }

      setFlowFeed(flows.slice(0, 10));

      const enriched = items.map(it => {
        const hits = flows.filter(f => {
          if (f.strikeHint) return Number(f.strikeHint) === Math.round(it.strike);
          return f.text?.includes(`${Math.round(it.strike)}`);
        }).length;

        return { ...it, score: scoreCall(it, hits), tags: hits ? ['Unusual Flow'] : [] };
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
          <button onClick={fetchData} className="bg-blue-600 px-4 py-2 rounded self-start md:self-auto">
            Scan Calls
          </button>
        </div>

        {flowNote && (
          <div className="bg-yellow-600/20 border border-yellow-600 text-yellow-200 text-sm px-3 py-2 rounded">
            {flowNote}
          </div>
        )}

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

        <AlertFeed items={flowFeed} />
        <MarketSentiment />
      </div>
    </div>
  );
}
