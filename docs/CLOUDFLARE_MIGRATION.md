# Cloudflare Pages Migration Guide

Complete guide for migrating PT2030 Candidaturas from Railway to Cloudflare Pages.

## Table of Contents

1. [Overview](#overview)
2. [Why Cloudflare Pages](#why-cloudflare-pages)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Migration](#step-by-step-migration)
5. [Environment Variables Mapping](#environment-variables-mapping)
6. [DNS Configuration](#dns-configuration)
7. [Testing Checklist](#testing-checklist)
8. [Rollback Plan](#rollback-plan)
9. [Post-Migration Verification](#post-migration-verification)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This guide walks you through migrating your PT2030 Candidaturas application from Railway to Cloudflare Pages, ensuring zero downtime and maintaining all functionality.

**Migration Timeline:** Approximately 1-2 hours
**Downtime:** Zero (using blue-green deployment strategy)

---

## Why Cloudflare Pages

### Cost Benefits
- **$0/month** for unlimited bandwidth and requests
- **No usage limits** for static site hosting
- Railway costs ~$5-20/month

### Performance Benefits
- **10-30ms latency** from Portugal (vs 100-200ms on Railway)
- **300+ edge locations** worldwide
- **Automatic global CDN** distribution

### Compliance & Security
- **GDPR compliant** with EU data centers
- **Built-in DDoS protection**
- **Free SSL certificates** with automatic renewal
- **Edge-side security headers**

### Developer Experience
- **Git-based deployments** (auto-deploy on push)
- **Preview deployments** for every PR
- **Instant rollbacks**
- **Build logs** and analytics

---

## Prerequisites

Before starting the migration, ensure you have:

### Required Accounts
- ✅ Cloudflare account (free tier is sufficient)
- ✅ GitHub repository access
- ✅ Domain ownership (if using custom domain)

### Required Tools
```bash
# Node.js 18+
node --version  # Should be v18.x or higher

# npm
npm --version

# Wrangler CLI (Cloudflare's CLI tool)
npm install -g wrangler

# Git
git --version
```

### Authentication
```bash
# Login to Cloudflare via Wrangler
wrangler login

# Verify authentication
wrangler whoami
```

---

## Step-by-Step Migration

### Phase 1: Preparation (15 minutes)

#### 1.1 Backup Current Deployment
```bash
# Document current Railway configuration
cd /path/to/candidatura-turbo-pt

# Save Railway environment variables
# Go to Railway dashboard → Settings → Variables
# Copy all variables to a secure location

# Create backup branch
git checkout -b backup/pre-cloudflare-migration
git push origin backup/pre-cloudflare-migration
```

#### 1.2 Review Project Configuration
```bash
# Verify build configuration
cat package.json | grep '"build"'
# Should output: "build": "vite build"

# Check build output directory
cat vite.config.ts | grep 'outDir'
# Should be: outDir: 'dist'

# Test local build
npm run build
ls -la dist/  # Verify files are generated
```

#### 1.3 Install Wrangler CLI
```bash
# Install globally
npm install -g wrangler

# Verify installation
wrangler --version

# Login to Cloudflare
wrangler login
# This will open a browser window for authentication
```

---

### Phase 2: Cloudflare Pages Setup (20 minutes)

#### 2.1 Create Cloudflare Pages Project

**Option A: Via Cloudflare Dashboard (Recommended for first-time)**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your account → Click "Pages"
3. Click "Create a project"
4. Click "Connect to Git"
5. Select your GitHub repository
6. Configure build settings:
   - **Project name:** `pt2030-candidaturas`
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** `18`
7. Click "Save and Deploy"

**Option B: Via Wrangler CLI**
```bash
# Create project
wrangler pages project create pt2030-candidaturas

# Deploy initial version
npm run build
wrangler pages deploy dist --project-name=pt2030-candidaturas
```

#### 2.2 Configure Environment Variables

Navigate to: **Cloudflare Dashboard → Pages → pt2030-candidaturas → Settings → Environment Variables**

Add the following variables for **Production**:

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_OPENROUTER_API_KEY` | OpenRouter API key (AI features) | `sk-or-v1-...` |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | `https://xxx@xxx.ingest.sentry.io/xxx` |
| `VITE_POSTHOG_KEY` | PostHog analytics key | `phc_...` |
| `VITE_PUBLIC_URL` | Public URL of your app | `https://pt2030-candidaturas.pages.dev` |

**For Preview deployments**, add the same variables but use test/staging values if available.

#### 2.3 Configure Build Settings

In **Settings → Builds & deployments**:

```toml
# These are already in cloudflare-pages.toml
Build command: npm run build
Build output directory: dist
Root directory: /
Node version: 18
```

Enable:
- ✅ **Automatic deployments** on push to main
- ✅ **Preview deployments** for pull requests
- ✅ **Build watch paths** (optional): `src/**`, `public/**`, `package.json`

---

### Phase 3: DNS & Custom Domain (15 minutes)

#### 3.1 Add Custom Domain (Optional but Recommended)

1. Go to **Pages → pt2030-candidaturas → Custom domains**
2. Click "Set up a custom domain"
3. Enter your domain (e.g., `candidaturas.pt2030.com`)
4. Cloudflare will provide DNS records to configure

#### 3.2 DNS Configuration

If your domain is **on Cloudflare**:
- DNS records are automatically configured
- No manual steps needed

If your domain is **external**:
Add these DNS records at your registrar:

```dns
Type: CNAME
Name: candidaturas (or your subdomain)
Value: pt2030-candidaturas.pages.dev
TTL: Auto or 3600

Type: TXT (for verification)
Name: _cf-custom-hostname.candidaturas
Value: [provided by Cloudflare]
TTL: Auto or 3600
```

#### 3.3 SSL Certificate

Cloudflare automatically provisions SSL certificates:
- **Provisioning time:** 1-5 minutes
- **Renewal:** Automatic
- **Type:** Universal SSL (covers www and apex domain)

Verify SSL status: **Custom domains → SSL/TLS status should be "Active"**

---

### Phase 4: Deployment & Testing (20 minutes)

#### 4.1 Initial Deployment

**Automatic (Git-based):**
```bash
# Simply push to main branch
git checkout main
git pull origin main
git push origin main

# Cloudflare will automatically build and deploy
```

**Manual (using script):**
```bash
# Use the deployment script
chmod +x scripts/deploy-cloudflare.sh
./scripts/deploy-cloudflare.sh production
```

**Manual (using Wrangler):**
```bash
# Build locally
npm run build

# Deploy
wrangler pages deploy dist --project-name=pt2030-candidaturas --branch=main
```

#### 4.2 Verify Deployment

```bash
# Check deployment URL
DEPLOY_URL="https://pt2030-candidaturas.pages.dev"

# Test HTTP status
curl -I $DEPLOY_URL

# Test response time
curl -w "@-" -o /dev/null -s "$DEPLOY_URL" <<'EOF'
    time_namelookup:  %{time_namelookup}s\n
       time_connect:  %{time_connect}s\n
    time_appconnect:  %{time_appconnect}s\n
   time_pretransfer:  %{time_pretransfer}s\n
      time_redirect:  %{time_redirect}s\n
 time_starttransfer:  %{time_starttransfer}s\n
                    ----------\n
         time_total:  %{time_total}s\n
EOF
```

Expected results:
- ✅ HTTP 200 status
- ✅ Response time < 100ms (from Portugal)
- ✅ All assets loading correctly

---

### Phase 5: Monitoring Setup (10 minutes)

#### 5.1 Configure Cloudflare Analytics

Enable **Web Analytics** in Cloudflare Pages:
1. Go to **Pages → pt2030-candidaturas → Analytics**
2. Enable "Web Analytics"
3. Configure data retention (default: 6 months)

Metrics to monitor:
- Page views
- Unique visitors
- Bandwidth usage
- Cache hit ratio
- Response time by location

#### 5.2 Set Up Alerts (Optional)

In **Cloudflare Dashboard → Notifications**:
- ✅ Pages deployment failures
- ✅ Pages deployment success
- ✅ SSL certificate expiration warnings

---

## Environment Variables Mapping

### Railway → Cloudflare Pages

| Railway Variable | Cloudflare Pages Variable | Notes |
|-----------------|---------------------------|-------|
| `SUPABASE_URL` | `VITE_SUPABASE_URL` | Add `VITE_` prefix for Vite |
| `SUPABASE_ANON_KEY` | `VITE_SUPABASE_ANON_KEY` | Add `VITE_` prefix |
| `OPENROUTER_API_KEY` | `VITE_OPENROUTER_API_KEY` | Add `VITE_` prefix |
| `PORT` | ❌ Not needed | Cloudflare handles port mapping |
| `NODE_ENV` | ❌ Auto-set | Set to `production` automatically |

### Important Notes on Environment Variables

1. **VITE_ Prefix Required:**
   - All env vars exposed to client must start with `VITE_`
   - This is a Vite security feature
   - Server-side only variables don't need the prefix

2. **Setting Variables:**
   ```bash
   # Via Cloudflare Dashboard
   # Pages → Settings → Environment Variables

   # Via Wrangler CLI
   wrangler pages secret put VITE_SUPABASE_URL
   # Then paste the value when prompted
   ```

3. **Environment Separation:**
   - **Production:** Used for main branch deployments
   - **Preview:** Used for PR/branch deployments
   - Set different values for testing vs production

---

## DNS Configuration

### Scenario 1: Domain Already on Cloudflare

✅ **Easiest option** - Automatic DNS configuration

1. Add custom domain in Pages settings
2. Cloudflare automatically creates DNS records
3. SSL provisioned within 1-5 minutes

### Scenario 2: External Domain Registrar

Requires manual DNS configuration:

1. **Add CNAME record:**
   ```
   Type: CNAME
   Name: @ (or your subdomain)
   Value: pt2030-candidaturas.pages.dev
   TTL: 3600
   ```

2. **Verify domain ownership:**
   - Cloudflare provides a TXT record
   - Add to your DNS provider
   - Wait for propagation (up to 48 hours, usually < 1 hour)

3. **Check propagation:**
   ```bash
   # Check DNS propagation
   dig candidaturas.yourdomain.com

   # Or use online tool
   # https://dnschecker.org
   ```

### Scenario 3: Subdomain Configuration

For subdomain (e.g., `app.pt2030.com`):

```dns
Type: CNAME
Name: app
Value: pt2030-candidaturas.pages.dev
TTL: 3600
```

---

## Testing Checklist

### Pre-Migration Testing
- [ ] Build completes successfully locally (`npm run build`)
- [ ] All environment variables documented
- [ ] Backup of Railway configuration saved
- [ ] Git repository is clean and up-to-date

### Post-Migration Testing

#### Functional Testing
- [ ] Homepage loads correctly
- [ ] All routes work (test SPA routing)
- [ ] Static assets load (images, fonts, CSS)
- [ ] JavaScript bundles load and execute
- [ ] API calls to Supabase work
- [ ] AI features work (if using OpenRouter)
- [ ] Authentication flows work
- [ ] Form submissions work
- [ ] File uploads work (if applicable)

#### Performance Testing
- [ ] Page load time < 2s (from Portugal)
- [ ] First Contentful Paint < 1s
- [ ] Time to Interactive < 3s
- [ ] Lighthouse score > 90
- [ ] All assets served via CDN
- [ ] Proper caching headers set

#### Security Testing
- [ ] HTTPS enabled and working
- [ ] SSL certificate valid
- [ ] Security headers present (X-Frame-Options, CSP, etc.)
- [ ] No mixed content warnings
- [ ] CORS configured correctly

#### Analytics & Monitoring
- [ ] Sentry error tracking works
- [ ] PostHog analytics tracking works
- [ ] Cloudflare Analytics showing data
- [ ] Build logs accessible

#### Cross-browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Performance Comparison

Run these tests from Portugal:

```bash
# Test Railway
curl -w "@-" -o /dev/null -s "https://your-railway-app.railway.app" <<'EOF'
Response time: %{time_total}s
EOF

# Test Cloudflare Pages
curl -w "@-" -o /dev/null -s "https://pt2030-candidaturas.pages.dev" <<'EOF'
Response time: %{time_total}s
EOF
```

**Expected Improvement:**
- Railway: 100-200ms
- Cloudflare: 10-30ms
- **Improvement: ~5-10x faster**

---

## Rollback Plan

### If Issues Occur During Migration

#### Immediate Rollback (< 5 minutes)

**Option 1: DNS Rollback**
If using custom domain:
```bash
# Change DNS back to Railway
# Type: CNAME
# Value: your-railway-app.railway.app
```

**Option 2: Cloudflare Rollback**
```bash
# Rollback to previous deployment
wrangler pages deployment list --project-name=pt2030-candidaturas

# Find previous deployment ID
wrangler pages deployment tail <deployment-id>
```

Via Dashboard:
1. Go to **Pages → pt2030-candidaturas → Deployments**
2. Find previous working deployment
3. Click "..." → "Rollback to this deployment"

#### Full Rollback to Railway

1. **Revert DNS changes** (if custom domain was moved)
   ```bash
   # Update CNAME to point back to Railway
   ```

2. **Keep Railway running** (don't decommission yet)
   - Verify Railway is still active
   - Test Railway URL still works

3. **Communicate status**
   - Update team/stakeholders
   - Document issues encountered

---

## Post-Migration Verification

### Day 1 Checklist
- [ ] Monitor error rates in Sentry
- [ ] Check analytics in PostHog
- [ ] Review Cloudflare Analytics
- [ ] Monitor user feedback
- [ ] Check build success rate

### Week 1 Checklist
- [ ] Review performance metrics
- [ ] Compare costs (Railway vs Cloudflare)
- [ ] Monitor uptime (should be > 99.9%)
- [ ] Review edge cache hit ratio
- [ ] Check bandwidth usage

### Month 1 Checklist
- [ ] Decommission Railway (if stable)
- [ ] Document final migration notes
- [ ] Update team documentation
- [ ] Review cost savings
- [ ] Optimize Cloudflare settings further

---

## Troubleshooting

### Common Issues & Solutions

#### Build Fails

**Issue:** Build fails with "command not found"
```bash
Error: npm: command not found
```

**Solution:**
```bash
# Verify Node version in cloudflare-pages.toml
[build.environment]
NODE_VERSION = "18"
```

---

**Issue:** Build fails with "Module not found"
```bash
Error: Cannot find module 'vite'
```

**Solution:**
```bash
# Ensure build command uses 'npm ci' for clean install
# Update build command:
npm ci && npm run build
```

---

#### Routing Issues

**Issue:** 404 on page refresh (SPA routing)

**Solution:**
Verify `cloudflare-pages.toml` has:
```toml
[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

---

#### Environment Variables Not Working

**Issue:** App shows "undefined" for env variables

**Solution:**
1. Verify variables start with `VITE_` prefix
2. Check variables are set in Cloudflare Pages settings
3. Redeploy after adding variables
```bash
# Trigger redeploy
wrangler pages deployment create
```

---

#### SSL/HTTPS Issues

**Issue:** SSL certificate not provisioned

**Solution:**
1. Wait 5 minutes (initial provisioning takes time)
2. Verify domain ownership via TXT record
3. Check DNS propagation: `dig your-domain.com`
4. Contact Cloudflare support if > 24 hours

---

#### Performance Issues

**Issue:** Slow load times

**Solution:**
```bash
# Check build size
du -sh dist/

# Optimize bundle
npm run build -- --report

# Enable compression in headers
[[headers]]
for = "/*"
[headers.values]
Content-Encoding = "gzip"
```

---

#### API Calls Failing

**Issue:** Supabase API calls return 401/403

**Solution:**
1. Verify `VITE_SUPABASE_URL` is correct
2. Verify `VITE_SUPABASE_ANON_KEY` is correct
3. Check CORS settings in Supabase
4. Verify domain is whitelisted in Supabase

---

## Additional Resources

### Documentation
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

### Tools
- [DNS Propagation Checker](https://dnschecker.org)
- [SSL Certificate Checker](https://www.ssllabs.com/ssltest/)
- [WebPageTest](https://www.webpagetest.org/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

### Support
- [Cloudflare Community](https://community.cloudflare.com/)
- [Cloudflare Discord](https://discord.gg/cloudflaredev)
- [Cloudflare Support](https://support.cloudflare.com/)

---

## Success Metrics

After migration, you should see:

### Performance
- ✅ **90% reduction** in latency from Portugal (10-30ms vs 100-200ms)
- ✅ **99.99% uptime** (Cloudflare SLA)
- ✅ **Global CDN** serving content from 300+ locations

### Cost
- ✅ **$0/month** hosting costs (vs $5-20/month on Railway)
- ✅ **Unlimited bandwidth** included
- ✅ **No usage-based pricing**

### Developer Experience
- ✅ **Git-based deployments** (push to deploy)
- ✅ **Preview deployments** for every PR
- ✅ **Instant rollbacks** (one-click)
- ✅ **Build analytics** and logs

### Compliance
- ✅ **GDPR compliant** with EU edge nodes
- ✅ **DDoS protection** included
- ✅ **Security headers** configured
- ✅ **Automatic SSL** renewal

---

## Migration Completion

Once you've completed all steps and verified everything works:

1. ✅ Mark migration as complete in project docs
2. ✅ Decommission Railway deployment
3. ✅ Update README with new deployment URL
4. ✅ Update CI/CD pipelines (if any)
5. ✅ Celebrate! 🎉

---

**Last Updated:** 2025-11-08
**Version:** 1.0
**Maintained By:** PT2030 Development Team
