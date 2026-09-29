import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin, Plus, Trash2, RefreshCw, CheckCircle2, XCircle, Truck,
  Shield, Search, ToggleLeft, ToggleRight, AlertCircle, Loader2, Sparkles
} from 'lucide-react';
import { ServicePincode } from '../../types';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/pincodes';

export const DoorstepPincodeManager: React.FC = () => {
  const [pincodes, setPincodes] = useState<ServicePincode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New pincode form
  const [newPincode, setNewPincode] = useState('');
  const [newArea, setNewArea] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Pincode auto-lookup
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
  const [lookupSuggestions, setLookupSuggestions] = useState<string[]>([]);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const fetchPincodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        setPincodes(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load pincode list from server.');
      }
    } catch {
      setError('Cannot connect to server. Make sure the broker Vite dev server is running on port 5174.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPincodes();
  }, [fetchPincodes]);

  // Auto-lookup area from India Post Pincode API
  useEffect(() => {
    if (newPincode.length !== 6) {
      setLookupStatus('idle');
      setLookupSuggestions([]);
      return;
    }

    setLookupStatus('loading');
    if (lookupTimer.current) clearTimeout(lookupTimer.current);

    lookupTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${newPincode}`);
        const data = await res.json();
        if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
          const offices: any[] = data[0].PostOffice;
          // Build unique area labels: "PostOffice, District, State"
          const suggestions = Array.from(
            new Set(
              offices.map((o: any) => `${o.Name}, ${o.District}, ${o.State}`)
            )
          ).slice(0, 6);
          setLookupSuggestions(suggestions);
          setLookupStatus('found');
          // Auto-fill with the first match if area is empty or unchanged
          if (!newArea || newArea === '') {
            setNewArea(suggestions[0]);
          }
        } else {
          setLookupStatus('not_found');
          setLookupSuggestions([]);
        }
      } catch {
        setLookupStatus('not_found');
      }
    }, 600);

    return () => { if (lookupTimer.current) clearTimeout(lookupTimer.current); };
  }, [newPincode]);

  const handleAddPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!/^\d{6}$/.test(newPincode)) { setAddError('Pincode must be exactly 6 digits.'); return; }
    if (!newArea.trim()) { setAddError('Area / locality name is required.'); return; }

    setSaving(true);
    const newEntry: ServicePincode = {
      id: `PIN${Date.now()}`,
      pincode: newPincode.trim(),
      area: newArea.trim(),
      active: true,
      addedAt: new Date().toLocaleString('en-IN'),
    };

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });
      if (res.status === 409) {
        setAddError(`Pincode ${newPincode} already exists in the service list.`);
      } else if (res.ok) {
        setPincodes(prev => [...prev, newEntry]);
        setNewPincode('');
        setNewArea('');
        showSuccess(`Pincode ${newPincode} added — doorstep service now available in this area!`);
      } else {
        setAddError('Failed to save pincode. Please try again.');
      }
    } catch {
      setAddError('Network error. Could not save pincode.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (pincode: ServicePincode) => {
    const updated = { ...pincode, active: !pincode.active };
    setPincodes(prev => prev.map(p => p.id === pincode.id ? updated : p));
    try {
      await fetch(API_BASE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pincode.id, active: !pincode.active }),
      });
      showSuccess(`Pincode ${pincode.pincode} ${!pincode.active ? 'activated' : 'deactivated'}.`);
    } catch {}
  };

  const handleDeletePincode = async (pincode: ServicePincode) => {
    if (!confirm(`Remove ${pincode.pincode} (${pincode.area}) from doorstep service area?\n\nCustomers in this area will no longer see the doorstep option.`)) return;
    setPincodes(prev => prev.filter(p => p.id !== pincode.id));
    try {
      await fetch(`${API_BASE}?id=${pincode.id}`, { method: 'DELETE' });
      showSuccess(`Pincode ${pincode.pincode} removed from doorstep service areas.`);
    } catch {}
  };

  const filtered = pincodes.filter(p =>
    p.pincode.includes(searchQuery) ||
    p.area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = pincodes.filter(p => p.active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            Doorstep Service Pincodes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage the pincodes where your team offers doorstep gold valuation & pawn broking.
          </p>
        </div>
        <button
          onClick={fetchPincodes}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Pincodes', value: pincodes.length, color: 'bg-slate-100 text-slate-800' },
          { label: 'Active', value: activeCount, color: 'bg-emerald-100 text-emerald-800' },
          { label: 'Paused', value: pincodes.length - activeCount, color: 'bg-amber-100 text-amber-800' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.color} rounded-2xl p-3 text-center`}>
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-[11px] font-bold mt-0.5 opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Success / Error banners */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-xs text-emerald-800 font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-100 border border-red-300 text-xs text-red-800 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Add Pincode Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" />
          Add Doorstep Service Area
        </h3>
        <form onSubmit={handleAddPincode} className="space-y-3">

          {/* Row 1: Pincode input */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Pincode *</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={newPincode}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setNewPincode(val);
                  // Clear area if pincode changes so auto-fill kicks in fresh
                  if (val.length !== 6) setNewArea('');
                }}
                placeholder="Enter 6-digit pincode"
                className={`w-full border rounded-xl px-3 py-2.5 pr-10 text-slate-900 font-mono text-base font-black focus:outline-none transition-colors ${
                  lookupStatus === 'found' ? 'border-emerald-400 bg-emerald-50 focus:border-emerald-500' :
                  lookupStatus === 'not_found' ? 'border-red-300 bg-red-50 focus:border-red-400' :
                  'border-slate-300 focus:border-blue-400'
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {lookupStatus === 'loading' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                {lookupStatus === 'found' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {lookupStatus === 'not_found' && <XCircle className="w-4 h-4 text-red-400" />}
              </div>
            </div>
            {lookupStatus === 'loading' && (
              <p className="text-[11px] text-blue-600 mt-1 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Looking up area from India Post database…
              </p>
            )}
            {lookupStatus === 'not_found' && (
              <p className="text-[11px] text-red-600 mt-1">
                ⚠️ Pincode not found in India Post records. Please check and re-enter.
              </p>
            )}
          </div>

          {/* Row 2: Area field — auto-populated + editable */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
              Area / Locality Name *
              {lookupStatus === 'found' && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-extrabold uppercase flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Auto-filled
                </span>
              )}
            </label>
            <input
              type="text"
              value={newArea}
              onChange={e => setNewArea(e.target.value)}
              placeholder={lookupStatus === 'loading' ? 'Fetching area name…' : 'e.g. Anna Nagar East, Chennai'}
              disabled={lookupStatus === 'loading'}
              className={`w-full border rounded-xl px-3 py-2.5 text-slate-900 text-xs font-semibold focus:outline-none transition-colors ${
                lookupStatus === 'loading'
                  ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-wait'
                  : lookupStatus === 'found'
                    ? 'border-emerald-300 bg-emerald-50 focus:border-emerald-400'
                    : 'border-slate-300 focus:border-blue-400'
              }`}
            />

            {/* Suggestion chips when multiple post offices returned */}
            {lookupStatus === 'found' && lookupSuggestions.length > 1 && (
              <div className="mt-2">
                <p className="text-[10px] text-slate-500 font-semibold mb-1.5">
                  📮 {lookupSuggestions.length} post offices found — tap to select:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {lookupSuggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewArea(s)}
                      className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold transition cursor-pointer ${
                        newArea === s
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {addError && (
            <div className="flex items-center gap-2 text-xs text-red-700 font-semibold p-2 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {addError}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || lookupStatus === 'loading' || !newPincode || !newArea.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {saving ? 'Saving…' : 'Add Doorstep Service Area'}
          </button>
        </form>
      </div>

      {/* Search + List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by pincode or area name..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Loading pincodes…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <MapPin className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-semibold">{pincodes.length === 0 ? 'No doorstep service areas added yet.' : 'No results match your search.'}</p>
            <p className="text-xs mt-1 opacity-70">{pincodes.length === 0 ? 'Add your first pincode above to start accepting doorstep valuation requests.' : 'Try a different search term.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(p => (
              <div key={p.id} className={`flex items-center justify-between px-5 py-3.5 gap-4 hover:bg-slate-50 transition ${!p.active ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${p.active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black font-mono text-slate-900 text-sm">{p.pincode}</span>
                      {p.active ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-extrabold uppercase">Active</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-500 text-[9px] font-extrabold uppercase">Paused</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{p.area}</div>
                    <div className="text-[10px] text-slate-400">Added: {p.addedAt}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(p)}
                    title={p.active ? 'Pause doorstep service for this pincode' : 'Re-activate doorstep service'}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${p.active ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                  >
                    {p.active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                    {p.active ? 'Pause' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeletePincode(p)}
                    title="Remove from doorstep service area"
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
        <Shield className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
        <div>
          <strong className="font-black">How it works:</strong> When customers submit a pawn enquiry through the Customer Portal or Android APK, they will enter their pincode. If their pincode matches an <strong>active</strong> entry here, they'll see the "🏠 Doorstep Valuation" option and can book a home visit slot. If not, they'll be directed to visit your branch. Enquiries will arrive in the Live Enquiries panel with a doorstep tag.
        </div>
      </div>
    </div>
  );
};
