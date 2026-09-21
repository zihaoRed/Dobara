# Device Check H5

Guided hardware checks for a phone browser. The page exchanges the one-time detect token through
`POST /api/h5-detect/v1/open` and polls `GET /api/h5-detect/v1/state` every two seconds.

## Run

```bash
pnpm --filter @dobara/device-check dev
```

Open the tablet-issued `/device-check/?token=DETECT_TOKEN` URL for a real inspection. Use
`/device-check/?demo=1` for a standalone local UI check; demo results are not uploaded.

When a token is present in the URL, the page opens the backend session automatically. During local
development, Vite proxies `/api` to `http://test.dobaraindia.com`. Set `VITE_DOBARA_API_BASE_URL`
for deployments where the API is not available on the same origin.

The dev server listens on the LAN. From a phone on the same Wi-Fi, open
`http://<computer-lan-ip>:3004/device-check/?token=LOCAL-TEST&demo=1`.

Camera, microphone and motion APIs require HTTPS on physical devices (`localhost` is exempt during development).

## Browser support

- Android Chrome/Edge: screen, touch, orientation, audio, microphone and camera.
- iOS Safari 15+: screen, touch, audio, microphone and camera; motion permission requires a user gesture.
- Desktop Chromium/Safari: screen, touch/mouse, audio and media devices; orientation is normally unsupported.
- Embedded WebViews: support depends on the host app's permission forwarding and secure-context configuration.

Power and volume buttons are not part of the H5 sequence. The clerk confirms the fixed button item
on the inspection tablet, which submits the seventh result separately.

## E2E

```bash
python3 -m pip install -r e2e/requirements.txt
python3 -m playwright install chromium
python3 e2e/check_flow.py
```

The E2E flow uses Chromium fake camera and microphone devices and enables sensor simulation with `?demo=1`.
