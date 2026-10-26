"""Validation and import/export helpers for ordinary address records."""
import csv
import io
import json
import re
from typing import Any

REQUIRED_FIELDS = ("name", "number", "pincode", "address", "city", "state")
ALIASES = {
    "full_name": "name",
    "phone": "number",
    "mobile": "number",
    "mobile_number": "number",
    "postal_code": "pincode",
    "zip": "pincode",
    "zipcode": "pincode",
    "street": "address",
    "address_line": "address",
}
FORBIDDEN_KEY_PARTS = (
    "password", "passwd", "secret", "token", "cookie", "session",
    "authorization", "auth_header", "otp", "api_key", "apikey",
    "private_key", "credential", "login"
)

def normalize_record(record: dict[str, Any]) -> dict[str, Any]:
    normalized: dict[str, Any] = {}
    for key, value in record.items():
        if not isinstance(key, str):
            continue
        clean_key = key.strip().lower().replace(" ", "_").replace("-", "_")
        clean_key = ALIASES.get(clean_key, clean_key)
        normalized[clean_key] = value if value is not None else ""
    return normalized

def sensitive_keys(record: dict[str, Any]) -> list[str]:
    found = []
    for key in record:
        lowered = str(key).lower().replace("-", "_")
        if any(part in lowered for part in FORBIDDEN_KEY_PARTS):
            found.append(str(key))
    return found

def parse_json_text(text: str) -> list[dict[str, Any]]:
    try:
        raw = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON: {exc.msg} at line {exc.lineno}, column {exc.colno}") from exc
    if isinstance(raw, dict):
        raw = raw.get("addresses", [raw])
    if not isinstance(raw, list):
        raise ValueError("JSON must be a list of address objects or an object with an 'addresses' list.")
    if not raw:
        raise ValueError("The JSON file contains no records.")
    if len(raw) > 500:
        raise ValueError("Maximum 500 records per import.")
    results = []
    for index, item in enumerate(raw, start=1):
        if not isinstance(item, dict):
            raise ValueError(f"Record {index} is not an object.")
        bad = sensitive_keys(item)
        if bad:
            raise ValueError(f"Record {index} contains credential-like field(s): {', '.join(bad)}. Remove them and import address fields only.")
        results.append(normalize_record(item))
    return results

def validate_record(record: dict[str, Any]) -> list[str]:
    errors = []
    for field in REQUIRED_FIELDS:
        value = record.get(field, "")
        if not isinstance(value, (str, int, float)) or not str(value).strip():
            errors.append(f"Missing {field}")
    number = str(record.get("number", "")).strip()
    if number and not re.fullmatch(r"\+?[0-9 ()-]{7,20}", number):
        errors.append("Number should contain only digits, spaces, +, parentheses, or hyphens (7–20 characters)")
    pincode = str(record.get("pincode", "")).strip()
    if pincode and not re.fullmatch(r"[0-9]{6}", pincode):
        errors.append("Pincode should be exactly 6 digits")
    for field in REQUIRED_FIELDS:
        value = record.get(field, "")
        if isinstance(value, str) and len(value) > 300:
            errors.append(f"{field} is too long (max 300 characters)")
    return errors

def export_json(records: list[dict[str, Any]]) -> str:
    return json.dumps(records, ensure_ascii=False, indent=2)

def export_csv(records: list[dict[str, Any]]) -> str:
    fields = list(dict.fromkeys(k for row in records for k in row.keys()))
    if not fields:
        fields = list(REQUIRED_FIELDS)
    buffer = io.StringIO(newline="")
    writer = csv.DictWriter(buffer, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for row in records:
        writer.writerow({k: row.get(k, "") for k in fields})
    return buffer.getvalue()

def blank_template() -> str:
    return json.dumps([{"name":"","number":"","pincode":"","address":"","city":"","state":""}], indent=2)
