# Address Manager — Render Website + Telegram Bot

A local-first organizer for ordinary address records. It supports JSON import, per-record previews, validation, and JSON/CSV export.

## Privacy and safety

- The website saves imported records in `localStorage` in the current browser and origin. The website code does not upload address files to a server.
- Browser local storage is not encrypted. Do not use shared devices; clearing browser data can delete records. Export backups regularly.
- The Telegram bot processes JSON files sent to it and stores the imported records in the bot process's per-user memory. That bot data is separate from website storage and is not synced to the website.
- This project does not log in to Meesho, handle account credentials, or change any shopping account, order, return, pickup, or shipping workflow.
- Never upload passwords, OTPs, cookies, tokens, authorization headers, session strings, or API keys.

## Deploy both services on Render

This repository includes a `render.yaml` Blueprint for two services:

1. **Static site** — serves the `web/` folder as your online website.
2. **Background worker** — runs the Telegram bot continuously.

### Steps from Android

1. Create a new GitHub repository and upload the files from this folder (keep `render.yaml` at the repository root).
2. Open https://render.com/ and sign in.
3. Choose **New + → Blueprint** and connect the repository containing `render.yaml`.
4. Render will ask you for `TELEGRAM_BOT_TOKEN`. Create a bot with the official `@BotFather` in Telegram and enter its token in Render's environment-variable prompt. Keep it secret; never commit it to GitHub.
5. Deploy the Blueprint. Wait for the static site and worker to finish deploying.
6. Open the static-site URL Render gives you. Import a JSON file and test the preview and export buttons.
7. Open your Telegram bot and send `/start`; then send a JSON file as a document.

If Blueprint setup isn't available, create the services separately:
- **Static Site:** repository root, publish directory `web`, no build required.
- **Background Worker:** repository root, build command `pip install -r requirements.txt`, start command `python bot.py`, environment variable `TELEGRAM_BOT_TOKEN`.

## Website usage

- Import a JSON array of objects, or an object with an `addresses` array.
- Required fields: `name`, `number`, `pincode`, `address`, `city`, `state`.
- Pincodes must be six digits; phone numbers are checked for basic formatting.
- Use **Get template** to download a blank JSON template.
- Export the current records as JSON or CSV.
- Records are restored from the same browser's local storage after reload. Storage is specific to that browser/device and site origin.

## Telegram bot commands

- `/start` — help
- `/template` — download a blank JSON template
- `/export_json` — export the most recently imported records for your Telegram user
- `/export_csv` — export those records as CSV
- `/clear` — clear records held for your Telegram user in the bot process

The bot is not a shared database. It does not read browser local storage. If the worker restarts, its in-memory records are lost; import the JSON file again when needed.

## Run locally

```bash
python -m pip install -r requirements.txt
cp .env.example .env
# Edit .env and set TELEGRAM_BOT_TOKEN
python bot.py
```

To preview the website locally, serve the `web/` directory with any static file server, or open `web/index.html` in a modern browser.

## Vercel alternative for the website

The website is static and can also be deployed independently to Vercel using `vercel.json`. The Telegram bot should remain a separate always-running worker on Render.
