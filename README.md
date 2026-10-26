# Meesho Address Shield — Automated Protection & Telegram Bot

A high-performance automated suite to shield user addresses, phone numbers, and names from Meesho order databases and address-seller scrapers.

---

## 🔍 Detailed Diagnosis: Why Vercel Failed & How It Is Fixed

When deploying commit `3d6b04c` to Vercel, the build failed with:
```
npm error code ERESOLVE could not resolve
Found: esbuild@0.25.12
Could not resolve dependency: peerOptional esbuild@"^0.27.0 || ^0.28.0" from vite@8.3.5
Error: [BUILD_UTILS_SPAWN_1] Command "npm install" exited with 1
```

### The 3 Core Errors on Vercel:

1. **`npm ERESOLVE` Peer Dependency Mismatch**:
   - **Cause:** Vercel runs `npm install` with strict peer-dependency checks by default. Vite 8 / Tailwind CSS Vite plugins specify optional peer bounds on esbuild that npm flags as an unresolvable collision when an explicit or transitive older esbuild exists.
   - **Fix Applied:** 
     - Added `.npmrc` with `legacy-peer-deps=true`.
     - Added `vercel.json` with `"installCommand": "npm install --legacy-peer-deps"`.
     - Cleaned `package.json` dependencies so Vite manages its own optimized esbuild binary.

2. **Python vs Node.js Mixed-Runtime Confusion**:
   - **Cause:** Vercel detected `requirements.txt` and attempted to install Python 3.14 dependencies, expecting a Python serverless API route in `/api`.
   - **Fix Applied:** Configured `vercel.json` explicitly with `"framework": "vite"`, `"buildCommand": "npm run build"`, and `"outputDirectory": "dist"` so Vercel treats the project as a Vite Single Page Application.

3. **Telegram Bot Cannot Run on Vercel (Serverless Constraint)**:
   - **Cause:** Vercel is a **serverless** platform designed for short request-response cycles (max 10-60s execution timeout). A Telegram Bot (`bot.py`) requires a persistent, long-running loop (`python-telegram-bot` polling). Vercel kills background loops immediately.
   - **Solution:** 
     - **Option A (Recommended):** Deploy on **Render** using the included `render.yaml` blueprint. Render runs the Web App as a Static Site and the Telegram Bot as a 24/7 Background Worker.
     - **Option B:** Deploy the frontend Web App to **Vercel** and run `bot.py` on Render or any Python VPS/server.

---

## 🚀 Deployment Options

### Option 1: Deploy on Render (Both Web App & 24/7 Telegram Bot)

Render deploys both the Web App and the Telegram Bot with one click using `render.yaml`:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Fix Vercel build & configure Render blueprint"
   git push origin main
   ```
2. **Go to [render.com](https://render.com/)**:
   - Click **New +** → **Blueprint**.
   - Select your repository (`armaan12300/Meesho-address-`).
   - Render automatically provisions:
     - 🌐 `meesho-address-shield-web` (Static Site)
     - 🤖 `meesho-address-shield-bot` (Background Worker)
3. Enter `TELEGRAM_BOT_TOKEN` when prompted and click **Apply**.

---

### Option 2: Deploy Web App on Vercel

With the updated `.npmrc` and `vercel.json`:

1. **Push the changes to GitHub**:
   ```bash
   git add .
   git commit -m "Update all configurations for clean Vercel redeployment"
   git push origin main
   ```
2. **In Vercel Dashboard**:
   - Go to your Project Settings → **Build & Development Settings**.
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install --legacy-peer-deps` (automatically picked up from `vercel.json` and `.npmrc`).
   - Trigger a **Redeploy**. The build will succeed with 0 errors.

---

## 🤖 Telegram Bot Commands (BotFather Setup)

Copy and paste this exact block into **@BotFather** (`/setcommands`):

```text
start - Delete Meesho address via JSON & launch Mini App
help - How the 12-step return wipe trick works
app - Launch Telegram Mini App interface
sample - Download sample Meesho session JSON template
seturl - Link your public Vercel/Render URL to remove Google login
url - View currently linked Mini App URL
status - Check bot system status and features
```

---

## 🔓 How to Remove Google Login in Telegram Mini App

1. Deploy your frontend to **Vercel** or **Render** (free, public HTTPS URL, e.g. `https://meesho-address.vercel.app`).
2. In your Telegram chat with the bot, send:
   ```text
   /seturl https://your-project.vercel.app
   ```
3. Or configure the Menu Button in **@BotFather**:
   - `/setmenubutton` ➔ Select your bot ➔ Send URL `https://your-project.vercel.app` ➔ Button title: `🚀 Wipe Address`.
4. The Mini App opens instantly with **zero login required**! You can also delete addresses directly by pasting JSON in the chat without opening any browser.

