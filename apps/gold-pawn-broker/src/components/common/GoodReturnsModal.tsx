import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SUPPORTED_CITIES, calculateIndianGoldRates } from '../../utils/goodReturnsService';
import { formatCurrency } from '../../utils/formatters';
import { RefreshCw, X, TrendingUp, ExternalLink, Globe, Sparkles, ShieldCheck, CheckCircle2, Calculator, Check, ArrowRightLeft } from 'lucide-react';

export const GoodReturnsModal: React.FC = () => {
  const { 
    goodReturnsRates, 
    refreshGoodReturnsRates, 
    syncLiveMarketRates,
    resetGoldRatesToLive,
    updateGoldRates,
    changeGoodReturnsCity, 
    isGoodReturnsModalOpen, 
    setIsGoodReturnsModalOpen 
  } = useApp();

  const [rate24K, setRate24K] = useState<number>(goodReturnsRates.rates['24K'] || 15270);
  const [rate22K, setRate22K] = useState<number>(goodReturnsRates.rates['22K'] || 14000);
  const [rate20K, setRate20K] = useState<number>(goodReturnsRates.rates['20K'] || 12725);
  const [rate18K, setRate18K] = useState<number>(goodReturnsRates.rates['18K'] || 11453);
  const [autoCalcEnabled, setAutoCalcEnabled] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncingLive, setIsSyncingLive] = useState<boolean>(false);

  // Sync state whenever goodReturnsRates changes
  useEffect(() => {
    setRate24K(goodReturnsRates.rates['24K'] || 15270);
    setRate22K(goodReturnsRates.rates['22K'] || 14000);
    setRate20K(goodReturnsRates.rates['20K'] || 12725);
    setRate18K(goodReturnsRates.rates['18K'] || 11453);
  }, [goodReturnsRates]);

  const handle24KChange = (val: number) => {
    setRate24K(val);
    if (autoCalcEnabled && val > 0) {
      const calc = calculateIndianGoldRates(val);
      setRate22K(calc['22K']);
      setRate20K(calc['20K']);
      setRate18K(calc['18K']);
    }
  };

  const handleRecalculate = () => {
    if (rate24K > 0) {
      const calc = calculateIndianGoldRates(rate24K);
      setRate22K(calc['22K']);
      setRate20K(calc['20K']);
      setRate18K(calc['18K']);
      setSyncStatus('Recalculated 22K/20K/18K based on Indian bullion standard');
      setTimeout(() => setSyncStatus(null), 3500);
    }
  };

  const handleSaveAndSync = () => {
    const r24 = Number(rate24K) || 15270;
    const r22 = Number(rate22K) || Math.round(r24 * 22 / 24);
    const r20 = Number(rate20K) || Math.round(r24 * 20 / 24);
    const r18 = Number(rate18K) || Math.round(r24 * 18 / 24);

    updateGoldRates({
      '24K': r24,
      '22K': r22,
      '20K': r20,
      '18K': r18
    }, goodReturnsRates.city);

    setSyncStatus(`✓ Custom rates applied & synced across app for ${goodReturnsRates.city}!`);
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const handleSyncLiveMarket = async () => {
    setIsSyncingLive(true);
    setSyncStatus('Fetching live GoodReturns.in market rates...');
    try {
      const liveData = await syncLiveMarketRates(goodReturnsRates.city);
      setRate24K(liveData.rates['24K']);
      setRate22K(liveData.rates['22K']);
      setRate20K(liveData.rates['20K']);
      setRate18K(liveData.rates['18K']);
      setSyncStatus(`✓ Official GoodReturns.in live rates synced for ${goodReturnsRates.city}!`);
    } catch {
      resetGoldRatesToLive(goodReturnsRates.city);
      setSyncStatus(`✓ Live market rates restored for ${goodReturnsRates.city}`);
    } finally {
      setIsSyncingLive(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  if (!isGoodReturnsModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="liquid-glass-modal w-full max-w-lg rounded-3xl overflow-hidden flex flex-col border border-amber-200/60 shadow-2xl">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-white/40 to-yellow-500/10 border-b border-amber-200/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">GoodReturns.in Live Gold Feed</h3>
                {goodReturnsRates.isManualOverride ? (
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-900 rounded font-mono text-[9px] font-bold border border-amber-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    MANUAL OVERRIDE
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-800 rounded font-mono text-[9px] font-bold border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    LIVE MARKET SPOT
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Official Indian bullion spot market prices</p>
            </div>
          </div>

          <button
            onClick={() => setIsGoodReturnsModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white/80 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">
          
          {/* Active Manual Override Warning Banner */}
          {goodReturnsRates.isManualOverride && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-xs animate-in fade-in shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold text-amber-950 block">Custom Manual Rate Active</span>
                  <span className="text-[11px] text-amber-800">
                    App is using your custom rates. Live GoodReturns market feed is overridden.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSyncLiveMarket}
                disabled={isSyncingLive}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-extrabold shadow-xs transition flex items-center gap-1 shrink-0 ml-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLive ? 'animate-spin' : ''}`} />
                <span>Restore Live Feed</span>
              </button>
            </div>
          )}

          {/* City Selector Pills */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Select Indian Bullion Market City:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {SUPPORTED_CITIES.map(city => (
                <button
                  key={city}
                  type="button"
                  onClick={() => changeGoodReturnsCity(city)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition ${
                    goodReturnsRates.city === city
                      ? 'bg-amber-500/20 text-amber-900 border-amber-400/80 shadow-sm font-bold'
                      : 'bg-white/60 text-slate-600 border-slate-200/80 hover:bg-white'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Rates Display Grid */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* 22K Hallmarked Gold */}
            <div className="p-4 rounded-2xl liquid-glass-gold border border-amber-300/60 text-slate-900">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                <span>22K (916 Purity)</span>
                <span className="text-emerald-700 font-mono text-[10px]">
                  ▲ +₹{goodReturnsRates.change24h['22K']}/g
                </span>
              </div>
              <div className="text-2xl font-black text-amber-950 font-mono mt-1">
                ₹{goodReturnsRates.rates['22K'].toLocaleString('en-IN')}
                <span className="text-xs font-normal text-amber-800"> / gram</span>
              </div>
              <div className="text-[10px] text-amber-800/90 mt-1">
                Standard jewelry hallmark rate in {goodReturnsRates.city}
              </div>
            </div>

            {/* 24K Pure Gold */}
            <div className="p-4 rounded-2xl liquid-glass-card border border-amber-200 text-slate-900">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>24K (999 Pure)</span>
                <span className="text-emerald-700 font-mono text-[10px]">
                  ▲ +₹{goodReturnsRates.change24h['24K']}/g
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                ₹{goodReturnsRates.rates['24K'].toLocaleString('en-IN')}
                <span className="text-xs font-normal text-slate-600"> / gram</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Pure bullion bar benchmark
              </div>
            </div>

          </div>

          {/* Extended Purities Table */}
          <div className="bg-white/80 rounded-2xl border border-amber-200/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs">Standard Carat Conversion Grid</span>
              <span className="text-[10px] text-slate-500 font-mono">Formula: 24K × (Karat / 24)</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-amber-500/10 border border-amber-300 rounded-xl">
                <span className="text-[10px] text-amber-900 font-bold block">24K Gold</span>
                <span className="font-mono font-black text-amber-950">₹{goodReturnsRates.rates['24K'].toLocaleString('en-IN')}/g</span>
              </div>
              <div className="p-2 bg-amber-50/80 border border-amber-200 rounded-xl">
                <span className="text-[10px] text-slate-600 font-bold block">22K (91.67%)</span>
                <span className="font-mono font-bold text-slate-900">₹{goodReturnsRates.rates['22K'].toLocaleString('en-IN')}/g</span>
              </div>
              <div className="p-2 bg-amber-50/80 border border-amber-200 rounded-xl">
                <span className="text-[10px] text-slate-600 font-bold block">20K (83.33%)</span>
                <span className="font-mono font-bold text-slate-900">₹{goodReturnsRates.rates['20K'].toLocaleString('en-IN')}/g</span>
              </div>
              <div className="p-2 bg-amber-50/80 border border-amber-200 rounded-xl">
                <span className="text-[10px] text-slate-600 font-bold block">18K (75.00%)</span>
                <span className="font-mono font-bold text-slate-900">₹{goodReturnsRates.rates['18K'].toLocaleString('en-IN')}/g</span>
              </div>
            </div>
          </div>

          {/* Rate Calibrator Tool with Auto-Calculation as per Indian Pricing Standards */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-yellow-500/10 rounded-2xl border border-amber-300 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                <span>Manual Gold Rate Calibrator</span>
              </span>
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] font-bold text-amber-900 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCalcEnabled}
                    onChange={(e) => setAutoCalcEnabled(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Auto-calculate 22K, 20K, 18K</span>
                </label>
              </div>
            </div>

            <p className="text-[10.5px] text-slate-600 leading-snug">
              Enter manual rate for <strong>24K</strong> bullion. 22K (91.67%), 20K (83.33%), and 18K (75.00%) auto-calculate per Indian standards. Click <strong>Apply Manual Rate to App</strong> to use custom values, or <strong>Sync Live Market Rate</strong> to restore live feed.
            </p>

            <div className="grid grid-cols-4 gap-2">
              <div className="p-2 rounded-xl bg-amber-100/60 border border-amber-300">
                <label className="text-[10px] text-amber-950 font-black block mb-1">
                  24K Pure (₹/g) *
                </label>
                <input
                  type="number"
                  value={rate24K}
                  onChange={(e) => handle24KChange(Number(e.target.value))}
                  id="goodreturns-override-24k"
                  className="w-full px-2 py-1 bg-white border border-amber-400 rounded-lg text-xs font-mono font-black text-amber-950 focus:ring-2 focus:ring-amber-400/50"
                  placeholder="24K Rate"
                />
                <span className="text-[9px] text-amber-800 font-semibold block mt-0.5">Base Bullion</span>
              </div>

              <div className="p-2 rounded-xl bg-white/90 border border-amber-200">
                <label className="text-[10px] text-slate-700 font-bold block mb-1">
                  22K (₹/g)
                </label>
                <input
                  type="number"
                  value={rate22K}
                  onChange={(e) => setRate22K(Number(e.target.value))}
                  id="goodreturns-override-22k"
                  className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-400/50"
                  placeholder="22K Rate"
                />
                <span className="text-[9px] text-slate-500 block mt-0.5">24K × 22/24</span>
              </div>

              <div className="p-2 rounded-xl bg-white/90 border border-amber-200">
                <label className="text-[10px] text-slate-700 font-bold block mb-1">
                  20K (₹/g)
                </label>
                <input
                  type="number"
                  value={rate20K}
                  onChange={(e) => setRate20K(Number(e.target.value))}
                  id="goodreturns-override-20k"
                  className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-400/50"
                  placeholder="20K Rate"
                />
                <span className="text-[9px] text-slate-500 block mt-0.5">24K × 20/24</span>
              </div>

              <div className="p-2 rounded-xl bg-white/90 border border-amber-200">
                <label className="text-[10px] text-slate-700 font-bold block mb-1">
                  18K (₹/g)
                </label>
                <input
                  type="number"
                  value={rate18K}
                  onChange={(e) => setRate18K(Number(e.target.value))}
                  id="goodreturns-override-18k"
                  className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-400/50"
                  placeholder="18K Rate"
                />
                <span className="text-[9px] text-slate-500 block mt-0.5">24K × 18/24</span>
              </div>
            </div>

            {/* Sync Feedback Message */}
            {syncStatus && (
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{syncStatus}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRecalculate}
                  className="px-2.5 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[11px] rounded-lg shadow-2xs transition flex items-center gap-1"
                  title="Force recalculation from current 24K"
                >
                  <Calculator className="w-3 h-3 text-amber-700" />
                  <span>Recalculate Slabs</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncLiveMarket}
                  disabled={isSyncingLive}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                  title="Clear overrides and fetch live GoodReturns market rate"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLive ? 'animate-spin' : ''}`} />
                  <span>Sync Live Market Rate</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveAndSync}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-600/30 transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Manual Rate to App</span>
              </button>
            </div>
          </div>

          {/* Broker Guidance Callout */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-300/40 text-[11px] text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Pawnbroker Custom Lending Principle</span>
            </div>
            <p className="text-slate-600">
              GoodReturns rates represent open bullion market spot value. For collateral pledge safety, pawn brokers evaluate at a desired margin (typically 80%–92% of market rate), which can be adjusted per customer relationship.
            </p>
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <span>Last feed sync: <strong className="text-slate-700">{goodReturnsRates.lastUpdated}</strong></span>
              {goodReturnsRates.isManualOverride ? (
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200">Manual Override</span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">Live Market</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleSyncLiveMarket}
              disabled={isSyncingLive}
              className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold transition"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingLive ? 'animate-spin' : ''}`} />
              <span>{isSyncingLive ? 'Syncing...' : 'Sync Live GoodReturns'}</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between">
          <a
            href={goodReturnsRates.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-amber-700 hover:text-amber-800 flex items-center gap-1 font-semibold"
          >
            <span>View GoodReturns.in Official Page</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={() => setIsGoodReturnsModalOpen(false)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
