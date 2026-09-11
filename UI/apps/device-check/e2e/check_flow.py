"""E2E: device-check H5 (TAB-P0-14) — token → screen colors → touch → sensors → speaker → mic → camera → buttons (ADB verdict) → summary."""
from __future__ import annotations

import os
import sys

from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("DEVICE_CHECK_BASE", "http://localhost:3004/device-check/")


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            # headless chromium has no real mic/camera — fake streams + auto-grant
            args=["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
        )
        ctx = browser.new_context(
            permissions=["microphone", "camera"],
            viewport={"width": 390, "height": 844},  # phone-sized
        )
        page = ctx.new_page()
        page.set_default_timeout(20000)

        page.goto(BASE)
        expect(page.get_by_test_id("dc-token-input")).to_be_visible()
        page.get_by_test_id("dc-start").click()

        # 1. screen solid colors
        page.get_by_test_id("dc-screen-area").wait_for()
        page.get_by_test_id("dc-screen-pass").click()

        # 2. touch paint — sweep every row of the grid to reach ≥90% coverage
        area = page.get_by_test_id("dc-touch-area")
        box = area.bounding_box()
        rows = 20
        for r in range(rows):
            y = box["y"] + (r + 0.5) * box["height"] / rows
            page.mouse.move(box["x"] + 4, y)
            page.mouse.down()
            page.mouse.move(box["x"] + box["width"] - 4, y, steps=18)
            page.mouse.up()
        expect(page.get_by_test_id("dc-touch-pass")).to_be_enabled()
        page.get_by_test_id("dc-touch-pass").click()

        # 3. sensors — three guided axes (α/β/γ); demo shortcut completes one axis per click
        for _ in range(4):
            if page.get_by_test_id("dc-sensors-pass").is_enabled():
                break
            page.get_by_test_id("dc-sensors-simulate").click()
        page.get_by_test_id("dc-sensors-pass").click()

        # 4. speaker — listen confirmation
        page.get_by_test_id("dc-speaker-pass").click()

        # 5. microphone — record 3s (fake audio input) then confirm playback
        page.get_by_test_id("dc-mic-record").click()
        page.get_by_test_id("dc-mic-pass").wait_for(state="visible", timeout=10000)
        page.get_by_test_id("dc-mic-pass").click()

        # 6. camera — capture a frame then confirm preview
        page.get_by_test_id("dc-camera-shot").click()
        page.get_by_test_id("dc-camera-pass").click()

        # 7. buttons — page only guides; the tablet ADB verdict arrives (~2.2s in demo)
        page.get_by_test_id("dc-buttons-ok").wait_for(state="visible", timeout=15000)
        page.get_by_test_id("dc-buttons-ok").click()

        # summary — results sent to the tablet, token consumed
        page.get_by_text("Check complete").wait_for()
        print("PASS device-check flow")
        browser.close()


if __name__ == "__main__":
    try:
        run()
    except Exception as e:  # noqa: BLE001
        print(f"FAIL device-check flow: {e}")
        sys.exit(1)
