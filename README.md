# Pigglo

A full-stack budget tracking application built with Next.js, PostgreSQL, and Prisma. Plan your yearly budgets, track transactions, manage categories, and collaborate with others through shared budgets.

## Features

- **Authentication**: Login, register, and password reset functionality
- **Budget Management**: Create and manage multiple budgets
- **Yearly Planning**: Plan income, expenses, debt, and savings for the year
- **Transaction Tracking**: Add and track transactions with categories
- **Category Management**: Create and organize categories by type
- **Shared Budgets**: Share budgets with others with role-based permissions
- **Role-Based Access Control**: Three roles (Owner, Admin, Visitor) with different permissions
- **Dark Mode**: Toggle between light and dark themes

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pigglo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/budget_tracker?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Dashboard pages
│   ├── (budget)/        # Budget detail pages
│   └── api/             # API routes
├── components/
│   ├── ui/              # Reusable UI components
│   └── ...              # Feature components
├── lib/
│   ├── auth.ts          # NextAuth configuration
│   ├── db.ts            # Prisma client
│   ├── utils.ts         # Utility functions
│   └── budget-utils.ts  # Budget-related utilities
└── contexts/
    └── ThemeContext.tsx # Theme management
```

## Role-Based Permissions

### Owner
- Full access to all features
- Can add/remove users
- Can change user roles
- Can delete the budget
- Can edit/delete any transaction

### Admin
- Can add/edit/delete transactions (own only)
- Can add/edit/delete plans and categories
- Cannot manage users
- Cannot delete the budget

### Visitor
- Read-only access
- Cannot add/edit/delete anything
- No edit/delete buttons visible

## Database Schema

- **User**: User accounts
- **Budget**: Budget containers
- **BudgetUser**: Many-to-many relationship with roles
- **Category**: Transaction categories
- **Transaction**: Individual transactions
- **Plan**: Yearly planning data

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio

## License

ISC
