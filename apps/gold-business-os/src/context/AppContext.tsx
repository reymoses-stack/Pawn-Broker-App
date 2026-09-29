import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Role,
  GoldRates,
  Branch,
  Customer,
  LoanProduct,
  GoldLoan,
  VaultPacket,
  GoldPurchaseTransaction,
  CoinProduct,
  CoinOrder,
  ChartOfAccount,
  JournalEntry,
  AuditLogEntry,
  NotificationItem,
  GoldAppraisalItem,
} from '../types';
import {
  initialGoldRates,
  initialBranches,
  initialCustomers,
  initialLoanProducts,
  initialVaultPackets,
  initialLoans,
  initialPurchases,
  initialCoinProducts,
  initialOrders,
  initialChartOfAccounts,
  initialJournalEntries,
  initialAuditLogs,
  initialNotifications,
} from '../data/initialData';

export type PortalType = 'CUSTOMER' | 'STAFF' | 'ADMIN';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface CartItem {
  product: CoinProduct;
  quantity: number;
}

interface AppContextType {
  // Navigation & Personas
  activePortal: PortalType;
  setActivePortal: (portal: PortalType) => void;
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  currentCustomer: Customer;
  setCurrentCustomer: (customer: Customer) => void;
  activeBranch: Branch;
  setActiveBranch: (branch: Branch) => void;

  // Gold Rates Engine
  rates: GoldRates;
  updateRates: (newRates: Partial<GoldRates>) => void;
  simulateRateTick: (customDelta?: number) => void;
  fetchLiveRates: () => Promise<void>;
  toggleLiveStream: () => void;

  // Master Data
  branches: Branch[];
  customers: Customer[];
  loanProducts: LoanProduct[];
  addLoanProduct: (prod: LoanProduct) => void;

  // Gold Loans Engine
  loans: GoldLoan[];
  createLoan: (
    customerId: string,
    branchId: string,
    items: GoldAppraisalItem[],
    requestedAmount: number,
    productId: string,
    method: 'CASH' | 'NEFT' | 'UPI'
  ) => GoldLoan;
  repayLoan: (loanId: string, amount: number, paymentType: 'INTEREST' | 'PRINCIPAL' | 'FULL_SETTLEMENT') => void;
  closeLoanAndReleaseVault: (loanId: string) => void;

  // Vault Engine
  vaultPackets: VaultPacket[];
  verifyPacketSeal: (packetId: string) => void;

  // Gold Buying / Reselling Engine
  purchases: GoldPurchaseTransaction[];
  createGoldPurchase: (
    customerId: string,
    branchId: string,
    items: GoldAppraisalItem[],
    meltLossPercent: number,
    paymentMethod: 'UPI' | 'NEFT' | 'CASH'
  ) => GoldPurchaseTransaction;

  // E-Commerce Coin Store
  coinProducts: CoinProduct[];
  cart: CartItem[];
  addToCart: (product: CoinProduct) => void;
  updateCartQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  orders: CoinOrder[];
  placeOrder: (
    shippingAddress: string,
    paymentMethod: 'UPI' | 'CREDIT_CARD' | 'NET_BANKING'
  ) => CoinOrder;
  updateOrderStatus: (orderId: string, status: CoinOrder['orderStatus']) => void;

  // Financial Accounting
  chartOfAccounts: ChartOfAccount[];
  journalEntries: JournalEntry[];

  // Auditing & Notifications
  auditLogs: AuditLogEntry[];
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;

  // Feedback Toasts
  toasts: Toast[];
  showToast: (type: Toast['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePortal, setActivePortal] = useState<PortalType>('CUSTOMER');
  const [activeRole, setActiveRole] = useState<Role>('CUSTOMER');
  const [branches] = useState<Branch[]>(initialBranches);
  const [activeBranch, setActiveBranch] = useState<Branch>(initialBranches[0]);
  const [customers] = useState<Customer[]>(initialCustomers);
  const [currentCustomer, setCurrentCustomer] = useState<Customer>(initialCustomers[0]);
  const [rates, setRates] = useState<GoldRates>(initialGoldRates);
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>(initialLoanProducts);

  const [loans, setLoans] = useState<GoldLoan[]>(initialLoans);
  const [vaultPackets, setVaultPackets] = useState<VaultPacket[]>(initialVaultPackets);
  const [purchases, setPurchases] = useState<GoldPurchaseTransaction[]>(initialPurchases);
  const [coinProducts] = useState<CoinProduct[]>(initialCoinProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<CoinOrder[]>(initialOrders);

  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>(initialChartOfAccounts);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(initialJournalEntries);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: Toast['type'], title: string, message: string) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addAuditLog = (what: string, beforeValue?: string, afterValue?: string, approvalRef?: string) => {
    const newLog: AuditLogEntry = {
      id: 'aud-' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      who: activeRole === 'CUSTOMER' ? currentCustomer.name : 'Branch Officer',
      role: activeRole,
      branch: activeBranch.code,
      what,
      beforeValue,
      afterValue,
      ipContext: '192.168.1.100 [Local Station]',
      approvalRef: approvalRef || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const recordJournal = (
    refType: JournalEntry['refType'],
    refNumber: string,
    debitAccount: string,
    creditAccount: string,
    amount: number,
    narration: string
  ) => {
    const entry: JournalEntry = {
      id: 'jrn-' + Date.now(),
      entryNumber: `JRN-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString().split('T')[0],
      refType,
      refNumber,
      debitAccount,
      creditAccount,
      amount,
      narration,
    };
    setJournalEntries((prev) => [entry, ...prev]);
  };

  const updateRates = (newRates: Partial<GoldRates>) => {
    setRates((prev) => ({
      ...prev,
      ...newRates,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
    showToast('info', 'Gold Rates Updated', 'New pricing engine parameters are now active across all portals.');
    addAuditLog('Updated Gold Pricing Engine', 'Prior Rates', `24K: ₹${newRates.rate24kPerGram || rates.rate24kPerGram}`);
  };

  const simulateRateTick = (customDelta?: number) => {
    const delta = customDelta !== undefined ? customDelta : Math.floor(Math.random() * 51) - 25; // -25 to +25 ₹/g realistic tick
    const baseline24k = 15475;
    const new24k = Math.max(12000, rates.rate24kPerGram + delta);
    const new22k = Math.round(new24k * 0.9166);
    const new18k = Math.round(new24k * 0.7725);
    const new14k = Math.round(new24k * 0.5833);
    const changePct = Number((((new24k - baseline24k) / baseline24k) * 100).toFixed(2));

    setRates((prev) => ({
      ...prev,
      rate24kPerGram: new24k,
      rate22kPerGram: new22k,
      rate18kPerGram: new18k,
      rate14kPerGram: new14k,
      ratePerSovereign22k: new22k * 8,
      ratePerSovereign24k: new24k * 8,
      changePercent24k: changePct,
      changePercent22k: changePct,
      highToday24k: Math.max(prev.highToday24k, new24k),
      lowToday24k: Math.min(prev.lowToday24k, new24k),
      highToday22k: Math.max(prev.highToday22k, new22k),
      lowToday22k: Math.min(prev.lowToday22k, new22k),
      loanValuationRate22k: Math.round(new22k * 0.75), // 75% LTV statutory benchmark
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }));
  };

  const fetchLiveRates = async () => {
    showToast('info', 'Connecting to Feed', 'Fetching live market feed from GoodReturns & Metals...');
    try {
      // Simulate live network sync to live market feed
      await new Promise((resolve) => setTimeout(resolve, 600));
      const variation = Math.floor(Math.random() * 31) - 15;
      simulateRateTick(variation);
      showToast('success', 'Live Rate Synced', `GoodReturns / Metals feed updated: 24K @ ₹${(15475 + variation).toLocaleString('en-IN')}/g`);
    } catch {
      showToast('error', 'Feed Error', 'Unable to reach GoodReturns feed; using offline IBJA cache.');
    }
  };

  const toggleLiveStream = () => {
    const nextState = !rates.isLiveStreaming;
    setRates((prev) => ({ ...prev, isLiveStreaming: nextState }));
    showToast(
      nextState ? 'success' : 'warning',
      nextState ? 'Live Stream Active' : 'Live Stream Paused',
      nextState ? 'Auto-updating rates as per live market fluctuations.' : 'Automatic price tick paused.'
    );
  };

  // Background auto-streaming interval (updates every 10 seconds when enabled)
  React.useEffect(() => {
    if (!rates.isLiveStreaming) return;
    const interval = setInterval(() => {
      // 70% chance of micro-fluctuation during active trading session
      if (Math.random() > 0.3) {
        const delta = Math.floor(Math.random() * 21) - 10; // -10 to +10 fluctuation
        if (delta !== 0) {
          simulateRateTick(delta);
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [rates.isLiveStreaming, rates.rate24kPerGram]);

  const addLoanProduct = (prod: LoanProduct) => {
    setLoanProducts((prev) => [...prev, prod]);
    showToast('success', 'Product Created', `Added loan scheme: ${prod.name}`);
    addAuditLog(`Created Loan Product ${prod.name}`);
  };

  // Create & Disburse Loan
  const createLoan = (
    customerId: string,
    branchId: string,
    items: GoldAppraisalItem[],
    requestedAmount: number,
    productId: string,
    method: 'CASH' | 'NEFT' | 'UPI'
  ): GoldLoan => {
    const cust = customers.find((c) => c.id === customerId) || currentCustomer;
    const branch = branches.find((b) => b.id === branchId) || activeBranch;
    const product = loanProducts.find((p) => p.id === productId) || loanProducts[0];

    const totalGross = items.reduce((sum, it) => sum + it.grossWeight, 0);
    const totalNet = items.reduce((sum, it) => sum + it.netWeight, 0);
    const totalValuation = items.reduce((sum, it) => sum + it.calculatedValue, 0);
    const ltv = Number(((requestedAmount / totalValuation) * 100).toFixed(1));

    const loanNum = `GL-2026-${String(loans.length + 184).padStart(6, '0')}`;
    const packetCode = `PKT-${branch.code.split('-')[0]}-${String(vaultPackets.length + 930).padStart(6, '0')}`;
    const packetLocation = `Vault 1 -> Rack C -> Tray 01 -> Slot P-${Math.floor(10 + Math.random() * 80)}`;

    const newLoan: GoldLoan = {
      id: 'loan-' + Date.now(),
      loanNumber: loanNum,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      branchId: branch.id,
      branchName: branch.name,
      items,
      totalGrossWeight: totalGross,
      totalNetWeight: totalNet,
      totalValuation,
      loanAmount: requestedAmount,
      ltvPercent: ltv,
      product,
      status: 'ACTIVE',
      packetId: packetCode,
      packetLocation,
      disbursementMethod: method,
      disbursementRef: `${method}-${Math.floor(10000000 + Math.random() * 90000000)}`,
      outstandingPrincipal: requestedAmount,
      accruedInterest: Math.round((requestedAmount * (product.interestRatePerAnnum / 100)) / 12),
      interestPaidTotal: 0,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + product.tenureMonths * 30 * 86400000).toISOString().split('T')[0],
      appraiserName: 'S. Narain (Certified Gold Assayer)',
      approverName: 'M. Senthil (Branch Manager)',
    };

    const newPacket: VaultPacket = {
      id: 'pkt-' + Date.now(),
      packetCode,
      loanNumber: loanNum,
      customerId: cust.id,
      customerName: cust.name,
      branchCode: branch.code,
      vaultId: 'V1-SECURE',
      rack: 'Rack C',
      tray: 'Tray 01',
      slot: packetLocation.split('->')[3]?.trim() || 'Slot 10',
      itemCount: items.length,
      grossWeight: totalGross,
      netWeight: totalNet,
      sealedAt: new Date().toLocaleString(),
      sealStatus: 'SEALED_IN_VAULT',
      custodianEmployee: 'K. Balaji (Vault Custodian)',
      qrPayload: `NEXUS-GOLD-OS|${packetCode}|${loanNum}|${totalNet}g|${branch.code}`,
    };

    setLoans((prev) => [newLoan, ...prev]);
    setVaultPackets((prev) => [newPacket, ...prev]);

    // Financial Accounting entry: Debit Loan Portfolio, Credit Cash/Bank
    recordJournal(
      'LOAN_DISBURSEMENT',
      loanNum,
      '1200 - Gold Loan Portfolio',
      method === 'CASH' ? '1010 - Branch Vault Cash' : '1020 - Bank Operating Account',
      requestedAmount,
      `Disbursed Gold Loan ${loanNum} for ${cust.name} against ${totalNet}g gold pledge`
    );

    addAuditLog(`Disbursed Gold Loan ${loanNum}`, 'STATUS: PENDING', `DISBURSED: ₹${requestedAmount.toLocaleString('en-IN')}`);
    showToast('success', 'Loan Disbursed & Gold Pledged', `Loan ${loanNum} of ₹${requestedAmount.toLocaleString('en-IN')} approved and packet ${packetCode} secured in vault.`);

    return newLoan;
  };

  // Repay Loan (Interest or Principal)
  const repayLoan = (loanId: string, amount: number, paymentType: 'INTEREST' | 'PRINCIPAL' | 'FULL_SETTLEMENT') => {
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id !== loanId) return l;
        let newPrincipal = l.outstandingPrincipal;
        let newInterestAccrued = l.accruedInterest;
        let newInterestPaid = l.interestPaidTotal;
        let newStatus = l.status;

        if (paymentType === 'INTEREST') {
          newInterestAccrued = Math.max(0, newInterestAccrued - amount);
          newInterestPaid += amount;
        } else if (paymentType === 'PRINCIPAL') {
          newPrincipal = Math.max(0, newPrincipal - amount);
        } else if (paymentType === 'FULL_SETTLEMENT') {
          newPrincipal = 0;
          newInterestAccrued = 0;
          newInterestPaid += l.accruedInterest;
          newStatus = 'CLOSED';
        }

        return {
          ...l,
          outstandingPrincipal: newPrincipal,
          accruedInterest: newInterestAccrued,
          interestPaidTotal: newInterestPaid,
          status: newPrincipal === 0 ? 'CLOSED' : newStatus,
          closedDate: newPrincipal === 0 ? new Date().toISOString().split('T')[0] : undefined,
        };
      })
    );

    const loanObj = loans.find((l) => l.id === loanId);
    recordJournal(
      'LOAN_REPAYMENT',
      loanObj?.loanNumber || 'REPAY',
      '1020 - Bank Operating Account',
      paymentType === 'INTEREST' ? '4010 - Interest Income' : '1200 - Gold Loan Portfolio',
      amount,
      `Repayment of ₹${amount} received against loan ${loanObj?.loanNumber}`
    );

    addAuditLog(`Loan Repayment on ${loanObj?.loanNumber}`, `Type: ${paymentType}`, `Paid: ₹${amount}`);
    showToast('success', 'Payment Received', `Successfully processed repayment of ₹${amount.toLocaleString('en-IN')}. Receipt generated.`);
  };

  // Close Loan & Handover Gold from Vault
  const closeLoanAndReleaseVault = (loanId: string) => {
    const targetLoan = loans.find((l) => l.id === loanId);
    if (!targetLoan) return;

    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, status: 'CLOSED', closedDate: new Date().toISOString().split('T')[0] } : l))
    );

    setVaultPackets((prev) =>
      prev.map((p) => (p.packetCode === targetLoan.packetId ? { ...p, sealStatus: 'RELEASED_TO_CUSTOMER' } : p))
    );

    addAuditLog(
      `Vault Packet Released to Customer`,
      `SEALED: ${targetLoan.packetId}`,
      `RELEASED to ${targetLoan.customerName}`
    );
    showToast('success', 'Gold Released to Customer', `Packet ${targetLoan.packetId} retrieved from vault and handed over to ${targetLoan.customerName}.`);
  };

  const verifyPacketSeal = (packetId: string) => {
    showToast('info', 'Packet Verified', `Biometric & Tamper Seal verified on packet ${packetId}.`);
    addAuditLog(`Verified Vault Packet ${packetId}`);
  };

  // Direct Gold Buying / Scrap Reselling
  const createGoldPurchase = (
    customerId: string,
    branchId: string,
    items: GoldAppraisalItem[],
    meltLossPercent: number,
    paymentMethod: 'UPI' | 'NEFT' | 'CASH'
  ): GoldPurchaseTransaction => {
    const cust = customers.find((c) => c.id === customerId) || currentCustomer;
    const branch = branches.find((b) => b.id === branchId) || activeBranch;

    const totalGross = items.reduce((sum, it) => sum + it.grossWeight, 0);
    const totalNet = items.reduce((sum, it) => sum + it.netWeight, 0);
    const payableWeight = Number((totalNet * (1 - meltLossPercent / 100)).toFixed(2));
    const ratePerGram = Math.round(rates.rate22kPerGram * (1 + rates.buyingMarginPercent / 100));
    const grossValuation = Math.round(totalNet * ratePerGram);
    const finalPayout = Math.round(payableWeight * ratePerGram);
    const deductions = grossValuation - finalPayout;

    const purNumber = `PUR-2026-${String(purchases.length + 42).padStart(4, '0')}`;

    const newPurchase: GoldPurchaseTransaction = {
      id: 'pur-' + Date.now(),
      purchaseNumber: purNumber,
      customerId: cust.id,
      customerName: cust.name,
      phone: cust.phone,
      branchId: branch.id,
      branchName: branch.name,
      items,
      totalGrossWeight: totalGross,
      totalNetWeight: totalNet,
      meltLossPercent,
      payableWeight,
      appliedRatePerGram: ratePerGram,
      grossValuation,
      deductions,
      finalPayout,
      paymentMethod,
      paymentRef: `${paymentMethod}-BUY-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'PAID',
      date: new Date().toISOString().split('T')[0],
      employeeName: 'R. Karthik (Procurement Officer)',
    };

    setPurchases((prev) => [newPurchase, ...prev]);

    // Financial accounting: Debit Raw Scrap Inventory, Credit Cash/Bank
    recordJournal(
      'GOLD_PURCHASE',
      purNumber,
      '1350 - Raw Gold Scrap Inventory',
      paymentMethod === 'CASH' ? '1010 - Branch Vault Cash' : '1020 - Bank Operating Account',
      finalPayout,
      `Bought ${payableWeight}g scrap gold from ${cust.name} via ${paymentMethod}`
    );

    addAuditLog(`Gold Purchase Completed ${purNumber}`, 'OFFER_MADE', `PAID ₹${finalPayout} for ${payableWeight}g`);
    showToast('success', 'Gold Bought Successfully', `Processed payout of ₹${finalPayout.toLocaleString('en-IN')} to ${cust.name}. Added to refinery inventory.`);

    return newPurchase;
  };

  // E-Commerce Store
  const addToCart = (product: CoinProduct) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.product.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast('success', 'Added to Cart', `${product.name} added to your bullion cart.`);
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const next = item.quantity + delta;
            return next > 0 ? { ...item, quantity: next } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const placeOrder = (
    shippingAddress: string,
    paymentMethod: 'UPI' | 'CREDIT_CARD' | 'NET_BANKING'
  ): CoinOrder => {
    const subtotal = cart.reduce((sum, item) => {
      const goldPrice = item.product.weightGrams * rates.rate24kPerGram;
      return sum + goldPrice * item.quantity;
    }, 0);

    const makingTotal = cart.reduce((sum, item) => sum + item.product.makingCharges * item.quantity, 0);
    const taxGst = Math.round((subtotal + makingTotal) * (rates.taxGstPercent / 100));
    const totalAmount = subtotal + makingTotal + taxGst;

    const ordNum = `ORD-GLD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: CoinOrder = {
      id: 'ord-' + Date.now(),
      orderNumber: ordNum,
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      phone: currentCustomer.phone,
      shippingAddress,
      items: cart.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unitPrice: Math.round(
          (item.product.weightGrams * rates.rate24kPerGram + item.product.makingCharges) * 1.03
        ),
      })),
      subtotal,
      makingChargesTotal: makingTotal,
      taxGst,
      shippingCharge: 0, // Free insured shipping
      totalAmount,
      paymentMethod,
      paymentStatus: 'PAID',
      orderStatus: 'CONFIRMED',
      trackingNumber: `NEXUS-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toLocaleString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();

    // Financial Accounting: Debit Bank, Credit Coin Revenue
    recordJournal(
      'COIN_SALE',
      ordNum,
      '1020 - Bank Operating Account',
      '4030 - Gold Coin Sales Revenue',
      totalAmount,
      `Online bullion order ${ordNum} paid via ${paymentMethod}`
    );

    addAuditLog(`Placed Gold Coin Order ${ordNum}`, 'CART', `ORDER CONFIRMED ₹${totalAmount.toLocaleString('en-IN')}`);
    showToast('success', 'Order Placed!', `Your order ${ordNum} for ₹${totalAmount.toLocaleString('en-IN')} is confirmed with tamper-evident secure transit.`);

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: CoinOrder['orderStatus']) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, orderStatus: status } : o)));
    showToast('info', 'Order Status Updated', `Order marked as ${status.replace('_', ' ')}.`);
    addAuditLog(`Updated Order ${orderId} status to ${status}`);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <AppContext.Provider
      value={{
        activePortal,
        setActivePortal,
        activeRole,
        setActiveRole,
        currentCustomer,
        setCurrentCustomer,
        activeBranch,
        setActiveBranch,
        rates,
        updateRates,
        fetchLiveRates,
        toggleLiveStream,
        simulateRateTick,
        branches,
        customers,
        loanProducts,
        addLoanProduct,
        loans,
        createLoan,
        repayLoan,
        closeLoanAndReleaseVault,
        vaultPackets,
        verifyPacketSeal,
        purchases,
        createGoldPurchase,
        coinProducts,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        orders,
        placeOrder,
        updateOrderStatus,
        chartOfAccounts,
        journalEntries,
        auditLogs,
        notifications,
        markNotificationRead,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
