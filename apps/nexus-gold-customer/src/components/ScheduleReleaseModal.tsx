import React, { useState } from 'react';
import { Mortgage } from '../types';
import { formatCurrency, formatWeight, formatDate } from '../utils/formatters';
import { 
  ShieldCheck, X, CheckCircle2, Lock, Clock, 
  Calendar, AlertCircle, Sparkles, Building2 
} from 'lucide-react';
import { Language } from '../i18n/translations';

interface ScheduleReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  mortgage: Mortgage;
  language: Language;
  onConfirm: (pickupDate: string, notes?: string) => void;
}

export const ScheduleReleaseModal: React.FC<ScheduleReleaseModalProps> = ({
  isOpen,
  onClose,
  mortgage,
  language,
  onConfirm
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [pickupDate, setPickupDate] = useState(defaultDate);
  const [preferredTime, setPreferredTime] = useState('Afternoon (2:00 PM - 5:00 PM)');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const totalNet = mortgage.items.reduce((s, it) => s + it.netWeight, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullNotes = `Slot: ${preferredTime}${customerNotes ? ` | Note: ${customerNotes}` : ''}`;
    onConfirm(pickupDate, fullNotes);
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-amber-200/90 shadow-2xl w-full max-w-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {language === 'ta' ? 'நகைகள் மீட்பு நேர அட்டவணை' : 'Schedule Ornament Collection'}
              </h2>
              <p className="text-xs text-amber-200/80">
                Pledge #{mortgage.mortgageNumber} • {formatWeight(totalNet)} Gold
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              {language === 'ta' ? 'மீட்பு கோரிக்கை வெற்றிகரமாக பதிவு செய்யப்பட்டது!' : 'Jewel Release Request Submitted!'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              {language === 'ta'
                ? `உங்கள் நகைகள் காப்பீடு செய்யப்பட்ட உயர் பாதுகாப்பு பெட்டகத்தில் இருந்து சரிபார்க்கப்பட்டு ${formatDate(pickupDate)} அன்று கிளையில் ஒப்படைக்க தயாராக வைக்கப்படும்.`
                : `Our vault custodians are retrieving and verifying the security seal barcodes for your ornaments. They will be staged at the counter for collection on ${formatDate(pickupDate)}.`}
            </p>
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-950">
              📍 Branch: Main Street Branch • Please bring your Original Pawn Ticket and Photo ID.
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer shadow-md"
            >
              {language === 'ta' ? 'சரி (Done)' : 'Close'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-800">
            
            {/* Trust Building Vault Security Notice */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-950 font-bold block mb-0.5">
                  {language === 'ta' ? '100% பாதுகாப்பான பெட்டக நடைமுறை' : 'Insured Vault Retrieval Protocol'}
                </strong>
                <p className="text-emerald-900 leading-relaxed text-[11px]">
                  {language === 'ta'
                    ? 'வாடிக்கையாளர் நகைகள் முழு காப்பீடு செய்யப்பட்ட பயோமெட்ரிக் கால-பூட்டு பெட்டகத்தில் வைக்கப்பட்டுள்ளன. சேதமின்றி முத்திரை சரிபார்ப்புடன் ஒப்படைக்க குறைந்தபட்சம் 24 மணி நேர முன்பதிவு அவசியமாகும்.'
                    : 'To ensure maximum security and tamper-proof custody, customer ornaments are held in biometric time-lock strongrooms. A 24-hour advance intimation allows our vault custodian team to retrieve and seal-verify your items.'}
                </p>
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>{language === 'ta' ? 'நேரில் வரும் தேதி' : 'Preferred Collection Date'}</span>
              </label>
              <input
                type="date"
                min={defaultDate}
                value={pickupDate}
                onChange={e => setPickupDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-amber-500 outline-hidden"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Minimum 24 hours required for vault staging
              </p>
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>{language === 'ta' ? 'விருப்பமான நேரம்' : 'Preferred Counter Time Slot'}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  'Morning (10 AM - 1 PM)',
                  'Afternoon (2 PM - 5 PM)',
                  'Evening (5 PM - 8 PM)'
                ].map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setPreferredTime(slot)}
                    className={`p-2.5 rounded-xl text-center font-bold text-[11px] border transition cursor-pointer ${
                      preferredTime === slot
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Customer Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {language === 'ta' ? 'கூடுதல் குறிப்புகள் (விருப்பத்தேர்வு)' : 'Special Request / Instructions (Optional)'}
              </label>
              <input
                type="text"
                value={customerNotes}
                onChange={e => setCustomerNotes(e.target.value)}
                placeholder="e.g. Will be bringing cash for full principal settlement"
                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800 focus:bg-white focus:border-amber-500 outline-hidden"
              />
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
              >
                {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 transition active:scale-98 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'ta' ? 'மீட்பு முன்பதிவு செய்க' : 'Confirm Retrieval Booking'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
