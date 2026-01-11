'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Role } from '@prisma/client'
import { getCurrencyOptions, Currency } from '@/lib/currency'
import Card from './ui/Card'
import Button from './ui/Button'
import Input from './ui/Input'
import Select from './ui/Select'
import Modal from './ui/Modal'

interface User {
  id: string
  name: string | null
  email: string
}

interface BudgetMember {
  id: string
  userId: string
  role: Role
  user: User
}

interface SettingsPageProps {
  budgetId: string
  budgetName: string
  budgetCurrency: string
  members: BudgetMember[]
}

const roleOptions = [
  { value: Role.VISITOR, label: 'Visitor' },
  { value: Role.ADMIN, label: 'Admin' },
]

export default function SettingsPage({
  budgetId,
  budgetName,
  budgetCurrency,
  members,
}: SettingsPageProps) {
  const router = useRouter()
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isDeleteBudgetModalOpen, setIsDeleteBudgetModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>(Role.VISITOR)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [membersList, setMembersList] = useState<BudgetMember[]>(members)
  const [currency, setCurrency] = useState<Currency>(budgetCurrency as Currency)
  const [currencyLoading, setCurrencyLoading] = useState(false)

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/budgets/${budgetId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to add user')
        return
      }

      setMembersList([...membersList, data.member])
      setIsAddUserModalOpen(false)
      setEmail('')
      setRole(Role.VISITOR)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeRole = async (memberId: string, newRole: Role) => {
    try {
      const response = await fetch(
        `/api/budgets/${budgetId}/users/${memberId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        alert('Failed to change role')
        return
      }

      setMembersList(
        membersList.map((m) =>
          m.id === memberId ? { ...m, role: newRole } : m
        )
      )
    } catch (err) {
      alert('An error occurred')
    }
  }

  const handleRemoveUser = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/budgets/${budgetId}/users/${memberId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        alert('Failed to remove user')
        return
      }

      setMembersList(membersList.filter((m) => m.id !== memberId))
    } catch (err) {
      alert('An error occurred')
    }
  }

  const handleCurrencyChange = async (newCurrency: Currency) => {
    setCurrencyLoading(true)
    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: newCurrency }),
      })

      if (!response.ok) {
        alert('Failed to update currency')
        return
      }

      setCurrency(newCurrency)
      router.refresh()
    } catch (err) {
      alert('An error occurred')
    } finally {
      setCurrencyLoading(false)
    }
  }

  const handleDeleteBudget = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this budget? This action cannot be undone.'
      )
    ) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        alert('Failed to delete budget')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Budget Name
          </h2>
          <p className="text-gray-700 dark:text-gray-300">{budgetName}</p>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Currency
          </h2>
          <Select
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
            options={getCurrencyOptions()}
            disabled={currencyLoading}
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This currency will be used for all amounts in this budget.
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Members
            </h2>
            <Button onClick={() => setIsAddUserModalOpen(true)}>
              Add User
            </Button>
          </div>
          <div className="space-y-3">
            {membersList.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {member.user.name || member.user.email}
                  </div>
                  {member.user.name && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {member.user.email}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {member.role === Role.OWNER ? (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Owner
                    </span>
                  ) : (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleChangeRole(member.id, e.target.value as Role)
                        }
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        {roleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRemoveUser(member.id)}
                      >
                        Remove
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
            Danger Zone
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Once you delete a budget, there is no going back. Please be certain.
          </p>
          <Button
            variant="danger"
            onClick={() => setIsDeleteBudgetModalOpen(true)}
            disabled={loading}
          >
            Delete Budget
          </Button>
        </Card>
      </div>

      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => {
          setIsAddUserModalOpen(false)
          setEmail('')
          setRole(Role.VISITOR)
          setError('')
        }}
        title="Add User to Budget"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            placeholder="user@example.com"
          />
          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            options={roleOptions}
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
              onClick={() => {
                setIsAddUserModalOpen(false)
                setEmail('')
                setRole(Role.VISITOR)
                setError('')
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add User'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteBudgetModalOpen}
        onClose={() => setIsDeleteBudgetModalOpen(false)}
        title="Delete Budget"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this budget? This action cannot be
            undone and all data will be permanently deleted.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteBudgetModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteBudget}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Budget'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
