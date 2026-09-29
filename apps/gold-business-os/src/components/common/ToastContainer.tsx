import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl liquid-glass shadow-2xl transition-all transform translate-y-0 border ${
            toast.type === 'success'
              ? 'border-emerald-300/80 text-emerald-950'
              : toast.type === 'error'
              ? 'border-red-300/80 text-red-950'
              : toast.type === 'warning'
              ? 'border-amber-300/80 text-amber-950'
              : 'border-sky-300/80 text-sky-950'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-sky-600" />}
          </div>
          <div className="flex-1">
            <h5 className="font-bold text-xs text-slate-900 leading-tight">{toast.title}</h5>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer p-0.5 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

