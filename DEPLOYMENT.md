# 🚀 TinyLink Deployment Guide

This guide will walk you through deploying TinyLink to production using Vercel and a PostgreSQL database.

## Prerequisites

- GitHub account
- Vercel account (free tier)
- PostgreSQL database (Neon, Supabase, or similar - free tier available)

## Step 1: Prepare Your Database

### Option A: Neon (Recommended)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string (it looks like: `postgresql://user:password@host/database`)
4. Keep this handy for Step 3

### Option B: Supabase

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to Settings → Database
4. Copy the "Connection string" (URI format)
5. Keep this handy for Step 3

### Option C: Railway

1. Go to [railway.app](https://railway.app) and sign up
2. Create a new PostgreSQL database
3. Copy the connection string from the "Connect" tab
4. Keep this handy for Step 3

## Step 2: Push to GitHub

If you haven't already, push your code to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - TinyLink URL Shortener"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/tinylink.git

# Push to GitHub
git push -u origin main
```

## Step 3: Deploy to Vercel

### 3.1 Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### 3.2 Configure Environment Variables

Before deploying, add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | Your PostgreSQL connection string | From Step 1 |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` | Will be provided after first deploy |

**Important:** After your first deployment, update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL.

### 3.3 Deploy

1. Click "Deploy"
2. Wait for the build to complete (2-3 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## Step 4: Initialize Database

After deployment, you need to create the database tables:

### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link your project
vercel link

# Run Prisma migration
vercel env pull .env.production
npx prisma migrate deploy
```

### Option B: Using Prisma Studio

```bash
# Set your production DATABASE_URL locally
export DATABASE_URL="your-production-database-url"

# Push the schema
npx prisma db push

# Verify with Prisma Studio
npx prisma studio
```

### Option C: Manual SQL

Connect to your database and run:

```sql
CREATE TABLE "links" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "targetUrl" TEXT NOT NULL,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "links_code_idx" ON "links"("code");
```

## Step 5: Verify Deployment

### 5.1 Test Health Endpoint

```bash
curl https://your-project.vercel.app/healthz
```

Expected response:
```json
{
  "status": "ok",
  "message": "Service is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

### 5.2 Test Link Creation

```bash
curl -X POST https://your-project.vercel.app/api/links \
  -H "Content-Type: application/json" \
  -d '{"targetUrl": "https://google.com"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "code": "abc123",
    "targetUrl": "https://google.com",
    "clicks": 0,
    "createdAt": "..."
  }
}
```

### 5.3 Test Redirect

Visit `https://your-project.vercel.app/abc123` in your browser. You should be redirected to Google.

### 5.4 Test Dashboard

Visit `https://your-project.vercel.app` and verify:
- ✅ Dashboard loads
- ✅ Can create new links
- ✅ Links appear in table
- ✅ Can copy short links
- ✅ Can delete links
- ✅ Click counts increment

## Step 6: Custom Domain (Optional)

### 6.1 Add Domain in Vercel

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

### 6.2 Update Environment Variable

After adding a custom domain, update `NEXT_PUBLIC_APP_URL`:

1. Go to project settings → Environment Variables
2. Update `NEXT_PUBLIC_APP_URL` to your custom domain
3. Redeploy the project

## Troubleshooting

### Database Connection Issues

**Problem:** "Failed to connect to database"

**Solutions:**
1. Verify `DATABASE_URL` is correct in Vercel environment variables
2. Check if your database allows connections from Vercel's IP ranges
3. Ensure SSL is enabled in connection string (add `?sslmode=require`)
4. Try connection pooling: `?pgbouncer=true&connection_limit=1`

### Build Failures

**Problem:** Build fails with Prisma errors

**Solutions:**
1. Ensure `prisma generate` runs before build
2. Check `package.json` has correct build script:
   ```json
   "build": "prisma generate && next build"
   ```
3. Verify Prisma schema is valid

### 404 on Redirects

**Problem:** Short links return 404

**Solutions:**
1. Verify database has the link record
2. Check if code matches exactly (case-sensitive)
3. Ensure `[code]/route.ts` is deployed correctly

### Environment Variables Not Working

**Problem:** App can't read environment variables

**Solutions:**
1. Redeploy after adding/changing environment variables
2. Ensure variable names match exactly
3. For client-side variables, use `NEXT_PUBLIC_` prefix

## Monitoring and Maintenance

### View Logs

```bash
# Install Vercel CLI
npm i -g vercel

# View logs
vercel logs
```

### Monitor Performance

1. Go to your project in Vercel dashboard
2. Click "Analytics" to see:
   - Page views
   - Response times
   - Error rates
   - Geographic distribution

### Database Maintenance

1. **Backup regularly** - Most providers offer automatic backups
2. **Monitor storage** - Check database size in provider dashboard
3. **Optimize queries** - Use Prisma Studio to analyze slow queries
4. **Clean old links** - Consider adding expiration logic

## Scaling Considerations

### Free Tier Limits

**Vercel:**
- 100 GB bandwidth/month
- 100 deployments/day
- Unlimited projects

**Neon:**
- 3 GB storage
- 1 project
- Unlimited queries

**Supabase:**
- 500 MB database
- 2 GB bandwidth
- 50,000 monthly active users

### When to Upgrade

Consider upgrading when you hit:
- 10,000+ links created
- 100,000+ redirects/month
- Need custom domains
- Need team collaboration
- Need advanced analytics

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use environment variables** - For all secrets
3. **Enable HTTPS** - Vercel does this automatically
4. **Rate limiting** - Consider adding for production
5. **Input validation** - Already implemented with Zod
6. **SQL injection prevention** - Prisma handles this

## Performance Optimization

1. **Database indexing** - Already configured on `code` field
2. **Connection pooling** - Add to DATABASE_URL if needed
3. **Caching** - Consider Redis for hot links
4. **CDN** - Vercel Edge Network handles this
5. **Image optimization** - Use Next.js Image component

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check database provider logs
3. Test locally with production DATABASE_URL
4. Review [Next.js deployment docs](https://nextjs.org/docs/deployment)
5. Review [Prisma deployment docs](https://www.prisma.io/docs/guides/deployment)

## Success Checklist

- [ ] Database created and accessible
- [ ] Code pushed to GitHub
- [ ] Vercel project created and linked
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] Health check returns 200
- [ ] Can create links via API
- [ ] Can create links via UI
- [ ] Redirects work (302 status)
- [ ] Click tracking works
- [ ] Can delete links
- [ ] Dashboard displays correctly
- [ ] Mobile responsive
- [ ] Custom domain configured (optional)

## Next Steps

After successful deployment:

1. **Share your link** - Add deployment URL to README
2. **Monitor usage** - Check Vercel analytics
3. **Gather feedback** - Test with real users
4. **Add features** - Consider analytics, expiration, etc.
5. **Document API** - Create API documentation
6. **Add tests** - Run `npm test` before deploying

---

**Congratulations! Your TinyLink URL shortener is now live! 🎉**

Live URL: `https://your-project.vercel.app`
