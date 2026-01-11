'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrencyOptions, Currency } from '@/lib/currency'
import Card from './ui/Card'
import Modal from './ui/Modal'
import Input from './ui/Input'
import Select from './ui/Select'
import Button from './ui/Button'

export default function CreateBudgetCard() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, currency }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create budget')
        return
      }

      setIsOpen(false)
      setName('')
      setCurrency('USD')
      router.push(`/budget/${data.budget.id}`)
      router.refresh()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow border-dashed border-2 flex items-center justify-center min-h-[150px]"
        onClick={() => setIsOpen(true)}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">+</div>
          <div className="text-gray-600 dark:text-gray-400 font-medium">
            Create New Budget
          </div>
        </div>
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false)
          setName('')
          setCurrency('USD')
          setError('')
        }}
        title="Create New Budget"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Budget Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            placeholder="e.g., Personal Budget, Family Budget"
          />
          <Select
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            options={getCurrencyOptions()}
            disabled={loading}
          />
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsOpen(false)
                setName('')
                setError('')
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Budget'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
