'use client'

import { useState, useEffect } from 'react'
import { TransactionType } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency'
import Card from './ui/Card'
import Button from './ui/Button'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface StatisticsPageProps {
  budgetId: string
  initialYear: number
  currency: 'USD' | 'EUR' | 'HUF'
}

const transactionTypes = [
  { value: TransactionType.INCOME, label: 'Income', color: '#10b981' },
  { value: TransactionType.EXPENSE, label: 'Expense', color: '#ef4444' },
  { value: TransactionType.DEBT, label: 'Debt', color: '#3b82f6' },
  { value: TransactionType.SAVINGS, label: 'Savings', color: '#eab308' },
]

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#eab308', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4']

export default function StatisticsPage({
  budgetId,
  initialYear,
  currency,
}: StatisticsPageProps) {
  const [year, setYear] = useState(initialYear)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  )
  const [selectedTypes, setSelectedTypes] = useState<Set<TransactionType>>(
    new Set([
      TransactionType.INCOME,
      TransactionType.EXPENSE,
      TransactionType.DEBT,
      TransactionType.SAVINGS,
    ])
  )
  const [pieChartType, setPieChartType] = useState<TransactionType>(TransactionType.EXPENSE)

  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/statistics?budgetId=${budgetId}&year=${year}`
        )
        if (response.ok) {
          const result = await response.json()
          setData(result)
          // Initialize selected categories with top categories of the selected type (default: EXPENSE)
          const expenseCategories = result.categoryData
            .filter((c: any) => c.type === TransactionType.EXPENSE)
            .slice(0, 8)
            .map((c: any) => c.id)
          setSelectedCategories(new Set(expenseCategories))
        }
      } catch (err) {
        console.error('Error fetching statistics:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStatistics()
  }, [budgetId, year])

  const getProgressMessage = (
    type: TransactionType,
    actual: number,
    planned: number
  ) => {
    const diff = actual - planned
    const percent = planned > 0 ? Math.round((actual / planned) * 100) : 0

    switch (type) {
      case TransactionType.INCOME:
      case TransactionType.SAVINGS:
        if (diff >= 0) {
          return {
            message: "You've reached your goal",
            value: `+${formatCurrency(Math.abs(diff), currency)}`,
            color: 'text-green-600 dark:text-green-400',
          }
        } else {
          return {
            message: `You are ${formatCurrency(Math.abs(diff), currency)} away from your plan`,
            value: `${percent}%`,
            color: 'text-gray-600 dark:text-gray-400',
          }
        }
      case TransactionType.DEBT:
        if (diff >= 0) {
          return {
            message: 'You paid your yearly debts',
            value: `+${formatCurrency(Math.abs(diff), currency)}`,
            color: 'text-green-600 dark:text-green-400',
          }
        } else {
          return {
            message: `You are ${formatCurrency(Math.abs(diff), currency)} away from paying debts`,
            value: `${percent}%`,
            color: 'text-gray-600 dark:text-gray-400',
          }
        }
      case TransactionType.EXPENSE:
        if (diff > 0) {
          return {
            message: `You've exceeded your expenses by ${formatCurrency(diff, currency)}`,
            value: `${percent}%`,
            color: 'text-red-600 dark:text-red-400',
          }
        } else {
          return {
            message: `You are ${formatCurrency(Math.abs(diff), currency)} under your plan`,
            value: `${percent}%`,
            color: 'text-green-600 dark:text-green-400',
          }
        }
      default:
        return {
          message: '',
          value: '',
          color: '',
        }
    }
  }

  const prepareLineChartData = () => {
    if (!data?.monthlyData) return []
    return data.monthlyData.map((month: any) => ({
      month: month.monthName,
      ...(selectedTypes.has(TransactionType.INCOME) && {
        'Income Actual': month.income.actual,
        'Income Planned': month.income.planned,
      }),
      ...(selectedTypes.has(TransactionType.EXPENSE) && {
        'Expense Actual': month.expense.actual,
        'Expense Planned': month.expense.planned,
      }),
      ...(selectedTypes.has(TransactionType.DEBT) && {
        'Debt Actual': month.debt.actual,
        'Debt Planned': month.debt.planned,
      }),
      ...(selectedTypes.has(TransactionType.SAVINGS) && {
        'Savings Actual': month.savings.actual,
        'Savings Planned': month.savings.planned,
      }),
    }))
  }

  const preparePieChartData = () => {
    if (!data?.categoryData) return []
    return data.categoryData.filter((cat: any) =>
      cat.type === pieChartType && selectedCategories.has(cat.id)
    )
  }

  const getCategoriesForType = (type: TransactionType) => {
    if (!data?.categoryData) return []
    return data.categoryData.filter((cat: any) => cat.type === type)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load statistics</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Year Navigation */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
        <Button variant="ghost" onClick={() => setYear(year - 1)} className="p-2 text-lg sm:text-xl">
          ←
        </Button>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white text-center">
          Statistics - {year}
        </h1>
        <Button variant="ghost" onClick={() => setYear(year + 1)} className="p-2 text-lg sm:text-xl">
          →
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
      {transactionTypes.map((type) => {
        const totals = data.totals[type.value.toLowerCase() as keyof typeof data.totals]
        const progress = getProgressMessage(
          type.value,
          totals.actual,
          totals.planned
        )
          return (
            <Card
              key={type.value}
              className={`border-l-4 ${
                type.value === TransactionType.INCOME
                  ? 'border-income bg-green-50 dark:bg-green-950/20'
                  : type.value === TransactionType.EXPENSE
                  ? 'border-expense bg-red-50 dark:bg-red-950/20'
                  : type.value === TransactionType.DEBT
                  ? 'border-debt bg-blue-50 dark:bg-blue-950/20'
                  : 'border-savings bg-yellow-50 dark:bg-yellow-950/20'
              }`}
            >
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {type.label}
              </div>
              <div
                className={`text-3xl font-bold mb-2 ${
                  type.value === TransactionType.INCOME
                    ? 'text-income'
                    : type.value === TransactionType.EXPENSE
                    ? 'text-expense'
                    : type.value === TransactionType.DEBT
                    ? 'text-debt'
                    : 'text-savings'
                }`}
              >
                {formatCurrency(totals.actual, currency)}
              </div>
              {progress.message && (
                <div className="space-y-1">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {progress.message}
                  </div>
                  <div className={`text-sm font-semibold ${progress.color}`}>
                    {progress.value}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Line Chart */}
        <Card>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Monthly Trends
            </h2>
            <div className="flex flex-wrap gap-2">
              {transactionTypes.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.has(type.value)}
                    onChange={(e) => {
                      const newSet = new Set(selectedTypes)
                      if (e.target.checked) {
                        newSet.add(type.value)
                      } else {
                        newSet.delete(type.value)
                      }
                      setSelectedTypes(newSet)
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={prepareLineChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedTypes.has(TransactionType.INCOME) && (
                <>
                  <Line
                    type="monotone"
                    dataKey="Income Actual"
                    stroke="#10b981"
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="Income Planned"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    opacity={0.5}
                  />
                </>
              )}
              {selectedTypes.has(TransactionType.EXPENSE) && (
                <>
                  <Line
                    type="monotone"
                    dataKey="Expense Actual"
                    stroke="#ef4444"
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="Expense Planned"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    opacity={0.5}
                  />
                </>
              )}
              {selectedTypes.has(TransactionType.DEBT) && (
                <>
                  <Line
                    type="monotone"
                    dataKey="Debt Actual"
                    stroke="#3b82f6"
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="Debt Planned"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    opacity={0.5}
                  />
                </>
              )}
              {selectedTypes.has(TransactionType.SAVINGS) && (
                <>
                  <Line
                    type="monotone"
                    dataKey="Savings Actual"
                    stroke="#eab308"
                    strokeWidth={3}
                  />
                  <Line
                    type="monotone"
                    dataKey="Savings Planned"
                    stroke="#eab308"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    opacity={0.5}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie Chart */}
        <Card>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Category Breakdown
              </h2>
              <select
                value={pieChartType}
                onChange={(e) => {
                  const newType = e.target.value as TransactionType
                  setPieChartType(newType)
                  // Update selected categories to include all categories of the new type
                  const typeCategories = getCategoriesForType(newType)
                  setSelectedCategories(new Set(typeCategories.map((c: any) => c.id)))
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-gray-900"
              >
                {transactionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {getCategoriesForType(pieChartType).map((cat: any, index: number) => (
                <label
                  key={cat.id}
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.has(cat.id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedCategories)
                      if (e.target.checked) {
                        newSet.add(cat.id)
                      } else {
                        newSet.delete(cat.id)
                      }
                      setSelectedCategories(newSet)
                    }}
                    className="w-3 h-3"
                  />
                  <span
                    className="text-xs flex items-center gap-1"
                    style={{
                      color:
                        transactionTypes.find((t) => t.value === cat.type)
                          ?.color || '#000',
                    }}
                  >
                    {cat.emoji && <span>{cat.emoji}</span>}
                    <span>{cat.name} ({formatCurrency(cat.amount, currency)})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={preparePieChartData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {preparePieChartData().map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Monthly Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {transactionTypes.map((type) => {
        const stats = data.monthlyStats[type.value.toLowerCase() as keyof typeof data.monthlyStats]
        return (
            <Card
              key={type.value}
              className={`border-l-4 ${
                type.value === TransactionType.INCOME
                  ? 'border-income'
                  : type.value === TransactionType.EXPENSE
                  ? 'border-expense'
                  : type.value === TransactionType.DEBT
                  ? 'border-debt'
                  : 'border-savings'
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${
                  type.value === TransactionType.INCOME
                    ? 'text-income'
                    : type.value === TransactionType.EXPENSE
                    ? 'text-expense'
                    : type.value === TransactionType.DEBT
                    ? 'text-debt'
                    : 'text-savings'
                }`}
              >
                {type.label} Stats
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Planned Avg
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.plannedAvg || 0, currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Real Avg
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.actualAvg || 0, currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Highest Month
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.highest || 0, currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Lowest Month
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.lowest || 0, currency)}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
