"""E2E: addresses, mall filters, after-sales, appointment store slot, help."""
from __future__ import annotations

import os
import re
import sys
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("CONSUMER_BASE", "http://localhost:3010/consumer")


def login(page):
    page.goto(f"{BASE}/login", wait_until="domcontentloaded")
    page.get_by_test_id("login-phone").wait_for(timeout=20000)
    page.get_by_test_id("login-phone").fill("9876543201")
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

        try:
            login(page)
            print("PASS login")
        except Exception as e:
            failures.append(f"login: {e}")
            print(f"FAIL login: {e}")

        # Addresses
        try:
            page.goto(f"{BASE}/account/addresses", wait_until="domcontentloaded")
            expect(page.get_by_test_id("address-list")).to_be_visible(timeout=15000)
            page.get_by_test_id("add-address").click()
            expect(page.get_by_test_id("address-form")).to_be_visible()
            page.get_by_test_id("addr-name").fill("E2E User")
            page.get_by_test_id("addr-phone").fill("9876501234")
            # State → City is a cascading select pair (city is disabled until a state is picked)
            page.get_by_test_id("addr-state").select_option("Maharashtra")
            page.get_by_test_id("addr-city").select_option("Mumbai")
            page.get_by_test_id("addr-line").fill("Test Lane 1")
            page.get_by_test_id("addr-pin").fill("400001")
            page.get_by_test_id("save-address").click()
            page.wait_for_timeout(800)
            expect(page.get_by_text("E2E User")).to_be_visible(timeout=8000)
            print("PASS address CRUD shell")
        except Exception as e:
            failures.append(f"address: {e}")
            print(f"FAIL address: {e}")
            page.screenshot(path="e2e-fail-address.png", full_page=True)

        # Mall filters + view toggle + APP-P0-10 search features
        try:
            page.goto(f"{BASE}/buy", wait_until="domcontentloaded")
            expect(page.get_by_test_id("mall-home")).to_be_visible(timeout=15000)

            # --- Multi-select filters (品牌/型号/成色/容量/颜色 all support multi-select) ---
            page.get_by_test_id("filter-toggle").click()
            expect(page.get_by_test_id("filter-panel")).to_be_visible()
            panel = page.get_by_test_id("filter-panel")
            panel.get_by_role("button", name="Apple", exact=True).click()
            panel.get_by_role("button", name="Samsung", exact=True).click()
            page.wait_for_timeout(700)
            chips = page.get_by_test_id("filter-chips")
            expect(chips.get_by_text("Apple")).to_be_visible()
            expect(chips.get_by_text("Samsung")).to_be_visible()
            # Removing one keeps the other — proves multi-select, not radio behaviour
            chips.get_by_text("Apple").first.click()
            page.wait_for_timeout(700)
            expect(page.get_by_test_id("filter-chips").get_by_text("Samsung")).to_be_visible()
            expect(page.get_by_test_id("filter-chips").get_by_text("Apple")).to_have_count(0)
            chips.get_by_text("Samsung").first.click()
            page.wait_for_timeout(500)

            # --- Similar devices when results are thin (< 3) ---
            panel.get_by_role("button", name="Blue Haze", exact=True).click()
            page.wait_for_timeout(900)
            expect(page.get_by_test_id("similar-devices")).to_be_visible(timeout=8000)
            print("PASS mall multi-select filters + similar devices")

            # --- View toggle ---
            page.get_by_test_id("filter-toggle").click()
            page.get_by_test_id("view-list").click()
            expect(page.get_by_test_id("device-grid")).to_be_visible()

            # --- Search history + trending panel (empty query, focused) ---
            box = page.get_by_role("textbox").first
            box.click()
            page.wait_for_timeout(600)
            expect(page.get_by_test_id("search-history-panel")).to_be_visible(timeout=8000)
            expect(page.get_by_test_id("search-hot")).to_be_visible()
            page.get_by_test_id("search-hot").get_by_role("button").first.click()
            page.wait_for_timeout(900)
            expect(box).to_have_value("iPhone 14")
            # Committed term is recorded — reopening shows it under Recent
            box.fill("")
            box.click()
            page.wait_for_timeout(600)
            expect(page.get_by_test_id("search-history")).to_be_visible(timeout=8000)
            expect(page.get_by_test_id("search-history").get_by_text("iPhone 14")).to_be_visible()

            # --- Spelling correction ---
            box.fill("iphon 14")
            page.wait_for_timeout(1000)
            expect(page.get_by_test_id("search-didyoumean")).to_be_visible(timeout=8000)
            page.get_by_test_id("search-didyoumean").click()
            page.wait_for_timeout(600)
            expect(box).to_have_value("iPhone 14")
            print("PASS mall search history / trending / spelling correction")

            # --- APP-P1-03 city picker: default nationwide → pick → banner clears ---
            page.goto(f"{BASE}/buy", wait_until="domcontentloaded")
            expect(page.get_by_test_id("mall-home")).to_be_visible(timeout=15000)
            expect(page.get_by_test_id("city-selector")).to_be_visible()
            # No city chosen yet → nationwide banner with a picker entry
            expect(page.get_by_test_id("city-banner")).to_be_visible(timeout=8000)
            page.get_by_test_id("city-selector").click()
            expect(page.get_by_test_id("city-picker")).to_be_visible()
            expect(page.get_by_test_id("city-row-national")).to_be_visible()
            expect(page.get_by_test_id("city-use-location")).to_be_visible()
            page.get_by_test_id("city-row-Mumbai").click()
            page.wait_for_timeout(600)
            expect(page.get_by_test_id("city-picker")).to_have_count(0)
            expect(page.get_by_test_id("city-selector")).to_contain_text("Mumbai")
            # A chosen city means same-city stock applies → banner is gone
            expect(page.get_by_test_id("city-banner")).to_have_count(0)
            print("PASS city picker / banner")
        except Exception as e:
            failures.append(f"mall: {e}")
            print(f"FAIL mall: {e}")
            page.screenshot(path="e2e-fail-mall.png", full_page=True)

        # Help center
        try:
            page.goto(f"{BASE}/account/help", wait_until="domcontentloaded")
            expect(page.get_by_test_id("help-center")).to_be_visible(timeout=15000)
            expect(page.get_by_text("Help Center")).to_be_visible()
            print("PASS help center")
        except Exception as e:
            failures.append(f"help: {e}")
            print(f"FAIL help: {e}")

        # After-sales apply
        try:
            page.goto(f"{BASE}/account/orders/ORD-001/after-sale", wait_until="domcontentloaded")
            expect(page.get_by_test_id("aftersale-apply")).to_be_visible(timeout=15000)
            page.get_by_test_id("add-photo").click()
            page.get_by_test_id("add-photo").click()
            page.get_by_test_id("submit-aftersale").click()
            page.wait_for_url("**/account/after-sales/**", timeout=15000)
            expect(page.get_by_test_id("aftersale-detail")).to_be_visible()
            print("PASS after-sales apply")
        except Exception as e:
            failures.append(f"aftersale: {e}")
            print(f"FAIL aftersale: {e}")
            page.screenshot(path="e2e-fail-aftersale.png", full_page=True)

        # Appointment store + slot
        try:
            page.goto(f"{BASE}/sell/appointment", wait_until="domcontentloaded")
            # Step 1 minimal path via selects
            page.locator("select").nth(0).select_option(label="Apple")
            page.wait_for_timeout(600)
            page.locator("select").nth(1).select_option(index=1)
            page.wait_for_timeout(400)
            # First color / storage chips under the model section
            color_btns = page.locator("button").filter(has_text="Titanium").or_(page.locator("button").filter(has_text="Black")).or_(page.locator("button").filter(has_text="Midnight"))
            color_btns.first.click()
            page.locator("button").filter(has_text="GB").first.click()
            page.get_by_role("button", name="Next").click()
            # Step 2 — admission self-check first (APP-P1-01 回收前置条件自检, hard gate:
            # "Get Estimate" stays disabled until all 7 are answered)
            for tid in (
                "admission-power_on-yes",
                "admission-account_signout-already_signed_out",
                "admission-water_damage-no",
                "admission-battery_swell-no",
                "admission-emi_active-no",
                "admission-carrier_lock-no",
                "admission-lost_stolen-no",
            ):
                page.get_by_test_id(tid).click()
            # Remaining required fields
            page.get_by_role("button", name="Yes", exact=True).click()
            page.get_by_role("button", name="90%+").click()
            # Labels follow APP-P1-01 wording (body vs screen "like new" differ, so match exactly)
            page.get_by_role("button", name="Like new, no scratches", exact=True).click()
            page.get_by_role("button", name="Like new", exact=True).click()
            page.get_by_role("button", name="Normal, no discolouration", exact=True).click()
            page.get_by_role("button", name="Get Estimate").click()
            expect(page.get_by_test_id("appointment-step3")).to_be_visible(timeout=10000)
            # Store list shares the app-wide current city (APP-P1-01 ↔ APP-P1-03); pick
            # Mumbai here so the store assertion does not depend on leftover state.
            expect(page.get_by_test_id("appointment-city-selector")).to_be_visible()
            page.get_by_test_id("appointment-city-selector").click()
            expect(page.get_by_test_id("city-picker")).to_be_visible()
            page.get_by_test_id("city-row-Mumbai").click()
            page.wait_for_timeout(600)
            expect(page.get_by_test_id("appointment-city-selector")).to_contain_text("Mumbai")
            page.get_by_test_id("store-st-mum-1").click()
            page.locator("[data-testid^=slot-]").first.click()
            expect(page.get_by_test_id("book-appointment")).to_be_enabled()
            page.get_by_test_id("book-appointment").click()
            page.wait_for_url("**/appointment/success**", timeout=15000)
            print("PASS appointment store/slot")
        except Exception as e:
            failures.append(f"appointment: {e}")
            print(f"FAIL appointment: {e}")
            page.screenshot(path="e2e-fail-appointment.png", full_page=True)

        # Admission self-check — negative path: a reject answer must hard-block the booking
        try:
            page.goto(f"{BASE}/sell/appointment", wait_until="domcontentloaded")
            page.locator("select").nth(0).select_option(label="Apple")
            page.wait_for_timeout(600)
            page.locator("select").nth(1).select_option(index=1)
            page.wait_for_timeout(400)
            color_btns = page.locator("button").filter(has_text="Titanium").or_(page.locator("button").filter(has_text="Black")).or_(page.locator("button").filter(has_text="Midnight"))
            color_btns.first.click()
            page.locator("button").filter(has_text="GB").first.click()
            page.get_by_role("button", name="Next").click()
            # Cannot sign out of the account → ADM-02 reject
            page.get_by_test_id("admission-account_signout-cant_signout").click()
            expect(page.get_by_test_id("admission-reject-account_signout")).to_be_visible()
            expect(page.get_by_test_id("admission-blocked-banner")).to_be_visible()
            expect(page.get_by_test_id("admission-contact-support")).to_be_visible()
            # Fill the remaining required fields — the gate must still hold
            for tid in (
                "admission-power_on-yes",
                "admission-water_damage-no",
                "admission-battery_swell-no",
                "admission-emi_active-no",
                "admission-carrier_lock-no",
                "admission-lost_stolen-no",
            ):
                page.get_by_test_id(tid).click()
            page.get_by_role("button", name="Yes", exact=True).click()
            page.get_by_role("button", name="90%+").click()
            page.get_by_role("button", name="Like new, no scratches", exact=True).click()
            page.get_by_role("button", name="Like new", exact=True).click()
            page.get_by_role("button", name="Normal, no discolouration", exact=True).click()
            expect(page.get_by_test_id("get-estimate")).to_be_disabled()
            # Correcting the answer releases the gate
            page.get_by_test_id("admission-account_signout-yes").click()
            expect(page.get_by_test_id("admission-blocked-banner")).to_have_count(0)
            expect(page.get_by_test_id("get-estimate")).to_be_enabled()
            print("PASS admission self-check gate")
        except Exception as e:
            failures.append(f"admission gate: {e}")
            print(f"FAIL admission gate: {e}")
            page.screenshot(path="e2e-fail-admission.png", full_page=True)

        # Enterprise account: register → bind store → switch mode → credit checkout (02 APP-P0-05 / APP-P1-04)
        try:
            page.goto(f"{BASE}/login", wait_until="domcontentloaded")
            page.get_by_test_id("login-phone").fill("9876500099")
            page.get_by_test_id("send-otp").click()
            page.get_by_test_id("login-otp").wait_for()
            page.get_by_test_id("login-otp").fill("123456")
            page.get_by_test_id("verify-otp").click()
            page.wait_for_url("**/register**", timeout=15000)
            # Personal type (default): no store required → submit enabled once form valid
            page.get_by_test_id("register-password").fill("Ent@Dobra9")
            page.get_by_test_id("register-confirm").fill("Ent@Dobra9")
            page.get_by_test_id("register-agree").click()
            expect(page.get_by_test_id("complete-registration")).to_be_enabled()
            # Switch to enterprise → store becomes required → button disables
            page.get_by_test_id("register-type-enterprise").click()
            expect(page.get_by_test_id("complete-registration")).to_be_disabled()
            page.get_by_test_id("register-store-search").fill("Andheri")
            page.get_by_test_id("register-store-hit-st-mum-1").wait_for(timeout=8000)
            page.get_by_test_id("register-store-hit-st-mum-1").click()
            expect(page.get_by_test_id("register-store-selected")).to_contain_text("MobileXchange Andheri")
            expect(page.get_by_test_id("register-store-selected")).to_contain_text("27AABCM1234F1Z5")
            expect(page.get_by_test_id("complete-registration")).to_be_enabled()
            page.get_by_test_id("complete-registration").click()
            page.wait_for_url("**/home**", timeout=15000)
            print("PASS enterprise registration (store binding)")

            # Profile shows enterprise badge + switch entry; personal accounts have none (u-1 covered by earlier suites implicitly)
            page.goto(f"{BASE}/account", wait_until="domcontentloaded")
            expect(page.get_by_test_id("enterprise-account-badge")).to_be_visible(timeout=8000)
            expect(page.get_by_test_id("enterprise-account-badge")).to_contain_text("ST-MH-0001")

            # Enterprise mode → cart one device → credit pay (sufficient line st-mum-1)
            page.get_by_test_id("mode-enterprise").click()
            page.wait_for_url("**/buy/enterprise**", timeout=10000)
            page.get_by_test_id(re.compile(r"^enterprise-select-\d+$")).first.click()
            page.get_by_test_id("enterprise-add-selected").click()
            page.get_by_test_id("enterprise-cart-link").click()
            expect(page.get_by_test_id("credit-line-card")).to_be_visible(timeout=8000)
            expect(page.get_by_test_id("credit-available")).to_contain_text("3,80,000")
            page.get_by_test_id("pay-credit").click()
            page.get_by_test_id("enterprise-place-order").click()
            page.wait_for_url("**/account/orders**", timeout=15000)
            expect(page.get_by_test_id("order-list-toast")).to_contain_text("pending settlement")
            print("PASS enterprise credit checkout")
        except Exception as e:
            failures.append(f"enterprise: {e}")
            print(f"FAIL enterprise: {e}")
            page.screenshot(path="e2e-fail-enterprise.png", full_page=True)

        # Insufficient credit: u-10 bound to st-del-1 (available ₹20,000) → credit disabled + shortfall
        try:
            page.goto(f"{BASE}/login", wait_until="domcontentloaded")
            # logout via local state clear is unreliable; use fresh context state reset through storage
            page.evaluate("localStorage.clear()")
            page.goto(f"{BASE}/login", wait_until="domcontentloaded")
            page.get_by_test_id("login-phone").fill("9876543212")
            page.get_by_test_id("send-otp").click()
            page.get_by_test_id("login-otp").wait_for()
            page.get_by_test_id("login-otp").fill("123456")
            page.get_by_test_id("verify-otp").click()
            page.wait_for_url("**/home**", timeout=15000)
            page.goto(f"{BASE}/account", wait_until="domcontentloaded")
            page.get_by_test_id("mode-enterprise").click()
            page.wait_for_url("**/buy/enterprise**", timeout=10000)
            page.get_by_test_id(re.compile(r"^enterprise-select-\d+$")).first.click()
            page.get_by_test_id("enterprise-add-selected").click()
            page.get_by_test_id("enterprise-cart-link").click()
            expect(page.get_by_test_id("credit-line-card")).to_be_visible(timeout=8000)
            expect(page.get_by_test_id("pay-credit")).to_be_disabled()
            expect(page.get_by_test_id("pay-credit-shortfall")).to_contain_text("short ₹")
            expect(page.get_by_test_id("pay-razorpay")).to_be_enabled()
            print("PASS insufficient credit gate (shortfall + razorpay fallback)")
        except Exception as e:
            failures.append(f"insufficient credit: {e}")
            print(f"FAIL insufficient credit: {e}")
            page.screenshot(path="e2e-fail-insufficient.png", full_page=True)

        browser.close()

    if failures:
        print("\n=== REMAINING FEATURES FAILED ===")
        for f in failures:
            print("-", f)
        sys.exit(1)
    print("\n=== REMAINING FEATURES PASSED ===")
    sys.exit(0)


if __name__ == "__main__":
    run()
