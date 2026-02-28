# 8th Wall WebAR Archive

Complete export of all 8th Wall WebAR projects by Purple Squirrel Media. Exported February 2026 before platform migration.

## Projects (11)

| Project | Type | Features | Migration |
|---|---|---|---|
| **a-frame-place-mesh** | A-Frame | SLAM, tap-to-place mesh | Easy |
| **avatar-rigged-face-model** | A-Frame | Face tracking, expression mapping | Hard |
| **buy-now** | A-Frame | SLAM, drag/rotate, CSS2D labels | Medium |
| **holostream** | A-Frame | SLAM, Arcturus volumetric video | Hard |
| **image-target-portal** | A-Frame | Image targets, portal, nav-mesh | Hard |
| **portal** | A-Frame | Image targets, portal effect | Medium |
| **proximity-trigger** | A-Frame | SLAM, joystick, cubemap reflections | Hard |
| **readyplayerme** | A-Frame | Sky effects, face tracking, RPM avatars | Very Hard |
| **sky-exchange** | A-Frame | Sky effects, LayersController | Hard |
| **vps-scavenger-hunt** | A-Frame | VPS, Lightship Maps, GPS | Very Hard |
| **world-effects** | Babylon.js | SLAM, Babylon.js integration | Hard |

## Architecture

All projects (except world-effects) use:
- **8frame** (8th Wall's A-Frame fork) v1.2.0 or v1.3.0
- **Webpack 5** build system
- **Bundled XR engine** in `external/xr/` (SLAM + face tracking TFLite models)
- **XRExtras** helpers for gestures, loading, error handling

`world-effects` uses Babylon.js 5.23.0 instead of A-Frame.

## Migration Notes

- **Easy**: `a-frame-place-mesh` — barely uses 8th Wall APIs, pure A-Frame/Three.js
- **Medium**: `portal`, `buy-now` — swap image tracking to MindAR.js, replace gesture helpers
- **Hard**: Face tracking → MediaPipe Face Mesh, Sky Effects → no open-source web equivalent, VPS → no web replacement
- Common fix: Replace `cdn.8thwall.com` Draco decoder with `gstatic.com/draco/v1/decoders/`
- Common fix: Replace 8frame with standard A-Frame 1.3.0+ from aframe.io

## Build

Each project is independently buildable:

```bash
cd <project-name>
npm install
npm start     # dev server
npm run build # production bundle
```
