# Frontend Deployment Guide

## Deploy to Vercel (Free & Easy!)

### 1. Push Your Code to GitHub
```bash
git add .
git commit -m "Add simple frontend for HVACplus"
git push
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New Project"**
3. Import your GitHub repository: `floodyc/HVACplus`
4. **Important Settings:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** Leave as `.` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

5. **Environment Variables** - Add this ONE variable:
   ```
   NEXT_PUBLIC_API_URL = https://your-railway-app-url.railway.app
   ```
   (Replace with your actual Railway backend URL)

6. Click **"Deploy"**

### 3. Done! 🎉

Vercel will:
- Build your Next.js app
- Deploy it automatically
- Give you a URL like: `https://hvacplus.vercel.app`
- Auto-deploy on every git push!

## Test Your App

Visit your Vercel URL and you should see:
- Login/Signup page
- Dashboard with projects
- Add spaces/rooms
- Run HVAC calculations

## Cost

**$0/month** - Vercel's free tier includes:
- Unlimited deployments
- Automatic HTTPS
- Global CDN
- Custom domains

## Local Development

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local with your Railway API URL
npm run dev
# Visit http://localhost:3000
```

## Need Help?

- Backend not working? Check your Railway deployment
- CORS errors? Update CORS_ORIGINS in Railway backend variables
- Can't login? Make sure NEXT_PUBLIC_API_URL points to your Railway URL
