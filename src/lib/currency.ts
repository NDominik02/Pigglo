export type Currency = 'USD' | 'EUR' | 'HUF'

export interface CurrencyConfig {
  code: Currency
  symbol: string
  symbolPosition: 'before' | 'after'
  decimalPlaces: number
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    symbolPosition: 'before',
    decimalPlaces: 2,
  },
  HUF: {
    code: 'HUF',
    symbol: 'Ft',
    symbolPosition: 'after',
    decimalPlaces: 0, // Hungarian Forint typically doesn't use decimals
  },
}

export function formatCurrency(
  amount: number,
  currency: Currency = 'USD'
): string {
  const config = CURRENCIES[currency]
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
  })

  if (config.symbolPosition === 'before') {
    return `${config.symbol}${formattedAmount}`
  } else {
    return `${formattedAmount} ${config.symbol}`
  }
}

export function getCurrencyOptions() {
  return Object.values(CURRENCIES).map((currency) => ({
    value: currency.code,
    label: `${currency.code} (${currency.symbol})`,
  }))
}
