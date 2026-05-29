# House Concierge — Deployment Guide

Follow these steps to get your app live. Total time: ~30 minutes. Total cost: ~$0 to start (free tiers + pay-as-you-go API).

---

## Step 1: Get Your API Keys (10 min)

### OpenAI API Key
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to **API Keys** → **Create new secret key**
4. Copy the key (starts with `sk-`)
5. Add $5-10 of credit under **Billing** (this will last weeks/months at MVP volume)

### Resend API Key (for email notifications)
1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Go to **API Keys** → **Create API Key**
4. Copy the key (starts with `re_`)
5. Free tier gives you 100 emails/day — plenty for MVP

---

## Step 2: Push to GitHub (5 min)

1. Go to [github.com](https://github.com) and sign up / log in
2. Click **New Repository** (the green button or the `+` icon)
3. Name it `house-concierge`, keep it **Private**, click **Create**
4. Open Terminal on your Mac and run these commands:

```bash
# Navigate to the project folder
cd path/to/house-concierge

# Create the .env.local file with your real keys
cp .env.example .env.local
# Edit .env.local with your actual API keys (use TextEdit or VS Code)

# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/house-concierge.git
git push -u origin main
```

**Important:** The `.env.local` file with your real keys is in `.gitignore` — it won't be uploaded to GitHub. That's correct and intentional.

---

## Step 3: Deploy on Vercel (5 min)

1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account
2. Click **Add New → Project**
3. Import your `house-concierge` repository
4. Before clicking **Deploy**, add your environment variables:
   - Click **Environment Variables**
   - Add these three:
     | Name | Value |
     |------|-------|
     | `OPENAI_API_KEY` | `sk-your-actual-key` |
     | `RESEND_API_KEY` | `re_your-actual-key` |
     | `NOTIFY_EMAIL` | `s.brandonxf@gmail.com` |
5. Click **Deploy**
6. Wait 1-2 minutes — you'll get a URL like `house-concierge.vercel.app`

**That's it. Your app is live.**

---

## Step 4: Custom Domain (Optional, $12/year)

1. Buy a domain on [Namecheap](https://namecheap.com) or [Cloudflare](https://cloudflare.com) (e.g., `houseconcierge.app`)
2. In Vercel, go to your project → **Settings → Domains**
3. Add your domain and follow the DNS instructions

---

## How It Works Day-to-Day

When someone uses the app and submits a pro request:

1. **You get an email** with their name, phone, appliance, issue, and ZIP code
2. **You find a pro** — search Thumbtack, Yelp, or Angi for a provider who handles that appliance type in their ZIP area
3. **You text the customer** — send them the pro's name, price range, and a link to schedule (or just the pro's phone number)
4. **Follow up** — text back the next day to ask if the pro showed up and if the issue is resolved

This is your "Wizard of Oz" phase. You're the concierge. Once you've done 30-50 of these, you'll know:
- Which appliance types get the most requests
- Which providers are reliable
- What the average job costs
- Whether this is a business worth building further

---

## Costs Summary

| Item | Cost |
|------|------|
| Vercel hosting | Free |
| OpenAI API (GPT-4o-mini) | ~$0.15 per 1M input tokens (~$5-20/month) |
| Resend emails | Free (100/day) |
| Domain (optional) | ~$12/year |
| **Total** | **~$5-20/month** |

---

## Troubleshooting

**Build fails on Vercel?**
- Check that all environment variables are set correctly
- Check the build logs for specific error messages

**AI chat not responding?**
- Verify your OpenAI API key is correct
- Make sure you have billing credit on your OpenAI account

**Not getting email notifications?**
- Check your Resend dashboard for delivery status
- Verify the RESEND_API_KEY and NOTIFY_EMAIL are set

**Need help?**
- Come back to this conversation and ask me
