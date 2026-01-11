import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { requireBudgetAccess } from '@/lib/budget-utils'
import { Role } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const budgetId = searchParams.get('budgetId')

    if (!budgetId) {
      return NextResponse.json(
        { error: 'budgetId is required' },
        { status: 400 }
      )
    }

    await requireBudgetAccess(budgetId)

    const transactions = await prisma.transaction.findMany({
      where: { budgetId },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { budgetId, type, categoryId, amount, currency, description, date } =
      await req.json()

    if (!budgetId || !type || amount === undefined || !date) {
      return NextResponse.json(
        { error: 'budgetId, type, amount, and date are required' },
        { status: 400 }
      )
    }

    const { userRole } = await requireBudgetAccess(budgetId)

    if (userRole !== Role.OWNER && userRole !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'HUF']
    const transactionCurrency = currency && validCurrencies.includes(currency) ? currency : 'USD'

    const transaction = await prisma.transaction.create({
      data: {
        budgetId,
        userId: session.user.id,
        categoryId: categoryId || null,
        type,
        amount: parseFloat(amount),
        currency: transactionCurrency,
        description: description || null,
        date: new Date(date),
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
