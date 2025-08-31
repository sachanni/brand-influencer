export type SupportedCurrency = 'INR' | 'USD' | 'GBP' | 'EUR';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  locale: string;
  name: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    locale: 'en-IN',
    name: 'Indian Rupee',
    flag: '🇮🇳'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
    name: 'US Dollar',
    flag: '🇺🇸'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    locale: 'en-GB',
    name: 'British Pound',
    flag: '🇬🇧'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    locale: 'en-EU',
    name: 'Euro',
    flag: '🇪🇺'
  }
};

/**
 * Format currency amount based on the specified currency
 */
export function formatCurrency(
  amount: number | string, 
  currency: SupportedCurrency = 'INR',
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
  } = {}
): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return `${SUPPORTED_CURRENCIES[currency].symbol}0`;
  }

  const config = SUPPORTED_CURRENCIES[currency];
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    showSymbol = true
  } = options;

  const formatted = new Intl.NumberFormat(config.locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: config.code,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(numericAmount);

  return formatted;
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: SupportedCurrency): string {
  return SUPPORTED_CURRENCIES[currency].symbol;
}

/**
 * Convert currency display text (like "₹4L-₹8L") based on the target currency
 */
export function convertCurrencyRange(
  range: string, 
  fromCurrency: SupportedCurrency, 
  toCurrency: SupportedCurrency
): string {
  if (fromCurrency === toCurrency) {
    return range;
  }

  // Simple conversion rates (in real app, these would come from an exchange rate API)
  const conversionRates: Record<SupportedCurrency, Record<SupportedCurrency, number>> = {
    INR: { INR: 1, USD: 0.012, GBP: 0.0095, EUR: 0.011 },
    USD: { INR: 83, USD: 1, GBP: 0.79, EUR: 0.92 },
    GBP: { INR: 105, USD: 1.27, GBP: 1, EUR: 1.17 },
    EUR: { INR: 90, USD: 1.08, GBP: 0.85, EUR: 1 }
  };

  const rate = conversionRates[fromCurrency][toCurrency];
  const fromSymbol = getCurrencySymbol(fromCurrency);
  const toSymbol = getCurrencySymbol(toCurrency);

  // Replace currency symbols and convert amounts
  return range
    .replace(new RegExp(fromSymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), toSymbol)
    .replace(/(\d+(?:\.\d+)?)(L|K)?/g, (match, amount, suffix) => {
      let numericAmount = parseFloat(amount);
      
      // Convert L (lakh) and K (thousand) to base numbers for conversion
      if (suffix === 'L') numericAmount *= 100000; // 1 lakh = 100,000
      if (suffix === 'K') numericAmount *= 1000;

      // Apply conversion rate
      numericAmount *= rate;

      // Format back to appropriate suffix
      if (numericAmount >= 100000) {
        if (toCurrency === 'INR') {
          return (numericAmount / 100000).toFixed(1).replace('.0', '') + 'L';
        } else {
          return (numericAmount / 1000).toFixed(0) + 'K';
        }
      } else if (numericAmount >= 1000) {
        return (numericAmount / 1000).toFixed(0) + 'K';
      } else {
        return Math.round(numericAmount).toString();
      }
    });
}

/**
 * Get formatted currency options for select dropdowns
 */
export function getCurrencyOptions(): Array<{ value: SupportedCurrency; label: string; flag: string }> {
  return Object.entries(SUPPORTED_CURRENCIES).map(([code, config]) => ({
    value: code as SupportedCurrency,
    label: `${config.flag} ${config.name} (${config.symbol})`,
    flag: config.flag
  }));
}