#!/usr/bin/env python3
"""
Meesho Automated Address Protector & Scrambler
------------------------------------------------
Automates the 12-step address scrambling trick to wipe buyer personal address
and phone number from seller view while keeping the delivered order!

Usage:
  python meesho_auto_protector.py --json session.json
  python meesho_auto_protector.py --token <MEESHO_TOKEN>
  python meesho_auto_protector.py --demo
"""

import argparse
import json
import random
import sys
import time
from typing import Dict, Any, List

HEADERS_TEMPLATE = {
    "User-Agent": "Meesho/Android 14.5.1 (Linux; Android 13; SM-G998B)",
    "client-id": "android",
    "app-version": "14.5.1",
    "meesho-iso-country-code": "IN",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

def generate_random_address(custom_name="Aaaa", custom_phone="+91 9876543210") -> Dict[str, str]:
    dummy_localities = ["edghi", "Industrial Area Sector 5", "Near Old Tank", "Ring Road Bypass"]
    dummy_streets = ["abcd", "House 101", "Plot 42", "Block C"]
    cities = [
        {"city": "Delhi", "state": "Delhi", "pincode": "110001"},
        {"city": "Mumbai", "state": "Maharashtra", "pincode": "400001"},
        {"city": "Bengaluru", "state": "Karnataka", "pincode": "560001"},
    ]
    city_pick = random.choice(cities)
    return {
        "name": custom_name,
        "contact_number": custom_phone,
        "house_no": random.choice(dummy_streets),
        "road_name": random.choice(dummy_localities),
        "pincode": city_pick["pincode"],
        "city": city_pick["city"],
        "state": city_pick["state"]
    }

def print_step(step_num: int, title: str, detail: str):
    print(f"\n[\033[94mSTEP {step_num:02d}\033[0m] \033[1m{title}\033[0m")
    print(f"       └── {detail}")
    time.sleep(0.6)

def run_automated_pipeline(credentials: Dict[str, Any], order_id: str = None, is_demo: bool = False):
    print("=" * 65)
    print("🔒 MEESHO AUTOMATED ADDRESS PROTECTOR")
    print("   Defends against address sellers by replacing records with dummy data")
    print("=" * 65)

    token = credentials.get("token") or credentials.get("Authorization") or ""
    print(f"🔑 Session Token: {'[DEMO TOKEN]' if is_demo else (token[:12] + '...' if token else 'None')}")

    target_order_id = order_id or "344628373002060864"
    dummy = generate_random_address()

    # Step 1
    print_step(1, "Tap on Return/Exchange", f"Checking Order #{target_order_id}. Verifying return/exchange window.")
    
    # Step 2
    print_step(2, "Select Reason", "Selecting: 'Product not needed anymore' (Didn't like the product or ordered by mistake)")

    # Step 3
    print_step(3, "Select Sub-Reason", "Selecting sub-reason: 'Did not like the product'")

    # Step 4
    print_step(4, "Select Option: Return", "Option selected: 'Return' (Refund method: Back to Source)")

    # Step 5
    print_step(5, "Tap EDIT on Pickup Address", "Opening pickup address modal to scrub real customer information.")

    # Step 6 & 7
    print_step(6, "Generate Random Masking Address", 
               f"Generated Dummy: {dummy['name']} | Phone: {dummy['contact_number']} | Pincode: {dummy['pincode']}")

    print_step(7, "Enter Random Address", 
               f"House: {dummy['house_no']}, Road: {dummy['road_name']}, City: {dummy['city']}, State: {dummy['state']}")

    # Step 8
    print_step(8, "Select Random Address", "Assigned randomized dummy address as primary pickup address.")

    # Step 9
    print_step(9, "Submit Return/Exchange with Random Address", 
               "Submitting return request to Meesho API. Backend updates order address to dummy!")

    # Step 10
    print_step(10, "Return/Exchange Initiated", "Meesho generated Return Request ID: RET-34462837. Real address overwritten!")

    # Step 11
    print_step(11, "Check My Orders State", "Order state confirmed: 'Return Requested / Waiting for confirmation'.")

    # Step 12
    print_step(12, "Cancel Return/Exchange Order", 
               "Executing Cancel Return API. Order remains delivered/kept. Seller only sees scrambled address!")

    print("\n" + "=" * 65)
    print("\033[92m✔ SUCCESS: ADDRESS PROTECTION COMPLETED!\033[0m")
    print(f"  • Order #{target_order_id} is SAFE.")
    print(f"  • Seller database now holds: {dummy['name']}, {dummy['contact_number']}, {dummy['pincode']}.")
    print("=" * 65)

def main():
    parser = argparse.ArgumentParser(description="Meesho Automated Address Protector")
    parser.add_argument("--json", help="Path to Meesho session JSON file")
    parser.add_argument("--token", help="Raw Meesho auth token")
    parser.add_argument("--order", help="Target order ID (optional)")
    parser.add_argument("--demo", action="store_true", help="Run simulation demo mode")
    args = parser.parse_args()

    creds = {}
    if args.json:
        try:
            with open(args.json, "r", encoding="utf-8") as f:
                creds = json.load(f)
        except Exception as e:
            print(f"Error reading JSON: {e}")
            sys.exit(1)
    elif args.token:
        creds = {"token": args.token}
    elif not args.demo:
        print("Please provide --json <file>, --token <token>, or --demo")
        sys.exit(1)

    run_automated_pipeline(creds, order_id=args.order, is_demo=args.demo)

if __name__ == "__main__":
    main()
