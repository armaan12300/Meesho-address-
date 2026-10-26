#!/usr/bin/env python3
"""
Meesho Address Manager — Telegram Bot & Mini App Companion
-----------------------------------------------------------
Safe, client-focused delivery address validator, deduplicator,
and CSV/JSON exporter. Connects to Telegram Mini App with zero false claims.
"""

import os
import re
import json
import logging
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

import meesho_api

load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
DEFAULT_APP_URL = "https://ais-dev-4fxlnvf7ox3uamx4iurjwm-955897745705.asia-southeast1.run.app"
raw_app_url = os.getenv("APP_URL", "").strip()

MAX_FILE_BYTES = 5_000_000

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger("meesho-address-bot")


def normalize_app_urls(input_url: Optional[str] = None) -> Dict[str, str]:
    """
    Normalizes any user-entered or pasted URL:
    - Enforces https://
    - Strips trailing slashes
    - Returns base URL
    """
    url = (input_url or "").strip()
    if not url or "your-vercel-app-url" in url or "your-project.vercel.app" in url:
        url = DEFAULT_APP_URL

    if not url.startswith("http://") and not url.startswith("https://"):
        url = f"https://{url}"

    url = url.rstrip("/")
    return {
        "base": url,
        "full_suite": url,
    }


APP_URLS = normalize_app_urls(raw_app_url)


def get_app_inline_keyboard(urls: Optional[Dict[str, str]] = None) -> InlineKeyboardMarkup:
    target = urls or APP_URLS
    is_custom = target["base"] != DEFAULT_APP_URL
    app_label = "🚀 Launch Address Manager (Vercel)" if is_custom else "🚀 Launch Address Manager (App)"

    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                app_label,
                web_app=WebAppInfo(url=target["full_suite"])
            )
        ],
        [
            InlineKeyboardButton("📥 Download Sample JSON", callback_data="cmd_sample"),
            InlineKeyboardButton("🎲 Dummy Privacy Mask", callback_data="cmd_dummy")
        ],
        [
            InlineKeyboardButton("📖 Manual Return Privacy Guide", callback_data="cmd_guide"),
            InlineKeyboardButton("🌐 Check Connected URL", callback_data="cmd_check_url")
        ]
    ])


def get_reply_keyboard(urls: Optional[Dict[str, str]] = None) -> ReplyKeyboardMarkup:
    target = urls or APP_URLS
    return ReplyKeyboardMarkup(
        [
            [
                KeyboardButton("🚀 Open Address Manager", web_app=WebAppInfo(url=target["full_suite"])),
                KeyboardButton("📖 How It Works")
            ],
            [
                KeyboardButton("📥 Sample JSON Template"),
                KeyboardButton("🌐 Connected App URL")
            ]
        ],
        resize_keyboard=True,
        is_persistent=True
    )


def extract_address_objects(text: str) -> List[Dict[str, Any]]:
    """Safely extracts all JSON objects or list items from raw text, NDJSON, or dumps."""
    text = text.strip()
    if not text:
        return []

    # 1. Direct JSON parse
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return [p for p in parsed if isinstance(p, dict)]
        elif isinstance(parsed, dict):
            for key in ["addresses", "records", "accounts", "data"]:
                if key in parsed and isinstance(parsed[key], list):
                    return [p for p in parsed[key] if isinstance(p, dict)]
            return [parsed]
    except Exception:
        pass

    # 2. Balanced brace scanner for concatenated JSON strings or dumps
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
            obj = json.loads(match)
            if isinstance(obj, dict):
                results.append(obj)
        except Exception:
            pass

    return results


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    active_urls = context.user_data.get("custom_app_urls") or APP_URLS

    welcome_text = (
        f"📦 *MEESHO ADDRESS MANAGER & PRIVACY SHIELD*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"Hello *{user.first_name or 'User'}*! This bot helps you safely inspect, validate, "
        f"deduplicate, and export your Meesho delivery address records.\n\n"
        f"🛡️ *Features & Tools:*\n"
        f"• **Instant In-Chat Validation:** Send any JSON text or `.json` file to preview records, detect missing postal codes, and filter duplicate phone numbers.\n"
        f"• **One-Click Export:** Download clean, standardized `.json` and `.csv` files.\n"
        f"• **Telegram Mini App:** Tap below to manage and edit addresses in an interactive mobile UI.\n"
        f"• **Manual Return Privacy Guide:** Learn the step-by-step in-app technique to scramble order addresses during returns.\n\n"
        f"🚀 *Quick Actions:*\n"
        f"1️⃣ Paste your address JSON text below, or\n"
        f"2️⃣ Upload a `.json` / `.txt` file, or\n"
        f"3️⃣ Tap **Launch Address Manager** to open the Mini App."
    )

    await update.message.reply_text(
        welcome_text,
        parse_mode="Markdown",
        reply_markup=get_app_inline_keyboard(active_urls)
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    active_urls = context.user_data.get("custom_app_urls") or APP_URLS
    guide_text = (
        "📖 *MEESHO ADDRESS MANAGER — USER GUIDE*\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        "🔍 *1. How to Validate Addresses:* \n"
        "Send your address JSON in this chat or via the Mini App. The bot checks:\n"
        "• Recipient Name\n"
        "• 10-digit Contact Number\n"
        "• Street Address & House Number\n"
        "• City & State\n"
        "• 6-digit Indian Pincode\n"
        "• Repeated / Duplicate phone numbers\n\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "🛡️ *2. The Manual 12-Step Return Privacy Technique:* \n"
        "Because Meesho does NOT offer a public developer API, automated server-side hacking is restricted by Meesho's Akamai & Cloudflare firewalls. "
        "To protect your privacy manually inside the official Meesho app on Android:\n\n"
        "1. Open **My Orders** ➔ Select delivered order (< 7 days).\n"
        "2. Tap **Return/Exchange**.\n"
        "3. Reason: *'Product not needed anymore'* ➔ Sub-reason: *'Did not like the product'*.\n"
        "4. Mode: Select **Return** (Refund: Back to Source).\n"
        "5. Next to Pickup Address, tap **EDIT**.\n"
        "6. Enter randomized dummy data (e.g. `Aaaa`, `abcd`, `Delhi 110001`, `9876543210`).\n"
        "7. Select the dummy address and submit the return.\n"
        "8. Meesho replaces the customer address in the seller order table.\n"
        "9. Go back to My Orders ➔ Tap **Cancel Return**.\n"
        "10. You keep the product, the return is cancelled, and the seller only retains the dummy scrambled address forever! 🔒"
    )
    await update.message.reply_text(
        guide_text,
        parse_mode="Markdown",
        reply_markup=get_app_inline_keyboard(active_urls)
    )


async def app_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    active_urls = context.user_data.get("custom_app_urls") or APP_URLS
    await update.message.reply_text(
        "📱 *Launch Meesho Address Manager Mini App*\n\n"
        f"Connected URL: `{active_urls['base']}`\n\n"
        "Click below to launch the interactive manager:",
        parse_mode="Markdown",
        reply_markup=get_app_inline_keyboard(active_urls)
    )


async def sample_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    samples = meesho_api.get_sample_demo_records()
    payload = json.dumps({"note": "Sample Demo Address Records", "addresses": samples}, indent=2).encode("utf-8")

    await update.message.reply_document(
        InputFile(BytesIO(payload), filename="meesho_sample_addresses.json"),
        caption=(
            "📥 *Sample Address Template JSON (Demo Data)*\n\n"
            "Here is the standard address schema format. You can edit this file with your own records "
            "and upload it back to validate and export clean JSON / CSV."
        ),
        parse_mode="Markdown"
    )


async def url_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    active_urls = context.user_data.get("custom_app_urls") or APP_URLS
    await update.message.reply_text(
        f"🌐 *Currently Connected Web App URL:*\n`{active_urls['base']}`\n\n"
        f"To connect your custom Vercel or Render deployment, type:\n"
        f"`/seturl https://your-project.vercel.app`",
        parse_mode="Markdown",
        reply_markup=get_app_inline_keyboard(active_urls)
    )


async def seturl_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args or len(context.args) == 0:
        await update.message.reply_text(
            "⚠️ Usage: `/seturl <your-vercel-or-render-url>`\n\nExample:\n`/seturl https://my-app.vercel.app`",
            parse_mode="Markdown"
        )
        return
    raw_input = context.args[0]
    urls = normalize_app_urls(raw_input)
    context.user_data["custom_app_urls"] = urls
    await update.message.reply_text(
        f"✅ *App URL Updated Successfully!*\n\n"
        f"• Connected URL: `{urls['base']}`\n\n"
        f"Mini App buttons will now open this deployment.",
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
    elif query.data == "cmd_check_url":
        await url_command(update, context)
    elif query.data == "cmd_dummy":
        dummy = meesho_api.generate_dummy_mask()
        lines = [
            "🎲 *Random Privacy Mask Address (For Return Trick):*",
            "",
            f"• **Name:** `{dummy['name']}`",
            f"• **Phone:** `{dummy['phone']}`",
            f"• **House / Building:** `{dummy['house']}`",
            f"• **Road / Area:** `{dummy['road']}`",
            f"• **City & State:** `{dummy['city']}, {dummy['state']}`",
            f"• **Pincode:** `{dummy['pincode']}`",
            "",
            "💡 *Use these dummy credentials when editing the pickup address during a return in the Meesho app!*"
        ]
        await query.message.reply_text("\n".join(lines), parse_mode="Markdown")


async def process_address_list(update: Update, raw_items: List[Dict[str, Any]]):
    total = len(raw_items)
    if total == 0:
        await update.message.reply_text(
            "⚠️ *No Valid Address Records Found*\n\n"
            "Please provide a JSON with address fields like `name`, `phone`, `house`, `city`, and `pincode`.\n"
            "Type /sample to get a working template.",
            parse_mode="Markdown"
        )
        return

    status_msg = await update.message.reply_text(
        f"🔍 *Analyzing {total} record(s)...*\nValidating delivery fields, checking postal codes, and scanning for duplicate phones...",
        parse_mode="Markdown"
    )

    records, valid_count, dup_count = meesho_api.parse_and_validate_addresses(raw_items)
    invalid_count = total - valid_count - dup_count

    # Build summary report
    report_lines = [
        f"📊 *Address Validation Summary ({total} Records)*:\n",
        f"• ✅ **Valid & Ready:** {valid_count}",
        f"• ⚠️ **Incomplete / Missing Fields:** {invalid_count}",
        f"• 🧹 **Duplicate Contacts:** {dup_count}",
        "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    ]

    # Show first 5 records preview
    report_lines.append("📋 *Records Preview:*")
    for r in records[:5]:
        status_icon = "✅" if r["is_valid"] and not r["is_duplicate"] else ("🧹" if r["is_duplicate"] else "⚠️")
        note = f" ({r['duplicate_reason']})" if r["is_duplicate"] else (
            f" (Missing: {', '.join(r['missing_fields'])})" if not r["is_valid"] else ""
        )
        report_lines.append(
            f"{status_icon} *#{r['index']} {r['name'] or 'Unnamed'}* — `{r['phone'] or 'No phone'}`\n"
            f"   {r['house']} {r['road']}, {r['city']} {r['pincode']}{note}"
        )

    if total > 5:
        report_lines.append(f"\n_... and {total - 5} more record(s) included in export files below._")

    await status_msg.edit_text("\n".join(report_lines), parse_mode="Markdown")

    # Generate and deliver clean CSV and JSON
    try:
        csv_data = meesho_api.export_to_csv(records).encode("utf-8")
        json_data = meesho_api.export_to_json(records).encode("utf-8")

        await update.message.reply_document(
            InputFile(BytesIO(csv_data), filename="meesho_addresses_cleaned.csv"),
            caption="📄 *Cleaned CSV Export* (Ready for Excel / Sheets)"
        )
        await update.message.reply_document(
            InputFile(BytesIO(json_data), filename="meesho_addresses_cleaned.json"),
            caption="📦 *Standardized JSON Export*"
        )
    except Exception as e:
        log.error(f"Error sending export documents: {e}")


async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    doc = update.message.document
    if not doc:
        return
    if doc.file_size and doc.file_size > MAX_FILE_BYTES:
        await update.message.reply_text("⚠️ File too large. Maximum supported file size is 5 MB.")
        return

    try:
        remote_file = await context.bot.get_file(doc.file_id)
        data = await remote_file.download_as_bytearray()
        text = data.decode("utf-8-sig", errors="replace")
        addresses = extract_address_objects(text)
        await process_address_list(update, addresses)
    except Exception as exc:
        await update.message.reply_text(f"❌ Error processing file: {exc}")


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (update.message.text or "").strip()
    if text.startswith("/"):
        return

    # Quick keyboard button taps
    if text in ["🚀 Open Address Manager", "🚀 Launch Address Manager"]:
        await app_command(update, context)
        return
    elif text == "📖 How It Works":
        await help_command(update, context)
        return
    elif text == "📥 Sample JSON Template":
        await sample_command(update, context)
        return
    elif text == "🌐 Connected App URL":
        await url_command(update, context)
        return

    # Check if user pasted a URL
    if (
        text.startswith("http://")
        or text.startswith("https://")
        or ".vercel.app" in text
        or ".onrender.com" in text
    ):
        urls = normalize_app_urls(text)
        context.user_data["custom_app_urls"] = urls
        await update.message.reply_text(
            f"✅ *App URL Connected Successfully!*\n\nConnected: `{urls['base']}`",
            parse_mode="Markdown",
            reply_markup=get_app_inline_keyboard(urls)
        )
        return

    # Check if user pasted a token to inspect locally
    if "eyJ" in text and len(text) > 80 and not text.startswith("{"):
        inspection = meesho_api.inspect_session_token_locally(text)
        await update.message.reply_text(
            f"🔍 *Local Token Inspection Result:*\n\n"
            f"• **User ID:** `{inspection.get('user_id') or 'N/A'}`\n"
            f"• **Country:** `{inspection.get('country_code') or 'IN'}`\n"
            f"• **Token Hash:** `{inspection.get('token_preview')}`\n"
            f"• **Status:** Local inspection only. Meesho does not provide a public developer API for automated account changes.",
            parse_mode="Markdown"
        )
        return

    # Otherwise treat as address data
    addresses = extract_address_objects(text)
    if addresses:
        await process_address_list(update, addresses)
    else:
        active_urls = context.user_data.get("custom_app_urls") or APP_URLS
        await update.message.reply_text(
            "📦 *Meesho Address Manager:*\n\n"
            "• **Send a JSON file or paste address text** to inspect, validate, and export clean records.\n"
            "• **Or paste your Vercel URL** to link your web deployment.\n"
            "• **Or launch the Mini App** below for full visual management!",
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
        "✅ *Address Received from Mini App*\n\n"
        f"• **Name:** `{name}`\n"
        f"• **Phone:** `{phone}`\n"
        f"• **City & State:** `{city}, {state}`\n"
        f"• **Pincode:** `{pincode}`\n\n"
        "Address received and validated successfully!",
        parse_mode="Markdown",
    )


async def post_init(application: Application):
    """Register slash commands in Telegram menu automatically."""
    commands = [
        BotCommand("start", "Open Address Manager & launch Mini App"),
        BotCommand("app", "Open interactive Telegram Mini App"),
        BotCommand("help", "Address validation guide & manual return trick"),
        BotCommand("sample", "Download sample address template JSON"),
        BotCommand("url", "Check currently connected App URL"),
        BotCommand("seturl", "Connect your Vercel or Render deployment URL"),
    ]
    try:
        await application.bot.set_my_commands(commands)
        log.info("Registered Telegram Bot commands in slash menu successfully.")
    except Exception as e:
        log.warning(f"Could not register commands: {e}")


def main():
    if not TOKEN:
        print("Notice: TELEGRAM_BOT_TOKEN not configured in environment.")
        print("Please configure TELEGRAM_BOT_TOKEN in your .env or hosting environment.")
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

    print(f"Meesho Address Manager Bot is running... (App URL: {APP_URLS['base']})")
    app.run_polling()


if __name__ == "__main__":
    main()
