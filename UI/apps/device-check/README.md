# Device Check H5

Local, guided hardware checks for a phone browser. Backend session binding and result upload are intentionally out of scope for now.

## Run

```bash
pnpm --filter @dobara/device-check dev
```

Open `/device-check/`. Use `?token=INSPECTION_ID` to provide a local inspection ID. The sensor simulation control is available only with `?demo=1`.

Camera, microphone and motion APIs require HTTPS on physical devices (`localhost` is exempt during development).

## Browser support

- Android Chrome/Edge: screen, touch, orientation, audio, microphone and camera.
- iOS Safari 15+: screen, touch, audio, microphone and camera; motion permission requires a user gesture.
- Desktop Chromium/Safari: screen, touch/mouse, audio and media devices; orientation is normally unsupported.
- Embedded WebViews: support depends on the host app's permission forwarding and secure-context configuration.

Power and volume buttons cannot be verified by a normal webpage. The final step is deliberately recorded as `external` until a tablet/native integration supplies the verdict.

## E2E

```bash
python3 -m pip install -r e2e/requirements.txt
python3 -m playwright install chromium
python3 e2e/check_flow.py
```

The E2E flow uses Chromium fake camera and microphone devices and enables sensor simulation with `?demo=1`.
