import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, User, RolePermissionSet } from '../../types';
import { 
  UserCog, Shield, Check, X as Cross, UserCheck, 
  UserPlus, Crown, KeyRound, Trash2, Power, 
  AlertCircle, Sparkles, Clock, Lock, RotateCcw,
  SlidersHorizontal, CheckCircle2
} from 'lucide-react';
import { CreateEmployeeModal } from './CreateEmployeeModal';

const PERMISSION_COLUMNS: { key: keyof Omit<RolePermissionSet, 'desc'>; label: string; desc: string }[] = [
  { key: 'customers', label: 'Customers', desc: 'Create and view customer profiles' },
  { key: 'kyc', label: 'KYC & Photo', desc: 'Conduct biometric & Aadhaar OTP verification' },
  { key: 'appraise', label: 'Appraisal', desc: 'Gold weight testing & valuation' },
  { key: 'mortgageApproval', label: 'Pawn Approval', desc: 'Sanction and disburse loans' },
  { key: 'paymentCollection', label: 'Payments', desc: 'Collect interest and print receipts' },
  { key: 'expenses', label: 'Expenses', desc: 'Record shop operating expenditures' },
  { key: 'reports', label: 'Reports', desc: 'Access business analytics & loan books' },
  { key: 'auditLogs', label: 'Audit Logs', desc: 'Inspect immutable system event logs' },
  { key: 'systemSettings', label: 'Settings', desc: 'Modify rates, margins & business rules' }
];

export const StaffView: React.FC = () => {
  const { 
    users, 
    currentUser, 
    resetEmployeePassword, 
    deleteEmployeeAccount, 
    updateEmployeeAccount,
    rbacPermissions,
    updateRolePermission,
    resetRbacPermissions
  } = useApp();

  const isOwner = currentUser.isOwner || currentUser.role === 'Master Admin / Owner';
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newTempPassword, setNewTempPassword] = useState('');
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const handleOpenReset = (user: User) => {
    setResettingUser(user);
    setNewTempPassword(`Temp@${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleConfirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newTempPassword.trim()) return;

    resetEmployeePassword(resettingUser.id, newTempPassword.trim());
    setActionNotice({
      message: `Temporary password for ${resettingUser.name} reset to: ${newTempPassword.trim()}. Mandatory password change re-enforced on next login.`,
      type: 'success'
    });
    setResettingUser(null);
    setTimeout(() => setActionNotice(null), 8000);
  };

  const handleTogglePermission = (role: UserRole, permKey: keyof Omit<RolePermissionSet, 'desc'>) => {
    if (!isOwner) {
      setActionNotice({
        message: 'Permission denied: Only the business owner can edit the RBAC security matrix.',
        type: 'info'
      });
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }

    const currentVal = rbacPermissions[role]?.[permKey] ?? false;
    const newVal = !currentVal;
    updateRolePermission(role, permKey, newVal);

    const col = PERMISSION_COLUMNS.find(c => c.key === permKey);
    setActionNotice({
      message: `Updated [${role}]: ${col?.label} permission is now ${newVal ? 'GRANTED ✓' : 'REVOKED ✗'}`,
      type: 'success'
    });
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleResetMatrix = () => {
    if (!isOwner) return;
    if (confirm('Reset all RBAC matrix permissions back to recommended default security settings?')) {
      resetRbacPermissions();
      setActionNotice({
        message: 'RBAC permissions matrix restored to default enterprise security policy.',
        type: 'info'
      });
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 liquid-glass border border-amber-200/80 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl liquid-glass-gold border border-amber-300 flex items-center justify-center text-amber-900 shadow-sm">
            {isOwner ? <Crown className="w-6 h-6 text-amber-800" /> : <UserCog className="w-6 h-6 text-indigo-700" />}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span>Staff Accounts & Access Control</span>
              {isOwner && (
                <span className="text-[10px] bg-amber-500/20 text-amber-950 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  OWNER PRIVILEGES
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              {isOwner 
                ? 'Only you (the Owner) can create staff accounts and customize role permissions in real time.'
                : 'Staff directory & permissions. Role modifications are restricted to the business owner.'}
            </p>
          </div>
        </div>

        {/* Action Button: Owner Create Employee */}
        {isOwner && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl liquid-glass-gold font-bold text-amber-950 border border-amber-300 shadow-md hover:brightness-105 active:scale-[0.99] text-xs transition"
          >
            <UserPlus className="w-4 h-4 text-amber-800" />
            <span>+ Create Employee Account</span>
          </button>
        )}
      </div>

      {/* Floating Notice / Toast */}
      {actionNotice && (
        <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-2 shadow-sm animate-in fade-in ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-500/15 border-emerald-400 text-emerald-950'
            : 'bg-blue-500/15 border-blue-400 text-blue-950'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold">{actionNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-slate-600 hover:text-slate-900 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Staff User Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => {
          const isCurrent = u.id === currentUser.id;
          const isUserOwner = u.isOwner || u.role === 'Master Admin / Owner';

          return (
            <div
              key={u.id}
              className={`p-5 rounded-3xl border transition flex flex-col justify-between ${
                isCurrent 
                  ? 'liquid-glass-gold border-amber-400/80 shadow-md shadow-amber-500/10'
                  : 'liquid-glass border-amber-200/60 shadow-xs'
              }`}
            >
              <div>
                {/* Card Top */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isUserOwner ? (
                      <Crown className="w-4 h-4 text-amber-600" />
                    ) : (
                      <UserCog className="w-4 h-4 text-slate-500" />
                    )}
                    <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isCurrent 
                      ? 'bg-amber-600 text-white' 
                      : isUserOwner
                      ? 'bg-amber-500/20 text-amber-950 border border-amber-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isCurrent ? 'YOU (LOGGED IN)' : isUserOwner ? 'OWNER' : 'STAFF'}
                  </span>
                </div>

                {/* Role badge */}
                <div className="text-xs font-bold text-amber-900 mb-1.5 flex items-center gap-1.5">
                  <span>{u.role}</span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                  {rbacPermissions[u.role]?.desc || 'Standard branch staff permissions.'}
                </p>

                {/* Contact & Credentials summary */}
                <div className="text-[11px] text-slate-600 font-mono space-y-1 pt-2.5 border-t border-amber-200/50">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Username:</span>
                    <span className="font-bold text-slate-800">{u.username || u.email.split('@')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mobile:</span>
                    <span>+91 {u.phone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Password:</span>
                    {u.mustChangePassword ? (
                      <span className="text-[10px] bg-yellow-500/20 text-yellow-950 px-1.5 py-0.2 rounded font-sans font-bold">
                        First-Time Setup Pending
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-950 px-1.5 py-0.2 rounded font-sans font-bold">
                        Permanent Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Owner Action Buttons */}
              {isOwner && !isUserOwner && (
                <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenReset(u)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-950 font-bold text-xs border border-amber-300 transition flex items-center justify-center gap-1"
                  >
                    <KeyRound className="w-3 h-3 text-amber-800" />
                    <span>Reset Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateEmployeeAccount(u.id, { isActive: !u.isActive })}
                    title={u.isActive ? 'Deactivate account' : 'Activate account'}
                    className={`p-1.5 rounded-xl border text-xs transition ${
                      u.isActive 
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to permanently delete employee account for ${u.name}?`)) {
                        deleteEmployeeAccount(u.id);
                      }
                    }}
                    title="Delete Employee Account"
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FULLY EDITABLE RBAC PERMISSIONS MATRIX */}
      <div className="liquid-glass border border-amber-200/80 rounded-3xl shadow-sm p-6 space-y-4">
        
        {/* Table Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-amber-200/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-700" />
              <span>Role-Based Access Control (RBAC) Permissions Matrix</span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-950 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                LIVE EDITABLE
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isOwner 
                ? 'Click any cell to immediately grant or revoke permissions for that role across all branch modules.'
                : 'Configured by the Business Owner. Real-time enforcement across all modules.'}
            </p>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={handleResetMatrix}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-amber-200/80 text-xs font-semibold shadow-xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset to Defaults</span>
            </button>
          )}
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-amber-100/50 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-amber-200">
              <tr>
                <th className="py-3 px-3 min-w-[150px]">Role / Persona</th>
                {PERMISSION_COLUMNS.map(col => (
                  <th key={col.key} className="py-3 px-2 text-center min-w-[90px]" title={col.desc}>
                    <div className="font-bold">{col.label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200/50">
              {(Object.keys(rbacPermissions) as UserRole[]).map(role => {
                const perms = rbacPermissions[role];
                const isMasterOwner = role === 'Master Admin / Owner';

                return (
                  <tr key={role} className="hover:bg-amber-50/40 transition">
                    
                    {/* Role Title */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {isMasterOwner && <Crown className="w-3.5 h-3.5 text-amber-600" />}
                        <span>{role}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{perms.desc}</div>
                    </td>

                    {/* Permission Cells (Editable Switches) */}
                    {PERMISSION_COLUMNS.map(col => {
                      const isAllowed = !!perms[col.key];

                      return (
                        <td key={col.key} className="py-3 px-2 text-center">
                          <button
                            type="button"
                            disabled={!isOwner}
                            onClick={() => handleTogglePermission(role, col.key)}
                            title={isOwner ? `Click to ${isAllowed ? 'Revoke' : 'Grant'} ${col.label} for ${role}` : col.desc}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 mx-auto ${
                              isAllowed
                                ? 'bg-emerald-500/20 text-emerald-950 border border-emerald-400 hover:bg-emerald-500/30 shadow-xs'
                                : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                            } ${isOwner ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
                          >
                            {isAllowed ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                                <span>YES</span>
                              </>
                            ) : (
                              <>
                                <Cross className="w-3 h-3 text-slate-400" />
                                <span>NO</span>
                              </>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="pt-2 border-t border-amber-200/50 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <strong className="text-slate-700">YES</strong> = Granted / Authorized
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <strong className="text-slate-700">NO</strong> = Denied / Hidden
            </span>
          </div>
          <div className="italic text-amber-900 font-medium">
            💡 Tap any button above to instantly update permissions for any staff tier.
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md liquid-glass-modal rounded-3xl border border-amber-300 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <KeyRound className="w-5 h-5 text-amber-700" />
              <span>Reset Password for {resettingUser.name}</span>
            </div>
            <p className="text-xs text-slate-600">
              Generate a new temporary password for <strong>{resettingUser.username || resettingUser.email}</strong>. The employee will be prompted to set their permanent password on next login.
            </p>

            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Temporary Password
                </label>
                <input
                  type="text"
                  value={newTempPassword}
                  onChange={(e) => setNewTempPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs font-mono font-bold text-amber-950 rounded-xl border border-amber-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl liquid-glass-gold font-bold text-amber-950 border border-amber-300 text-xs transition shadow-sm"
                >
                  Confirm & Force Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for creating employee */}
      {isCreateModalOpen && (
        <CreateEmployeeModal onClose={() => setIsCreateModalOpen(false)} />
      )}

    </div>
  );
};
