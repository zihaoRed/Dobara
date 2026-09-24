"""E2E: TAB-P0-14 H5 检测页联动 over the CLOUD-P0-16 relay.

The tablet issues a one-time token; the check page — opened on the tablet's own origin so
they share localStorage/demoBus — consumes it, reports each finished item up, and the
tablet lights those items up live. A retest commanded from the tablet travels back down
through the page's 2-second poll.

Requires both dev servers: tablet :3002 and device-check :3004 (the tablet proxies
/device-check to :3004 so the page is same-origin).
"""
from __future__ import annotations

import os
import re
import sys
from playwright.sync_api import sync_playwright, expect

from inspection_flow import clerk_login, customer_otp, through_admission

BASE = os.environ.get("TABLET_BASE", "http://localhost:3002/tablet")


def to_hardware(page):
    page.get_by_test_id("admission-continue").click()
    page.get_by_test_id("hardware-results").wait_for()
    # Android IMEI secret-code wizard — clerk presses the final '#'
    page.get_by_test_id("imei-wizard").wait_for()
    page.get_by_test_id("imei-pressed-hash").click()


def run():
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
        )
        ctx = browser.new_context(permissions=["microphone", "camera"])
        tablet = ctx.new_page()
        tablet.set_default_timeout(30000)

        try:
            clerk_login(tablet)
            customer_otp(tablet)
            through_admission(tablet)
            to_hardware(tablet)

            # --- 1. Tablet issues a one-time token once an H5 item comes due ---
            expect(tablet.get_by_test_id("h5-phase")).to_have_text(
                re.compile("token issued", re.I), timeout=30000
            )
            url_el = tablet.get_by_test_id("h5-url")
            url_el.wait_for(state="visible", timeout=15000)
            h5_url = url_el.inner_text().strip()
            m = re.search(r"token=([A-Z0-9]+)", h5_url)
            if not m:
                raise AssertionError(f"no token in check URL: {h5_url!r}")
            token = m.group(1)
            print(f"PASS tablet issued one-time token ({len(token)} chars)")

            expect(tablet.get_by_test_id("h5-phase")).to_have_text(
                re.compile("waiting for the page", re.I), timeout=15000
            )

            # --- 2. Open the check page on the SAME origin (proxy) so state is shared ---
            phone = ctx.new_page()
            phone.set_default_timeout(30000)
            phone.goto(h5_url, wait_until="domcontentloaded")
            phone.get_by_test_id("dc-start").click()
            phone.get_by_test_id("dc-step-label").wait_for(timeout=20000)

            # Tablet observes the consumption and flips to "running on device"
            expect(tablet.get_by_test_id("h5-phase")).to_have_text(
                re.compile("running on device", re.I), timeout=20000
            )
            print("PASS check page bound to the session (tablet sees it running)")

            # Negative control: the tablet must NOT self-complete an H5 item — before the
            # phone reports anything, that row has to stay pending.
            phone.get_by_test_id("dc-screen-area").wait_for(timeout=20000)
            tablet.wait_for_timeout(2500)
            expect(tablet.get_by_test_id("hw-item-screen_display")).to_have_attribute(
                "data-status", "pending"
            )
            print("PASS tablet does not fake H5 results locally")

            # --- 3. Screen colours on the phone → tablet item lights up ---
            phone.get_by_test_id("dc-screen-area").wait_for()
            for _ in range(5):
                phone.get_by_role("button", name="Next color").click()
            phone.get_by_test_id("dc-screen-pass").click()

            screen_row = tablet.get_by_test_id("hw-item-screen_display")
            expect(screen_row).to_have_attribute("data-status", "normal", timeout=20000)
            print("PASS screen result relayed to the tablet")

            # --- 4. Touch on the phone → tablet item lights up ---
            area = phone.get_by_test_id("dc-touch-area")
            phone.get_by_test_id("dc-touch-pass").wait_for()
            box = area.bounding_box()
            rows = 20
            for r in range(rows):
                y = box["y"] + (r + 0.5) * box["height"] / rows
                phone.mouse.move(box["x"] + 4, y)
                phone.mouse.down()
                phone.mouse.move(box["x"] + box["width"] - 4, y, steps=18)
                phone.mouse.up()
            expect(phone.get_by_test_id("dc-touch-pass")).to_be_enabled(timeout=15000)
            phone.get_by_test_id("dc-touch-pass").click()

            touch_row = tablet.get_by_test_id("hw-item-screen_touch")
            expect(touch_row).to_have_attribute("data-status", "normal", timeout=20000)
            print("PASS touch result relayed to the tablet")

            # --- 5. Anti-cheat fingerprint arrives with the first report ---
            expect(tablet.get_by_test_id("h5-fingerprint")).to_be_visible(timeout=15000)
            print("PASS device fingerprint surfaced on the tablet")

            # --- 6. Tablet-issued retest reaches the phone and re-arms that step ---
            tablet.get_by_test_id("h5-retest-screen_touch").click()
            expect(phone.get_by_test_id("dc-step-label")).to_contain_text(
                re.compile("touch", re.I), timeout=20000
            )
            expect(phone.get_by_test_id("dc-step-label")).to_contain_text(
                re.compile("retest requested", re.I), timeout=20000
            )
            print("PASS retest command delivered down to the check page")
        except Exception as e:
            failures.append(str(e))
            print(f"FAIL h5 linkage: {e}")
            try:
                tablet.screenshot(path="e2e-fail-h5-linkage.png", full_page=True)
            except Exception:
                pass
        finally:
            browser.close()

    if failures:
        print("\n=== H5 LINKAGE FAILED ===")
        for f in failures:
            print("-", f)
        sys.exit(1)
    print("\n=== H5 LINKAGE PASSED ===")


if __name__ == "__main__":
    run()
