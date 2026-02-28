# Space 1: Video Surface

This space demonstrates how to add interactive UI controls to a video surface in a 3D scene using the built-in video texture system.

## Overview

This implementation uses a prefab video surface for playback, and adds a custom UI layer for play/pause control. The component handles visual feedback and user interaction with the video.

## Components

### Video Controls UI

This component adds play/pause UI to an existing video surface entity.

#### Functionality

When attached, the `Video Controls UI` component:

1. Displays a semi-transparent background and a play/pause icon over the video.
2. Switches between play and pause states when the user taps the screen.
3. Fades out the controls while playing for an unobstructed view.

#### Schema

- **background**: `ecs.eid` — The UI element acting as the background overlay.
- **playbackImage**: `ecs.eid` — The image element used to show the play/pause icon.

#### Example Use

Add the component to a video surface prefab with references to the overlay UI elements.

#### Behavior Highlights

- Starts in a paused state.
- On tap, toggles between play and pause.
- UI fades out automatically when video is playing.

## Code Summary

The `Video Controls UI` component uses a state machine with `paused` and `playing` states, triggered by screen taps. It interacts with the `ecs.VideoControls` system to control playback and updates UI elements using `ecs.Ui.mutate`.

---

# Space 2: Image Target

todo

---

# Space 3: Chromakey

![](https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExZmd5enFjcHphbmw2NDN6Nm9qcDNkcHh6anZoaDhuZzk2eXJid3kxNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/grTc04P0RL0OSNicon/giphy.gif)

This space uses a custom Chromakey Material to remove a specified color (e.g. green screen) from a video or image texture.

You can fine-tune the chromakey shader using the `background`, `similarity`, `smoothness`, and `spill` values:

![](https://static.8thwall.app/assets/schema-t5ok5467cg.png)

You can upload your own video and find optimized values for it here: https://playground.8thwall.app/chromakey-threejs/

Green Screen Video:

![](https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTh6cnQwYXB6a2F3ZXdkdGk1N2dlMTh0bGd6ZHdyZm01dTUxNzl5dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/oChnDwUrsrkeFjPzwT/giphy.gif)

Chromakey Shader code by https://github.com/Mugen87 on THREE.js forum.

---

# Space 4: Spatial Audio

This space demonstrates placing a 3D boombox model in real space using AR, complete with spatial audio and a state machine that manages both the boombox and its UI. Users can interact with clickable buttons in the 3D world to pause or play the boombox.

![Demo](https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNnEzNnNuYW1sZ211a3pwd2s4MDg1dDdtZGdiN2x1bXN5Z240YjZ4ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/AHEjQ6ilg18zUjIbY6/giphy-downsized-large.gif)

## Components

### boombox

This component controls the boombox’s audio playback and its associated UI, which includes interactive buttons for pausing and playing music. The state machine manages the boombox’s state, switching between ‘on’ (playing) and ‘off’ (paused) modes.

## Functionality

When the boombox component is added to an entity:

1. Displays a 3D UI in the AR scene, including play and pause buttons.
2. Toggles between on and off states based on user interaction.
3. When in the on state, the boombox plays music and updates the UI to show a pause button.
4. When in the off state, the boombox pauses the music and updates the UI to show a play button.
5. Handles touchstart events for the UI buttons.

## Schema:

- screenRef: ecs.eid - Reference to the UI element that displays the play/pause button.
- imagePlay: ecs.string - Path to the play button image.
- imagePause: ecs.string - Path to the pause button image.

## Code Highlight:

```ts
ecs.registerComponent({
  name: 'boombox',
  schema: {
    screenRef: ecs.eid,
    // @asset
    imagePlay: ecs.string,
    // @asset
    imagePause: ecs.string,
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    ecs.defineState('on')
      .onEnter(() => {
        console.log('on')
        ecs.Audio.mutate(world, eid, (cursor) => {
          cursor.paused = false
        })
        ecs.Ui.mutate(world, schemaAttribute.get(eid).screenRef, (cursor) => {
          cursor.image = schemaAttribute.get(eid).imagePause
        })
      })
      .onEvent(
        ecs.input.SCREEN_TOUCH_START,
        'off',
        {
          target: schemaAttribute.get(eid).screenRef,
        }
      )
      .initial()

    ecs.defineState('off')
      .onEnter(() => {
        console.log('off')
        ecs.Audio.mutate(world, eid, (cursor) => {
          cursor.paused = true
        })
        ecs.Ui.mutate(world, schemaAttribute.get(eid).screenRef, (cursor) => {
          cursor.image = schemaAttribute.get(eid).imagePlay
        })
      })
      .onEvent(
        ecs.input.SCREEN_TOUCH_START,
        'on',
        {
          target: schemaAttribute.get(eid).screenRef,
        }
      )
  },
});
```

This code demonstrates:

- How the state machine toggles between playing and pausing audio.
- Updating the UI image to reflect the current state of the boombox.

## Additional Features:

- Adds event listeners for SCREEN_TOUCH_START events to toggle between states, allowing users to control the boombox’s playback through the 3D UI.

## Attribution

Boombox by Poly by Google [CC-BY] (https://creativecommons.org/licenses/by/3.0/) via Poly Pizza (https://poly.pizza/m/4hZk7Fg8KiP)

"Tiki Bar Mixer" Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0 License
http://creativecommons.org/licenses/by/4.0/
