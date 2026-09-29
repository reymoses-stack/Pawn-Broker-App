import React from 'react';
import { Branch } from '../types';
import { 
  Building2, Phone, Clock, MapPin, 
  ShieldCheck, Lock, Award, MessageCircle, CheckCircle2 
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface BranchVaultViewProps {
  branch: Branch;
  language: Language;
}

export const BranchVaultView: React.FC<BranchVaultViewProps> = ({
  branch,
  language
}) => {
  const t = translations[language];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-600" />
          <span>{t.tabBranch}</span>
        </h3>
        <p className="text-xs text-slate-500">
          {language === 'ta'
            ? 'அடமானக் கடை உரிமம், தொடர்பு மற்றும் நகை பாதுகாப்பு சான்றிதழ் விவரங்கள்'
            : 'Official pawnbroking license credentials, shop contact, and vault security standards'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Branch Card */}
        <div className="bg-white rounded-3xl p-6 border border-amber-200/90 shadow-md space-y-5">
          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">
                {branch.name}
              </h4>
              <p className="text-xs text-amber-900 font-mono font-bold">
                Branch Code: {branch.code}
              </p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 block font-semibold">{t.directions}</span>
                <span className="text-slate-800 font-medium">{branch.address}, {branch.city}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 block font-semibold">{language === 'ta' ? 'வேலை நேரம்' : 'Working Hours'}</span>
                <span className="text-slate-800 font-medium">{branch.workingHours}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Award className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 block font-semibold">{t.license}</span>
                <span className="font-mono text-emerald-800 font-bold">{branch.licenseNumber}</span>
                <span className="text-slate-400 block text-[10px]">Income Tax PAN: {branch.panNumber}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 block font-semibold">{language === 'ta' ? 'அதிகாரப்பூர்வ மேலாளர்' : 'Branch Head'}</span>
                <span className="text-slate-900 font-bold">{branch.managerName}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="pt-2 grid grid-cols-2 gap-3">
            <a
              href={`tel:${branch.phone}`}
              className="py-3 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Phone className="w-4 h-4" />
              <span>{t.callBranch}</span>
            </a>

            <a
              href={`https://wa.me/${branch.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello, I would like to inquire about my gold loan account.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t.chatWhatsapp}</span>
            </a>
          </div>
        </div>

        {/* Security & Vault Custody Guarantee Card */}
        <div className="bg-white rounded-3xl p-6 border border-amber-200/90 shadow-md space-y-5">
          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">
                {language === 'ta' ? 'வங்கித் தர பெட்டகப் பாதுகாப்பு' : 'Bank-Grade Vault Security'}
              </h4>
              <p className="text-xs text-emerald-700 font-bold">
                100% Insured Underwritten Custody
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">
                  {language === 'ta' ? 'தீ மற்றும் கொள்ளை தடுப்பு பெட்டகம்' : 'Fireproof & Reinforced Safe Vaults'}
                </strong>
                <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                  {language === 'ta'
                    ? 'அனைத்து தங்க நகைகளும் இந்திய தர நிர்ணய சான்றிதழ் பெற்ற பாதுகாப்பு பெட்டகத்தில் தனித்தனி பாக்கெட்டுகளில் சீல் வைக்கப்பட்டுள்ளது.'
                    : 'Each ornament packet is individually weighed, sealed in tamper-evident security pouches, and stored in certified reinforced vaults.'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">
                  {language === 'ta' ? '24/7 சிசிடிவி & காப்பீட்டு பாதுகாப்பு' : 'Full Insurance Coverage & 24/7 CCTV'}
                </strong>
                <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                  {language === 'ta'
                    ? 'நகையின் சந்தை மதிப்பு முழுமையாக அரசு விதிகளின்படி காப்பீடு செய்யப்பட்டுள்ளது.'
                    : 'Insured against all transit, burglary, and natural perils up to 100% of market valuation.'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">
                  {language === 'ta' ? 'அசல் நகைகள் ஒப்படைப்பு உறுதிமொழி' : 'Guaranteed Exact Ornament Release'}
                </strong>
                <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                  {language === 'ta'
                    ? 'கடன் தொகையை செலுத்திய உடனேயே உங்கள் தாலி, சங்கிலி அல்லது வளையல்கள் அப்படியே உங்கள் கைகளில் ஒப்படைக்கப்படும்.'
                    : 'Upon full principal and interest settlement with your original ticket, your pledged gold is verified and released directly to you in minutes.'}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
