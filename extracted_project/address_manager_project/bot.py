import logging
import os
from io import BytesIO
from dotenv import load_dotenv
from telegram import Update, InputFile
from telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes, filters
from address_manager import parse_json_text, validate_record, export_json, export_csv, blank_template

load_dotenv()
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
MAX_FILE_BYTES = 1_000_000
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("address-manager")

def get_records(context: ContextTypes.DEFAULT_TYPE):
    return context.user_data.setdefault("records", [])

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "📒 Address Manager\n\n"
        "Send a JSON file containing address records. I’ll preview each record and report validation issues.\n\n"
        "Commands:\n/template — blank JSON template\n/export_json — export imported records as JSON\n"
        "/export_csv — export imported records as CSV\n/clear — clear records in memory\n\n"
        "Privacy: records are kept only in this bot process's memory. Don’t send passwords, OTPs, cookies, tokens, or session data. "
        "This bot does not edit Meesho or any other account."
    )

async def template(update: Update, context: ContextTypes.DEFAULT_TYPE):
    data = blank_template().encode("utf-8")
    await update.message.reply_document(InputFile(BytesIO(data), filename="address-template.json"),
                                       caption="Fill in address fields only. Phone and pincode should be strings.")

async def receive_json(update: Update, context: ContextTypes.DEFAULT_TYPE):
    doc = update.message.document
    if not doc:
        return
    if doc.file_size and doc.file_size > MAX_FILE_BYTES:
        await update.message.reply_text("File too large. Maximum JSON file size is 1 MB.")
        return
    if not (doc.file_name or "").lower().endswith(".json"):
        await update.message.reply_text("Please send a .json document. Other file types aren’t accepted.")
        return
    try:
        remote = await context.bot.get_file(doc.file_id)
        payload = await remote.download_as_bytearray()
        if len(payload) > MAX_FILE_BYTES:
            await update.message.reply_text("File too large. Maximum JSON file size is 1 MB.")
            return
        records = parse_json_text(payload.decode("utf-8-sig"))
    except (ValueError, UnicodeDecodeError) as exc:
        await update.message.reply_text(f"Couldn’t import file: {exc}")
        return
    context.user_data["records"] = records
    lines = [f"📋 Imported {len(records)} record(s). Preview:"]
    for i, record in enumerate(records, 1):
        errors = validate_record(record)
        lines.append(
            f"\n{i}. {record.get('name','(no name)')}\n"
            f"Phone: {record.get('number','')}\n"
            f"Address: {record.get('address','')}\n"
            f"{record.get('city','')}, {record.get('state','')} {record.get('pincode','')}\n"
            f"Validation: {'✅ Looks valid' if not errors else '⚠️ ' + '; '.join(errors)}"
        )
        if len("\n".join(lines)) > 3500:
            lines.append("\n…Preview shortened. Export to inspect all records.")
            break
    lines.append("\n\nUse /export_json or /export_csv to download. Check every record yourself before use.")
    await update.message.reply_text("\n".join(lines))

async def export_file(update: Update, context: ContextTypes.DEFAULT_TYPE, kind: str):
    records = get_records(context)
    if not records:
        await update.message.reply_text("No records loaded yet. Send a JSON file first.")
        return
    # Export only address data. Never include credential-like keys.
    if kind == "json":
        content, filename = export_json(records), "addresses.json"
    else:
        content, filename = export_csv(records), "addresses.csv"
    await update.message.reply_document(
        InputFile(BytesIO(content.encode("utf-8-sig")), filename=filename),
        caption=f"Exported {len(records)} record(s). Review the file before using it."
    )

async def export_json_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await export_file(update, context, "json")

async def export_csv_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await export_file(update, context, "csv")

async def clear(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.pop("records", None)
    await update.message.reply_text("🧹 Cleared the records held for this Telegram user in bot memory.")

def main():
    if not TOKEN or TOKEN == "put_your_botfather_token_here":
        raise SystemExit("Set TELEGRAM_BOT_TOKEN in your .env file or environment.")
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("template", template))
    app.add_handler(CommandHandler("export_json", export_json_cmd))
    app.add_handler(CommandHandler("export_csv", export_csv_cmd))
    app.add_handler(CommandHandler("clear", clear))
    app.add_handler(MessageHandler(filters.Document.ALL, receive_json))
    log.info("Address Manager bot starting")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
