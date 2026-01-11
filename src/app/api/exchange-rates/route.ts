import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchAndStoreAllRates } from '@/lib/exchange-rates'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await fetchAndStoreAllRates()

    return NextResponse.json({ message: 'Exchange rates updated successfully' })
  } catch (error) {
    console.error('Error updating exchange rates:', error)
    return NextResponse.json(
      { error: 'Failed to update exchange rates' },
      { status: 500 }
    )
  }
}
