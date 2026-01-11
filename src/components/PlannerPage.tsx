'use client'

import { useState, useEffect } from 'react'
import { TransactionType, Role } from '@prisma/client'
import { canEditPlans } from '@/lib/utils'
import { formatCurrency, Currency } from '@/lib/currency'
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

interface Plan {
  id: string
  type: TransactionType
  categoryId: string | null
  category: Category | null
  year: number
  month: number | null
  amount: number
  currency: string
}

interface PlannerPageProps {
  budgetId: string
  year: number
  initialPlans: Plan[]
  categories: Category[]
  userRole: string
  currency: 'USD' | 'EUR' | 'HUF'
}

const transactionTypes = [
  { value: TransactionType.INCOME, label: 'Income' },
  { value: TransactionType.EXPENSE, label: 'Expense' },
  { value: TransactionType.DEBT, label: 'Debt' },
  { value: TransactionType.SAVINGS, label: 'Savings' },
]

const months = [
  { value: null, label: 'Yearly Total' },
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

export default function PlannerPage({
  budgetId,
  year: initialYear,
  initialPlans,
  categories,
  userRole,
  currency,
}: PlannerPageProps) {
  const [year, setYear] = useState(initialYear)
  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [preselectedType, setPreselectedType] = useState<TransactionType | null>(null)
  const [formData, setFormData] = useState<{
    type: TransactionType
    categoryId: string
    month: number | null
    amount: string
  }>({
    type: TransactionType.INCOME,
    categoryId: '',
    month: null,
    amount: '',
  })
  const [applyToAllMonths, setApplyToAllMonths] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canEdit = canEditPlans(userRole as Role)

  // Fetch plans when year changes
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch(`/api/plans?budgetId=${budgetId}&year=${year}`)
        if (response.ok) {
          const data = await response.json()
          setPlans(data.plans)
        }
      } catch (err) {
        console.error('Error fetching plans:', err)
      }
    }
    if (year !== initialYear) {
      fetchPlans()
    }
  }, [year, budgetId, initialYear])

  const getPlansForType = (type: TransactionType, month: number | null = null) => {
    return plans.filter((p) => p.type === type && p.month === month)
  }

  const getTotalForMonth = (type: TransactionType, month: number) => {
    return plans
      .filter((p) => p.type === type && p.month === month)
      .reduce((sum, p) => sum + p.amount, 0)
  }

  const getYearlyTotalForType = (type: TransactionType) => {
    return plans
      .filter((p) => p.type === type && p.month !== null)
      .reduce((sum, p) => sum + p.amount, 0)
  }

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME:
        return 'border-l-4 border-income bg-green-50 dark:bg-green-950/20'
      case TransactionType.EXPENSE:
        return 'border-l-4 border-expense bg-red-50 dark:bg-red-950/20'
      case TransactionType.DEBT:
        return 'border-l-4 border-debt bg-blue-50 dark:bg-blue-950/20'
      case TransactionType.SAVINGS:
        return 'border-l-4 border-savings bg-yellow-50 dark:bg-yellow-950/20'
      default:
        return ''
    }
  }

  const getTypeTextColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.INCOME:
        return 'text-income'
      case TransactionType.EXPENSE:
        return 'text-expense'
      case TransactionType.DEBT:
        return 'text-debt'
      case TransactionType.SAVINGS:
        return 'text-savings'
      default:
        return 'text-gray-900 dark:text-white'
    }
  }

  const handleOpenModal = (plan?: Plan, type?: TransactionType, month?: number | null) => {
    if (plan) {
      setEditingPlan(plan)
      setPreselectedType(null)
      setApplyToAllMonths(false)
      setFormData({
        type: plan.type,
        categoryId: plan.categoryId || '',
        month: plan.month,
        amount: plan.amount.toString(),
      })
    } else {
      setEditingPlan(null)
      const selectedType = type || TransactionType.INCOME
      setPreselectedType(selectedType)
      setApplyToAllMonths(false)
      setFormData({
        type: selectedType,
        categoryId: '',
        month: month ?? null,
        amount: '',
      })
    }
    setIsModalOpen(true)
    setError('')
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPlan(null)
    setPreselectedType(null)
    setApplyToAllMonths(false)
    setFormData({
      type: TransactionType.INCOME,
      categoryId: '',
      month: null,
      amount: '',
    })
    setError('')
  }

  const filteredCategories = categories.filter(
    (cat) => cat.type === formData.type
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate all required fields
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount greater than 0')
      setLoading(false)
      return
    }

    if (!formData.categoryId) {
      setError('Please select a category')
      setLoading(false)
      return
    }

    // Validate that month is selected (unless applying to all months) - yearly totals are calculated automatically from monthly plans
    if (!applyToAllMonths && formData.month === null) {
      setError('Please select a month or check "Apply to all months"')
      setLoading(false)
      return
    }

    try {
      if (editingPlan) {
        // Editing existing plan - single update
        const response = await fetch(`/api/plans/${editingPlan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            budgetId,
            type: formData.type,
            categoryId: formData.categoryId || null,
            year,
            month: formData.month,
            amount: parseFloat(formData.amount),
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to update plan')
          return
        }

        setPlans(plans.map((p) => (p.id === editingPlan.id ? data.plan : p)))
        handleCloseModal()
      } else if (applyToAllMonths) {
        // Create plan for all 12 months
        const monthsToCreate = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        const createdPlans: Plan[] = []

        for (const month of monthsToCreate) {
          const response = await fetch('/api/plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              budgetId,
              type: formData.type,
              categoryId: formData.categoryId,
              year,
              month,
              amount: parseFloat(formData.amount),
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            setError(data.error || `Failed to create plan for month ${month}`)
            return
          }

          createdPlans.push(data.plan)
        }

        // Add all created plans to the state
        setPlans([...plans, ...createdPlans])
        handleCloseModal()
      } else {
        // Create single plan
        const response = await fetch('/api/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            budgetId,
            type: formData.type,
            categoryId: formData.categoryId || null,
            year,
            month: formData.month,
            amount: parseFloat(formData.amount),
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to save plan')
          return
        }

        setPlans([...plans, data.plan])
        handleCloseModal()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) {
      return
    }

    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        alert('Failed to delete plan')
        return
      }

      setPlans(plans.filter((p) => p.id !== planId))
    } catch (err) {
      alert('An error occurred')
    }
  }

  const handleClearAll = async (type: TransactionType) => {
    const typeLabel = transactionTypes.find(t => t.value === type)?.label || type
    const plansOfType = plans.filter(p => p.type === type)
    const count = plansOfType.length

    if (count === 0) {
      return
    }

    if (!confirm(`Are you sure you want to delete all ${count} ${typeLabel.toLowerCase()} plan(s) for ${year}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/plans/bulk?budgetId=${budgetId}&type=${type}&year=${year}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Failed to delete plans')
        return
      }

      // Remove all plans of this type from state
      setPlans(plans.filter((p) => p.type !== type))
    } catch (err) {
      alert('An error occurred')
    }
  }

  return (
    <>
      {/* Year Navigation */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
        <Button
          variant="ghost"
          onClick={() => setYear(year - 1)}
          className="p-2 text-lg sm:text-xl"
        >
          ←
        </Button>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white text-center">
          Yearly Planner - {year}
        </h1>
        <Button
          variant="ghost"
          onClick={() => setYear(year + 1)}
          className="p-2 text-lg sm:text-xl"
        >
          →
        </Button>
      </div>

      {/* Yearly Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {transactionTypes.map((type) => {
          const monthlyTotal = getYearlyTotalForType(type.value as TransactionType)
          const typeColor = getTypeColor(type.value as TransactionType)
          const textColor = getTypeTextColor(type.value as TransactionType)
          const monthlyPlans = plans.filter(
            (p) => p.type === type.value && p.month !== null
          )
          return (
            <Card key={type.value} className={typeColor}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${textColor}`}>
                  {type.label} - Yearly Total
                </h2>
                {canEdit && monthlyPlans.length > 0 && (
                  <button
                    onClick={() => handleClearAll(type.value as TransactionType)}
                    className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    title={`Clear all ${type.label.toLowerCase()} plans`}
                  >
                    Clear All
                  </button>
                )}
              </div>
              {monthlyTotal > 0 ? (
                <div className="space-y-1">
                  <div className={`text-3xl font-bold ${textColor}`}>
                    {formatCurrency(monthlyTotal, currency)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Calculated from {monthlyPlans.length} monthly plan{monthlyPlans.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-gray-400 dark:text-gray-600 text-2xl">
                    {formatCurrency(0, currency)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No monthly plans set
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Monthly Planning Grid */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Monthly Breakdown
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {transactionTypes.map((type) => (
            <div key={type.value} className="space-y-3">
              <h3 className={`text-base sm:text-lg font-semibold ${getTypeTextColor(type.value as TransactionType)}`}>
                {type.label}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((monthNum) => {
                  const monthPlans = getPlansForType(type.value as TransactionType, monthNum)
                  const monthTotal = getTotalForMonth(type.value as TransactionType, monthNum)
                  const monthName = months.find(m => m.value === monthNum)?.label || ''
                  return (
                    <Card
                      key={monthNum}
                      className={`cursor-pointer hover:shadow-md transition-shadow relative p-2 ${
                        monthPlans.length > 0 ? getTypeColor(type.value as TransactionType) : 'bg-gray-50 dark:bg-gray-800'
                      }`}
                      onClick={() => canEdit && handleOpenModal(undefined, type.value as TransactionType, monthNum)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {monthName.slice(0, 3)}
                        </div>
                        {monthTotal > 0 && (
                          <div className={`text-xs font-bold ${getTypeTextColor(type.value as TransactionType)}`}>
                            {formatCurrency(monthTotal, currency)}
                          </div>
                        )}
                      </div>
                      {monthPlans.length > 0 ? (
                        <div className="space-y-2">
                          {monthPlans.map((plan) => (
                            <div key={plan.id} className="group">
                              <div className="flex items-center justify-between mb-0.5">
                                <div className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1.5 flex-1 min-w-0">
                                  {plan.category?.emoji && (
                                    <span className="text-lg flex-shrink-0" style={{ lineHeight: 1 }}>
                                      {plan.category.emoji}
                                    </span>
                                  )}
                                  <span className="truncate">{plan.category?.name || 'No category'}</span>
                                </div>
                                {canEdit && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleOpenModal(plan, type.value as TransactionType, monthNum)
                                      }}
                                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs"
                                      title="Edit"
                                    >
                                      ✎
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDelete(plan.id)
                                      }}
                                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
                                      title="Delete"
                                    >
                                      ×
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className={`text-xs font-semibold ${getTypeTextColor(type.value as TransactionType)}`}>
                                {formatCurrency(plan.amount, currency)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 dark:text-gray-600">
                          Click to add
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPlan ? 'Edit Plan' : 'Create Plan'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!preselectedType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value as TransactionType
                  setFormData({ ...formData, type: newType, categoryId: '' })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-gray-900 dark:text-gray-100"
                disabled={!!editingPlan}
              >
                {transactionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {preselectedType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900">
                {transactionTypes.find(t => t.value === preselectedType)?.label}
              </div>
            </div>
          )}
          {!applyToAllMonths && (
            <Select
              label="Month"
              value={formData.month === null ? '' : formData.month.toString()}
              onChange={(e) => setFormData({ ...formData, month: e.target.value === '' ? null : parseInt(e.target.value) })}
              options={months.filter(m => m.value !== null).map(m => ({ value: m.value!.toString(), label: m.label }))}
              disabled={loading || !!editingPlan}
              required
            />
          )}
          {applyToAllMonths && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Month
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900">
                All 12 months
              </div>
            </div>
          )}
          {!editingPlan && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="applyToAllMonths"
                checked={applyToAllMonths}
                onChange={(e) => {
                  setApplyToAllMonths(e.target.checked)
                  if (e.target.checked) {
                    setFormData({ ...formData, month: null })
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                disabled={loading}
              />
              <label htmlFor="applyToAllMonths" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Apply to all 12 months
              </label>
            </div>
          )}
          <Select
            label="Category"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            options={[
              { value: '', label: 'Select a category...' },
              ...filteredCategories.map((cat) => ({
                value: cat.id,
                label: `${cat.emoji ? cat.emoji + ' ' : ''}${cat.name}`,
              })),
            ]}
            disabled={loading}
            required
          />
          <Input
            label="Amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
              {loading ? 'Saving...' : editingPlan ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
