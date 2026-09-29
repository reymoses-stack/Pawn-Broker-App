import { Mortgage, Customer, Payment, Branch, BusinessSettings } from '../types';
import { formatCurrency, formatDate } from './formatters';
import { buildCustomerPortalUrl } from './qrCodeService';

/**
 * Clean and format Indian mobile phone numbers for WhatsApp API.
 * Ensures 10-digit numbers get prefixed with 91.
 */
export function cleanMobileForWhatsApp(mobile: string): string {
  const digitsOnly = mobile.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return digitsOnly;
  }
  return digitsOnly;
}

/**
 * Open WhatsApp Web / App with pre-filled message text.
 */
export function openWhatsApp(mobile: string, message: string): void {
  const cleanPhone = cleanMobileForWhatsApp(mobile);
  if (!cleanPhone) {
    alert('Invalid customer mobile number for WhatsApp dispatch.');
    return;
  }
  const encodedText = encodeURIComponent(message.trim());
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Generate formatted WhatsApp message for a newly booked or active pawn pledge.
 */
export function buildPledgeReceiptMessage(params: {
  mortgage: Mortgage;
  customer: Customer;
  branch: Branch;
  settings: BusinessSettings;
  language?: 'en' | 'ta';
}): string {
  const { mortgage, customer, branch, settings, language = 'en' } = params;
  const portalUrl = buildCustomerPortalUrl(customer.id, branch.code, mortgage.mortgageNumber);
  const totalGross = mortgage.items?.reduce((s, i) => s + (i.grossWeight || 0), 0) || 0;
  const totalNet = mortgage.items?.reduce((s, i) => s + (i.netWeight || 0), 0) || 0;
  const totalGrams = totalGross.toFixed(2);
  const netGrams = totalNet.toFixed(2);

  if (language === 'ta') {
    return `
👑 *${settings.companyName || branch.name}*
📍 *${branch.name}* (கிளை குறியீடு: ${branch.code})
---------------------------------------
வணக்கம் *${customer.name}* அவர்களுக்கு,

தங்களின் தங்க நகை அடமான ரசீது விபரம்:
📋 *அடமான எண்:* ${mortgage.mortgageNumber}
📅 *தேதி:* ${formatDate(mortgage.mortgageDate)}
💰 *வழங்கப்பட்ட அசல் கடன்:* ${formatCurrency(mortgage.principalAmount)}
⚖️ *மொத்த எடை:* ${totalGrams} g (நிகர எடை: ${netGrams} g)
📈 *வட்டி விகிதம்:* ${mortgage.interestRate}% / மாதம்
🗓️ *கடைசி தவணை தேதி:* ${formatDate(mortgage.maturityDate)}

📄 *தங்களின் டிஜிட்டல் பாஸ்புக் & ரசீதை பதிவிறக்கம் செய்ய:*
👉 ${portalUrl}

📞 *தொடர்புக்கு:* ${branch.phone || 'கடை நிர்வாகம்'}
நன்றி, என்றும் உங்கள் நல்வாழ்வில் இணைந்திருக்கும் நிறுவனம்!
`.trim();
  }

  return `
👑 *${settings.companyName || branch.name}*
📍 *${branch.name}* (Branch: ${branch.code})
---------------------------------------
Dear *${customer.name}*,

Thank you for pledging with us. Here are your Pawn Pledge details:
📋 *Pledge Loan No:* ${mortgage.mortgageNumber}
📅 *Issue Date:* ${formatDate(mortgage.mortgageDate)}
💰 *Principal Amount:* ${formatCurrency(mortgage.principalAmount)}
⚖️ *Gold Net Weight:* ${netGrams} g (Gross: ${totalGrams} g)
📈 *Monthly Interest Rate:* ${mortgage.interestRate}% p.m.
🗓️ *Maturity Due Date:* ${formatDate(mortgage.maturityDate)}

📄 *View & Download your Digital Passbook / PDF Receipt:*
👉 ${portalUrl}

📞 *Branch Helpdesk:* ${branch.phone || ''}
${settings.tagline ? `✨ ${settings.tagline}` : ''}
`.trim();
}

/**
 * Generate formatted WhatsApp message for a payment / interest collection receipt.
 */
export function buildPaymentReceiptMessage(params: {
  payment: Payment;
  mortgage?: Mortgage;
  customer: Customer;
  branch: Branch;
  settings: BusinessSettings;
  language?: 'en' | 'ta';
}): string {
  const { payment, mortgage, customer, branch, settings, language = 'en' } = params;
  const portalUrl = buildCustomerPortalUrl(customer.id, branch.code, mortgage?.mortgageNumber);
  const receiptNo = payment.referenceNumber || payment.id;

  if (language === 'ta') {
    return `
🧾 *${settings.companyName || branch.name}*
📍 *வட்டி வசூல் வரவு ரசீது*
---------------------------------------
வணக்கம் *${customer.name}* அவர்களுக்கு,

தங்களின் தொகை வரவு வைக்கப்பட்டது:
🧾 *ரசீது எண்:* ${receiptNo}
📋 *அடமான எண்:* ${payment.mortgageNumber}
📅 *வரவு தேதி:* ${formatDate(payment.paymentDate)}
💵 *செலுத்திய தொகை:* ${formatCurrency(payment.amount)} (${payment.paymentMethod})

🔹 *வட்டி வரவு:* ${formatCurrency(payment.allocatedInterest)}
🔹 *அசல் வரவு:* ${formatCurrency(payment.allocatedPrincipal)}
${mortgage ? `📊 *மீதமுள்ள அசல் கடன்:* ${formatCurrency(mortgage.outstandingPrincipal)}` : ''}

📄 *தங்களின் பாஸ்புக்கில் சரிபார்க்க:*
👉 ${portalUrl}

📞 *கிளை உதவி எண்:* ${branch.phone || ''}
நன்றி!
`.trim();
  }

  return `
🧾 *${settings.companyName || branch.name}*
📍 *Payment Collection Receipt*
---------------------------------------
Dear *${customer.name}*,

We have successfully received your payment:
🧾 *Receipt Voucher No:* ${receiptNo}
📋 *Loan Account No:* ${payment.mortgageNumber}
📅 *Payment Date:* ${formatDate(payment.paymentDate)}
💵 *Total Paid:* ${formatCurrency(payment.amount)} (via ${payment.paymentMethod})

🔹 *Interest Credited:* ${formatCurrency(payment.allocatedInterest)}
🔹 *Principal Reduced:* ${formatCurrency(payment.allocatedPrincipal)}
${mortgage ? `📊 *Remaining Principal Balance:* ${formatCurrency(mortgage.outstandingPrincipal)}` : ''}

📄 *View your Live Passbook Statement:*
👉 ${portalUrl}

📞 *Contact Branch:* ${branch.phone || ''}
Thank you for banking with ${settings.companyName || branch.name}!
`.trim();
}

/**
 * Generate formatted WhatsApp message for payment reminder (Due / Overdue).
 */
export function buildReminderMessage(params: {
  mortgage: Mortgage;
  customer: Customer;
  branch: Branch;
  settings: BusinessSettings;
  language?: 'en' | 'ta';
}): string {
  const { mortgage, customer, branch, settings, language = 'en' } = params;
  const portalUrl = buildCustomerPortalUrl(customer.id, branch.code, mortgage.mortgageNumber);
  const isOverdue = mortgage.status === 'Overdue';

  if (language === 'ta') {
    return `
⚠️ *${settings.companyName || branch.name} - அன்பான நினைவூட்டல்*
---------------------------------------
வணக்கம் *${customer.name}* அவர்களுக்கு,

தங்களின் தங்க நகை அடமானக் கணக்கு எண்: *${mortgage.mortgageNumber}*
${isOverdue ? '⚠️ *தவணை காலம் முடிவடைந்து நிலுவையில் உள்ளது.*' : '🗓️ *தவணை காலம் விரைவில் முடிவடைகிறது.*'}

💰 *அசல் கடன் தொகை:* ${formatCurrency(mortgage.outstandingPrincipal)}
⏳ *நிலுவை வட்டி:* ${formatCurrency(mortgage.outstandingInterest || 0)}
💵 *மொத்தம் செலுத்த வேண்டிய தொகை:* ${formatCurrency(mortgage.outstandingPrincipal + (mortgage.outstandingInterest || 0))}
🗓️ *கடைசி தவணை தேதி:* ${formatDate(mortgage.maturityDate)}

அபராத வட்டியை தவிர்க்க தயவுசெய்து எங்களது கிளைக்கு வருகை தந்து அல்லது UPI மூலமாக செலுத்தி புதுப்பித்துக் கொள்ளுமாறு கேட்டுக்கொள்கிறோம்.

📄 *தங்களின் பாஸ்புக் விவரங்களை இங்கே பார்க்க:*
👉 ${portalUrl}

📞 *கிளை தொலைபேசி எண்:* ${branch.phone || ''}
${branch.address ? `🏢 *முகவரி:* ${branch.address}` : ''}
`.trim();
  }

  return `
⚠️ *${settings.companyName || branch.name} - Payment Due Reminder*
---------------------------------------
Dear *${customer.name}*,

Friendly reminder regarding your Gold Pledge Loan: *${mortgage.mortgageNumber}*.
${isOverdue ? '🚨 *Your loan has crossed its maturity date and is currently OVERDUE.*' : '🗓️ *Your loan interest/tenure maturity is DUE soon.*'}

💰 *Outstanding Principal:* ${formatCurrency(mortgage.outstandingPrincipal)}
⏳ *Accrued Interest:* ${formatCurrency(mortgage.outstandingInterest || 0)}
💵 *Total Amount Payable:* ${formatCurrency(mortgage.outstandingPrincipal + (mortgage.outstandingInterest || 0))}
🗓️ *Maturity Due Date:* ${formatDate(mortgage.maturityDate)}

Please visit our branch or pay via UPI/Bank transfer to avoid penalty charges or auction proceedings.

📄 *Check your Digital Passbook online:*
👉 ${portalUrl}

📞 *Branch Contact:* ${branch.phone || ''}
${branch.address ? `🏢 *Address:* ${branch.address}` : ''}
`.trim();
}
