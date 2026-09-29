export type Language = 'en' | 'ta';

export interface Translations {
  // Navigation & Common
  dashboard: string;
  pledges: string;
  newPledge: string;
  customers: string;
  newCustomer: string;
  payments: string;
  collectCash: string;
  vault: string;
  khatabook: string;
  reports: string;
  staff: string;
  auditTrail: string;
  settings: string;
  searchPlaceholder: string;
  lockWorkstation: string;
  lockVault: string;
  scanPacket: string;
  quickActions: string;
  activePledges: string;
  overdue: string;
  dueToday: string;
  next7Days: string;
  
  // Financial & Gold Terminology (Local Indian Market)
  principal: string;
  interest: string;
  penaltyInterest: string;
  loanAmount: string;
  interestRate: string;
  grossWeight: string;
  netWeight: string;
  stoneWeight: string;
  marketRate: string;
  pawnBrokerRate: string;
  cashInHand: string;
  bankBalance: string;
  gallaCash: string;
  receiptNumber: string;
  receipt: string;
  releaseGold: string;
  renewal: string;
  partialPayment: string;
  balanceDue: string;
  status: string;
  active: string;
  closed: string;
  redeemed: string;
  grams: string;
  perGram: string;
  itemDescription: string;
  purity: string;
  touch: string;

  // Dashboard & Attention Queue
  immediateAttention: string;
  goldRatesToday: string;
  liveGoodReturns: string;
  overdueNotice: string;
  noOverdueRecords: string;
  noDueTodayRecords: string;
  noUpcomingRecords: string;
  action: string;
  customerName: string;
  mobileNumber: string;
  date: string;
  dueDate: string;
  pledgeDate: string;
  viewDetails: string;
  collectVaddi: string;
  printReceipt: string;

  // Login & Portal
  loginTitle: string;
  loginSubtitle: string;
  ownerLogin: string;
  staffLogin: string;
  emailOrUsername: string;
  password: string;
  enterPassword: string;
  mobileOtpLogin: string;
  registeredMobile: string;
  sendOtp: string;
  enterOtp: string;
  verifyAndLogin: string;
  loginButton: string;
  firstTimeLoginNote: string;
  languageSelect: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation & Common (Indian Market English - direct, familiar terms)
    dashboard: 'Dashboard',
    pledges: 'Pledges & Loans (Girvi / அடமானம்)',
    newPledge: '+ New Gold Pledge',
    customers: 'Customer Directory (Grahak)',
    newCustomer: '+ Add Customer',
    payments: 'Payment & Vaddi Collection',
    collectCash: '₹ Collect Cash / Vaddi',
    vault: 'Safe Vault & Lockers (Petty)',
    khatabook: 'Day Book & Ledger (Khatabook)',
    reports: 'Business & Interest Reports',
    staff: 'Staff & Access Control',
    auditTrail: 'Audit Trail Logs',
    settings: 'Shop Settings & Rules',
    searchPlaceholder: 'Search Mobile, Name, Pledge No (GM-...), Aadhaar...',
    lockWorkstation: 'Lock Workstation',
    lockVault: 'Lock Vault',
    scanPacket: 'Scan Packet',
    quickActions: 'Counter Quick Actions',
    activePledges: 'Running Pledges (Girvi)',
    overdue: 'Overdue (காலாவதி)',
    dueToday: 'Due Today (இன்று தவணை)',
    next7Days: 'Next 7 Days Due',

    // Financial & Gold Terminology
    principal: 'Asal / Principal (அசல்)',
    interest: 'Vaddi / Interest (வட்டி)',
    penaltyInterest: 'Late Penalty Vaddi (அபராத வட்டி)',
    loanAmount: 'Loan Cash Given (கடன் தொகை)',
    interestRate: 'Monthly Interest % (மாத வட்டி)',
    grossWeight: 'Gross Weight (மொத்த எடை)',
    netWeight: 'Net Pure Weight (நிகர எடை)',
    stoneWeight: 'Stone / Wastage (கல் கழிவு)',
    marketRate: 'GoodReturns Market Rate',
    pawnBrokerRate: 'Shop Mortgage Rate (நமது விலை)',
    cashInHand: 'Counter Cash (கல்லா பணம்)',
    bankBalance: 'Bank Account Balance',
    gallaCash: 'Galla Box Cash',
    receiptNumber: 'Pledge / Raseed No',
    receipt: 'Pledge Receipt (பற்றுச் சீட்டு)',
    releaseGold: 'Meetu / Release Gold (மீட்பு)',
    renewal: 'Loan Renewal (புதுப்பித்தல்)',
    partialPayment: 'Part Payment (பகுதி வசூல்)',
    balanceDue: 'Baaki / Balance Due (பாக்கி)',
    status: 'Loan Status',
    active: 'Active (நடைமுறை)',
    closed: 'Closed (முடிந்தது)',
    redeemed: 'Gold Released (மீட்கப்பட்டது)',
    grams: 'grams (கி)',
    perGram: 'per gram (கிராம்)',
    itemDescription: 'Gold Item Details (நகை விவரம்)',
    purity: 'Purity / Hallmark Touch',
    touch: 'Touch (916 KDM / 22K)',

    // Dashboard & Attention Queue
    immediateAttention: 'Daily Action Queue (கல்லா தவணை பட்டியல்)',
    goldRatesToday: 'Live Gold Bullion Rates (GoodReturns)',
    liveGoodReturns: 'Live Chennai Bullion Rates',
    overdueNotice: 'Customer loans past due date. Call for interest payment or redemption.',
    noOverdueRecords: 'No overdue pledge accounts! All loans up to date.',
    noDueTodayRecords: 'No pledge interest or renewals due today.',
    noUpcomingRecords: 'No pledges due in the next 7 days.',
    action: 'Action',
    customerName: 'Customer (Grahak)',
    mobileNumber: 'Mobile Number',
    date: 'Date',
    dueDate: 'Due Date',
    pledgeDate: 'Pledge Date',
    viewDetails: 'View Details',
    collectVaddi: 'Collect Vaddi',
    printReceipt: 'Print A4 Receipt',

    // Login & Portal
    loginTitle: 'NEXUS GOLD SOVEREIGN',
    loginSubtitle: 'Gold Pawn Brokerage & Vault Management OS',
    ownerLogin: 'Owner Secure Login (உரிமையாளர்)',
    staffLogin: 'Staff Counter Login (பணியாளர்)',
    emailOrUsername: 'Registered Email or Username',
    password: 'Password (கடவுச்சொல்)',
    enterPassword: 'Enter your password',
    mobileOtpLogin: 'Mobile OTP Quick Login',
    registeredMobile: 'Owner Mobile Number (+91)',
    sendOtp: 'Send OTP',
    enterOtp: 'Enter 6-Digit SMS OTP',
    verifyAndLogin: 'Verify OTP & Log In',
    loginButton: 'Log In to Counter',
    firstTimeLoginNote: 'First-time staff login will prompt you to set your private password.',
    languageSelect: 'Language / மொழி'
  },
  ta: {
    // Navigation & Common (Tamil / தமிழ்)
    dashboard: 'முகப்புப்பலகை (Dashboard)',
    pledges: 'அடமானக் கணக்குகள் (Pledges)',
    newPledge: '+ புதிய அடமானம்',
    customers: 'வாடிக்கையாளர் பட்டியல் (Customers)',
    newCustomer: '+ புதிய வாடிக்கையாளர்',
    payments: 'வட்டி & அசல் வசூல் (Payments)',
    collectCash: '₹ வட்டி வசூல் (Collect)',
    vault: 'லாக்கர் & பாதுகாப்பு பெட்டகம் (Vault)',
    khatabook: 'கல்லா தினசரி கணக்கு (Khatabook)',
    reports: 'வணிக அறிக்கைகள் (Reports)',
    staff: 'பணியாளர் நிர்வாகம் (Staff)',
    auditTrail: 'கணினி தணிக்கை பதிவு (Audit Logs)',
    settings: 'கடை அமைப்புகள் (Settings)',
    searchPlaceholder: 'மொபைல் எண், பெயர், ரசீது எண் (GM-...), ஆதார் தேடுக...',
    lockWorkstation: 'கல்லா திரையை பூட்டு',
    lockVault: 'லாக்கரை பூட்டு',
    scanPacket: 'நகை பாக்கெட் ஸ்கேன்',
    quickActions: 'துரித செயல்பாடுகள் (Quick Actions)',
    activePledges: 'நடப்பில் உள்ள அடமானம்',
    overdue: 'தவணை தவறியவை (Overdue)',
    dueToday: 'இன்று தவணை நாள் (Due Today)',
    next7Days: 'அடுத்த 7 நாட்கள் தவணை',

    // Financial & Gold Terminology (Local Tamil Pawn Terms)
    principal: 'அசல் தொகை (Principal / Asal)',
    interest: 'வட்டி தொகை (Vaddi / Interest)',
    penaltyInterest: 'அபராத வட்டி (Late Fee)',
    loanAmount: 'வழங்கப்பட்ட கடன் (Loan Given)',
    interestRate: 'மாத வட்டி விகிதம் (Interest %)',
    grossWeight: 'மொத்த எடை (Gross Wt)',
    netWeight: 'நிகர எடை (Net Wt)',
    stoneWeight: 'கல் / அழுக்கு கழிவு (Stone Wt)',
    marketRate: 'இன்றைய தங்கம் சந்தை விலை',
    pawnBrokerRate: 'நமது அடமான கிராம் விலை (Shop Rate)',
    cashInHand: 'கல்லா ரொக்க இருப்பு (Cash in Hand)',
    bankBalance: 'வங்கி கணக்கு இருப்பு (Bank Balance)',
    gallaCash: 'கல்லா பெட்டி ரொக்கம்',
    receiptNumber: 'அடமான ரசீது எண் (Pledge No)',
    receipt: 'அடமான பற்றுச் சீட்டு (Receipt)',
    releaseGold: 'நகை மீட்பு (Release Gold / Meetu)',
    renewal: 'அடமானம் புதுப்பித்தல் (Renewal)',
    partialPayment: 'பகுதி ரொக்க வசூல் (Part Payment)',
    balanceDue: 'மீதமுள்ள பாக்கி தொகை (Balance Due)',
    status: 'நிலைமை (Status)',
    active: 'நடைமுறையில் (Active)',
    closed: 'முடிந்தது (Closed)',
    redeemed: 'மீட்கப்பட்டது (Redeemed)',
    grams: 'கிராம் (Grams)',
    perGram: 'ஒரு கிராமுக்கு (Per Gram)',
    itemDescription: 'தங்க நகை விவரம் (Ornaments)',
    purity: 'தங்க தரம் / டச் (Purity / Hallmark)',
    touch: 'டச் (916 KDM / 22 காரட்)',

    // Dashboard & Attention Queue
    immediateAttention: 'இன்றைய உடனடி கவனப் பட்டியல் (Action Queue)',
    goldRatesToday: 'இன்றைய நேரடி தங்கம் விலை (GoodReturns)',
    liveGoodReturns: 'சென்னை நேரடி தங்கம் விலை நிலவரம்',
    overdueNotice: 'தவணை காலம் முடிந்த அடமானங்கள். வட்டி வசூலிக்க அல்லது நகை மீட்க தொடர்பு கொள்ளவும்.',
    noOverdueRecords: 'தவணை தவறிய கணக்குகள் ஏதுமில்லை! அனைத்தும் சீராக உள்ளது.',
    noDueTodayRecords: 'இன்று தவணை செலுத்தும் கணக்குகள் ஏதுமில்லை.',
    noUpcomingRecords: 'அடுத்த 7 நாட்களில் தவணை ஏதுமில்லை.',
    action: 'செயல்',
    customerName: 'வாடிக்கையாளர் பெயர்',
    mobileNumber: 'மொபைல் எண்',
    date: 'தேதி',
    dueDate: 'கடைசி தவணை தேதி',
    pledgeDate: 'அடமானம் வைத்த தேதி',
    viewDetails: 'முழு விவரம்',
    collectVaddi: 'வட்டி வசூல்',
    printReceipt: 'A4 ரசீது அச்சிடு',

    // Login & Portal
    loginTitle: 'நெக்சஸ் கோல்ட் ஆப்பரேட்டிங் சிஸ்டம்',
    loginSubtitle: 'தங்க அடமானக் கடை & லாக்கர் மேலாண்மை மென்பொருள்',
    ownerLogin: 'உரிமையாளர் உள்நுழைவு (Owner Login)',
    staffLogin: 'பணியாளர் உள்நுழைவு (Staff Login)',
    emailOrUsername: 'மின்னஞ்சல் அல்லது பயனர் பெயர்',
    password: 'கடவுச்சொல் (Password)',
    enterPassword: 'கடவுச்சொல்லை உள்ளிடவும்',
    mobileOtpLogin: 'மொபைல் OTP நேரடி உள்நுழைவு',
    registeredMobile: 'உரிமையாளர் மொபைல் எண் (+91)',
    sendOtp: 'OTP அனுப்புக',
    enterOtp: '6 இலக்க SMS OTP உள்ளிடவும்',
    verifyAndLogin: 'OTP சரிபார்த்து உள்நுழைக',
    loginButton: 'உள்நுழைக (Log In)',
    firstTimeLoginNote: 'முதல் முறை நுழையும் பணியாளர்கள் தங்களது புதிய ரகசிய கடவுச்சொல்லை அமைக்க வேண்டும்.',
    languageSelect: 'மொழி / Language'
  }
};
