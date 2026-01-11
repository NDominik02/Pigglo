'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from './ui/Card'
import Modal from './ui/Modal'
import Input from './ui/Input'
import Button from './ui/Button'

interface BudgetCardProps {
  budget: {
    id: string
    name: string
    transactionCount: number
    memberCount: number
    role: 'OWNER' | 'ADMIN' | 'VISITOR'
  }
  onUpdate?: () => void
}

export default function BudgetCard({ budget, onUpdate }: BudgetCardProps) {
  const router = useRouter()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editName, setEditName] = useState(budget.name)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClick = () => {
    router.push(`/budget/${budget.id}`)
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditName(budget.name)
    setIsEditModalOpen(true)
    setError('')
  }

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm(`Are you sure you want to delete "${budget.name}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/budgets/${budget.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Failed to delete budget')
        return
      }

      // Refresh the page to update the budget list
      if (onUpdate) {
        onUpdate()
      } else {
        router.refresh()
      }
    } catch (err) {
      alert('An error occurred while deleting the budget')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!editName.trim()) {
      setError('Budget name cannot be empty')
      return
    }

    if (editName.trim() === budget.name) {
      setIsEditModalOpen(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/budgets/${budget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to update budget')
        return
      }

      setIsEditModalOpen(false)
      // Refresh the page to update the budget list
      if (onUpdate) {
        onUpdate()
      } else {
        router.refresh()
      }
    } catch (err) {
      setError('An error occurred while updating the budget')
    } finally {
      setLoading(false)
    }
  }

  const canEdit = budget.role === 'OWNER'

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow relative"
        onClick={handleClick}
      >
        {canEdit && (
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={handleEditClick}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors shadow-sm"
              title="Edit budget name"
              aria-label="Edit budget name"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 shadow-sm"
              title="Delete budget"
              aria-label="Delete budget"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        )}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 pr-20">
          {budget.name}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>{budget.transactionCount} transactions</span>
          <span>{budget.memberCount} members</span>
        </div>
        <div className="mt-3">
          <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {budget.role}
          </span>
        </div>
      </Card>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setError('')
        }}
        title="Edit Budget Name"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="Budget Name"
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            disabled={loading}
            autoFocus
          />
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false)
                setError('')
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
