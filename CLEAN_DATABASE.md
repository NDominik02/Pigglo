# Database Cleanup Guide

## Option 1: Reset Database (Development - Deletes ALL data)

This will completely reset your database and apply all migrations fresh:

```bash
npx prisma migrate reset
```

**Warning:** This deletes ALL data in your database!

## Option 2: Create Production Migration (Recommended for Deployment)

If you want to keep your schema but create a clean migration for production:

```bash
# Create a new migration
npx prisma migrate dev --name init

# Or if you want to push schema without migrations
npx prisma db push
```

## Option 3: Manual Database Cleanup (Keep Schema, Delete Data)

If you want to keep the schema but delete all data:

```bash
# Connect to your database and run:
# PostgreSQL
psql $DATABASE_URL -c "TRUNCATE TABLE \"User\", \"Budget\", \"BudgetUser\", \"Category\", \"Transaction\", \"ExchangeRate\", \"Plan\" CASCADE;"

# Or using Prisma Studio to manually delete
npx prisma studio
```

## Option 4: Fresh Start (Drop and Recreate)

```bash
# Drop all tables and recreate
npx prisma migrate reset --force

# Then generate Prisma client
npx prisma generate
```

## For Production Deployment

1. **Create a migration:**
   ```bash
   npx prisma migrate dev --name production_init
   ```

2. **Apply migrations in production:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

## Recommended Steps Before Deployment

1. **Backup your current database** (if you have important data)
2. **Create a clean migration:**
   ```bash
   npx prisma migrate reset
   npx prisma migrate dev --name production_init
   ```
3. **Test locally:**
   ```bash
   npm run build
   npm run start
   ```
4. **Deploy to production**
5. **Run migrations on production:**
   ```bash
   npx prisma migrate deploy
   ```
