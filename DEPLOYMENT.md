# Deployment Guide for Vercel

## Prerequisites

1. Vercel account (free tier is fine)
2. GitHub repository connected
3. Google Gemini API key

## Step-by-Step Deployment

### 1. Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import the `blogsync` repository
4. Click "Deploy"

### 2. Set Up Database (Automatic)

After the first deployment (which will fail due to missing env vars):

1. Go to your project in Vercel Dashboard
2. Navigate to "Storage" tab
3. Click "Create Database" → "Postgres"
4. Select your preferred region
5. Click "Create"

Vercel will automatically add these environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### 3. Add Required Environment Variables

Go to "Settings" → "Environment Variables" and add:

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `JWT_SECRET` | JWT signing secret | Generate 32+ char random string |
| `JWT_REFRESH_SECRET` | Refresh token secret | Generate 32+ char random string |
| `GEMINI_API_KEY` | Google Gemini API key | Get from [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `ENCRYPTION_KEY` | Platform credential encryption | Generate exactly 32 char string |
| `NEXTAUTH_URL` | Your app URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth secret | Generate 32+ char random string |

#### Generate Random Strings

Use this command to generate secure random strings:
```bash
openssl rand -base64 32
```

Or use this Node.js command:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Set Up Vercel KV (Optional but Recommended)

For caching and rate limiting:

1. Go to "Storage" tab
2. Click "Create Database" → "KV"
3. Create the KV store

Vercel will automatically add:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### 5. Redeploy

After setting all environment variables:

1. Go to "Deployments" tab
2. Click on the three dots menu on the failed deployment
3. Click "Redeploy"

### 6. Run Database Migrations

After successful deployment:

1. Go to "Functions" tab
2. Or use Vercel CLI:
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

## Environment Variables Reference

### Required
- `JWT_SECRET` - JWT token signing secret (32+ chars)
- `JWT_REFRESH_SECRET` - Refresh token secret (32+ chars)
- `GEMINI_API_KEY` - Google Gemini API key
- `ENCRYPTION_KEY` - Exactly 32 characters for AES encryption
- `NEXTAUTH_URL` - Full URL of your deployed app
- `NEXTAUTH_SECRET` - NextAuth.js secret (32+ chars)

### Automatically Provided by Vercel
- `POSTGRES_*` - All PostgreSQL connection variables
- `KV_*` - All KV store variables (if enabled)
- `VERCEL_URL` - Your deployment URL
- `CRON_SECRET` - Automatically set for cron job security

## Post-Deployment

1. **Initialize Platforms**: The first user should set up platform connectors
2. **Test Cron Job**: Check logs at 2 AM UTC to ensure daily job runs
3. **Monitor Usage**: Check Vercel dashboard for function invocations and database usage

## Troubleshooting

### "Environment Variable references Secret which does not exist"
- Make sure to create the Vercel Postgres database first
- Remove any `@secret_name` references from vercel.json

### "Prisma Client not generated"
- The build command includes `prisma generate`
- If it fails, check build logs

### "Rate limit errors"
- Vercel KV is required for rate limiting
- Without KV, rate limiting falls back to in-memory (not recommended)

### Function Timeouts
- Hobby plan has 10-second timeout
- Optimize long-running operations or upgrade to Pro

## Support

For issues, check:
1. Vercel deployment logs
2. Function logs in Vercel dashboard
3. Browser console for frontend errors
4. Network tab for API errors