## **Welcome to Putt Putt Paradise! 🏌️‍♀️🌴⛳️**

Putt Putt Paradise is a modular, cross-device mini-golf game built with [8th Wall Studio](https://www.8thwall.com/),
showcasing physics, overlay ui, prefabs, state machines and more. Each space serves a clear purpose in the game’s journey,
and every component is designed to be highly reusable and customizable.

This readme includes:

1. Project Overview
2. How to Guide
3. Walkthrough Video
4. Project Changelog

# **Project Overview**

### **Start Screen**

The entrypoint for Putt Putt Paradise, presenting the "New Game" button and adapting the experience for mobile or desktop users.
This space also enables sound and sets up the initial state of the game.

![](https://static.8thwall.app/assets/Screen_Recording_2025-08-05_at_1.51.54%E2%80%AFAM-rrmyirmi6q.gif)

#### **StartGame.ts**

Controls all start screen logic, device setup, and transition into gameplay.

- **Detects mobile vs. desktop:** Adapts the UI, hides desktop controls if on mobile, and adjusts camera distance for smaller screens.
- **Handles button interactions:** "New Game" triggers sound unlock (for mobile), hover/click effects, and sets up a smooth transition.
- **Transitions to gameplay:** Loads the first playable hole (`Hole 1`) when the game starts.

### **Hole 1** - Par 3

The first playable golf hole, where core mechanics are introduced and the player can take their first shot.

![](https://static.8thwall.app/assets/Screen_Recording_2025-08-05_at_1.51.54%E2%80%AFAM-bvff7npu4l.gif)

#### **LoadingScreen.ts**

While assets load, an animated loading bar and percentage indicator are shown. Once all assets are ready, the UI fades out and gameplay begins.
This is attached to the LoadingScreen prefab.

- **Animated progress bar & percentage label:** Smoothly interpolates percent for visual polish.
- **Ensures assets are loaded:** Waits for all pending assets and ensures a minimum visible loading time.
- **Fade-out & transition:** Fades the loading UI out and dispatches a `level-loaded` event to trigger game logic.

#### **GolfOrbitControls.ts**

Implements a highly configurable, smooth orbit camera. Based on the built-in orbit camera component.

- **Full schema for customization:** Supports min/max angles, invert axes, inertia, zoom, and controller support.
- **Multiple input types:** Touch, mouse, and controller with optional pointer lock.
- **Camera focus:** Can be set to focus on specific entities for drama (e.g., focuses on hole after scoring).
- **Start Position:** Start Yaw, Start Pitch, Start Distance can be set to ensure the correct initial orbit position.

#### **PlayerControls.ts**

Manages all input, aiming, swinging, and physics for the golf ball. Listens for `level-loaded` event
from the LoadingScreen prefab to display the overlay UI.

- **Power meter UI:** Animates bar height and color based on power.
- **Aiming:** Players can rotate the golf club using the UI, keyboard, or a gamepad. An input manager handles all keyboard and gamepad input events.
- **Swing mechanic:** Handles swing animation, launches the ball with physics impulse.
- **Respawn:** If the ball falls out-of-bounds, it is respawned at the last position it was struck from.

#### **HoleScore.ts**

Tracks strokes, scoring, and result overlays for the current hole.

- **Collision-based scoring:** Detects when the ball reaches the hole.
- **Golf terminology:** Displays "Birdie," "Par," etc. based on player’s strokes vs par.
- **Celebratory feedback:** Shows particle effects and plays audio for scoring.
- **UI management:** Handles transitions between gameplay UI and results overlays.
- **Next hole progression:** On scoring, triggers transition to the next hole.

### **Hole 2** - Par 10

The second hole of the game, providing challenging multi-level obstacles.

![](https://static.8thwall.app/assets/Forge_OUZ-16mfp506q8.gif)

#### **LavaShader.ts**

Adds animated lava effects to course hazards or themed areas using a custom Three.js shader.

- **Procedural visuals:** Animated with time-based uniforms for flowing motion.
- **Custom textures:** Loads and repeats lava/cloud assets for seamless visuals.

### **Hole 3** - Par 30

Two fast laps on a Bay Area–style racetrack with a cinematic intro, lap triggers, and a podium finish. Includes over 100 new assets mostly generated with Asset Lab.

![](https://static.8thwall.app/assets/hole3-race-qx55i2ri1j.gif)

#### **RaceLogic.ts**

Orchestrates the full race flow with timed cameras and trigger-based laps.

- **Intro → Gameplay:** Track/Chopper/Tripod camera sequence, then spawn ball, enable physics, and hand off to Player camera.
- **Lap control:** Corner triggers advance **Lap 1 → Final Lap**, move blockers/backstops, and update jumbotrons (**LAP 1**, **FINAL LAP**).
- **Finish:** Final-corner trigger reveals/positions the podium hole to end the race.
- **Integration:** Listens for `level-loaded`, dispatches `reset_animation` to sync animated props; expects inspector refs for ball, player, triggers, backstop, cameras, overlays, and jumbotron texts.

#### **CurveAnimator.ts**

Drives entities along authored curves with time-based or distance-based (“train”) motion.

- **Interpolation:** Catmull-Rom spline or linear over `curveDataKey` paths; optional custom start to loop seamlessly at the entity’s position.
- **Orientation & smoothing:** Look-ahead “face travel direction” and `trackTightness` smoothing for stable motion.
- **Train mode:** Arc-length movement with curvature-aware speed (`minSpeed`/`maxSpeed`, `speedCompensation`) and per-entity `carOffset`.
- **Control & debug:** Start/pause/stop/reset events; optional debug cubes at control points for quick path inspection.

#### **CurveData.ts**

Reusable spline/linear paths consumed by `CurveAnimator`.

- **Named sets:** `raceCar`, `train`, `chopper`, `cruiseShip`, `barge`, plus `default`. Some curves are closed loops (first/last points match) for seamless circuits.
- **Usage:** Set the `curveDataKey` on any `CurveAnimator` to drive entities along a path.

#### **GltfTextureAnimator.ts**

Swaps GLTF mesh materials for a tiny shader with animated UVs and glow.

- **Effects:** UV scroll (U/V), optional X-flip, emissive pulsing (min/max), and opacity.
- **Lifecycle:** Waits for `GLTF_MODEL_LOADED`, finds textures, applies one shader across meshes, and updates uniforms per tick.
- **Use cases:** Signage, billboards, flowing surfaces, or simple light-chase effects.

#### **CustomLookAt.ts**

Targets an entity or world XYZ and rotates to face it, with simple axis constraints.

- **Targeting:** Entity reference or `targetX/Y/Z` vector when no entity is set.
- **Locks:** Preserve pitch (X) or disable Y aiming; warns on unsupported lock combos.
- **Hierarchy aware:** Converts to local space when the object has a parent, keeping orientations predictable.

![](https://static.8thwall.app/assets/hole3-golf-iasgci8c8k.gif)

### **Hole 4** - Par 3

This hole is based on a real mini golf hole scanned using [Scaniverse](https://scaniverse.com/) to generate a gaussian splat. The splat was exported in [.SPZ format](https://www.8thwall.com/docs/studio/guides/splats/).

![](https://static.8thwall.app/assets/splat-hole-video-l36yel2i1u.gif)

### **UI**

A cross-space UI layer that shows scores and progress throughout the game.
This utilizes UI frames with auto-layout logic to ensure screen size responsiveness.

#### **ScoreKeeper.ts**

Manages the running score log and par/score feedback UI. Attached to the "Result" persistent object in the UI space.

- **Event-driven updates:** Listens for `hole-scored` events from `HoleScore.ts`.
- **Dynamic UI log:** Instantiates new score entries as holes are played.
- **Color feedback:** Green for under par, red for over par, white for par.

![](https://static.8thwall.app/assets/54Krn-g99lb47i2r.png)

### **Putt Putt Factory**

A development and prototyping space, used as a staging ground for the putt putt prefab system. Browse the included prefabs in this space.

![](https://static.8thwall.app/assets/L00FQ-ge62b4bo1u.png)

---

### **How To Create A New Mini-Golf Hole** ⛳️

This project comes with all the logic and collider-equipped golf section prefabs for you to quickly snap together your own mini-golf holes.

#### **Step 1: Create a New Space**

1. Clone `Hole 1` and rename it `Hole 5`
2. Delete everything in the space except:
   - `Camera`
   - `Hole Score Zone`
   - `Player`
   - `Golf Ball`
   - `Directional Light`
   - `Music`
   - `Loading Screen`
3. Ensure `UI` remains an included space in `Hole 5` settings

![](https://static.8thwall.app/assets/clone-hole-8h265ke6m3.gif)

#### **Step 2: Add Golf Section Prefabs**

1. Open Prefabs menu
2. Select a prefab to preview
3. Drag into the hierarchy

![](https://static.8thwall.app/assets/Forge_dYf_clip-o8kego6o64.gif)

4. Shift+drag the pink x/z square to snap the track into place

![](<https://static.8thwall.app/assets/Forge_dYf_clip_(1)-ewln9qqo6f.gif>)

5. Shift+drag the green x axis ring while in rotation mode to snap rotate

![](<https://static.8thwall.app/assets/Forge_dYf_clip_(2)-csd58cnc3z.gif>)

#### **Step 3: Toggle Final Hole**

1. In Hole 5, Select Hole Score Zone
2. Toggle on "Final Hole" in the Hole Score component
3. Open Hole 4
4. Select Hole Score Zone
5. Toggle off "Final Hole" in the Hole Score component

![](https://static.8thwall.app/assets/Screen_Recording_2025-08-08_at_4.26.30%E2%80%AFPM-xi3tmxf0xg.gif)

### **PRO TIP: Use Asset Lab to generate 3D Models for your new Mini-Golf Hole! ⛳️**

---

### **Project Walkthrough**

(Walkthrough starts at 10:00)

https://youtu.be/Yz7qt65QLDc?si=e5skvKBlBLC5zpjL&t=600

---

### Changelog

#### September 4, 2025

- **Hole 4 (space)**
  - Added a new hole using a 3D scan (.spz file) of an IRL mini golf hole

#### August 25, 2025

- **Hole 3 (space)**
  - Updated flag-checkered.glb with fixed texture
  - Added sand trap colliders to turn 1
  - Added final turn colliders

#### August 24, 2025

- **Hole 3 (space)**
  - Implemented two-lap racetrack flow with cinematic intro and podium finish.
  - Over 100 new assets (3D models, textures, music) mostly generated with Asset Lab
- **RaceLogic.ts**
  - New state machine driving **pre-race intro → Lap 1 → Final Lap → Podium reveal**.
  - Timed camera cuts, physics gating for the ball, and jumbotron updates (**LAP 1**, **FINAL LAP**).
  - Trigger collisions move blockers/arms next lap; final turn reveals/positions podium hole.
  - Listens for `level-loaded`; dispatches `reset_animation` to sync animated props.
  - Exposed inspector refs: player, ball, triggers, backstop, podium hole, overlay, cameras, and jumbotron texts.
- **CurveAnimator.ts**
  - Includes **train mode** (arc-length movement) with curvature-based speed compensation and look-ahead orientation.
  - Support for **custom start** & **seamless loop at entity position**; optional debug cubes for control points.
  - Robust lifecycle: `initializing → delaying → animating → paused/stopped/completed` with `reset_animation`.
  - Improved closed-curve handling and Catmull-Rom/linear interpolation utilities.
- **CurveData.ts**
  - Added reusable path sets: `raceCar`, `train`, `chopper`, `cruiseShip`, `barge`, plus `default`.
  - Marked closed loops where applicable for seamless circuits.
- **GltfTextureAnimator.ts**
  - New lightweight shader component: UV scrolling (U/V), optional X-flip, emissive pulsing, and opacity.
  - Auto-discovers GLTF materials after `GLTF_MODEL_LOADED` and updates uniforms each tick.
- **CustomLookAt.ts**
  - New targeting utility: face a target **entity** or world **XYZ** with simple axis locks.
  - Parent-aware local rotation; warns on unsupported lock combinations.
- **Bug Fixes**
  - Updated player aim logic to point player in the direction the ball was most recently traveling
  - Hole number displays correctly now
  - Results scorecard displays correctly now

#### August 8, 2025

- **README.md**
  - added "How to Guide" and "Video Walkthrough"

#### August 7, 2025

- **HoleScore.ts**
  - Updated getNextHoleSpace() to automatically calculate the next hole by extracting the number from the current hole name and incrementing it by 1
  - Hole spaces should be named "Hole 1", "Hole 2", "Hole 3", etc for this to work

#### August 6, 2025

- **PlayerControls.ts**
  - Improved Ball Position Tracking: The ball's "safe position" is now recorded only once at the start
    and updated only when the ball is hit, preventing it from resetting to the wrong spot.
  - Better Out-of-Bounds Handling: Created a new, dedicated function called resetBallPosition() to
    handle out-of-bounds resets.
  - Enhanced Ball Stop Detection: Implemented new flags (ballStopped, resetTriggered) to properly track
    the ball's state, which prevents multiple resets and improves reliability.
  - Added Safety Flags: Implemented several new flags (ballStopped, resetTriggered, hasRecordedInitialPosition)
    to prevent duplicate actions and potential race conditions.
  - Overlay UI visibility is now handled through this script.
- **LoadingScreen.ts**
  - Overlay UI visibility is no longer handled from the loading screen to reduce prefab configuration.

---

---

---
