"""E2E: clerk login → OTP → decision (pre-photo gate) → photos/video → inspect → hardware → invoice skip → report.
Also reject path from decision.
"""
from __future__ import annotations

import os
import sys
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("TABLET_BASE", "http://localhost:3002/tablet")


def clerk_login(page):
    page.goto(f"{BASE}/login", wait_until="domcontentloaded")
    page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
    page.reload(wait_until="domcontentloaded")
    page.get_by_test_id("clerk-login").wait_for(timeout=15000)
    page.get_by_test_id("clerk-phone").fill("9876543210")
    page.get_by_test_id("clerk-send-otp").click()
    page.get_by_test_id("clerk-otp").wait_for()
    page.get_by_test_id("clerk-otp").fill("123456")
    page.get_by_test_id("clerk-verify-otp").click()
    page.get_by_test_id("store-home").wait_for(timeout=15000)
    # dismiss resume if any
    discard = page.get_by_test_id("discard-resume")
    if discard.count() and discard.is_visible():
        discard.click()
        page.get_by_test_id("store-home").wait_for()


def customer_otp(page):
    page.get_by_test_id("start-session").click()
    page.get_by_test_id("customer-phone").fill("9876543210")
    page.get_by_test_id("send-customer-otp").click()
    page.get_by_test_id("customer-otp").fill("123456")
    page.get_by_test_id("verify-customer-otp").click()
    page.get_by_test_id("session-detail").wait_for(timeout=15000)
    expect(page.get_by_test_id("appointment-card")).to_be_visible()


def through_appearance(page):
    page.get_by_test_id("start-inspection").click()
    # Appearance review is the FIRST step — reject gate before any capture
    page.get_by_test_id("appearance-decision").wait_for()
    page.get_by_test_id("continue-inspect").click()
    page.get_by_test_id("photo-capture").wait_for()
    page.get_by_test_id("demo-fill-photos").click()
    page.get_by_test_id("photos-continue").click()
    page.get_by_test_id("video-capture").wait_for()
    page.get_by_test_id("demo-fill-video").click()
    page.get_by_test_id("video-continue").click()
    page.get_by_test_id("admission-check").wait_for()


def run():
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1100, "height": 800})
        page.set_default_timeout(30000)

        try:
            clerk_login(page)
            customer_otp(page)
            through_appearance(page)

            # locked forward step should be disabled
            expect(page.get_by_test_id("nav-step-hardware")).to_be_disabled()

            # pass admission checks → defect checklist
            page.get_by_test_id("admission-continue").click()
            page.get_by_test_id("appearance-inspect").wait_for()
            # Checklist is optional — continue with zero selections triggers auto QC
            page.get_by_test_id("confirm-inspect").click()
            page.get_by_test_id("hardware-results").wait_for()
            page.get_by_test_id("hardware-continue").wait_for(state="visible", timeout=20000)
            # Color gate: walk-in (no appointment) → continue disabled until clerk confirms color
            page.get_by_test_id("color-confirm").wait_for()
            expect(page.get_by_test_id("hardware-continue")).to_be_disabled()
            page.get_by_test_id("color-option-midnight").click()
            # wait until enabled
            page.wait_for_function(
                "() => !document.querySelector('[data-testid=hardware-continue]')?.disabled",
                timeout=20000,
            )
            page.get_by_test_id("hardware-continue").click()

            # condition point-checks (repair/accessory/functional) — optional, continue
            page.get_by_test_id("condition-check").wait_for()
            page.get_by_test_id("condition-continue").click()

            # invoice skip via gate
            page.get_by_test_id("invoice-capture").wait_for()
            page.get_by_test_id("invoice-skip").click()
            page.get_by_test_id("data-submit").wait_for()
            expect(page.get_by_test_id("submit-session-id")).to_be_visible()
            page.get_by_test_id("tablet-report").wait_for(timeout=25000)
            expect(page.get_by_test_id("imei-masked")).to_contain_text("···")
            page.get_by_test_id("confirm-report").click()
            page.get_by_test_id("verification-status").wait_for()
            page.get_by_test_id("sim-verified").click()
            page.get_by_test_id("hand-to-db").click()
            print("PASS main inspection path")
        except Exception as e:
            failures.append(f"main: {e}")
            print(f"FAIL main: {e}")
            page.screenshot(path="e2e-fail-tablet-main.png", full_page=True)

        try:
            clerk_login(page)
            customer_otp(page)
            # Reject at the FIRST step — pre-photo gate, no capture effort spent
            page.get_by_test_id("start-inspection").click()
            page.get_by_test_id("appearance-decision").wait_for()
            page.get_by_test_id("go-reject").click()
            page.get_by_test_id("reject-device").wait_for()
            page.get_by_test_id("demo-fill-reject-photos").click()
            page.get_by_text("Screen severely cracked").click()
            page.get_by_test_id("confirm-reject").click()
            page.get_by_test_id("confirm-reject-final").click()
            page.get_by_test_id("reject-done").wait_for()
            page.get_by_test_id("reject-back-home").click()
            page.get_by_test_id("store-home").wait_for()
            print("PASS reject path")
        except Exception as e:
            failures.append(f"reject: {e}")
            print(f"FAIL reject: {e}")
            page.screenshot(path="e2e-fail-tablet-reject.png", full_page=True)

        browser.close()

    if failures:
        print("\n=== TABLET E2E FAILED ===")
        for f in failures:
            print("-", f)
        sys.exit(1)
    print("\n=== TABLET E2E PASSED ===")
    sys.exit(0)


if __name__ == "__main__":
    run()
