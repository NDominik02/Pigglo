import { prisma } from './db'
import { Currency } from './currency'

const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest'

interface ExchangeRateResponse {
  rates: Record<string, number>
  base: string
  date: string
}

// Cache exchange rates in memory for the current session
let rateCache: Map<string, { rate: number; date: Date }> = new Map()

export async function getExchangeRate(
  from: Currency,
  to: Currency
): Promise<number> {
  // Same currency, no conversion needed
  if (from === to) {
    return 1
  }

  const cacheKey = `${from}_${to}`
  const cached = rateCache.get(cacheKey)
  
  // Check if we have a recent cached rate (less than 24 hours old)
  if (cached) {
    const hoursSinceUpdate = (Date.now() - cached.date.getTime()) / (1000 * 60 * 60)
    if (hoursSinceUpdate < 24) {
      return cached.rate
    }
  }

  // Try to get from database (today's rates)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const dbRate = await prisma.exchangeRate.findFirst({
    where: {
      fromCurrency: from,
      toCurrency: to,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
    orderBy: {
      date: 'desc',
    },
  })

  if (dbRate) {
    rateCache.set(cacheKey, { rate: dbRate.rate, date: dbRate.date })
    return dbRate.rate
  }

  // Fetch from API if not in database
  try {
    const rate = await fetchExchangeRateFromAPI(from, to)
    
    // Store in database
    await prisma.exchangeRate.create({
      data: {
        fromCurrency: from,
        toCurrency: to,
        rate,
        date: today,
      },
    })

    // Update cache
    rateCache.set(cacheKey, { rate, date: today })
    
    return rate
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    
    // Fallback: try reverse rate if available
    const reverseKey = `${to}_${from}`
    const reverseCached = rateCache.get(reverseKey)
    if (reverseCached) {
      return 1 / reverseCached.rate
    }

    // Last resort: return 1 (no conversion) if API fails
    console.warn(`Failed to fetch exchange rate ${from} -> ${to}, using 1.0`)
    return 1
  }
}

async function fetchExchangeRateFromAPI(
  from: Currency,
  to: Currency
): Promise<number> {
  try {
    // Fetch rates from USD base (most common)
    const response = await fetch(`${EXCHANGE_RATE_API}/USD`)
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data: ExchangeRateResponse = await response.json()
    
    // Convert from -> USD -> to
    const fromToUSD = from === 'USD' ? 1 : (1 / (data.rates[from] || 1))
    const usdToTo = to === 'USD' ? 1 : (data.rates[to] || 1)
    
    return fromToUSD * usdToTo
  } catch (error) {
    console.error('Error fetching from exchange rate API:', error)
    throw error
  }
}

export async function convertAmount(
  amount: number,
  from: Currency,
  to: Currency
): Promise<number> {
  if (from === to) {
    return amount
  }

  const rate = await getExchangeRate(from, to)
  return amount * rate
}

export async function fetchAndStoreAllRates(): Promise<void> {
  const currencies: Currency[] = ['USD', 'EUR', 'HUF']
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    const response = await fetch(`${EXCHANGE_RATE_API}/USD`)
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data: ExchangeRateResponse = await response.json()
    
    // Store all currency pairs
    for (const from of currencies) {
      for (const to of currencies) {
        if (from === to) continue

        const fromToUSD = from === 'USD' ? 1 : (1 / (data.rates[from] || 1))
        const usdToTo = to === 'USD' ? 1 : (data.rates[to] || 1)
        const rate = fromToUSD * usdToTo

        // Upsert the rate
        await prisma.exchangeRate.upsert({
          where: {
            fromCurrency_toCurrency_date: {
              fromCurrency: from,
              toCurrency: to,
              date: today,
            },
          },
          update: {
            rate,
          },
          create: {
            fromCurrency: from,
            toCurrency: to,
            rate,
            date: today,
          },
        })

        // Update cache
        const cacheKey = `${from}_${to}`
        rateCache.set(cacheKey, { rate, date: today })
      }
    }

    console.log('Exchange rates fetched and stored successfully')
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    throw error
  }
}
