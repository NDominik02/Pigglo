import { NextRequest, NextResponse } from 'next/server'
import { fetchAndStoreAllRates } from '@/lib/exchange-rates'

/**
 * Cron job endpoint to fetch exchange rates daily
 * Should be called at 1 AM daily via external cron service (e.g., Vercel Cron, cron-job.org)
 * 
 * To use with Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/exchange-rates",
 *     "schedule": "0 1 * * *"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Optional: Add authentication header check
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await fetchAndStoreAllRates()

    return NextResponse.json({ 
      message: 'Exchange rates updated successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating exchange rates:', error)
    return NextResponse.json(
      { error: 'Failed to update exchange rates' },
      { status: 500 }
    )
  }
}
