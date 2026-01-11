# Deployment Guide

## Free Deployment Setup

### Architecture
- **Frontend + API Routes**: Vercel (Free)
- **Database**: Supabase PostgreSQL (Free tier)

### Step 1: Set up Supabase Database

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy your **Connection String** (URI format)
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### Step 2: Set up Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up with GitHub
3. Click **New Project**
4. Import your repository
5. Add Environment Variables:
   - `DATABASE_URL`: Your Supabase connection string
   - `AUTH_SECRET`: Generate a random secret (run `openssl rand -base64 32` or use [this generator](https://generate-secret.vercel.app/32))
   - `CRON_SECRET`: Optional, for securing cron endpoints (generate another random secret)

### Step 3: Run Database Migrations

After deployment, you need to run Prisma migrations:

**Option A: Using Vercel CLI (Recommended)**
```bash
npm install -g vercel
vercel login
vercel link
npx prisma migrate deploy
```

**Option B: Using Supabase SQL Editor**
1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from your Prisma migrations

**Option C: Using Prisma Studio (for initial setup)**
```bash
npx prisma db push
```

### Step 4: Set up Cron Job for Exchange Rates

Vercel supports cron jobs! Add this to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/exchange-rates",
      "schedule": "0 1 * * *"
    }
  ]
}
```

Or use an external service like [cron-job.org](https://cron-job.org):
- URL: `https://your-app.vercel.app/api/cron/exchange-rates`
- Schedule: Daily at 1:00 AM
- Add header: `Authorization: Bearer YOUR_CRON_SECRET`

### Step 5: Update Environment Variables

Make sure your `.env` file (or Vercel environment variables) includes:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
AUTH_SECRET="your-generated-secret-here"
CRON_SECRET="your-cron-secret-here" # Optional
```

### Alternative: Neon Database

If you prefer Neon:

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string
4. Use it as `DATABASE_URL` in Vercel

### Free Tier Limits

**Vercel Free Tier:**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless functions (API routes)
- ⚠️ 10-second function timeout
- ⚠️ Cold starts possible

**Supabase Free Tier:**
- ✅ 500 MB database storage
- ✅ 2 GB bandwidth/month
- ✅ Unlimited API requests
- ✅ 2 projects

**Neon Free Tier:**
- ✅ 3 GB storage
- ✅ Serverless Postgres
- ✅ Auto-scaling

### Troubleshooting

**Database Connection Issues:**
- Make sure `DATABASE_URL` is set correctly in Vercel
- Check Supabase/Neon firewall settings
- Use connection pooling URL if available

**Prisma Issues:**
- Run `npx prisma generate` before deploying
- Make sure migrations are up to date
- Check Prisma logs in Vercel build logs

**Cron Job Not Working:**
- Verify `vercel.json` is in your repo root
- Check Vercel dashboard → Settings → Cron Jobs
- Or use external cron service as backup

### Cost Summary

**Total Cost: $0/month** ✅

- Vercel: Free
- Supabase/Neon: Free tier
- Domain (optional): ~$10-15/year if you want a custom domain
