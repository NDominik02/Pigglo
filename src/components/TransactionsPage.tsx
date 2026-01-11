'use client'

import { useState, useEffect } from 'react'
import { TransactionType, Role, canEditTransaction, canDeleteTransaction } from '@/lib/utils'
import { formatCurrency, getCurrencyOptions, Currency } from '@/lib/currency'
import { convertAmount } from '@/lib/exchange-rates'
import Card from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import Select from './ui/Select'
import Modal from './ui/Modal'

interface Category {
  id: string
  name: string
  emoji: string | null
  type: TransactionType
}

interface Transaction {
  id: string
  userId: string
  categoryId: string | null
  type: TransactionType
  amount: number
  currency: string
  description: string | null
  date: string
  category: Category | null
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface TransactionsPageProps {
  budgetId: string
  userId: string
  userRole: string
  initialTransactions: Transaction[]
  categories: Category[]
  currency: 'USD' | 'EUR' | 'HUF'
}

const transactionTypes = [
  { value: TransactionType.INCOME, label: 'Income' },
  { value: TransactionType.EXPENSE, label: 'Expense' },
  { value: TransactionType.DEBT, label: 'Debt' },
  { value: TransactionType.SAVINGS, label: 'Savings' },
]

export default function TransactionsPage({
  budgetId,
  userId,
  userRole,
  initialTransactions,
  categories,
  currency,
}: TransactionsPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [convertedAmounts, setConvertedAmounts] = useState<Map<string, number>>(new Map())
  const [formData, setFormData] = useState({
    type: TransactionType.EXPENSE,
    categoryId: '',
    amount: '',
    currency: currency as 'USD' | 'EUR' | 'HUF',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Convert transaction amounts to base currency
  useEffect(() => {
    const convertAmounts = async () => {
      const conversions = new Map<string, number>()
      for (const transaction of transactions) {
        if (transaction.currency === currency) {
          conversions.set(transaction.id, transaction.amount)
        } else {
          try {
            const converted = await convertAmount(
              transaction.amount,
              transaction.currency as Currency,
              currency
            )
            conversions.set(transaction.id, converted)
          } catch (error) {
            console.error('Error converting amount:', error)
            conversions.set(transaction.id, transaction.amount)
          }
        }
      }
      setConvertedAmounts(conversions)
    }
    convertAmounts()
  }, [transactions, currency])

  const canAdd = userRole === Role.OWNER || userRole === Role.ADMIN

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'all') return true
    return t.type === filterType
  })

  const filteredCategories = categories.filter((c) => c.type === formData.type)

  const handleOpenModal = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction)
      setFormData({
        type: transaction.type,
        categoryId: transaction.categoryId || '',
        amount: transaction.amount.toString(),
        currency: (transaction.currency || 'USD') as 'USD' | 'EUR' | 'HUF',
        description: transaction.description || '',
        date: new Date(transaction.date).toISOString().split('T')[0],
      })
    } else {
      setEditingTransaction(null)
      setFormData({
        type: TransactionType.EXPENSE,
        categoryId: '',
        amount: '',
        currency: currency as 'USD' | 'EUR' | 'HUF',
        description: '',
        date: new Date().toISOString().split('T')[0],
      })
    }
    setIsModalOpen(true)
    setError('')
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTransaction(null)
    setFormData({
      type: TransactionType.EXPENSE,
      categoryId: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = editingTransaction
        ? `/api/transactions/${editingTransaction.id}`
        : '/api/transactions'
      const method = editingTransaction ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetId,
          type: formData.type,
          categoryId: formData.categoryId || null,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          description: formData.description || null,
          date: formData.date,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save transaction')
        return
      }

      if (editingTransaction) {
        setTransactions(
          transactions.map((t) =>
            t.id === editingTransaction.id ? data.transaction : t
          )
        )
      } else {
        setTransactions([data.transaction, ...transactions])
      }

      handleCloseModal()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return
    }

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        alert('Failed to delete transaction')
        return
      }

      setTransactions(transactions.filter((t) => t.id !== transactionId))
    } catch (err) {
      alert('An error occurred')
    }
  }

  return (
    <>
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
          >
            <option value="all">All Types</option>
            {transactionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        {canAdd && (
          <Button onClick={() => handleOpenModal()}>Add Transaction</Button>
        )}
      </div>

      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No transactions found
            </p>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => {
            const canEdit = canEditTransaction(
              userRole as Role,
              transaction.userId,
              userId
            )
            const canDelete = canDeleteTransaction(
              userRole as Role,
              transaction.userId,
              userId
            )

            return (
              <Card key={transaction.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(convertedAmounts.get(transaction.id) || transaction.amount, currency)}
                      </span>
                      {transaction.currency !== currency && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({formatCurrency(transaction.amount, transaction.currency as Currency)})
                        </span>
                      )}
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        {transaction.category?.emoji && <span>{transaction.category.emoji}</span>}
                        <span>{transaction.category?.name || 'Uncategorized'}</span>
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          transaction.type === TransactionType.INCOME
                            ? 'bg-green-100 dark:bg-green-900/30 text-income'
                            : transaction.type === TransactionType.EXPENSE
                            ? 'bg-red-100 dark:bg-red-900/30 text-expense'
                            : transaction.type === TransactionType.DEBT
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-debt'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-savings'
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </div>
                    {transaction.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {transaction.description}
                      </p>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(transaction.date).toLocaleDateString()} •{' '}
                      {transaction.user.name || transaction.user.email}
                    </div>
                  </div>
                  {(canEdit || canDelete) && (
                    <div className="flex gap-2">
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenModal(transaction)}
                        >
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )
          })
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => {
              setFormData({
                ...formData,
                type: e.target.value as TransactionType,
                categoryId: '',
              })
            }}
            options={transactionTypes}
            required
            disabled={loading}
          />
          <Select
            label="Category"
            value={formData.categoryId}
            onChange={(e) =>
              setFormData({ ...formData, categoryId: e.target.value })
            }
            options={[
              { value: '', label: 'No category' },
              ...filteredCategories.map((c) => ({
                value: c.id,
                label: c.name,
              })),
            ]}
            disabled={loading}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              disabled={loading}
            />
            <Select
              label="Currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
              options={getCurrencyOptions()}
              required
              disabled={loading}
            />
          </div>
          <Input
            label="Description"
            type="text"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            disabled={loading}
          />
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            disabled={loading}
          />
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingTransaction ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
