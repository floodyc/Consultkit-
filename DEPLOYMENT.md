# ConsultKit Deployment Guide

This guide covers deploying ConsultKit applications to Vercel (frontends) and Render (backends).

## Overview

| Service | Platform | Purpose |
|---------|----------|---------|
| HVACplus Frontend | Vercel | Main HVAC calculator app |
| HVACplus Backend | Render | API for HVAC calculations |
| ConsultKit Landing | Vercel | Marketing landing page |
| SaaS App Frontends | Vercel | Individual app UIs |
| SaaS App Backends | Render | Individual app APIs |

## Prerequisites

1. GitHub account connected to both Vercel and Render
2. Stripe account for payment processing
3. SendGrid (or similar) for transactional emails
4. PostgreSQL databases (provisioned via Render)

## Deploying to Vercel (Frontends)

### Step 1: Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repository
3. Select the root directory for the app:
   - HVACplus: `/` (root)
   - Landing Page: `saas-portfolio/landing-page`
   - ScopeStack: `saas-portfolio/apps/scopestack/frontend`
   - RetainerPulse: `saas-portfolio/apps/retainerpulse/frontend`
   - ProposalForge: `saas-portfolio/apps/proposalforge/frontend`
   - ClientBoard: `saas-portfolio/apps/clientboard/frontend`
   - LeadGate: `saas-portfolio/apps/leadgate/frontend`
   - DeliverProof: `saas-portfolio/apps/deliverproof/frontend`

### Step 2: Configure Environment Variables

For each frontend, add:

```
NEXT_PUBLIC_API_URL=https://[app-name]-api.onrender.com
```

### Step 3: Configure Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain (e.g., `scopestack.consultkit.com`)
3. Update DNS records as instructed

### Step 4: Deploy

Click "Deploy" and Vercel will automatically build and deploy.

## Deploying to Render (Backends)

### Option A: Using Blueprint (Recommended)

1. Go to [render.com/new](https://render.com/new)
2. Click "Blueprint"
3. Connect the GitHub repository
4. Render will read `render.yaml` and create all services

### Option B: Manual Setup

#### Create Database

1. Go to Render Dashboard > New > PostgreSQL
2. Name: `[app-name]-db`
3. Database: `[app_name]`
4. User: `[app_name]_user`
5. Select "Starter" plan
6. Click "Create Database"

#### Create Web Service

1. Go to Render Dashboard > New > Web Service
2. Connect GitHub repository
3. Configure:
   - Name: `[app-name]-api`
   - Root Directory: `saas-portfolio/apps/[app-name]/backend`
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. Add Environment Variables:
   ```
   DATABASE_URL=[from database]
   JWT_SECRET=[generate 32+ char random string]
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=[SendGrid API key]
   FROM_EMAIL=noreply@[app].consultkit.com
   ```

5. Click "Create Web Service"

## Environment Variables Reference

### Backend Services

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing (32+ chars) | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes |
| `SMTP_HOST` | SMTP server host | Yes |
| `SMTP_PORT` | SMTP server port | Yes |
| `SMTP_USER` | SMTP username | Yes |
| `SMTP_PASSWORD` | SMTP password/API key | Yes |
| `FROM_EMAIL` | Sender email address | Yes |

### Frontend Services

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID | No |

## Stripe Webhook Setup

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://[app-name]-api.onrender.com/api/v1/billing/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

## Custom Domains

### Vercel (Frontends)

1. Add domain in Vercel project settings
2. Add CNAME record: `[subdomain] -> cname.vercel-dns.com`

### Render (Backends)

1. Add domain in Render service settings
2. Add CNAME record: `[subdomain] -> [service-name].onrender.com`

## Monitoring & Logs

### Vercel
- View deployment logs in project dashboard
- Enable Vercel Analytics for performance monitoring

### Render
- View service logs in dashboard
- Set up health check alerts
- Use Render's built-in metrics

## CI/CD

Both Vercel and Render automatically deploy on push to the connected branch.

### Recommended Branch Strategy

- `main` - Production deployments
- `staging` - Preview deployments
- Feature branches - Pull request previews (Vercel)

## Troubleshooting

### Common Issues

**Build Fails on Vercel**
- Check Node version (should be 18+)
- Verify all dependencies are in package.json
- Check for TypeScript errors

**Backend Fails to Start**
- Verify DATABASE_URL is correct
- Check Python version (should be 3.9+)
- Ensure all requirements are installed

**Stripe Webhooks Not Working**
- Verify webhook URL is correct
- Check STRIPE_WEBHOOK_SECRET matches
- Ensure endpoint is publicly accessible

**CORS Errors**
- Add frontend URL to backend CORS_ORIGINS
- Ensure protocol (https) matches

## Cost Estimates

### Vercel (Free Tier)
- Hobby: Free for personal projects
- Pro: $20/month per member for teams

### Render
- Starter PostgreSQL: $7/month per database
- Starter Web Service: $7/month per service

**Estimated Monthly Cost (all apps):**
- 7 databases: $49/month
- 7 web services: $49/month
- Total: ~$98/month on Render + Vercel free tier
