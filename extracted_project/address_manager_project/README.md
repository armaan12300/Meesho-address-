# Address Manager — Telegram Bot + Vercel Website

A privacy-first address-data organizer. It imports JSON, previews each address record, validates fields, and exports JSON or CSV.

## Safety boundaries
- This project manages address records only.
- It does **not** log in to Meesho or any other service.
- It does **not** change pickup/shipping addresses on accounts, submit orders/returns, or automate account actions.
- Do not upload passwords, OTPs, API keys, cookies, session strings, authorization headers, or other credentials.
- The website processes files locally in your browser. It does not upload address files to a server.
- The Telegram bot processes the JSON file sent to the bot and keeps records in memory only for that bot process; records are not persisted to disk.

## Project layout

```text
address_manager_project/
├── README.md
├── requirements.txt
├── .env.example
├── .gitignore
├── bot.py
├── address_manager.py
├── vercel.json
└── web/
    ├── index.html
    ├── app.js
    └── style.css
```

## Address JSON format

Use either a list of objects:

```json
[
  {
    "name": "Example Person",
    "number": "9000000000",
    "pincode": "110001",
    "address": "101 Example Road",
    "city": "Delhi",
    "state": "Delhi"
  }
]
```

or an object containing an `addresses` list:

```json
{
  "addresses": [
    {
      "name": "Example Person",
      "number": "9000000000",
      "pincode": "110001",
      "address": "101 Example Road",
      "city": "Delhi",
      "state": "Delhi"
    }
  ]
}
```

Phone numbers and pincodes are strings so leading zeroes are preserved. Extra non-sensitive fields are retained, but credential-like fields cause the record to be rejected.

## Run the Telegram bot on Android / Termux

1. Create a bot with **@BotFather** and copy its token.
2. Install Termux from a trusted source, then run:

   ```bash
   pkg update && pkg upgrade
   pkg install python git
   ```

3. Put this project folder on your phone. In Termux, `cd` into the folder.
4. Install dependencies:

   ```bash
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

5. Create `.env` from `.env.example`, then add your BotFather token:

   ```bash
   cp .env.example .env
   nano .env
   ```

   Set `TELEGRAM_BOT_TOKEN=your_token_here`. Keep `.env` private and never upload it to GitHub.

6. Start the bot:

   ```bash
   python bot.py
   ```

7. Open your bot in Telegram and send `/start`. Send a JSON file as a document. Use `/export_json` or `/export_csv` to export the most recently imported valid records.

Keep Termux running for the bot to stay online. Android battery optimization may stop background processes. For a bot that must run 24/7, use a trusted always-on Python host and configure the token as a secret environment variable. Never paste the token into chat.

## Deploy the website to Vercel (Android-friendly)

The website is a static, client-side app; no Python server or database is required.

1. Create a GitHub repository and upload the contents of this project folder.
2. Open Vercel in your browser and import that repository.
3. Set the project root to the repository root.
4. Deploy. `vercel.json` publishes the `web/` folder as the static site.
5. Open the generated URL. Choose a JSON file; preview and validate records; then export JSON or CSV.

Alternatively, on Android you can use GitHub's website to upload files, then import the repo into Vercel. The website's data stays in the browser tab and is not sent to Vercel.

## Run the website locally

Open `web/index.html` in a modern browser. If your browser blocks local file behavior, serve the `web` folder:

```bash
cd web
python -m http.server 8000
```

Then open `http://127.0.0.1:8000`.

## Deploy the Telegram bot to a host

Deploy `bot.py` as a Python worker/service on a Python hosting provider:
- Build/install command: `pip install -r requirements.txt`
- Start command: `python bot.py`
- Environment variable: `TELEGRAM_BOT_TOKEN`

Do not deploy the bot as a Vercel serverless function: Telegram polling is a long-running process and should use a worker host. The static website can be on Vercel independently.

## Commands

- `/start` — help
- `/template` — download a blank JSON template
- `/export_json` — export current imported records as JSON
- `/export_csv` — export current imported records as CSV
- `/clear` — clear records held in the bot's memory

## Important
This is a general address organizer. Verify every record before using it anywhere. Do not use false addresses or use the tool to manipulate a platform's return, pickup, delivery, or account workflows.
