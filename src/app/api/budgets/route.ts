import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Role, TransactionType } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const budgets = await prisma.budget.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: { userId: session.user.id },
            },
          },
        ],
      },
      include: {
        _count: {
          select: { transactions: true, members: true },
        },
      },
    })

    return NextResponse.json({ budgets })
  } catch (error) {
    console.error('Error fetching budgets:', error)
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

    const { name, currency } = await req.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Budget name is required' },
        { status: 400 }
      )
    }

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'HUF']
    const selectedCurrency = currency && validCurrencies.includes(currency) ? currency : 'USD'

    const budget = await prisma.budget.create({
      data: {
        name: name.trim(),
        currency: selectedCurrency,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: Role.OWNER,
          },
        },
        categories: {
          createMany: {
            data: [
              // Income categories
              { name: 'Salary', emoji: '💼', type: TransactionType.INCOME },
              { name: 'Freelance', emoji: '💻', type: TransactionType.INCOME },
              { name: 'Investment', emoji: '📈', type: TransactionType.INCOME },
              { name: 'Rental Income', emoji: '🏠', type: TransactionType.INCOME },
              { name: 'Bonus', emoji: '🎁', type: TransactionType.INCOME },
              { name: 'Other Income', emoji: '💰', type: TransactionType.INCOME },
              // Expense categories
              { name: 'Groceries', emoji: '🛒', type: TransactionType.EXPENSE },
              { name: 'Rent', emoji: '🏘️', type: TransactionType.EXPENSE },
              { name: 'Utilities', emoji: '💡', type: TransactionType.EXPENSE },
              { name: 'Transportation', emoji: '🚗', type: TransactionType.EXPENSE },
              { name: 'Gas', emoji: '⛽', type: TransactionType.EXPENSE },
              { name: 'Dining Out', emoji: '🍽️', type: TransactionType.EXPENSE },
              { name: 'Entertainment', emoji: '🎬', type: TransactionType.EXPENSE },
              { name: 'Shopping', emoji: '🛍️', type: TransactionType.EXPENSE },
              { name: 'Healthcare', emoji: '🏥', type: TransactionType.EXPENSE },
              { name: 'Insurance', emoji: '🛡️', type: TransactionType.EXPENSE },
              { name: 'Phone', emoji: '📱', type: TransactionType.EXPENSE },
              { name: 'Internet', emoji: '🌐', type: TransactionType.EXPENSE },
              { name: 'Other Expenses', emoji: '📝', type: TransactionType.EXPENSE },
              // Debt categories
              { name: 'Credit Card', emoji: '💳', type: TransactionType.DEBT },
              { name: 'Student Loan', emoji: '🎓', type: TransactionType.DEBT },
              { name: 'Car Loan', emoji: '🚙', type: TransactionType.DEBT },
              { name: 'Personal Loan', emoji: '📋', type: TransactionType.DEBT },
              { name: 'Mortgage', emoji: '🏡', type: TransactionType.DEBT },
              { name: 'Other Debt', emoji: '📊', type: TransactionType.DEBT },
              // Savings categories
              { name: 'Emergency Fund', emoji: '🚨', type: TransactionType.SAVINGS },
              { name: 'Retirement', emoji: '👴', type: TransactionType.SAVINGS },
              { name: 'Vacation', emoji: '✈️', type: TransactionType.SAVINGS },
              { name: 'House Down Payment', emoji: '🏘️', type: TransactionType.SAVINGS },
              { name: 'Education', emoji: '📚', type: TransactionType.SAVINGS },
              { name: 'Other Savings', emoji: '💵', type: TransactionType.SAVINGS },
            ],
          },
        },
      },
    })

    return NextResponse.json({ budget }, { status: 201 })
  } catch (error) {
    console.error('Error creating budget:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
