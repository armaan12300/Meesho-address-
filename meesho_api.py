"""
Meesho Address Manager — Core Data & Address Engine
---------------------------------------------------
A secure, honest utility for validating, sanitizing, deduplicating,
and exporting Meesho delivery address records (JSON & CSV).

Design & Security Principles:
- NEVER fabricates fake server-side success responses or order mutations.
- Distinguishes local JWT decoding from server-verified authentication.
- Never logs or exposes raw tokens, secrets, or cookies.
- Focuses on user-controlled data management: preview, validation, editing, deduplication, and export.
"""

import base64
import csv
import json
import logging
import re
from io import StringIO
from typing import Dict, Any, List, Optional, Tuple

log = logging.getLogger("meesho-address-engine")

# Default Indian dummy address generator for privacy masking
DUMMY_NAMES = ["Aaaa", "R. K. Verma", "P. Kumar", "S. Gupta", "A. Sharma"]
DUMMY_STREETS = ["abcd", "House 42, Block B", "Flat 101, Galaxy Heights", "Plot 99, Industrial Area"]
DUMMY_ROADS = ["edghi", "Near Old Metro Station", "Ring Road Bypass", "Sector 9 Colony"]
DUMMY_CITIES = [
    {"city": "Delhi", "state": "Delhi", "pincode": "110001"},
    {"city": "Mumbai", "state": "Maharashtra", "pincode": "400001"},
    {"city": "Bengaluru", "state": "Karnataka", "pincode": "560001"},
    {"city": "Kolkata", "state": "West Bengal", "pincode": "700001"},
    {"city": "Hyderabad", "state": "Telangana", "pincode": "500001"},
]


def mask_token(token: Optional[str]) -> str:
    """Safely masks a token for preview without leaking secrets."""
    if not token or not isinstance(token, str):
        return ""
    token = token.strip()
    if len(token) <= 12:
        return "***"
    return f"{token[:6]}...{token[-4:]}"


def inspect_session_token_locally(token_str: str) -> Dict[str, Any]:
    """
    Safely inspects JWT or composite token claims locally WITHOUT making
    unverified server claims.
    """
    if not token_str or not isinstance(token_str, str):
        return {"has_token": False, "status": "no_token_provided"}

    token_str = token_str.strip()
    inner_jwt = ""
    xo_hash = ""

    # Check for Meesho composite format (base64(header).base64(body))
    if "." in token_str:
        parts = token_str.split(".")
        try:
            p2 = parts[1]
            p2 += "=" * ((4 - len(p2) % 4) % 4)
            decoded_json = json.loads(base64.b64decode(p2).decode("utf-8", errors="ignore"))
            if isinstance(decoded_json, dict):
                inner_jwt = decoded_json.get("jwt", "")
                xo_hash = decoded_json.get("xo", "")
        except Exception:
            pass

    target_jwt = inner_jwt if inner_jwt else token_str
    claims: Dict[str, Any] = {}

    if "." in target_jwt:
        jwt_parts = target_jwt.split(".")
        if len(jwt_parts) >= 2:
            try:
                payload_b64 = jwt_parts[1]
                payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
                claims = json.loads(base64.b64decode(payload_b64).decode("utf-8", errors="ignore"))
            except Exception:
                pass

    user_id = str(claims.get("https://meesho.com/user_id") or claims.get("user_id") or claims.get("sub") or "")
    instance_id = str(claims.get("https://meesho.com/instance_id") or claims.get("instance_id") or "")
    country_code = str(claims.get("https://meesho.com/iso_country_code") or "IN")

    return {
        "has_token": True,
        "token_preview": mask_token(token_str),
        "user_id": user_id,
        "instance_id_preview": mask_token(instance_id) if instance_id else "",
        "country_code": country_code,
        "claims_extracted": bool(claims),
        "verification_status": "unverified_local_token",
        "notice": (
            "Local token inspection only. Meesho does not provide a public developer API, "
            "so server-side authentication cannot be verified programmatically without mobile APK credentials."
        )
    }


def validate_address_record(raw: Any, index: int = 1) -> Dict[str, Any]:
    """
    Validates a single address record.
    Checks for essential delivery fields: name, phone, address/house, city, state, pincode.
    """
    if not isinstance(raw, dict):
        return {
            "id": f"rec_{index}",
            "index": index,
            "name": "Invalid Record",
            "phone": "",
            "house": "",
            "road": "",
            "city": "",
            "state": "",
            "pincode": "",
            "is_valid": False,
            "missing_fields": ["record_is_not_a_json_object"],
            "raw": str(raw)
        }

    # Extract flexible field names
    name = str(raw.get("name") or raw.get("recipient_name") or raw.get("fullName") or raw.get("customer_name") or "").strip()
    phone = str(raw.get("phone") or raw.get("mobile") or raw.get("number") or raw.get("contact_number") or raw.get("phoneNumber") or "").strip()
    house = str(raw.get("house") or raw.get("house_no") or raw.get("address") or raw.get("building") or raw.get("flat") or "").strip()
    road = str(raw.get("road") or raw.get("road_name") or raw.get("colony") or raw.get("area") or raw.get("locality") or raw.get("street") or "").strip()
    city = str(raw.get("city") or raw.get("town") or "").strip()
    state = str(raw.get("state") or raw.get("region") or "").strip()
    pincode = str(raw.get("pincode") or raw.get("pin") or raw.get("postal_code") or raw.get("zip") or "").strip()

    missing: List[str] = []
    if not name:
        missing.append("name")
    if not phone:
        missing.append("phone")
    if not house and not road:
        missing.append("address_or_street")
    if not city:
        missing.append("city")
    if not pincode:
        missing.append("pincode")

    # Indian pincode format check (6 digits)
    pincode_clean = re.sub(r"[^0-9]", "", pincode)
    is_pincode_valid = len(pincode_clean) == 6 if pincode else False
    if pincode and not is_pincode_valid:
        missing.append("pincode_must_be_6_digits")

    is_valid = len(missing) == 0

    return {
        "id": f"rec_{index}_{hash((name, phone, house, pincode)) & 0xffffffff}",
        "index": index,
        "name": name,
        "phone": phone,
        "house": house,
        "road": road,
        "city": city,
        "state": state,
        "pincode": pincode,
        "is_valid": is_valid,
        "missing_fields": missing,
        "raw": raw
    }


def parse_and_validate_addresses(raw_list: List[Any]) -> Tuple[List[Dict[str, Any]], int, int]:
    """
    Parses a list of address dictionaries, validates each, and marks duplicates.
    Returns (validated_records, valid_count, duplicate_count).
    """
    phone_map: Dict[str, int] = {}
    validated_records: List[Dict[str, Any]] = []
    duplicate_count = 0
    valid_count = 0

    for idx, item in enumerate(raw_list, 1):
        record = validate_address_record(item, index=idx)

        # Clean phone for duplicate matching
        phone_digits = re.sub(r"[^0-9]", "", record["phone"])
        is_dup = False
        dup_reason = ""

        if len(phone_digits) >= 10:
            last10 = phone_digits[-10:]
            if last10 in phone_map:
                is_dup = True
                duplicate_count += 1
                dup_reason = f"Matches phone with Record #{phone_map[last10]}"
            else:
                phone_map[last10] = idx

        record["is_duplicate"] = is_dup
        record["duplicate_reason"] = dup_reason

        if record["is_valid"] and not is_dup:
            valid_count += 1

        validated_records.append(record)

    return validated_records, valid_count, duplicate_count


def generate_dummy_mask() -> Dict[str, str]:
    """Generates a safe placeholder Indian address for privacy masking."""
    city_info = random.choice(DUMMY_CITIES)
    rand_phone = f"+91 {random.randint(6000000000, 9999999999)}"
    return {
        "name": random.choice(DUMMY_NAMES),
        "phone": rand_phone,
        "house": random.choice(DUMMY_STREETS),
        "road": random.choice(DUMMY_ROADS),
        "city": city_info["city"],
        "state": city_info["state"],
        "pincode": city_info["pincode"],
        "is_mask": "true"
    }


def export_to_csv(records: List[Dict[str, Any]]) -> str:
    """Exports validated records to a clean CSV string."""
    output = StringIO()
    fieldnames = ["Index", "Status", "Name", "Phone", "House_Building", "Road_Colony", "City", "State", "Pincode", "Notes"]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for r in records:
        status_label = "VALID" if r.get("is_valid") and not r.get("is_duplicate") else (
            "DUPLICATE" if r.get("is_duplicate") else "INCOMPLETE"
        )
        notes = r.get("duplicate_reason") or (", ".join(r.get("missing_fields", []))) or "OK"
        writer.writerow({
            "Index": r.get("index", 1),
            "Status": status_label,
            "Name": r.get("name", ""),
            "Phone": r.get("phone", ""),
            "House_Building": r.get("house", ""),
            "Road_Colony": r.get("road", ""),
            "City": r.get("city", ""),
            "State": r.get("state", ""),
            "Pincode": r.get("pincode", ""),
            "Notes": notes
        })

    return output.getvalue()


def export_to_json(records: List[Dict[str, Any]]) -> str:
    """Exports clean, sanitized records as formatted JSON."""
    clean_list = []
    for r in records:
        clean_list.append({
            "name": r.get("name", ""),
            "phone": r.get("phone", ""),
            "house_building": r.get("house", ""),
            "road_area": r.get("road", ""),
            "city": r.get("city", ""),
            "state": r.get("state", ""),
            "pincode": r.get("pincode", ""),
            "is_valid": r.get("is_valid", False),
            "is_duplicate": r.get("is_duplicate", False)
        })
    return json.dumps({"exported_at": "UTC", "total_records": len(clean_list), "addresses": clean_list}, indent=2)


def get_sample_demo_records() -> List[Dict[str, Any]]:
    """Returns sample records explicitly labeled as simulated demo data."""
    return [
        {
            "name": "Amit Sharma",
            "phone": "+91 6221468377",
            "house": "50, Radha Duplex",
            "road": "Vijayanagar, Gandhi Chowk",
            "city": "Mysuru",
            "state": "Karnataka",
            "pincode": "570008",
            "is_demo": True
        },
        {
            "name": "Pooja Verma",
            "phone": "+91 9876543210",
            "house": "Flat 304, Green Palms",
            "road": "Ring Road Sector 4",
            "city": "Delhi",
            "state": "Delhi",
            "pincode": "110001",
            "is_demo": True
        },
        {
            "name": "Rahul Kumar",
            "phone": "+91 9876543210",  # Intended duplicate phone for testing
            "house": "House 12",
            "road": "Station Road",
            "city": "Delhi",
            "state": "Delhi",
            "pincode": "110001",
            "is_demo": True
        },
        {
            "name": "Incomplete Record",
            "phone": "+91 9123456789",
            "house": "Shop 4",
            "road": "Main Bazaar",
            "city": "",
            "state": "Rajasthan",
            "pincode": "99",  # Invalid pincode
            "is_demo": True
        }
    ]
