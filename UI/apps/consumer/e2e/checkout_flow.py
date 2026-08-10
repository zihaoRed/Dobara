"""E2E acceptance: login → buy → confirm order → pay → order detail."""
from __future__ import annotations

import os
import sys
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("CONSUMER_BASE", "http://localhost:3010/consumer")
DEMO_IMEI = "350000000000001"


def login(page):
    page.goto(f"{BASE}/login", wait_until="domcontentloaded")
    page.get_by_test_id("login-phone").wait_for(timeout=20000)
    page.get_by_test_id("login-phone").fill("9876543210")
    page.get_by_test_id("send-otp").click()
    page.get_by_test_id("login-otp").wait_for(timeout=10000)
    page.get_by_test_id("login-otp").fill("123456")
    page.get_by_test_id("verify-otp").click()
    page.wait_for_url("**/home**", timeout=20000)


def run():
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.set_default_timeout(20000)

        # 1) Login
        try:
            login(page)
            print("PASS login")
        except Exception as e:
            failures.append(f"login: {e}")
            print(f"FAIL login: {e}")
            page.screenshot(path="e2e-fail-login.png", full_page=True)

        # 2) Buy → order confirm (availability check, no early lock)
        try:
            page.goto(f"{BASE}/buy/product/{DEMO_IMEI}", wait_until="domcontentloaded")
            page.get_by_test_id("buy-now").wait_for(timeout=20000)
            page.get_by_test_id("buy-now").click()
            page.wait_for_url("**/order", timeout=20000)
            expect(page.get_by_test_id("order-confirm-title")).to_be_visible()
            expect(page.get_by_test_id("pincode-status")).to_contain_text("Deliverable", timeout=15000)
            print("PASS order confirm (no early lock)")
        except Exception as e:
            failures.append(f"order_confirm: {e}")
            print(f"FAIL order_confirm: {e}")
            page.screenshot(path="e2e-fail-confirm.png", full_page=True)

        # 3) Unserviceable address blocks submit
        try:
            page.get_by_test_id("address-addr-bad").click()
            page.wait_for_timeout(1000)
            expect(page.get_by_test_id("submit-order")).to_be_disabled()
            expect(page.get_by_test_id("pincode-status")).to_contain_text("not serviceable", timeout=8000)
            page.get_by_test_id("address-addr-1").click()
            page.wait_for_timeout(1000)
            expect(page.get_by_test_id("submit-order")).to_be_enabled(timeout=8000)
            print("PASS pincode serviceability gate")
        except Exception as e:
            failures.append(f"pincode: {e}")
            print(f"FAIL pincode: {e}")
            page.screenshot(path="e2e-fail-pincode.png", full_page=True)

        # 4) Submit → pay → success → detail
        try:
            page.get_by_test_id("submit-order").click()
            page.wait_for_url("**/order/pay/**", timeout=20000)
            expect(page.get_by_test_id("payment-title")).to_be_visible()
            page.get_by_test_id("pay-success").click()
            page.wait_for_url("**/order/success/**", timeout=20000)
            expect(page.get_by_test_id("order-success")).to_be_visible()
            page.get_by_test_id("view-order-detail").click()
            page.wait_for_url("**/account/orders/**", timeout=20000)
            expect(page.get_by_test_id("order-detail")).to_be_visible()
            print("PASS checkout → payment → order detail")
        except Exception as e:
            failures.append(f"checkout: {e}")
            print(f"FAIL checkout: {e}")
            page.screenshot(path="e2e-fail-checkout.png", full_page=True)

        # 5) Quote accept flow
        try:
            page.goto(f"{BASE}/sell/report/sess-demo-1", wait_until="domcontentloaded")
            expect(page.get_by_test_id("inspection-report")).to_be_visible(timeout=20000)
            page.get_by_test_id("accept-quote").click()
            page.get_by_test_id("confirm-accept-quote").click()
            page.wait_for_url("**/accepted", timeout=20000)
            expect(page.get_by_test_id("quote-accepted")).to_be_visible()
            print("PASS quote accept with confirm")
        except Exception as e:
            failures.append(f"quote: {e}")
            print(f"FAIL quote: {e}")
            page.screenshot(path="e2e-fail-quote.png", full_page=True)

        browser.close()

    if failures:
        print("\n=== ACCEPTANCE FAILED ===")
        for f in failures:
            print("-", f)
        sys.exit(1)
    print("\n=== ALL ACCEPTANCE CHECKS PASSED ===")
    sys.exit(0)


if __name__ == "__main__":
    run()
