# ColdCraft AI — Deployment Guide

## Your complete step-by-step guide to going live (for free)

---

## STEP 1: Get Your Free Anthropic API Key

1. Go to **https://console.anthropic.com**
2. Click **Sign Up** (use Google or email)
3. Once logged in, click **API Keys** in the left sidebar
4. Click **Create Key** → name it "coldcraft" → copy the key
5. Save this key somewhere safe — you'll need it in Step 4

> Anthropic gives you **$5 in free credits** when you sign up. That's roughly 500-1,000 email generations — plenty to validate your app before spending anything.

---

## STEP 2: Create a GitHub Account (if you don't have one)

1. Go to **https://github.com**
2. Click **Sign Up** → follow the steps (free)
3. Once logged in, click the **+** button (top right) → **New repository**
4. Name it `coldcraft-ai`
5. Keep it **Public** (Vercel's free tier requires public repos)
6. Check **"Add a README file"**
7. Click **Create repository**

---

## STEP 3: Upload Your Code to GitHub

### Option A: Using the GitHub website (easiest for beginners)

1. Open your new `coldcraft-ai` repo on GitHub
2. Click **"Add file"** → **"Upload files"**
3. Drag and drop ALL the project files from the zip I gave you
4. Make sure the folder structure looks like this:

```
coldcraft-ai/
├── api/
│   └── generate.js        ← serverless API (keeps your key secret)
├── src/
│   ├── App.jsx             ← the main app
│   └── main.jsx            ← React entry point
├── index.html              ← HTML shell
├── package.json            ← dependencies
├── vite.config.js          ← build config
├── vercel.json             ← Vercel routing
├── .gitignore              ← files to ignore
└── .env.example            ← shows what env vars you need
```

5. Click **"Commit changes"**

### Option B: Using the terminal (if comfortable)

```bash
git clone https://github.com/YOUR_USERNAME/coldcraft-ai.git
cd coldcraft-ai
# Copy all project files into this folder
git add .
git commit -m "Initial commit - ColdCraft AI"
git push origin main
```

---

## STEP 4: Deploy to Vercel (free)

1. Go to **https://vercel.com**
2. Click **Sign Up** → choose **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub
4. Click **"Add New..."** → **"Project"**
5. Find `coldcraft-ai` in your repo list → click **Import**
6. Under **Framework Preset**, select **Vite**
7. Open **"Environment Variables"** section
8. Add this variable:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** paste your API key from Step 1
9. Click **Deploy**
10. Wait 1-2 minutes... **Your app is now live!**

Vercel will give you a URL like: `https://coldcraft-ai.vercel.app`

---

## STEP 5: Test It

1. Open your Vercel URL
2. Fill in a test company, role, and offer
3. Pick 1 or 2 tones
4. Hit Generate
5. You should see a personalized cold email appear!

If it doesn't work, check:
- Your API key is correctly pasted in Vercel environment variables
- Go to Vercel dashboard → your project → Settings → Environment Variables

---

## STEP 6: Get a Custom Domain (optional, ~$1-9/year)

1. Go to **https://namecheap.com**
2. Search for a domain like `coldcraft.ai` or `coldcraftai.com`
3. Buy it (usually $1-9 for the first year)
4. In Vercel: go to your project → **Settings** → **Domains**
5. Add your custom domain and follow the DNS instructions

---

## STEP 7: Start Getting Traffic (free)

### Launch Day
- [ ] Submit to **Product Hunt** (producthunt.com → Submit)
- [ ] Post on **Reddit**: r/SideProject, r/Entrepreneur, r/sales, r/coldemail
- [ ] Post on **Hacker News**: "Show HN: I built an AI cold email generator"
- [ ] Post on **Twitter/X**: short demo video (screen record, no face needed)

### AI Directories (submit to all of these — free)
- [ ] theresanaiforthat.com
- [ ] futurepedia.io
- [ ] toolify.ai
- [ ] aitoptools.com
- [ ] topai.tools

### Ongoing Traffic
- [ ] Create a faceless YouTube Short / TikTok showing the tool in action
- [ ] Answer questions on Quora/Reddit about cold emails, link your tool
- [ ] Write a blog post on Medium: "How I Use AI to Write Cold Emails"

---

## STEP 8: Add Monetization

### Google AdSense (passive ad income)
1. Go to **https://adsense.google.com**
2. Sign up with your Google account
3. Add your site URL
4. Wait for approval (usually 1-3 days)
5. Once approved, paste the ad script into your `index.html`

### Stripe Payments (for Pro tier)
1. Go to **https://stripe.com** → Sign up (free)
2. Create a product: "ColdCraft Pro" at $9/month
3. Get a Stripe payment link
4. Replace the "Upgrade Now" button's onClick to redirect to your Stripe link

---

## What Each File Does

| File | Purpose |
|------|---------|
| `api/generate.js` | Serverless function that calls the Anthropic API. Your API key stays secret on the server — users never see it. |
| `src/App.jsx` | The entire frontend app — form, tone selector, results display. |
| `src/main.jsx` | React bootstrapping (you won't need to edit this). |
| `index.html` | The HTML shell with fonts and meta tags. |
| `package.json` | Lists your dependencies (React, Vite). |
| `vite.config.js` | Build configuration for Vite. |
| `vercel.json` | Tells Vercel how to route API calls vs frontend pages. |

---

## Estimated Costs

| Item | Cost |
|------|------|
| Vercel hosting | Free |
| Anthropic API (first $5) | Free |
| GitHub | Free |
| Domain (optional) | $1-9/year |
| Stripe | Free (2.9% per transaction) |
| **Total to launch** | **$0** |

---

## Revenue Projections

| Traffic/month | Ad Revenue | Pro Subs (2% conversion) | Total |
|---------------|-----------|-------------------------|-------|
| 1,000 visitors | ~$5 | ~2 × $9 = $18 | $23/mo |
| 5,000 visitors | ~$25 | ~10 × $9 = $90 | $115/mo |
| 10,000 visitors | ~$50 | ~20 × $9 = $180 | $230/mo |
| 50,000 visitors | ~$250 | ~100 × $9 = $900 | $1,150/mo |

These numbers grow as you add more tools to your site.

---

## Next Steps After Launch

1. **Add more features** to increase Pro conversion: A/B subject lines, CSV export, CRM integration
2. **Build tool #2** on the same domain (AI Resume Writer, AI LinkedIn Message Generator)
3. **Set up email capture** with free Mailchimp — offer "5 Free Cold Email Templates" as a lead magnet
4. **SEO optimize** your landing page for "cold email generator", "AI cold email tool"

---

You're one afternoon away from having a live, revenue-generating AI product. Let's go! 🚀
