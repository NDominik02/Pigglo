import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  VISITOR = 'VISITOR',
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  DEBT = 'DEBT',
  SAVINGS = 'SAVINGS',
}

export function canEditTransaction(userRole: Role, transactionUserId: string, currentUserId: string): boolean {
  if (userRole === Role.OWNER) return true
  if (userRole === Role.ADMIN && transactionUserId === currentUserId) return true
  return false
}

export function canDeleteTransaction(userRole: Role, transactionUserId: string, currentUserId: string): boolean {
  return canEditTransaction(userRole, transactionUserId, currentUserId)
}

export function canEditPlans(userRole: Role): boolean {
  return userRole === Role.OWNER || userRole === Role.ADMIN
}

export function canEditCategories(userRole: Role): boolean {
  return userRole === Role.OWNER || userRole === Role.ADMIN
}

export function canManageUsers(userRole: Role): boolean {
  return userRole === Role.OWNER
}

export function canDeleteBudget(userRole: Role): boolean {
  return userRole === Role.OWNER
}
