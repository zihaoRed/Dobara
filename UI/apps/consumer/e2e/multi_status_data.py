"""Verify seeded multi-status orders / after-sales / recycle lists."""
from __future__ import annotations

import os
import re
import sys
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("CONSUMER_BASE", "http://localhost:3010/consumer")

BUY_IDS = ["ORD-PENDING", "ORD-001", "ORD-SHIP", "ORD-DONE", "ORD-CANCEL", "ORD-AS", "ORD-RET"]
AS_IDS = ["AS-PENDING", "AS-APPROVED", "AS-RETURNING", "AS-REJECTED", "AS-REFUNDED"]
RCY_IDS = ["RCY-INSPECT", "RCY-CONFIRM", "RCY-DONE", "RCY-REJECT"]


def login(page):
    page.goto(f"{BASE}/login", wait_until="domcontentloaded")
    page.get_by_test_id("login-phone").fill("9876543210")
    page.get_by_test_id("send-otp").click()
    page.get_by_test_id("login-otp").wait_for()
    page.get_by_test_id("login-otp").fill("123456")
    page.get_by_test_id("verify-otp").click()
    page.wait_for_url("**/home**", timeout=20000)


def run():
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.set_default_timeout(20000)
        login(page)

        # Purchase orders — all statuses
        try:
            page.goto(f"{BASE}/account/orders", wait_until="domcontentloaded")
            expect(page.get_by_test_id("order-list")).to_be_visible(timeout=15000)
            for oid in BUY_IDS:
                expect(page.get_by_test_id(f"order-card-{oid}")).to_be_visible(timeout=8000)
            # filter pending
            page.get_by_role("button", name="Pending", exact=True).click()
            expect(page.get_by_test_id("order-card-ORD-PENDING")).to_be_visible()
            expect(page.get_by_test_id("order-card-ORD-001")).to_have_count(0)
            page.get_by_role("button", name="All", exact=True).click()
            # open shipped detail
            page.get_by_test_id("order-card-ORD-SHIP").click()
            expect(page.get_by_test_id("order-detail")).to_be_visible()
            expect(page.get_by_text("TRKSHIP8821")).to_be_visible()
            print("PASS buy orders multi-status")
        except Exception as e:
            failures.append(f"buy: {e}")
            print(f"FAIL buy: {e}")
            page.screenshot(path="e2e-fail-multistatus-buy.png", full_page=True)

        # Recycling tab
        try:
            page.goto(f"{BASE}/account/orders", wait_until="domcontentloaded")
            page.get_by_role("button", name=re.compile(r"Recycling")).click()
            for rid in RCY_IDS:
                expect(page.get_by_test_id(f"recycle-card-{rid}")).to_be_visible(timeout=8000)
            page.get_by_role("button", name="Rejected", exact=True).click()
            expect(page.get_by_test_id("recycle-card-RCY-REJECT")).to_be_visible()
            expect(page.get_by_test_id("recycle-card-RCY-DONE")).to_have_count(0)
            print("PASS recycle orders multi-status")
        except Exception as e:
            failures.append(f"recycle: {e}")
            print(f"FAIL recycle: {e}")
            page.screenshot(path="e2e-fail-multistatus-recycle.png", full_page=True)

        # After-sales
        try:
            page.goto(f"{BASE}/account/after-sales", wait_until="domcontentloaded")
            expect(page.get_by_test_id("aftersale-list")).to_be_visible()
            for aid in AS_IDS:
                expect(page.get_by_test_id(f"aftersale-card-{aid}")).to_be_visible(timeout=8000)
            page.get_by_role("button", name="Refunded", exact=True).click()
            expect(page.get_by_test_id("aftersale-card-AS-REFUNDED")).to_be_visible()
            page.get_by_test_id("aftersale-card-AS-REFUNDED").click()
            expect(page.get_by_test_id("aftersale-detail")).to_be_visible()
            print("PASS after-sales multi-status")
        except Exception as e:
            failures.append(f"aftersale: {e}")
            print(f"FAIL aftersale: {e}")
            page.screenshot(path="e2e-fail-multistatus-as.png", full_page=True)

        browser.close()

    if failures:
        print("\n=== MULTI-STATUS DATA FAILED ===")
        for f in failures:
            print("-", f)
        sys.exit(1)
    print("\n=== MULTI-STATUS DATA PASSED ===")
    sys.exit(0)


if __name__ == "__main__":
    run()
