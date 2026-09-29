import React, { useState } from 'react';
import { DoorstepPincodeManager } from './DoorstepPincodeManager';
import { useApp } from '../../context/AppContext';
import { BusinessSettings, BankAccount, Branch } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { calculateIndianGoldRates } from '../../utils/goodReturnsService';
import { 
  Settings, Gem, Percent, Hash, 
  Database, Download, Upload, RotateCcw, 
  CheckCircle2, Save, AlertCircle, Calculator,
  Landmark, Building2, ArrowLeftRight, CreditCard,
  Plus, Trash2, Edit3, Eye, EyeOff, Check, X,
  ShieldCheck, ArrowRight, ArrowDownLeft, ArrowUpRight,
  Wallet, Truck
} from 'lucide-react';

const COMMON_BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Indian Bank',
  'Canara Bank',
  'Axis Bank',
  'Bank of Baroda',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Union Bank of India',
  'Karur Vysya Bank',
  'City Union Bank',
  'Federal Bank',
  'Other Bank'
];

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    exportDatabaseJson, 
    importDatabaseJson, 
    resetToDefaults,
    interestRules,
    currentBranch,
    branches,
    addBranch,
    updateBranch,
    bankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    transferBetweenBranches,
    ledger,
    mortgages,
    language 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'general' | 'bank_accounts' | 'branches' | 'doorstep' | 'database'>('general');

  const [formSettings, setFormSettings] = useState<BusinessSettings>(() => ({
    ...settings,
    goldRates: settings.goldRates || {
      '24K': 7920,
      '22K': 7260,
      '20K': 6600,
      '18K': 5940,
      '14K': 4620
    }
  }));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Bank Account Modal State
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState({
    bankName: 'State Bank of India',
    customBankName: '',
    accountHolder: 'Nexus Gold Pawn Brokers',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    branchName: '',
    accountType: 'Current' as 'Current' | 'Savings' | 'OD / CC',
    balance: 0,
    assignedBranchId: 'all',
    isDefault: false
  });
  const [bankFormError, setBankFormError] = useState<string | null>(null);

  // Branch Modal State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    address: '',
    city: 'Chennai',
    phone: '',
    email: '',
    panNumber: '',
    licenseNumber: '',
    openingCash: 50000,
    assignedBankAccountIds: [] as string[]
  });
  const [branchFormError, setBranchFormError] = useState<string | null>(null);

  // Inter-Branch Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    sourceBranchId: currentBranch.id,
    sourceAccountType: 'Cash' as 'Cash' | 'Bank',
    sourceBankAccountId: '',
    targetBranchId: branches.find(b => b.id !== currentBranch.id)?.id || '',
    targetAccountType: 'Cash' as 'Cash' | 'Bank',
    targetBankAccountId: '',
    amount: '',
    remarks: ''
  });
  const [transferStatus, setTransferStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Calculate branch balances for transfers
  const getBranchBalance = (branchId: string, accountType: 'Cash' | 'Bank') => {
    const entries = ledger.filter(l => l.branchId === branchId && l.account === accountType);
    return entries.reduce((acc, curr) => curr.type === 'Credit' ? acc + curr.amount : acc - curr.amount, 0);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportBackup = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nexus_Gold_OS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const ok = importDatabaseJson(content);
        if (ok) {
          setImportStatus('Database successfully restored from JSON backup!');
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          alert('Failed to parse backup JSON. Please check file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all data back to the clean seed dataset? All temporary tests will be restored.')) {
      resetToDefaults();
      window.location.reload();
    }
  };

  // Open Bank Modal for Create or Edit
  const openBankModal = (account?: BankAccount) => {
    setBankFormError(null);
    if (account) {
      setEditingBankId(account.id);
      const isKnown = COMMON_BANKS.includes(account.bankName);
      setBankForm({
        bankName: isKnown ? account.bankName : 'Other Bank',
        customBankName: isKnown ? '' : account.bankName,
        accountHolder: account.accountHolder,
        accountNumber: account.accountNumber,
        confirmAccountNumber: account.accountNumber,
        ifscCode: account.ifscCode,
        branchName: account.branchName,
        accountType: account.accountType,
        balance: account.balance,
        assignedBranchId: account.assignedBranchId || 'all',
        isDefault: !!account.isDefault
      });
    } else {
      setEditingBankId(null);
      setBankForm({
        bankName: 'State Bank of India',
        customBankName: '',
        accountHolder: 'Nexus Gold Pawn Brokers',
        accountNumber: '',
        confirmAccountNumber: '',
        ifscCode: 'SBIN00',
        branchName: '',
        accountType: 'Current',
        balance: 100000,
        assignedBranchId: 'all',
        isDefault: bankAccounts.length === 0
      });
    }
    setIsBankModalOpen(true);
  };

  // Save Bank Account
  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    setBankFormError(null);

    const actualBankName = bankForm.bankName === 'Other Bank' ? bankForm.customBankName.trim() : bankForm.bankName;
    if (!actualBankName) {
      setBankFormError(language === 'ta' ? 'வங்கியின் பெயரை உள்ளிடவும்.' : 'Please enter bank name.');
      return;
    }

    if (!bankForm.accountNumber || bankForm.accountNumber.length < 8) {
      setBankFormError(language === 'ta' ? 'சரியான வங்கி கணக்கு எண்ணை உள்ளிடவும்.' : 'Please enter a valid bank account number.');
      return;
    }

    if (!editingBankId && bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      setBankFormError(language === 'ta' ? 'வங்கி கணக்கு எண்கள் பொருந்தவில்லை.' : 'Bank account numbers do not match.');
      return;
    }

    if (!bankForm.ifscCode || bankForm.ifscCode.length < 9) {
      setBankFormError(language === 'ta' ? 'சரியான IFSC குறியீட்டை உள்ளிடவும்.' : 'Please enter a valid IFSC code (e.g. SBIN0001234).');
      return;
    }

    const payload = {
      bankName: actualBankName,
      accountHolder: bankForm.accountHolder.trim(),
      accountNumber: bankForm.accountNumber.trim(),
      ifscCode: bankForm.ifscCode.toUpperCase().trim(),
      branchName: bankForm.branchName.trim(),
      accountType: bankForm.accountType,
      balance: Number(bankForm.balance) || 0,
      assignedBranchId: bankForm.assignedBranchId,
      isDefault: bankForm.isDefault
    };

    if (editingBankId) {
      updateBankAccount(editingBankId, payload);
    } else {
      addBankAccount(payload);
    }

    setIsBankModalOpen(false);
  };

  // Open Branch Modal for Create or Edit
  const openBranchModal = (br?: Branch) => {
    setBranchFormError(null);
    if (br) {
      setEditingBranchId(br.id);
      setBranchForm({
        name: br.name,
        code: br.code,
        address: br.address,
        city: br.city || 'Chennai',
        phone: br.phone,
        email: br.email,
        panNumber: br.panNumber,
        licenseNumber: br.licenseNumber,
        openingCash: br.openingCash || 0,
        assignedBankAccountIds: br.assignedBankAccountIds || []
      });
    } else {
      setEditingBranchId(null);
      const nextCode = `BR-0${branches.length + 1}`;
      setBranchForm({
        name: '',
        code: nextCode,
        address: '',
        city: 'Chennai',
        phone: '+91 ',
        email: '',
        panNumber: currentBranch.panNumber || 'AAACN1234F',
        licenseNumber: `TN-PBN-2026-00${branches.length + 1}`,
        openingCash: 100000,
        assignedBankAccountIds: bankAccounts.filter(b => b.isDefault).map(b => b.id)
      });
    }
    setIsBranchModalOpen(true);
  };

  // Save Branch
  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    setBranchFormError(null);

    if (!branchForm.name.trim()) {
      setBranchFormError(language === 'ta' ? 'கிளையின் பெயரை உள்ளிடவும்.' : 'Please enter branch name.');
      return;
    }
    if (!branchForm.code.trim()) {
      setBranchFormError(language === 'ta' ? 'கிளை குறியீட்டை உள்ளிடவும்.' : 'Please enter branch code (e.g. TBM-02).');
      return;
    }

    const payload = {
      name: branchForm.name.trim(),
      code: branchForm.code.trim().toUpperCase(),
      address: branchForm.address.trim(),
      city: branchForm.city.trim(),
      phone: branchForm.phone.trim(),
      email: branchForm.email.trim(),
      panNumber: branchForm.panNumber.trim().toUpperCase(),
      licenseNumber: branchForm.licenseNumber.trim(),
      assignedBankAccountIds: branchForm.assignedBankAccountIds,
      openingCash: Number(branchForm.openingCash) || 0
    };

    if (editingBranchId) {
      updateBranch(editingBranchId, payload);
    } else {
      addBranch(payload);
    }

    setIsBranchModalOpen(false);
  };

  // Execute Inter-Branch Transfer
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferStatus(null);

    const amountNum = Number(transferForm.amount);
    if (!amountNum || amountNum <= 0) {
      setTransferStatus({ success: false, message: 'Please enter a valid amount greater than 0.' });
      return;
    }

    if (transferForm.sourceBranchId === transferForm.targetBranchId) {
      setTransferStatus({ success: false, message: 'Source and target branches cannot be the same.' });
      return;
    }

    const res = transferBetweenBranches({
      sourceBranchId: transferForm.sourceBranchId,
      targetBranchId: transferForm.targetBranchId,
      sourceAccountType: transferForm.sourceAccountType,
      targetAccountType: transferForm.targetAccountType,
      sourceBankAccountId: transferForm.sourceAccountType === 'Bank' ? transferForm.sourceBankAccountId : undefined,
      targetBankAccountId: transferForm.targetAccountType === 'Bank' ? transferForm.targetBankAccountId : undefined,
      amount: amountNum,
      remarks: transferForm.remarks
    });

    setTransferStatus(res);
    if (res.success) {
      setTimeout(() => {
        setIsTransferModalOpen(false);
        setTransferStatus(null);
        setTransferForm(prev => ({ ...prev, amount: '', remarks: '' }));
      }, 1500);
    }
  };

  // Recent Inter-Branch Transfers from Ledger
  const recentTransfers = ledger
    .filter(l => l.category === 'Internal Branch Transfer Out' || l.category === 'Internal Branch Transfer In')
    .slice(0, 10);

  return (
    <div className="space-y-6 pb-12 text-slate-800">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 liquid-glass-card p-5 rounded-3xl border border-amber-200/70 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
            <Settings className="w-5 h-5 text-amber-600" />
            <span>{language === 'ta' ? 'கடை அமைப்புகள் & மேலாண்மை' : 'Shop Settings & Administration'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ta' 
              ? 'பல வங்கிக் கணக்குகள், கிளைகள், நிதிப் பரிமாற்றங்கள் மற்றும் காப்புப்பிரதி அமைப்புகள்.' 
              : 'Multi-bank accounts, branch management, internal fund transfers & system parameters.'}
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold animate-in fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{language === 'ta' ? 'அமைப்புகள் சேமிக்கப்பட்டது!' : 'Configuration Saved & Audited'}</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-amber-200/60 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeTab === 'general'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
          }`}
        >
          <Gem className="w-4 h-4" />
          <span>{language === 'ta' ? 'தங்க விலை & விதிககள்' : 'General & Gold Rates'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bank_accounts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeTab === 'bank_accounts'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>{language === 'ta' ? 'வங்கி கணக்குகள்' : 'Bank Accounts'}</span>
          <span className="bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
            {bankAccounts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branches')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeTab === 'branches'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{language === 'ta' ? 'கிளைகள் & உள் பரிமாற்றம்' : 'Branches & Transfers'}</span>
          <span className="bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
            {branches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('doorstep')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeTab === 'doorstep'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-blue-50'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>{language === 'ta' ? 'வீட்டு சேவை பகுதிகள்' : 'Doorstep Service'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeTab === 'database'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-amber-50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>{language === 'ta' ? 'தரவு காப்புப்பிரதி (Backup)' : 'Backup & Disaster Recovery'}</span>
        </button>
      </div>


      {/* TAB 1: GENERAL & GOLD RULES */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="space-y-6 text-xs text-slate-700 animate-in fade-in duration-150">
          
          {/* 1. Live Gold Market Bullion Rates */}
          <div className="p-6 liquid-glass-card border border-amber-200/80 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-amber-800 font-bold">
              <Gem className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-black text-slate-900">
                {language === 'ta' ? 'தங்க விலை விகிதம் (₹ / கிராம்)' : 'Live Gold Market Rates (₹ / Gram)'}
              </h3>
            </div>
            <p className="text-slate-500">
              {language === 'ta'
                ? `தற்போதைய கிளை ${currentBranch.name}-ல் கணக்கிடப்படும் அடிப்படை தங்க விலைகள்.`
                : `Fallback base rates applied across mortgage calculations in ${currentBranch.name}. (Live rates automatically synced via GoodReturns feed).`}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(['24K', '22K', '20K', '18K', '14K'] as const).map(purity => (
                <div key={purity} className={`p-3 rounded-2xl border shadow-xs ${
                  purity === '24K' 
                    ? 'bg-amber-100/70 border-amber-400' 
                    : 'bg-white/90 border-amber-200/70'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] text-slate-700 font-extrabold uppercase">
                      {purity} Gold {purity === '24K' && '(Base)'}
                    </label>
                    {purity !== '24K' && (
                      <span className="text-[9px] text-amber-800 font-mono font-semibold">
                        {purity === '22K' ? '91.67%' : purity === '20K' ? '83.33%' : purity === '18K' ? '75%' : '58.3%'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">₹</span>
                    <input
                      type="number"
                      value={formSettings.goldRates?.[purity] || 7260}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (purity === '24K' && val > 0) {
                          const calculated = calculateIndianGoldRates(val);
                          setFormSettings({
                            ...formSettings,
                            goldRates: {
                              ...(formSettings.goldRates || {}),
                              '24K': val,
                              '22K': calculated['22K'],
                              '20K': calculated['20K'],
                              '18K': calculated['18K'],
                              '14K': calculated['14K']
                            }
                          });
                        } else {
                          setFormSettings({
                            ...formSettings,
                            goldRates: {
                              ...(formSettings.goldRates || {
                                '24K': 7920,
                                '22K': 7260,
                                '20K': 6600,
                                '18K': 5940,
                                '14K': 4620
                              }),
                              [purity]: val
                            }
                          });
                        }
                      }}
                      className="w-full pl-6 pr-2 py-1.5 bg-amber-50/50 border border-amber-200/80 rounded-xl text-amber-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Standard Loan-to-Value (LTV %)</label>
                <input
                  type="number"
                  max={85}
                  min={50}
                  value={formSettings.defaultLtv}
                  onChange={(e) => setFormSettings({ ...formSettings, defaultLtv: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white/90 border border-amber-200/80 rounded-xl text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Statutory regulatory standard is typically 70% to 75%.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Interest Scheme</label>
                <select
                  value={formSettings.defaultInterestRuleId}
                  onChange={(e) => setFormSettings({ ...formSettings, defaultInterestRuleId: e.target.value })}
                  className="w-full px-3 py-2 bg-white/90 border border-amber-200/80 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                >
                  {interestRules.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Document Numbering Prefixes */}
          <div className="p-6 liquid-glass-card border border-amber-200/80 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-blue-800 font-bold">
              <Hash className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black text-slate-900">Document Numbering Prefixes</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Customer Prefix</label>
                <input
                  type="text"
                  value={formSettings.prefixes.customer}
                  onChange={(e) => setFormSettings({ ...formSettings, prefixes: { ...formSettings.prefixes, customer: e.target.value } })}
                  className="w-full px-3 py-1.5 bg-white/90 border border-amber-200/80 rounded-xl text-slate-800 font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Mortgage Prefix</label>
                <input
                  type="text"
                  value={formSettings.prefixes.mortgage}
                  onChange={(e) => setFormSettings({ ...formSettings, prefixes: { ...formSettings.prefixes, mortgage: e.target.value } })}
                  className="w-full px-3 py-1.5 bg-white/90 border border-amber-200/80 rounded-xl text-slate-800 font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Packet Prefix</label>
                <input
                  type="text"
                  value={formSettings.prefixes.packet}
                  onChange={(e) => setFormSettings({ ...formSettings, prefixes: { ...formSettings.prefixes, packet: e.target.value } })}
                  className="w-full px-3 py-1.5 bg-white/90 border border-amber-200/80 rounded-xl text-slate-800 font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-semibold mb-1">Receipt Prefix</label>
                <input
                  type="text"
                  value={formSettings.prefixes.receipt}
                  onChange={(e) => setFormSettings({ ...formSettings, prefixes: { ...formSettings.prefixes, receipt: e.target.value } })}
                  className="w-full px-3 py-1.5 bg-white/90 border border-amber-200/80 rounded-xl text-slate-800 font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Company Branding Details */}
          <div className="p-6 liquid-glass-card border border-amber-200/80 rounded-3xl shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900">Pawn Brokerage Branding</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Firm Name</label>
                <input
                  type="text"
                  value={formSettings.companyName}
                  onChange={(e) => setFormSettings({ ...formSettings, companyName: e.target.value })}
                  className="w-full px-3 py-2 bg-white/90 border border-amber-200/80 rounded-xl text-slate-800 font-bold focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={formSettings.tagline}
                  onChange={(e) => setFormSettings({ ...formSettings, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-white/90 border border-amber-200/80 rounded-xl text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Thermal Receipt Header</label>
              <textarea
                rows={3}
                value={formSettings.thermalReceiptHeader}
                onChange={(e) => setFormSettings({ ...formSettings, thermalReceiptHeader: e.target.value })}
                className="w-full px-3 py-2 bg-white/90 border border-amber-200/80 rounded-xl text-slate-800 font-mono focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-md shadow-amber-500/20 transition"
              >
                <Save className="w-4 h-4" />
                <span>Save System Settings</span>
              </button>
            </div>
          </div>

        </form>
      )}

      {/* TAB 2: BANK ACCOUNTS MANAGEMENT */}
      {activeTab === 'bank_accounts' && (
        <div className="space-y-6 text-xs text-slate-700 animate-in fade-in duration-150">
          
          {/* Top Bar with Add Bank Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 liquid-glass-card rounded-3xl border border-amber-200/80 shadow-xs">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-blue-600" />
                <span>{language === 'ta' ? 'அங்கீகரிக்கப்பட்ட வங்கிக் கணக்குகள்' : 'Registered Commercial Bank Accounts'}</span>
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {language === 'ta'
                  ? 'கடன் வழங்கல், வசூல் மற்றும் கிளை நிதிப் பரிமாற்றங்களுக்கான வணிக வங்கிகள்.'
                  : 'Manage multiple bank accounts, IFSC codes, balances, and branch assignments for disbursements & Khatabook.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => openBankModal()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ta' ? '+ புதிய வங்கிக் கணக்கு' : '+ Add Bank Account'}</span>
            </button>
          </div>

          {/* Bank Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map(account => {
              const assignedBranch = branches.find(b => b.id === account.assignedBranchId);
              return (
                <div 
                  key={account.id}
                  className="liquid-glass-card p-5 rounded-3xl border border-amber-200/80 shadow-xs relative flex flex-col justify-between space-y-4 hover:border-amber-400 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold shadow-2xs">
                          <Landmark className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                            {account.bankName}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {account.branchName || 'Main Branch'}
                          </span>
                        </div>
                      </div>

                      {account.isDefault && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                          DEFAULT
                        </span>
                      )}
                    </div>

                    <div className="mt-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-1.5 font-mono">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 uppercase text-[9px] font-sans font-bold">A/C Number:</span>
                        <span className="font-bold text-slate-800">
                          •••• •••• {account.accountNumber.slice(-4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 uppercase text-[9px] font-sans font-bold">IFSC Code:</span>
                        <span className="font-bold text-slate-700">{account.ifscCode}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 uppercase text-[9px] font-sans font-bold">A/C Type:</span>
                        <span className="text-slate-700 font-sans font-semibold">{account.accountType}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {language === 'ta' ? 'கிளை:' : 'Branch:'}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                        {account.assignedBranchId === 'all' ? 'All Branches' : assignedBranch?.name || account.assignedBranchId}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-amber-100 flex items-center justify-between">
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase font-bold">Current Balance</div>
                      <div className="text-base font-black font-mono text-emerald-700">
                        {formatCurrency(account.balance)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openBankModal(account)}
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 transition"
                        title="Edit Bank Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete bank account ${account.bankName} (${account.accountNumber})?`)) {
                            deleteBankAccount(account.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition"
                        title="Delete Bank Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* TAB 3: BRANCHES & INTER-BRANCH FUND TRANSFERS */}
      {activeTab === 'branches' && (
        <div className="space-y-6 text-xs text-slate-700 animate-in fade-in duration-150">
          
          {/* Top Bar with Add Branch & Transfer Funds Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 liquid-glass-card rounded-3xl border border-amber-200/80 shadow-xs">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>{language === 'ta' ? 'வணிக கிளைகள் மற்றும் நிதி பரிமாற்றம்' : 'Branch Network & Fund Orchestration'}</span>
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {language === 'ta'
                  ? 'புதிய கிளைகளை உருவாக்கவும், வங்கிக் கணக்குகளை ஒதுக்கவும் மற்றும் கிளைகளுக்கு இடையே நிதி பரிமாறவும்.'
                  : 'Create pawnshop branches, assign bank accounts, and execute internal double-entry fund transfers.'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>{language === 'ta' ? '↔ நிதி பரிமாற்றம்' : '↔ Transfer Funds Between Branches'}</span>
              </button>

              <button
                type="button"
                onClick={() => openBranchModal()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-md shadow-amber-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ta' ? '+ புதிய கிளை' : '+ Add New Branch'}</span>
              </button>
            </div>
          </div>

          {/* Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map(br => {
              const isCurrent = br.id === currentBranch.id;
              const branchActiveMortgages = mortgages.filter(m => m.branchId === br.id && (m.status === 'Active' || m.status === 'Due' || m.status === 'Overdue'));
              const branchCash = getBranchBalance(br.id, 'Cash');
              const branchBank = getBranchBalance(br.id, 'Bank');

              const assignedBankAccounts = bankAccounts.filter(ba => 
                ba.assignedBranchId === 'all' || ba.assignedBranchId === br.id || (br.assignedBankAccountIds && br.assignedBankAccountIds.includes(ba.id))
              );

              return (
                <div 
                  key={br.id}
                  className={`p-5 rounded-3xl border transition shadow-xs space-y-4 ${
                    isCurrent 
                      ? 'bg-gradient-to-br from-amber-500/10 via-white to-amber-50 border-amber-400' 
                      : 'bg-white border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black flex items-center justify-center shadow-sm text-sm">
                        {br.code}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            {br.name}
                          </h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-slate-950 border border-amber-400">
                              ACTIVE SESSION
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {br.address}, {br.city} • 📞 {br.phone}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openBranchModal(br)}
                      className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl border border-slate-200 transition"
                      title="Edit Branch"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Operational Metrics */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white/80 border border-amber-200/60 text-center font-mono">
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase font-sans font-bold">Active Loans</div>
                      <div className="text-xs font-black text-slate-900 mt-0.5">{branchActiveMortgages.length}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase font-sans font-bold">Cash Drawer</div>
                      <div className="text-xs font-black text-emerald-700 mt-0.5">{formatCurrency(branchCash)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase font-sans font-bold">Bank Balance</div>
                      <div className="text-xs font-black text-blue-700 mt-0.5">{formatCurrency(branchBank)}</div>
                    </div>
                  </div>

                  {/* Assigned Bank Accounts */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">
                      {language === 'ta' ? 'இணைக்கப்பட்ட வங்கிக் கணக்குகள்:' : 'Assigned Bank Accounts:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {assignedBankAccounts.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">No specific accounts assigned</span>
                      ) : (
                        assignedBankAccounts.map(ba => (
                          <span 
                            key={ba.id} 
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1"
                          >
                            <Landmark className="w-3 h-3 text-blue-600" />
                            <span>{ba.bankName} (••{ba.accountNumber.slice(-4)})</span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Statutory Info */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>License: {br.licenseNumber}</span>
                    <span>PAN: {br.panNumber}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Inter-Branch Transfers History */}
          <div className="p-6 liquid-glass-card border border-amber-200/80 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
                <span>{language === 'ta' ? 'சமீபத்திய கிளை நிதி பரிமாற்றங்கள்' : 'Recent Inter-Branch Fund Transfers'}</span>
              </h4>
              <span className="text-[11px] text-slate-400">Double-entry verified</span>
            </div>

            {recentTransfers.length === 0 ? (
              <p className="text-slate-400 text-center py-6">No inter-branch transfers recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {recentTransfers.map(trf => {
                  const isOut = trf.category === 'Internal Branch Transfer Out';
                  const br = branches.find(b => b.id === trf.branchId);
                  return (
                    <div 
                      key={trf.id}
                      className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl border ${
                          isOut ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}>
                          {isOut ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900">
                            {trf.description}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {formatDate(trf.date)} • Branch: {br?.name || trf.branchId} • Mode: {trf.account}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-mono font-black text-sm ${
                          isOut ? 'text-rose-700' : 'text-emerald-700'
                        }`}>
                          {isOut ? '-' : '+'}{formatCurrency(trf.amount)}
                        </span>
                        <div className="text-[9px] text-slate-400 font-mono">{trf.referenceId}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 5: DOORSTEP SERVICE PINCODES */}
      {activeTab === 'doorstep' && (
        <div className="animate-in fade-in duration-150">
          <DoorstepPincodeManager />
        </div>
      )}

      {/* TAB 4: DATABASE BACKUP & RESTORE */}
      {activeTab === 'database' && (
        <div className="p-6 liquid-glass-card border border-amber-200/80 rounded-3xl shadow-xs space-y-4 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-cyan-800 font-bold">
            <Database className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm font-black text-slate-900">Database Backup & Disaster Recovery (JSON)</h3>
          </div>
          <p className="text-slate-500">
            Export your complete operational state including customer KYC, active pledges, vault packets, Khatabook ledger, multi-bank accounts, and branch records.
          </p>

          {importStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{importStatus}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/90 hover:bg-white text-slate-800 font-bold rounded-xl border border-amber-200/80 shadow-xs transition"
            >
              <Download className="w-4 h-4 text-amber-600" />
              <span>Export Database JSON Backup</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2.5 bg-white/90 hover:bg-white text-slate-800 font-bold rounded-xl border border-amber-200/80 shadow-xs cursor-pointer transition">
              <Upload className="w-4 h-4 text-cyan-600" />
              <span>Restore from JSON File</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-300 ml-auto transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Clean Seed Data</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT BANK ACCOUNT */}
      {/* ========================================================================= */}
      {isBankModalOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="liquid-glass-modal border border-amber-200/90 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col bg-white">
            
            <div className="p-4 bg-gradient-to-r from-blue-500/10 via-white to-indigo-500/10 border-b border-amber-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 font-bold">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {editingBankId ? (language === 'ta' ? 'வங்கிக் கணக்கை திருத்துக' : 'Edit Bank Account') : (language === 'ta' ? 'புதிய வங்கிக் கணக்கு சேர்க்க' : 'Register New Bank Account')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'ta' ? 'அனைத்து வணிகக் கணக்கு விவரங்களையும் பூர்த்தி செய்க' : 'Commercial banking and IFSC code verification'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="p-5 space-y-4 text-xs">
              
              {bankFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bankFormError}</span>
                </div>
              )}

              {/* Bank Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Bank Name (வங்கி பெயர்) *
                </label>
                <select
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                >
                  {COMMON_BANKS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                {bankForm.bankName === 'Other Bank' && (
                  <input
                    type="text"
                    placeholder="Enter custom bank name..."
                    value={bankForm.customBankName}
                    onChange={(e) => setBankForm({ ...bankForm, customBankName: e.target.value })}
                    className="w-full mt-2 px-3 py-2 bg-white border border-amber-300 rounded-xl text-slate-800 font-medium focus:outline-none"
                    required
                  />
                )}
              </div>

              {/* Account Holder */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Account Holder Name (கணக்கு வைத்திருப்பவர்) *
                </label>
                <input
                  type="text"
                  value={bankForm.accountHolder}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none"
                  required
                />
              </div>

              {/* Account Number & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                    placeholder="e.g. 50200012345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold focus:outline-none"
                    required
                  />
                </div>

                {!editingBankId && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Confirm Account Number *
                    </label>
                    <input
                      type="text"
                      value={bankForm.confirmAccountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, confirmAccountNumber: e.target.value.replace(/\D/g, '') })}
                      placeholder="Re-type account number"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold focus:outline-none"
                      required
                    />
                  </div>
                )}
              </div>

              {/* IFSC & Bank Branch Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    value={bankForm.ifscCode}
                    onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. SBIN0001234"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold uppercase focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Bank Branch Name
                  </label>
                  <input
                    type="text"
                    value={bankForm.branchName}
                    onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                    placeholder="e.g. T. Nagar Branch"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Account Type & Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Account Type *
                  </label>
                  <select
                    value={bankForm.accountType}
                    onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none"
                  >
                    <option value="Current">Current Account (நடப்புக் கணக்கு)</option>
                    <option value="Savings">Savings Account (சேமிப்புக் கணக்கு)</option>
                    <option value="OD / CC">Overdraft / Cash Credit (OD/CC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Current Balance (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={bankForm.balance}
                    onChange={(e) => setBankForm({ ...bankForm, balance: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Assigned Shop Branch */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Assign to Shop Branch (கிளை ஒதுக்கீடு)
                </label>
                <select
                  value={bankForm.assignedBranchId}
                  onChange={(e) => setBankForm({ ...bankForm, assignedBranchId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none"
                >
                  <option value="all">All Branches (அனைத்து கிளைகளும்)</option>
                  {branches.map(br => (
                    <option key={br.id} value={br.id}>{br.name} ({br.code})</option>
                  ))}
                </select>
              </div>

              {/* Is Default Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultBank"
                  checked={bankForm.isDefault}
                  onChange={(e) => setBankForm({ ...bankForm, isDefault: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="isDefaultBank" className="text-slate-700 font-bold cursor-pointer">
                  Set as Primary / Default Account for Counter Disbursements & Collections
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20"
                >
                  {editingBankId ? 'Update Bank Account' : 'Save Bank Account'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT BRANCH */}
      {/* ========================================================================= */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="liquid-glass-modal border border-amber-200/90 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col bg-white">
            
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-white to-yellow-500/10 border-b border-amber-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-600 text-slate-950 flex items-center justify-center shadow-md shadow-amber-600/30 font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {editingBranchId ? (language === 'ta' ? 'கிளை விவரங்களை திருத்துக' : 'Edit Branch Details') : (language === 'ta' ? 'புதிய கிளை உருவாக்குதல்' : 'Create New Shop Branch')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'ta' ? 'அடமான உரிமம் மற்றும் இருப்பிட விவரங்கள்' : 'Pawnbroker licensing, code & assigned accounts'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBranchModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="p-5 space-y-4 text-xs">
              
              {branchFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{branchFormError}</span>
                </div>
              )}

              {/* Branch Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Branch Name (கிளையின் பெயர்) *
                  </label>
                  <input
                    type="text"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    placeholder="e.g. Tambaram West Branch"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Branch Code *
                  </label>
                  <input
                    type="text"
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. TBM-02"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold uppercase focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Address & City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Street Address (முகவரி)
                  </label>
                  <input
                    type="text"
                    value={branchForm.address}
                    onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                    placeholder="e.g. 15 GST Road, Market Corner"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    City (நகரம்)
                  </label>
                  <input
                    type="text"
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Branch Contact Phone
                  </label>
                  <input
                    type="text"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    placeholder="+91 44 2226 7890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Branch Email
                  </label>
                  <input
                    type="email"
                    value={branchForm.email}
                    onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                    placeholder="branch@nexusgold.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* License & PAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Pawnbroker License Number
                  </label>
                  <input
                    type="text"
                    value={branchForm.licenseNumber}
                    onChange={(e) => setBranchForm({ ...branchForm, licenseNumber: e.target.value })}
                    placeholder="TN-PBN-2026-002"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Firm PAN Number
                  </label>
                  <input
                    type="text"
                    value={branchForm.panNumber}
                    onChange={(e) => setBranchForm({ ...branchForm, panNumber: e.target.value.toUpperCase() })}
                    placeholder="AAACN1234F"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono uppercase focus:outline-none"
                  />
                </div>
              </div>

              {/* Opening Cash Drawer */}
              {!editingBranchId && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Opening Cash Drawer Capital (தொடக்க கல்லா ரொக்கம் ₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={branchForm.openingCash}
                    onChange={(e) => setBranchForm({ ...branchForm, openingCash: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Automatically initializes the cash drawer ledger balance for this branch.
                  </span>
                </div>
              )}

              {/* Assign Bank Accounts */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Assign Bank Accounts to this Branch:
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {bankAccounts.map(ba => {
                    const checked = branchForm.assignedBankAccountIds.includes(ba.id);
                    return (
                      <label key={ba.id} className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-amber-50/50">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBranchForm({ ...branchForm, assignedBankAccountIds: [...branchForm.assignedBankAccountIds, ba.id] });
                            } else {
                              setBranchForm({ ...branchForm, assignedBankAccountIds: branchForm.assignedBankAccountIds.filter(id => id !== ba.id) });
                            }
                          }}
                          className="w-4 h-4 text-amber-600 rounded"
                        />
                        <span className="font-bold text-slate-800 text-[11px]">{ba.bankName}</span>
                        <span className="text-slate-400 font-mono text-[10px]">(••{ba.accountNumber.slice(-4)})</span>
                        <span className="ml-auto font-mono text-[10px] text-emerald-700 font-bold">{formatCurrency(ba.balance)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  {editingBranchId ? 'Update Branch' : 'Create Branch'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INTER-BRANCH FUND TRANSFER */}
      {/* ========================================================================= */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="liquid-glass-modal border border-amber-200/90 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col bg-white">
            
            <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-white to-teal-500/10 border-b border-amber-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 font-bold">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {language === 'ta' ? 'கிளைகளுக்கு இடையிலான நிதி பரிமாற்றம்' : 'Internal Inter-Branch Fund Transfer'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'ta' ? 'இருமுறை உள்ளீட்டு கணக்கு பதிவு (Double-Entry Debit & Credit)' : 'Section 24: Direct double-entry cash drawer & bank rebalancing'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-5 space-y-4 text-xs">
              
              {transferStatus && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                  transferStatus.success 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}>
                  {transferStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                  <span className="font-medium">{transferStatus.message}</span>
                </div>
              )}

              {/* Source Branch & Account */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <div className="text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                  <span>1. Source Branch (பணம் எடுக்கும் கிளை)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Select Branch</label>
                    <select
                      value={transferForm.sourceBranchId}
                      onChange={(e) => setTransferForm({ ...transferForm, sourceBranchId: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl text-slate-800 font-bold focus:outline-none"
                    >
                      {branches.map(br => (
                        <option key={br.id} value={br.id}>{br.name} ({br.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Source Channel</label>
                    <select
                      value={transferForm.sourceAccountType}
                      onChange={(e) => setTransferForm({ ...transferForm, sourceAccountType: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl text-slate-800 font-bold focus:outline-none"
                    >
                      <option value="Cash">Cash Drawer (கல்லா ரொக்கம்)</option>
                      <option value="Bank">Bank Account (வங்கி)</option>
                    </select>
                  </div>
                </div>

                {transferForm.sourceAccountType === 'Bank' && (
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Select Bank Account</label>
                    <select
                      value={transferForm.sourceBankAccountId}
                      onChange={(e) => setTransferForm({ ...transferForm, sourceBankAccountId: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl text-slate-800 font-medium focus:outline-none"
                    >
                      <option value="">-- Choose Bank Account --</option>
                      {bankAccounts.map(ba => (
                        <option key={ba.id} value={ba.id}>
                          {ba.bankName} (••{ba.accountNumber.slice(-4)}) - Bal: {formatCurrency(ba.balance)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-1 border-t border-amber-200/60">
                  <span>Available Source Balance:</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(getBranchBalance(transferForm.sourceBranchId, transferForm.sourceAccountType))}
                  </span>
                </div>
              </div>

              {/* Destination Branch & Account */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                <div className="text-[10px] font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Destination Branch (பணம் வரவு வைக்கும் கிளை)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Select Target Branch</label>
                    <select
                      value={transferForm.targetBranchId}
                      onChange={(e) => setTransferForm({ ...transferForm, targetBranchId: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-xl text-slate-800 font-bold focus:outline-none"
                    >
                      {branches.filter(b => b.id !== transferForm.sourceBranchId).map(br => (
                        <option key={br.id} value={br.id}>{br.name} ({br.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Target Channel</label>
                    <select
                      value={transferForm.targetAccountType}
                      onChange={(e) => setTransferForm({ ...transferForm, targetAccountType: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-xl text-slate-800 font-bold focus:outline-none"
                    >
                      <option value="Cash">Cash Drawer (கல்லா ரொக்கம்)</option>
                      <option value="Bank">Bank Account (வங்கி)</option>
                    </select>
                  </div>
                </div>

                {transferForm.targetAccountType === 'Bank' && (
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Select Target Bank Account</label>
                    <select
                      value={transferForm.targetBankAccountId}
                      onChange={(e) => setTransferForm({ ...transferForm, targetBankAccountId: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-xl text-slate-800 font-medium focus:outline-none"
                    >
                      <option value="">-- Choose Target Bank Account --</option>
                      {bankAccounts.map(ba => (
                        <option key={ba.id} value={ba.id}>
                          {ba.bankName} (••{ba.accountNumber.slice(-4)}) - Bal: {formatCurrency(ba.balance)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Transfer Amount (பரிமாற்றத் தொகை ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50000"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-black text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                    required
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Remarks / Reason for Transfer (காரணம் / குறிப்பு)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cash replenishment for pledge disbursements"
                  value={transferForm.remarks}
                  onChange={(e) => setTransferForm({ ...transferForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
                >
                  Execute Transfer
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
