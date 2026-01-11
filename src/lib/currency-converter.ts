import { Currency } from './currency'
import { convertAmount } from './exchange-rates'

/**
 * Converts an amount from its original currency to the budget's base currency
 */
export async function convertToBaseCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount
  }
  return await convertAmount(amount, fromCurrency, toCurrency)
}

/**
 * Converts multiple amounts to base currency (batch operation for efficiency)
 */
export async function convertAmountsToBaseCurrency(
  items: Array<{ amount: number; currency: Currency }>,
  baseCurrency: Currency
): Promise<Map<string, number>> {
  const converted = new Map<string, number>()
  
  // Group by currency to minimize API calls
  const byCurrency = new Map<Currency, number[]>()
  items.forEach((item, index) => {
    if (!byCurrency.has(item.currency)) {
      byCurrency.set(item.currency, [])
    }
    byCurrency.get(item.currency)!.push(index)
  })

  // Convert each currency group
  for (const [currency, indices] of byCurrency.entries()) {
    if (currency === baseCurrency) {
      indices.forEach(index => {
        converted.set(String(index), items[index].amount)
      })
    } else {
      // Convert all amounts of this currency at once
      const rate = await convertAmount(1, currency, baseCurrency)
      indices.forEach(index => {
        converted.set(String(index), items[index].amount * rate)
      })
    }
  }

  return converted
}
