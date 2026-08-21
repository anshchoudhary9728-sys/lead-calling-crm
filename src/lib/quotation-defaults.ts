import { CompanyProfile } from '@/types/quotation';

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  name: 'FABRIC TRADERS',
  tagline: 'Wholesaler, Exporter & Manufacturer of Premium Quality Fabrics',
  address_line1: 'Plot No. 104-106, Textile Market Complex, Ring Road',
  address_line2: 'Near Millennium Market',
  city: 'Surat',
  state: 'Gujarat',
  pincode: '395002',
  phone: '+91 98765 43210 / +91 98123 45678',
  email: 'sales@fabrictraders.com',
  website: 'www.fabrictraders.com',
  gstin: '24AAACF1234D1ZP',
  pan: 'AAACF1234D',
  bank_details: {
    bank_name: 'HDFC Bank Ltd',
    account_name: 'FABRIC TRADERS PRIVATE LIMITED',
    account_number: '50200088991122',
    ifsc_code: 'HDFC0000123',
    branch: 'Ring Road Branch, Surat',
    upi_id: 'fabrictraders@hdfcbank',
  },
};

export const DEFAULT_TERMS_AND_CONDITIONS = [
  'Prices quoted are net ex-mill / ex-godown Surat unless otherwise stated.',
  'GST will be charged extra as applicable at the time of invoice dispatch.',
  'Goods will be dispatched within 5 to 7 business days upon receipt of confirmed advance / PO.',
  'Payment Terms: 50% advance along with order confirmation, balance before transport dispatch.',
  'Transportation & transit insurance charges shall be borne by the buyer on To-Pay basis.',
  'This quotation is valid for 15 days from the date of issue.',
  'Fabric color shade variation of up to ±5% is standard textile trade tolerance.',
  'Subject to Surat Jurisdiction only.',
];

export const POPULAR_FABRIC_PRESETS = [
  { name: 'Pure Cotton 60s Cambric (Grey/RFD)', hsn_code: '5208', defaultRate: 85, defaultUnit: 'Mtr', gst_rate: 5 },
  { name: '100% Rayon / Viscose 140 GSM Plain', hsn_code: '5408', defaultRate: 92, defaultUnit: 'Mtr', gst_rate: 5 },
  { name: 'Pure Linen 60 Lea Fabric (Dyed)', hsn_code: '5309', defaultRate: 320, defaultUnit: 'Mtr', gst_rate: 5 },
  { name: 'Cotton Flex / Slub Dyed Fabric', hsn_code: '5208', defaultRate: 110, defaultUnit: 'Mtr', gst_rate: 5 },
  { name: 'Polyester Satin Silk (Digital Print Ready)', hsn_code: '5407', defaultRate: 65, defaultUnit: 'Mtr', gst_rate: 5 },
  { name: 'Heavy Cotton Canvas (10oz / 12oz)', hsn_code: '5209', defaultRate: 175, defaultUnit: 'Mtr', gst_rate: 5 },
  { name: 'Pure Mulmul / Voile Cotton 92x80', hsn_code: '5208', defaultRate: 58, defaultUnit: 'Mtr', gst_rate: 5 },
  { name: 'Viscose Modal Print Fabric', hsn_code: '5408', defaultRate: 145, defaultUnit: 'Mtr', gst_rate: 5 },
  { name: 'Cotton Poplin 40s (Solid Dyed)', hsn_code: '5208', defaultRate: 95, defaultUnit: 'Mtr', gst_rate: 5 },
  { name: 'Cotton Lycra 4-Way Stretch (Twill/Satin)', hsn_code: '5211', defaultRate: 180, defaultUnit: 'Mtr', gst_rate: 5 },
];

/**
 * Converts a number into Indian Rupees words
 */
export function numberToIndianRupeesWords(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Rupees Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const twoDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tensMultiple = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigit(n: number): string {
    if (n === 0) return '';
    if (n < 10) return singleDigits[n];
    if (n < 20) return twoDigits[n - 10];
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return `${tensMultiple[tens]}${ones > 0 ? ' ' + singleDigits[ones] : ''}`;
  }

  function convertThreeDigit(n: number): string {
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    let res = '';
    if (hundreds > 0) {
      res += `${singleDigits[hundreds]} Hundred`;
    }
    if (remainder > 0) {
      if (res) res += ' and ';
      res += convertTwoDigit(remainder);
    }
    return res;
  }

  let num = rounded;
  let words = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const hundred = num;

  if (crore > 0) {
    words += `${convertTwoDigit(crore)} Crore `;
  }
  if (lakh > 0) {
    words += `${convertTwoDigit(lakh)} Lakh `;
  }
  if (thousand > 0) {
    words += `${convertTwoDigit(thousand)} Thousand `;
  }
  if (hundred > 0) {
    words += `${convertThreeDigit(hundred)} `;
  }

  return `Rupees ${words.trim()} Only`;
}
