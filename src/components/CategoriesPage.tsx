'use client'

import { useState, useRef, useEffect } from 'react'
import { TransactionType, Role, canEditCategories } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'
import Card from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import Select from './ui/Select'
import Modal from './ui/Modal'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'

interface Category {
  id: string
  name: string
  emoji: string | null
  type: TransactionType
}

interface CategoriesPageProps {
  budgetId: string
  userRole: string
  initialCategories: Category[]
}

const transactionTypes = [
  { value: TransactionType.INCOME, label: 'Income' },
  { value: TransactionType.EXPENSE, label: 'Expense' },
  { value: TransactionType.DEBT, label: 'Debt' },
  { value: TransactionType.SAVINGS, label: 'Savings' },
]

export default function CategoriesPage({
  budgetId,
  userRole,
  initialCategories,
}: CategoriesPageProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [formData, setFormData] = useState({
    name: '',
    emoji: '',
    type: TransactionType.EXPENSE,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  const canEdit = canEditCategories(userRole as Role)
  const { theme } = useTheme()

  const filteredCategories = categories.filter((c) => {
    if (filterType === 'all') return true
    return c.type === filterType
  })

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({ name: category.name, emoji: category.emoji || '', type: category.type })
    } else {
      setEditingCategory(null)
      setFormData({ name: '', emoji: '', type: TransactionType.EXPENSE })
    }
    setIsModalOpen(true)
    setError('')
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setFormData({ name: '', emoji: '', type: TransactionType.EXPENSE })
    setError('')
    setShowEmojiPicker(false)
  }

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setFormData({ ...formData, emoji: emojiData.emoji })
    setShowEmojiPicker(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetId,
          name: formData.name.trim(),
          emoji: formData.emoji.trim() || null,
          type: formData.type,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save category')
        return
      }

      if (editingCategory) {
        setCategories(
          categories.map((c) =>
            c.id === editingCategory.id ? data.category : c
          )
        )
      } else {
        setCategories([...categories, data.category])
      }

      handleCloseModal()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        alert('Failed to delete category')
        return
      }

      setCategories(categories.filter((c) => c.id !== categoryId))
    } catch (err) {
      alert('An error occurred')
    }
  }

  const groupedCategories = filteredCategories.reduce((acc, category) => {
    if (!acc[category.type]) {
      acc[category.type] = []
    }
    acc[category.type].push(category)
    return acc
  }, {} as Record<TransactionType, Category[]>)

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="all">All Types</option>
            {transactionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        {canEdit && (
          <Button onClick={() => handleOpenModal()}>Add Category</Button>
        )}
      </div>

      <div className="space-y-6">
        {Object.keys(groupedCategories).length === 0 ? (
          <Card>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No categories found
            </p>
          </Card>
        ) : (
          Object.entries(groupedCategories).map(([type, typeCategories]) => (
            <div key={type}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {
                  transactionTypes.find((t) => t.value === type)?.label ||
                    type
                }
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeCategories.map((category) => (
                  <Card key={category.id}>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 dark:text-white flex items-center gap-2">
                        {category.emoji && <span>{category.emoji}</span>}
                        <span>{category.name}</span>
                      </span>
                      {canEdit && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenModal(category)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(category.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Emoji (optional)
            </label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex items-center justify-center w-12 h-10 border border-gray-300 rounded-lg dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-2xl"
                  disabled={loading}
                >
                  {formData.emoji || '😀'}
                </button>
                {formData.emoji && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, emoji: '' })}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                    disabled={loading}
                  >
                    Clear
                  </button>
                )}
              </div>
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute z-50 mt-2"
                  style={{ left: 0 }}
                >
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    theme={theme === 'dark' ? 'dark' : 'light'}
                    width={350}
                    height={400}
                  />
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Click the emoji button to pick an emoji for this category
            </p>
          </div>
          <Input
            label="Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={loading}
          />
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as TransactionType,
              })
            }
            options={transactionTypes}
            required
            disabled={loading || !!editingCategory}
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
              {loading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
