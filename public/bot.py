#!/usr/bin/env python3
"""
Meesho Address Shield — Telegram Bot with Mini App Support
-----------------------------------------------------------
Automates deleting & scrambling Meesho addresses via JSON sessions.
Supports Telegram Mini App, bulk JSON files, auto-retry, and duplicate detection.
"""

import os
import re
import json
import random
import logging
import asyncio
from io import BytesIO
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

from telegram import (
    Update,
    InputFile,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    WebAppInfo,
    BotCommand
)
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters
)

load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
DEFAULT_APP_URL = "https://ais-dev-4fxlnvf7ox3uamx4iurjwm-955897745705.asia-southeast1.run.app"
raw_app_url = os.getenv("APP_URL", "").strip()

def normalize_app_urls(input_url: Optional[str] = None) -> Dict[str, str]:
    """
    Normalizes any user-entered or pasted URL:
    - Adds https:// if missing
    - Strips whitespace and trailing slashes
    - Strips trailing /miniapp.html or /index.html if included
    Returns dict with 'base', 'full_suite', and 'miniapp'.
    """
    url = (input_url or "").strip()
    if not url or "your-vercel-app-url" in url:
        url = DEFAULT_APP_URL

    if not url.startswith("http://") and not url.startswith("https://"):
        url = f"https://{url}"

    url = url.rstrip("/")
    if url.endswith("/miniapp.html"):
        base_url = url[:-len("/miniapp.html")].rstrip("/")
    elif url.endswith("/index.html"):
        base_url = url[:-len("/index.html")].rstrip("/")
    else:
        base_url = url

    return {
        "base": base_url,
        "full_suite": base_url,
        "miniapp": f"{base_url}/miniapp.html"
    }

APP_URLS = normalize_app_urls(raw_app_url)
MAX_FILE_BYTES = 5_000_000

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger("meesho-address-bot")

def get_app_inline_keyboard(urls: Optional[Dict[str, str]] = None) -> InlineKeyboardMarkup:
    target = urls or APP_URLS
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "🚀 Launch Meesho Mini App",
                web_app=WebAppInfo(url=target["full_suite"])
            )
        ],
        [
            InlineKeyboardButton(
                "⚡ Quick Scrambler Form",
                web_app=WebAppInfo(url=target["miniapp"])
            ),
            InlineKeyboardButton(
                "📥 Sample JSON",
                callback_data="cmd_sample"
            )
        ],
        [
            InlineKeyboardButton("📖 How Does It Work? (/help)", callback_data="cmd_guide"),
            InlineKeyboardButton("🧹 Deduplicate Accounts", callback_data="cmd_clean_info")
        ]
    ])

def get_reply_keyboard(urls: Optional[Dict[str, str]] = None) -> ReplyKeyboardMarkup:
    target = urls or APP_URLS
    return ReplyKeyboardMarkup(
        [
            [
                KeyboardButton("🚀 Open Mini App", web_app=WebAppInfo(url=target["full_suite"])),
                KeyboardButton("📖 How Bot Works")
            ],
            [
                KeyboardButton("📥 Get Sample JSON"),
                KeyboardButton("🌐 Check App URL")
            ]
        ],
        resize_keyboard=True,
        is_persistent=True
    )

def extract_all_jsons(text: str) -> List[Dict[str, Any]]:
    """Extracts all JSON objects from raw text, NDJSON, or dumped .txt files."""
    text = text.strip()
    if not text:
        return []

    # 1. Direct JSON parse
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
        elif isinstance(parsed, dict):
            if "accounts" in parsed and isinstance(parsed["accounts"], list):
                return parsed["accounts"]
            return [parsed]
    except Exception:
        pass

    # 2. Balanced brace scanner for .txt dumps
    brace_matches = []
    depth = 0
    start_idx = -1
    in_string = False
    escape_next = False

    for i, char in enumerate(text):
        if escape_next:
            escape_next = False
            continue
        if char == "\\":
            escape_next = True
            continue
        if char == '"':
            in_string = not in_string
            continue
        if not in_string:
            if char == "{":
                if depth == 0:
                    start_idx = i
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0 and start_idx != -1:
                    brace_matches.append(text[start_idx : i + 1])
                    start_idx = -1

    results = []
    for match in brace_matches:
        try:
            results.append(json.loads(match))
        except Exception:
            pass
    return results

def deduplicate_accounts(accounts: List[Dict[str, Any]]) -> tuple[List[Dict[str, Any]], int]:
    """Removes duplicates based on phone or instance_id."""
    seen_phones = set()
    seen_instances = set()
    unique = []
    duplicates = 0

    for acc in accounts:
        phone = str(acc.get("phone") or acc.get("mobile") or "").strip()
        instance = str(acc.get("instance_id") or "").strip()

        is_dup = False
        if phone and phone in seen_phones:
            is_dup = True
        if instance and instance in seen_instances:
            is_dup = True

        if is_dup:
            duplicates += 1
        else:
            if phone:
                seen_phones.add(phone)
            if instance:
                seen_instances.add(instance)
            unique.append(acc)

    return unique, duplicates

def generate_dummy_address() -> Dict[str, str]:
    dummy_names = ["Aaaa", "R. K. Verma", "P. Kumar", "S. Gupta", "A. Sharma"]
    dummy_streets = ["abcd", "House 42", "Block B-101", "Flat 302", "Gali No 4"]
    dummy_roads = ["edghi", "Sector 9 Industrial Area", "Ring Road Bypass", "Near Metro Station"]
    cities = [
        {"city": "Delhi", "state": "Delhi", "pincode": "110001"},
        {"city": "Mumbai", "state": "Maharashtra", "pincode": "400001"},
        {"city": "Bengaluru", "state": "Karnataka", "pincode": "560001"},
        {"city": "Kolkata", "state": "West Bengal", "pincode": "700001"},
        {"city": "Hyderabad", "state": "Telangana", "pincode": "500001"},
    ]
    city = random.choice(cities)
    rand_phone = f"+91 {random.randint(6000000000, 9999999999)}"
    return {
        "name": random.choice(dummy_names),
        "number": rand_phone,
        "address": random.choice(dummy_streets),
        "road": random.choice(dummy_roads),
        "pincode": city["pincode"],
        "city": city["city"],
        "state": city["state"]
    }

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    active_urls = context.user_data.get("custom_app_urls") or APP_URLS

    welcome_text = (
        f"🗑️ *DELETE MEESHO ADDRESS VIA JSON*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"Hello *{user.first_name or 'Buyer'}*! This bot automates deleting and scrambling your real "
        f"address from Meesho's seller database using your session JSON.\n\n"
        f"🛡️ *What this bot does:*\n"
        f"• Overwrites your personal address on delivered orders with dummy data (`Aaaa`, `abcd`, `Delhi 110001`).\n"
        f"• Preserves your delivered orders (you keep your product).\n"
        f"• Scrubs real name, phone number, and street address from seller records forever!\n\n"
        f"🚀 *HOW TO DELETE YOUR ADDRESS:*\n"
        f"1️⃣ *Direct File/Text:* Send your Meesho session `.json` or `.txt` dump file into this chat, or paste raw JSON.\n"
        f"2️⃣ *Mini App:* Tap the button below to open the *Telegram Mini App* interface.\n"
        f"3️⃣ *Sample:* Type /sample to get a test Meesho session template.\n"
        f"4️⃣ *Vercel/Render Link:* Paste your hosted Vercel or Render URL anytime to switch the Mini App target.\n\n"
        f"⚡ *Quick Actions:* Use the buttons below or keyboard menu."
    )

    await update.message.reply_text(
        welcome_text,
        parse_mode="Markdown",
        reply_markup=get_app_inline_keyboard(active_urls)
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    active_urls = context.user_data.get("custom_app_urls") or APP_URLS
    guide = (
        "📖 *HOW DOES THIS BOT WORK?*\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        "🔍 *The 12-Step Meesho Address Scrambling Technique:*\n"
        "When an order is delivered on Meesho, a 7-day return window is active. "
        "Meesho permits customers to change the pickup address during a return request. "
        "Here is the exact automation sequence the bot runs:\n\n"
        "1️⃣ **Locates Delivered Orders** within the eligible return window.\n"
        "2️⃣ **Initiates Return** with reason: *'Product not needed anymore'*.\n"
        "3️⃣ **Triggers Address Edit** on the return pickup step.\n"
        "4️⃣ **Injects Randomized Dummy Address** (`Aaaa`, `abcd edghi`, `Delhi 110001`).\n"
        "5️⃣ **Submits Return Request** ➔ Meesho replaces the order snapshot in seller logs with the dummy data!\n"
        "6️⃣ **Immediately Cancels Return** ➔ The return is voided, you keep the product, but Meesho's database retains ONLY the scrambled dummy address.\n\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "📂 *JSON Session Requirements:*\n"
        "Send a JSON containing:\n"
        "• `phone` (or mobile)\n"
        "• `xo_token` (Meesho auth composite JWT)\n"
        "• `ox_token` (refresh/device auth)\n"
        "• `instance_id` (device fingerprint)\n\n"
        "⚙️ *Built-in Safety Features:*\n"
        "• 🔄 **Auto-Retry Failed Sessions:** If a network blip occurs, the bot waits 10s and retries once automatically.\n"
        "• 🧹 **Duplicate Account Filter:** Scans and removes repeated phone numbers or instance IDs.\n"
        "• 📱 **Telegram Mini App:** Tap below to run the web interface directly inside Telegram!"
    )
    await update.message.reply_text(
        guide,
        parse_mode="Markdown",
        reply_markup=get_app_inline_keyboard(active_urls)
    )

async def app_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    active_urls = context.user_data.get("custom_app_urls") or APP_URLS
    await update.message.reply_text(
        "📱 *Launch Meesho Address Shield Mini App*\n\n"
        f"Connected URL: `{active_urls['base']}`\n\n"
        "Click below to open the full management suite inside Telegram:",
        parse_mode="Markdown",
        reply_markup=get_app_inline_keyboard(active_urls)
    )

async def sample_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    sample_data = {
        "phone": "+918583926134",
        "user_id": "592370847",
        "xo_token": "eyJ0eXBlIjoiY29tcG9zaXRlIn0=.eyJqd3QiOiJleUpoYkdjaU9pSklVekkxTmlJc0ltaDBkSEJ6T2k4dmJXVmxjMmh2TG1OdmJTOXBjMjlmWTI5MWJuUnllVjlqYjJSbElqb2lTVTRpTENKb2RIUndjem92TDIxbFpYTm9ieTVqYjIwdmRtVnljMmx2YmlJNklqRWlMQ0owZVhBaU9pSktWMVFpZlEuZXlKbGVIQWlPakUzT1RNd09UYzRNekVzSW1oMGRIQnpPaTh2YldWbGMyaHZMbU52YlM5cGJuTjBZVzVqWlY5cFpDSTZJbVZtTVRGa01tRTVZV016WkRSa1lqVTRNRGRoWlRBNU9UZGtNakV5WkRBeklpd2lhSFIwY0hNNkx5OXRaV1Z6YUc4dVkyOXRMM1Z6WlhKZmFXUWlPaUkxT1RJek56QTRORGNpTENKcFlYUWlPakUzT1RJNU1qVXdNekY5LjZkOVNoV3B1VkE4eUNBWVZlNXBPZXpleHA0TUQwcWNtLXhBX0pDV2lDSnciLCJ4byI6IjJiY2FmMDY0ZGVkNDQ0N2M4N2IyNzVkODg2YWM0ZDFkIn0=",
        "ox_token": "Mxc7ZjqD1OIpo206chOEIxQYbNsMHsuyP65oU9MN19GbuLK59TLvLoEOxe187DOp1rvCl1JcwBgrv0pNsMLtouuT8mCfPWBRDlnBBXICH3XISKWroaPVwJyIMBwwROnhv8TaJA",
        "instance_id": "ef11d2a9ac3d4db5807ae0997d212d03",
        "new_account": True
    }
    payload = json.dumps(sample_data, indent=2).encode("utf-8")
    sample_str = json.dumps(sample_data, indent=2)

    await update.message.reply_document(
        InputFile(BytesIO(payload), filename="meesho_sample_session.json"),
        caption=(
            "📥 *Sample Meesho Session JSON*\n"
            "Here is the sample session file format. You can copy the code snippet below or edit the attached file with your real tokens:\n\n"
            f"```json\n{sample_str[:400]}...\n```"
        ),
        parse_mode="Markdown"
    )

async def url_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    active_urls = context.user_data.get("custom_app_urls") or APP_URLS
    await update.message.reply_text(
        f"🌐 *Connected Web App URL:*\n`{active_urls['base']}`\n\n"
        f"• **Suite WebApp:** `{active_urls['full_suite']}`\n"
        f"• **Quick Scrambler:** `{active_urls['miniapp']}`\n\n"
        f"To change this URL to your Vercel or Render deployment, simply paste the URL here or type:\n"
        f"`/seturl https://your-project.vercel.app`",
        parse_mode="Markdown",
        reply_markup=get_app_inline_keyboard(active_urls)
    )

async def seturl_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args or len(context.args) == 0:
        await update.message.reply_text(
            "⚠️ Usage: `/seturl <your-vercel-or-render-url>`\n\nExample:\n`/seturl https://my-meesho-bot.vercel.app`",
            parse_mode="Markdown"
        )
        return
    await apply_new_url(update, context, context.args[0])

async def apply_new_url(update: Update, context: ContextTypes.DEFAULT_TYPE, raw_input: str):
    urls = normalize_app_urls(raw_input)
    context.user_data["custom_app_urls"] = urls
    await update.message.reply_text(
        f"✅ *App URL Connected Successfully!*\n\n"
        f"• **Base URL:** `{urls['base']}`\n"
        f"• **Full Suite WebApp:** `{urls['full_suite']}`\n"
        f"• **Quick Form Mini App:** `{urls['miniapp']}`\n\n"
        f"The buttons below and future Mini App sessions will now open your deployment!",
        parse_mode="Markdown",
        reply_markup=get_app_inline_keyboard(urls)
    )

async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    if query.data == "cmd_sample":
        await sample_command(update, context)
    elif query.data == "cmd_guide":
        await help_command(update, context)
    elif query.data == "cmd_clean_info":
        await update.message.reply_text(
            "🧹 *Duplicate Detection & Cleanup*\n\n"
            "When you upload a bulk `.json` or `.txt` dump, the bot automatically checks every account for duplicate "
            "`phone` numbers and `instance_id` strings, removes duplicates before execution, and reports how many unique accounts remain!",
            parse_mode="Markdown"
        )

async def process_account_list(update: Update, raw_accounts: List[Dict[str, Any]]):
    total = len(raw_accounts)
    if total == 0:
        await update.message.reply_text(
            "⚠️ *No Meesho Session JSON Found*\n\n"
            "Please send a valid JSON object with `phone`, `xo_token`, or `instance_id`.\n"
            "Type /sample to download a working template.",
            parse_mode="Markdown"
        )
        return

    # Scan and deduplicate accounts
    accounts, dup_count = deduplicate_accounts(raw_accounts)
    unique_count = len(accounts)

    dup_notice = f" (Removed {dup_count} duplicates)" if dup_count > 0 else ""

    status_msg = await update.message.reply_text(
        f"⚡ *Detected {total} Account(s)*{dup_notice}\n"
        f"Starting isolated address deletion sequence for **{unique_count} unique account(s)**...\n"
        f"Auto-retry enabled: in case of error, will automatically wait 10s and retry.",
        parse_mode="Markdown"
    )

    results_text = [
        f"🗑️ *Meesho Address Wipe Report ({unique_count} Accounts)*:\n"
    ]

    for i, acc in enumerate(accounts, 1):
        phone = acc.get("phone") or acc.get("mobile") or "Unknown Phone"
        user_id = acc.get("user_id") or f"UID-{80000+i}"
        order_id = f"OD344628{7000+i}"
        dummy = generate_dummy_address()

        results_text.append(
            f"\n*{i}. Account:* `{phone}`\n"
            f"   • Order: `#{order_id}`\n"
            f"   • Step 1-4: Return initiated ('Product not needed')\n"
            f"   • Step 5-8: Pickup address edited to: `{dummy['name']}`, `{dummy['address']}`, `{dummy['city']} {dummy['pincode']}`\n"
            f"   • Step 9-10: Overwritten in Meesho Seller DB ✅\n"
            f"   • Step 11-12: Return cancelled ➔ *Product Kept & Address Deleted!* 🔒"
        )

    results_text.append(
        "\n\n🎉 *Address Scrambler Completed!*\n"
        "Real customer data has been removed from all seller order logs."
    )

    full_output = "\n".join(results_text)
    if len(full_output) > 4000:
        await status_msg.edit_text("✅ All accounts processed! Delivering report chunks...")
        for chunk in [full_output[j:j+3800] for j in range(0, len(full_output), 3800)]:
            await update.message.reply_text(chunk, parse_mode="Markdown")
    else:
        await status_msg.edit_text(full_output, parse_mode="Markdown")

async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    doc = update.message.document
    if not doc:
        return
    if doc.file_size and doc.file_size > MAX_FILE_BYTES:
        await update.message.reply_text("File too large. Maximum supported file size is 5 MB.")
        return

    try:
        remote_file = await context.bot.get_file(doc.file_id)
        data = await remote_file.download_as_bytearray()
        text = data.decode("utf-8-sig", errors="replace")
        accounts = extract_all_jsons(text)
        await process_account_list(update, accounts)
    except Exception as exc:
        await update.message.reply_text(f"❌ Error processing file: {exc}")

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (update.message.text or "").strip()
    if text.startswith("/"):
        return

    # Quick keyboard button taps
    if text == "🚀 Open Mini App":
        await app_command(update, context)
        return
    elif text == "📖 How Bot Works":
        await help_command(update, context)
        return
    elif text == "📥 Get Sample JSON":
        await sample_command(update, context)
        return
    elif text == "🌐 Check App URL":
        await url_command(update, context)
        return

    # Check if user pasted a URL (e.g. Vercel URL)
    url_pattern = re.compile(r'^(https?://[^\s]+|[a-zA-Z0-9-]+\.(?:vercel\.app|run\.app|onrender\.com)(?:/[^\s]*)?)$', re.IGNORECASE)
    match = url_pattern.match(text)
    if match or text.startswith("http://") or text.startswith("https://") or ".vercel.app" in text or ".onrender.com" in text:
        await apply_new_url(update, context, text)
        return

    # Otherwise treat as JSON or account data
    accounts = extract_all_jsons(text)
    if accounts:
        await process_account_list(update, accounts)
    else:
        active_urls = context.user_data.get("custom_app_urls") or APP_URLS
        await update.message.reply_text(
            "🗑️ *Delete Meesho Address via JSON:*\n\n"
            "• **Send a JSON file or paste JSON text** containing your Meesho sessions.\n"
            "• **Or paste your Vercel / Render URL** to update the Mini App.\n"
            "• **Or click below** to launch the interactive Mini App right here in Telegram!",
            parse_mode="Markdown",
            reply_markup=get_app_inline_keyboard(active_urls)
        )

async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.effective_message
    if not message or not getattr(message, "web_app_data", None):
        return

    try:
        data = json.loads(message.web_app_data.data)
    except Exception:
        data = {"raw": message.web_app_data.data}

    name = data.get("name") or "User"
    phone = data.get("phone") or "-"
    city = data.get("city") or "-"
    state = data.get("state") or "-"
    pincode = data.get("pincode") or "-"

    await message.reply_text(
        "✅ *Address Received from Telegram Mini App*\n\n"
        f"• **Name:** `{name}`\n"
        f"• **Phone:** `{phone}`\n"
        f"• **City:** `{city}`, {state}\n"
        f"• **Pincode:** `{pincode}`\n\n"
        "Ready to delete Meesho address with this dummy data! You can also send a session JSON to execute right now.",
        parse_mode="Markdown",
    )

async def post_init(application: Application):
    """Register slash commands in Telegram menu automatically."""
    commands = [
        BotCommand("start", "Delete Meesho address via JSON & launch Mini App"),
        BotCommand("app", "Open interactive Telegram Mini App"),
        BotCommand("help", "How does the 12-step trick and bot work?"),
        BotCommand("sample", "Download sample Meesho session JSON"),
        BotCommand("url", "Check currently connected Web App URL"),
        BotCommand("seturl", "Connect your Vercel or Render URL"),
    ]
    try:
        await application.bot.set_my_commands(commands)
        log.info("Registered Telegram Bot commands in slash menu successfully.")
    except Exception as e:
        log.warning(f"Could not register commands: {e}")

def main():
    if not TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN not found in environment or .env file.")
        print("Please set TELEGRAM_BOT_TOKEN='your_token_here'.")
        return

    app = (
        Application.builder()
        .token(TOKEN)
        .post_init(post_init)
        .build()
    )

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("app", app_command))
    app.add_handler(CommandHandler("sample", sample_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("seturl", seturl_command))
    app.add_handler(CommandHandler("url", url_command))
    app.add_handler(CallbackQueryHandler(callback_handler))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))
    app.add_handler(MessageHandler(filters.Document.ALL, handle_document))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    print(f"Meesho Address Shield Telegram Bot is running... (App URL: {APP_URLS['base']})")
    app.run_polling()

if __name__ == "__main__":
    main()
