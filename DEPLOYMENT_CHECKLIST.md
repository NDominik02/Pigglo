# Deployment Checklist

## Pre-Deployment Steps ✅

- [x] Database cleaned and reset
- [x] Production migration created (`20260111164756_production_init`)
- [x] Prisma schema synced

## Environment Variables Needed

Make sure these are set in your Vercel project:

1. **DATABASE_URL** - Your Supabase/Neon PostgreSQL connection string
2. **AUTH_SECRET** - Generate with: `openssl rand -base64 32`
3. **CRON_SECRET** (optional) - For securing cron endpoints

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Deploy to Vercel
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Add environment variables (see above)
- Deploy

### 3. Run Database Migrations on Production

After deployment, run migrations on your production database:

**Option A: Using Vercel CLI**
```bash
vercel login
vercel link
npx prisma migrate deploy
```

**Option B: Using Supabase SQL Editor**
- Go to Supabase Dashboard → SQL Editor
- Copy the SQL from `prisma/migrations/20260111164756_production_init/migration.sql`
- Run it in the SQL Editor

**Option C: Using Prisma Studio (for initial setup)**
```bash
npx prisma db push
```

### 4. Verify Deployment

- [ ] Check that the app loads correctly
- [ ] Test user registration/login
- [ ] Create a test budget
- [ ] Verify database connection
- [ ] Check that cron jobs are set up (if using Vercel Cron)

## Post-Deployment

- [ ] Test all major features
- [ ] Verify exchange rates are fetching correctly
- [ ] Check mobile responsiveness
- [ ] Test budget sharing functionality

## Troubleshooting

If you encounter issues:

1. **Database Connection Errors:**
   - Verify `DATABASE_URL` is correct
   - Check Supabase/Neon firewall settings
   - Ensure connection pooling URL is used (if available)

2. **Migration Errors:**
   - Run `npx prisma migrate deploy` manually
   - Check migration files are in the repository

3. **Build Errors:**
   - Check that all dependencies are in `package.json`
   - Verify TypeScript compilation passes locally

## Notes

- The Prisma client generation warning (EPERM) is a Windows file lock issue and can be ignored
- Restart your dev server if you see Prisma client errors: `npm run dev`
- For production, migrations will run automatically if using `prisma migrate deploy`
