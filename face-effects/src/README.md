# Studio: Face Effects

Get started with 8th Wall Face Effects!

![](https://static.8thwall.app/assets/multiface-fm8afic2g8.gif)

## Spaces

Each space showcases different capabilities of 8th Wall's Face Effects.

### 🧍‍♂️ Default Space

A great starting point for learning how to:

- Attach 3D objects to facial landmarks using the front-facing camera
- Use the Photo Booth prefab to capture and share selfies

![Default Space](https://static.8thwall.app/assets/ScreenRecording2025-06-27at11.20.25AM-ezgif.com-optimize-egn29qdc71.gif)

### 🍎 Falling Apples

Demonstrates how to:

- Integrate basic physics interactions with face tracking
- Create playful, interactive experiences that respond to user movement

![Apples Falling](https://static.8thwall.app/assets/ScreenRecording2025-06-27at11.14.08AM-ezgif.com-optimize-1rvepmi9h8.gif)

## Prefabs

### 📸 Photo Booth

- Easily add photo-taking and sharing functionality
- Ideal for selfie-based experiences and social sharing

![Photo Booth Prefab](https://static.8thwall.app/assets/photobooth-prefab-pczehda0ap.gif)

### 🍏 Apple Spawner

- Creates new instances of the "Apple" prefab every second

### Reference Assets

For customizing the face mesh or designing your own effects:

- Download UV maps from /assets/common/:
  - uv-black.png
  - uv-bright.png
- Download the face mesh model for use in 3D software:
  - [facemesh.obj](https://cdn.8thwall.com/web/assets/face/facemesh.obj).

#### Attribution

Stereo glasses by [jau0gan](https://www.turbosquid.com/3d-models/free-stereo-3d-model/613193)

---

# Studio: This or That

This project demonstrates how to create a this or that face filter effect, using head tilt as an input selection mechanism to select between two options. The quiz options dynamically change after each selection, offering a variety of choices.

![](https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWllYmdtbXE4ZmoyYXQ2NnQxNWdrb3R0d2hqc3gzMHl3eXo1bXB0dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ERw8p3fyapse12mrBn/giphy.gif)

## Components

### `select.js`

The core component responsible for managing the quiz options and processing head tilts to make selections.

#### Functionality

When the `select` component is added to an entity:

- **Displays two options** (e.g., "McDonald's" vs "Chick-fil-A") using logos.
- **Head tilts are used for selection**:
  - Tilting the head to the left selects the left option.
  - Tilting the head to the right selects the right option.
- **Updates the visuals**: The selected option's color changes to indicate the user's choice.
- **Switches to new options** after a short delay once a choice is made.

#### Schema

- `left`: `ecs.eid` - Entity ID for the left choice.
- `right`: `ecs.eid` - Entity ID for the right choice.
- `leftLogo`: `ecs.eid` - Entity ID for the left option's logo.
- `rightLogo`: `ecs.eid` - Entity ID for the right option's logo.

#### Code Highlights

```javascript
const options = [
  ['mcdonalds', 'cfa'],
  ['tesla', 'mercedes'],
  ['chanel', 'lvmh'],
];
let optionIdx = 0;
const update = () => {
  setTimeout(() => {
    optionIdx = (optionIdx + 1) % options.length;
    const newOptions = options[optionIdx];
    ecs.Material.set(world, leftLogo, {
      textureSrc: `${require(`./assets/${newOptions[0]}.png`)}`,
    });
    ecs.Material.set(world, rightLogo, {
      textureSrc: `${require(`./assets/${newOptions[1]}.png`)}`,
    });
  }, 1000);
};
```

This snippet demonstrates:

- Managing quiz options.
- Updating the displayed logos for each option dynamically.

#### Event Listener

The component listens for the `facecontroller.faceupdated` event to track head movement and make selections based on the user's face rotation.
