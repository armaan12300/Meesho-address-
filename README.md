# Meesho Address Shield — Automated Protection & Telegram Bot

A high-performance automated suite to shield user addresses, phone numbers, and names from Meesho order databases and address-seller scrapers.

## 🚀 Why Render is Better than Vercel for this Project

| Feature | Vercel | Render |
| :--- | :--- | :--- |
| **Telegram Bot (`bot.py`)** | ❌ Fails (Vercel kills background polling processes after 10-60s) | ✅ **Runs 24/7 continuously** as a Background Worker |
| **Web Application** | ✅ Runs Vite static frontend | ✅ **Runs Static Site on Free Global CDN** |
| **Combined Deployment** | ❌ Cannot deploy bot + web together | ✅ **Single Blueprint (`render.yaml`) deploys both in 1 click** |
| **Pricing** | Free tier (serverless only) | **100% Free Static Web App** + Free Worker tier |

---

## 🛠️ Step-by-Step: Deploy on Render in 3 Minutes

### 1. Push Code to GitHub
Push this codebase to your GitHub repository (e.g., `armaan12300/Meesho-address-`):
```bash
git add .
git commit -m "Configure 1-click Render blueprint for Web App & Telegram Bot"
git push origin main
```

### 2. Connect to Render Blueprint
1. Open **[render.com](https://render.com/)** and log in (sign in with GitHub).
2. Click **New +** at the top right and select **Blueprint**.
3. Choose your repository: `armaan12300/Meesho-address-`.
4. Render will detect `render.yaml` automatically and display the two configured services:
   - 🌐 **`meesho-address-shield-web`** (Static Site — Web App)
   - 🤖 **`meesho-address-shield-bot`** (Background Worker — Telegram Bot)

### 3. Enter Environment Variables
- Render will ask for `TELEGRAM_BOT_TOKEN`.
- Paste your Telegram Bot token from `@BotFather`.
- Click **Apply**.

### 4. Done!
- Render builds and deploys both services simultaneously!
- You get a free HTTPS web URL (e.g. `https://meesho-address-shield-web.onrender.com`).
- Your Telegram bot will be active 24/7 responding to commands, JSON file uploads, and bulk `.txt` lists.
