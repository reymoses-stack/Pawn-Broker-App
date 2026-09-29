import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { 
  UserPlus, X, Shield, KeyRound, Smartphone, 
  Mail, Sparkles, CheckCircle2, AlertCircle, Copy, Check
} from 'lucide-react';

interface CreateEmployeeModalProps {
  onClose: () => void;
}

export const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({ onClose }) => {
  const { createEmployeeAccount, currentBranch } = useApp();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('Temp@' + Math.floor(1000 + Math.random() * 9000));
  const [role, setRole] = useState<UserRole>('Cashier');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdSuccess, setCreatedSuccess] = useState<{
    name: string;
    username: string;
    password: string;
    role: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const generateRandomPassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setPassword(`Temp@${randomNum}`);
  };

  const handleAutoSuggestUsername = (fullName: string) => {
    setName(fullName);
    if (!username) {
      const slug = fullName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15);
      setUsername(slug);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !username.trim() || !password.trim() || !phone.trim()) {
      setErrorMessage('Please fill in all mandatory fields (Name, Username, Temporary Password, and Mobile).');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please provide a valid 10-digit mobile number for the employee.');
      return;
    }

    const res = createEmployeeAccount({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      password: password.trim(),
      role,
      phone: cleanPhone,
      email: email.trim() || `${username.trim().toLowerCase()}@nexusgold.com`,
      branchId: currentBranch.id
    });

    if (!res.success) {
      setErrorMessage(res.message || 'Failed to create employee account.');
      return;
    }

    setCreatedSuccess({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      password: password.trim(),
      role
    });
  };

  const handleCopyCredentials = () => {
    if (!createdSuccess) return;
    const text = `*Nexus Gold ERP — Employee Credentials*\nName: ${createdSuccess.name}\nRole: ${createdSuccess.role}\nUsername: ${createdSuccess.username}\nTemporary Password: ${createdSuccess.password}\nNote: You will be prompted to set your own password upon first login at the branch terminal.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-lg liquid-glass-modal rounded-3xl border border-amber-300/80 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-amber-200/60 bg-gradient-to-r from-amber-100/80 via-white/80 to-amber-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-950 flex items-center justify-center border border-amber-300">
              <UserPlus className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Create Employee Account</h3>
              <p className="text-[11px] text-slate-500">
                Generate staff login with mandatory first-login password change
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {createdSuccess ? (
            /* Success View with Copy Card */
            <div className="space-y-5 animate-in zoom-in-95">
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/60 text-emerald-950 space-y-1 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="font-extrabold text-base pt-1">Employee Account Created!</div>
                <p className="text-xs text-emerald-800">
                  Account is ready. Share these temporary login details with your staff member.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-200 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-amber-200/50">
                  <span className="text-slate-500">Employee Name:</span>
                  <span className="font-bold text-slate-900">{createdSuccess.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-amber-200/50">
                  <span className="text-slate-500">Assigned Role:</span>
                  <span className="font-bold text-amber-900">{createdSuccess.role}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-amber-200/50 font-mono">
                  <span className="text-slate-500">Login Username:</span>
                  <span className="font-bold text-slate-900 bg-white/80 px-2 py-0.5 rounded border border-amber-200">
                    {createdSuccess.username}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-amber-200/50 font-mono">
                  <span className="text-slate-500">Temporary Password:</span>
                  <span className="font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded border border-amber-300">
                    {createdSuccess.password}
                  </span>
                </div>
                <div className="py-1 text-[11px] text-slate-600 leading-relaxed italic">
                  🛡️ First Login: When {createdSuccess.name} logs in with these credentials, the system will immediately prompt them to set their own permanent password.
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="flex-1 py-2.5 rounded-xl liquid-glass-gold font-bold text-amber-950 border border-amber-300 shadow-sm flex items-center justify-center gap-2 text-xs transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-800" />
                      <span>Copy Login Credentials</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employee Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleAutoSuggestUsername(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200/80 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    System Username *
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="e.g. ramesh_cash"
                    required
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-amber-200/80 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assign Role & Permissions *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200/80 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-medium"
                  >
                    <option value="Cashier">Cashier (Payments & Pledges)</option>
                    <option value="Gold Appraiser">Gold Appraiser (Purity & Testing)</option>
                    <option value="KYC Staff">KYC Staff (Customer Reg & Camera)</option>
                    <option value="Manager">Manager (Branch Operations)</option>
                    <option value="Auditor">Auditor (Read-Only Logs & Ledger)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employee Mobile No *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500">+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98400 11223"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-amber-200/80 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Work Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh@nexusgold.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200/80 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Temporary Initial Password *
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate New</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold text-amber-950 rounded-xl border border-amber-200/80 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <KeyRound className="w-4 h-4 text-amber-700 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Security policy note */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-200 text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-700" />
                  <span>Mandatory First-Time Password Change</span>
                </div>
                <p className="leading-relaxed text-slate-600">
                  This temporary password is only for initial access. Upon first login, the employee must establish their private password before viewing customer or gold vault data.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl liquid-glass-gold font-bold text-amber-950 border border-amber-300 shadow-md hover:brightness-105 active:scale-[0.99] text-xs transition"
                >
                  Create Account & Generate Access
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
