import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Don't reveal if user exists or not for security
    if (user) {
      // In a real app, you would:
      // 1. Generate a reset token
      // 2. Store it in the database with an expiration
      // 3. Send an email with the reset link
      // For now, we'll just return success
      const resetToken = crypto.randomBytes(32).toString('hex')
      // Store resetToken in database (you'd need a ResetToken model)
      // Send email with reset link
    }

    return NextResponse.json(
      { message: 'If an account exists, a reset link has been sent' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
