# Vercel Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Vercel account (free at https://vercel.com)
- GitHub account (repo already connected)
- Environment variables ready

### Step 1: Import Project to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Select **"Import Git Repository"**
4. Search and select `angelbuncy/certificate-creator-pro-78`
5. Click **"Import"**

### Step 2: Configure Environment Variables

In the **"Environment Variables"** section, add:

```
SUPABASE_URL=<your-supabase-url>
SUPABASE_PUBLISHABLE_KEY=<your-supabase-key>
LOVABLE_API_KEY=<your-lovable-key>
RESEND_API_KEY=<your-resend-key>
```

**Get these from:**
- **Supabase**: Project Settings → API keys
- **Lovable**: API dashboard
- **Resend**: Email API keys

### Step 3: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Your site is live at `https://<project-name>.vercel.app`

---

## 📋 Build Configuration

- **Framework**: Vite (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install` (auto)

---

## ✅ What's Fixed

✓ CSS complete - no truncation  
✓ SVG noise filter fully embedded  
✓ Google Fonts import working  
✓ Dotted grid utilities ready  
✓ Email API configured

---

## 🔍 Verify Deployment

After deployment:

1. **Check site loads** → https://your-domain.vercel.app
2. **Test login** → Click "SIGN IN"
3. **Test email config** → Create project and try "MAIL ALL"
4. **Check console** → DevTools for any errors

---

## 📱 Troubleshooting

### Build Fails
- Check all env vars are set
- Run `npm run build` locally to verify

### Emails Not Sending
- Verify `LOVABLE_API_KEY` and `RESEND_API_KEY`
- Check Vercel Function logs: Deployments → Function Logs
- Look for errors in browser console

### Styling Issues
- Clear browser cache (Cmd+Shift+R)
- Check CSS in DevTools → Sources tab

---

## 🔄 Redeployment

Changes auto-deploy when you push to `main` branch:

```bash
git add .
git commit -m "your changes"
git push origin main
```

Vercel rebuilds automatically (~1-2 min).

---

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **Build Logs**: Vercel Dashboard → Deployments → View Logs
- **Function Logs**: Vercel Dashboard → Deployments → Function Logs (for API errors)
