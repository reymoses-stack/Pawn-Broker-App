import React, { useEffect, useRef } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { CustomerListView } from './components/customers/CustomerListView';
import { MortgageListView } from './components/mortgages/MortgageListView';
import { MortgageDetailView } from './components/mortgages/MortgageDetailView';
import { NewMortgageWizard } from './components/mortgages/NewMortgageWizard';
import { PaymentModal } from './components/payments/PaymentModal';
import { PaymentListView } from './components/payments/PaymentListView';
import { GoldInventoryView } from './components/gold/GoldInventoryView';
import { PacketScannerModal } from './components/gold/PacketScannerModal';
import { LedgerView } from './components/accounting/LedgerView';
import { ExpenseModal } from './components/accounting/ExpenseModal';
import { ReportsView } from './components/reports/ReportsView';
import { StaffView } from './components/staff/StaffView';
import { AuditLogView } from './components/audit/AuditLogView';
import { SettingsView } from './components/settings/SettingsView';
import { CustomerFormModal } from './components/customers/CustomerFormModal';
import { RenewalModal } from './components/mortgages/RenewalModal';
import { ClosureModal } from './components/mortgages/ClosureModal';
import { ReceiptModal } from './components/common/ReceiptModal';
import { GoodReturnsModal } from './components/common/GoodReturnsModal';
import { CustomerWebPortalModal } from './components/portal/CustomerWebPortalModal';
import { CashDrawerTransactionModal } from './components/accounting/CashDrawerTransactionModal';
import { PublicCustomerPassbookView } from './components/portal/PublicCustomerPassbookView';
import { LoginPage } from './components/auth/LoginPage';
import { EnquiryListView } from './components/enquiries/EnquiryListView';
import { RePledgeListView } from './components/repledge/RePledgeListView';
import { App as CapacitorApp } from '@capacitor/app';

export const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedMortgage,
    setSelectedMortgage,
    isNewMortgageOpen,
    setIsNewMortgageOpen,
    isNewCustomerOpen,
    setIsNewCustomerOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isExpenseModalOpen,
    setIsExpenseModalOpen,
    isScannerModalOpen,
    setIsScannerModalOpen,
    isRenewalModalOpen,
    setIsRenewalModalOpen,
    isClosureModalOpen,
    setIsClosureModalOpen,
    isCustomerPortalOpen,
    setIsCustomerPortalOpen,
    isDrawerModalOpen,
    setIsDrawerModalOpen,
    receiptModalData,
    setReceiptModalData,
    isGoodReturnsModalOpen,
    setIsGoodReturnsModalOpen,
    isSidebarOpen,
    setIsSidebarOpen
  } = useApp();

  // Navigation History Stack for Android Back Button & Back Gestures
  const historyStackRef = useRef<string[]>(['dashboard']);
  const isNavigatingBackRef = useRef<boolean>(false);

  useEffect(() => {
    if (isNavigatingBackRef.current) {
      isNavigatingBackRef.current = false;
      return;
    }
    const stack = historyStackRef.current;
    if (stack[stack.length - 1] !== activeTab) {
      stack.push(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    let listenerHandle: any = null;

    const setupBackHandler = async () => {
      try {
        listenerHandle = await CapacitorApp.addListener('backButton', () => {
          // Priority 1: Topmost open modals
          if (receiptModalData) {
            setReceiptModalData(null);
            return;
          }
          if (isCustomerPortalOpen) {
            setIsCustomerPortalOpen(false);
            return;
          }
          if (isGoodReturnsModalOpen) {
            setIsGoodReturnsModalOpen(false);
            return;
          }
          if (isNewMortgageOpen) {
            setIsNewMortgageOpen(false);
            return;
          }
          if (isNewCustomerOpen) {
            setIsNewCustomerOpen(false);
            return;
          }
          if (isPaymentModalOpen) {
            setIsPaymentModalOpen(false);
            return;
          }
          if (isExpenseModalOpen) {
            setIsExpenseModalOpen(false);
            return;
          }
          if (isScannerModalOpen) {
            setIsScannerModalOpen(false);
            return;
          }
          if (isRenewalModalOpen) {
            setIsRenewalModalOpen(false);
            return;
          }
          if (isClosureModalOpen) {
            setIsClosureModalOpen(false);
            return;
          }

          // Priority 2: Sidebar drawer if open on mobile
          if (isSidebarOpen) {
            setIsSidebarOpen(false);
            return;
          }

          // Priority 3: Selected mortgage detail screen
          if (selectedMortgage) {
            setSelectedMortgage(null);
            return;
          }

          // Priority 4: Back through page navigation history
          if (historyStackRef.current.length > 1) {
            historyStackRef.current.pop(); // remove current active tab
            const prevTab = historyStackRef.current[historyStackRef.current.length - 1];
            if (prevTab) {
              isNavigatingBackRef.current = true;
              setActiveTab(prevTab);
              return;
            }
          }

          if (activeTab !== 'dashboard') {
            isNavigatingBackRef.current = true;
            historyStackRef.current = ['dashboard'];
            setActiveTab('dashboard');
            return;
          }

          // Priority 5: At root dashboard with nothing open -> exit / minimize app
          CapacitorApp.exitApp();
        });
      } catch (err) {
        console.warn('Capacitor backButton not available', err);
      }
    };

    setupBackHandler();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [
    receiptModalData,
    setReceiptModalData,
    isCustomerPortalOpen,
    setIsCustomerPortalOpen,
    isGoodReturnsModalOpen,
    setIsGoodReturnsModalOpen,
    isNewMortgageOpen,
    setIsNewMortgageOpen,
    isNewCustomerOpen,
    setIsNewCustomerOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isExpenseModalOpen,
    setIsExpenseModalOpen,
    isScannerModalOpen,
    setIsScannerModalOpen,
    isRenewalModalOpen,
    setIsRenewalModalOpen,
    isClosureModalOpen,
    setIsClosureModalOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    selectedMortgage,
    setSelectedMortgage,
    activeTab,
    setActiveTab
  ]);

  const renderMainContent = () => {
    // If a mortgage is selected for detail view, show detail view
    if (selectedMortgage) {
      return (
        <MortgageDetailView
          mortgage={selectedMortgage}
          onBack={() => setSelectedMortgage(null)}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'enquiries':
        return <EnquiryListView />;
      case 'customers':
      case 'customers_kyc':
        return <CustomerListView />;
      case 'mortgages_active':
        return <MortgageListView initialStatusFilter="active" />;
      case 'mortgages_due':
        return <MortgageListView initialStatusFilter="due" />;
      case 'mortgages_overdue':
        return <MortgageListView initialStatusFilter="overdue" />;
      case 'mortgages_renewed':
        return <MortgageListView initialStatusFilter="renewed" />;
      case 'mortgages_closed':
        return <MortgageListView initialStatusFilter="closed" />;
      case 'gold_inventory':
      case 'gold_packets':
      case 'gold_lockers':
      case 'gold_released':
        return <GoldInventoryView />;
      case 'repledge':
        return <RePledgeListView />;
      case 'payments':
        return <PaymentListView />;
      case 'accounts_ledger':
      case 'accounts_income':
      case 'accounts_expenses':
        return <LedgerView />;
      case 'reports':
        return <ReportsView />;
      case 'staff':
        return <StaffView />;
      case 'audit':
        return <AuditLogView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="h-screen max-h-screen bg-gradient-to-br from-[#faf8f5] via-[#f7f3eb] to-[#f4eee1] text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-amber-950 overflow-hidden">
      
      {/* Top Navigation */}
      <Navbar />

      {/* Main Layout Area: Static pinned sidebar on left, independent scrolling content on right */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Dynamic Content View Area - Scrollable workspace with mobile bottom nav padding */}
        <main className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-5 lg:p-6 w-full pb-24 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {renderMainContent()}
          </div>
        </main>

      </div>

      {/* Mobile Bottom Navigation Bar (5 Hot Options, Home in Middle) */}
      <BottomNav />

      {/* Modals & Overlays */}
      {isNewMortgageOpen && (
        <NewMortgageWizard onClose={() => setIsNewMortgageOpen(false)} />
      )}

      {isNewCustomerOpen && (
        <CustomerFormModal onClose={() => setIsNewCustomerOpen(false)} />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          onClose={() => setIsPaymentModalOpen(false)}
          targetMortgage={selectedMortgage || undefined}
        />
      )}

      {isExpenseModalOpen && (
        <ExpenseModal onClose={() => setIsExpenseModalOpen(false)} />
      )}

      {isScannerModalOpen && (
        <PacketScannerModal onClose={() => setIsScannerModalOpen(false)} />
      )}

      {isRenewalModalOpen && selectedMortgage && (
        <RenewalModal
          mortgage={selectedMortgage}
          onClose={() => setIsRenewalModalOpen(false)}
        />
      )}

      {isClosureModalOpen && selectedMortgage && (
        <ClosureModal
          mortgage={selectedMortgage}
          onClose={() => setIsClosureModalOpen(false)}
        />
      )}

      {/* Printable Receipt Modal */}
      {receiptModalData && <ReceiptModal />}

      {/* GoodReturns Live Feed City Modal */}
      <GoodReturnsModal />

      {/* Customer Self-Service Web/PWA Passbook Portal Modal & Shop QR Standee */}
      {isCustomerPortalOpen && <CustomerWebPortalModal />}

      {/* Cash Drawer & Bank Account Operations Modal */}
      {isDrawerModalOpen && <CashDrawerTransactionModal />}

    </div>
  );
};

export default function App() {
  const { authSession } = useApp();

  // Check if current URL is a Customer Self-Service QR Passbook scan
  const isPortalUrl = typeof window !== 'undefined' && (
    window.location.search.includes('portal=') || 
    window.location.hash.includes('portal')
  );

  if (isPortalUrl) {
    return <PublicCustomerPassbookView />;
  }

  // If no active session or 4-hr session has expired, enforce mandatory login
  if (!authSession) {
    return <LoginPage />;
  }

  return <AppContent />;
}
