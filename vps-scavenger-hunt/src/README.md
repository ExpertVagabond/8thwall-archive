# A-Frame: Lightship VPS Scavenger Hunt

This sample project combines Lightship Maps with Lightship VPS to create a Niantic-style 3D map where
users navigate to 4 different VPS activated Wayspots and open a series of bespoke VPS experiences.

![](https://i.giphy.com/media/faiCpKOvBdfpz0sLz1/giphy.gif)
![](https://i.giphy.com/media/L05xhp8eZbRYMpr94Y/giphy.gif)

For detailed documentation, visit the [Lightship VPS docs](https://www.8thwall.com/docs/web/#lightship-vps) 🔗

#### Lightship VPS Scavenger Hunt Overview
* components/
  * **custom-wayspot.js** manages the Wayspot geofence logic
    * `focused-wayspot`: manages which wayspot is currently selected
    * `custom-wayspot`: primitive defining how wayspots look and behave when near them
    * `responsive-map-theme`: sets different map themes either based on time of day or device's current light/dark mode.
      *  mode: `time` (default) or `device`. '`time`' sets theme based on user location & time of day using [Sunrise-Sunset.org](https://sunrise-sunset.org/). '`device`' uses device's current light/dark mode.
      *  light-theme: the name of the theme to display during the day or when device is in light mode
      *  dark-theme: the name of the theme to display at night or when device is in dark mode
    * `map-loading-screen`: loading screen that dismisses after scene assets have loaded and user location has been acquired
    * `map-debug-controls`: hold down WASD keys (W = North, A = West, S = South, D = East) to change the user position for debugging
      *  distance: how far the map will move in lat/long (default: 0.0001)
  * **named-wayspot.js** configures an <a-entity> to localize against a Project Wayspot by name. Sets animation visible when found. 
  * **shadow-shader.js** sets a shadow shader on the attached mesh. Includes polygon offset to avoid z-fighting.
* scenes/
  * **california-p.html** Squaloons (square balloons) blow in the wind, bouncing off this apartment sign
  * **college-ave.html** Cloth drapes and blows away from this decorative fountain statue
  * **concrete-cir.html** A cube of cubes breaks apart on impact, spilling all around this concrete circle
  * **lost-in-my-a.html** Colorful shapes collide with this mural and surrounding walls
  * **world-map.html** Niantic-style map scene where you walk in the real world to different Wayspots to launch a series of bespoke VPS experiences
* **main.css** styling rules for detect-mesh scene UI
* assets/map-assets/
  * **doty.glb** Niantic's [Captain Doty](https://8w.8thwall.app/welcome/)
  * **poi-disc.glb** Wayspot 3D model
  * **walk-icon.svg** SVG image of a pedestrian
* assets/vps-animations/ (draco-compressed baked physics animations from blender)
  * **california-p-anim** 
  * **concrete-cir-anim.glb** 
  * **college-ave-anim.glb**
  * **lost-in-my-a-anim.glb**
* assets/wayspot-meshes/ (reference meshes used as occluders. From Geospatial Browser)
  * **california-p.glb**
  * **concrete-cir.glb**
  * **college-ave.glb**
  * **lost-in-my-a.glb**
* modules/
  * **lightship-maps** adds Niantic Lightship Maps to your project

### Using the Niantic Lightship Maps for Web Module

Niantic Lightship Maps for Web provides easy-to-use and customizable real-world maps to build your location-based WebAR experiences. 

Click on the module to read the documentation.

### *Developing Bespoke VPS Experiences*

Bespoke VPS scenes are designed for a single Wayspot and utilize a reference mesh from the Geospatial Browser to align AR content.

Part 1: Add Wayspot to scene

1. Open the Geospatial Browser (map icon 🗺 on the left)
2. Find an activated Wayspot (or [activate a wayspot](https://www.8thwall.com/docs/web/#scanning-wayspots))
3. Add the activated Wayspot to your project
 
![](https://static.8thwall.app/assets/geospatial-browser-jmcd7ic3ob.png)

Part 2: Use Wayspot GLB as reference for custom AR animation

4. Download the reference GLB from the right side of the row.
5. Use this in your 3D modeling software (Blender, Maya, A-Frame, etc) to position AR content relative to the mesh origin.

*IMPORTANT*: The origin of this 3D model is the origin of the Wayspot. DO NOT RESET THE ORIGIN OR YOUR CONTENT WILL NOT BE ALIGNED.

![](https://i.giphy.com/media/dOFnRHGzZghGjecdeq/giphy.gif) 

6. Import animation GLB into Cloud Editor and add to scene
7. Add the named-wayspot component to your asset's <a-entity>. The 'name' attribute refers to the Project Wayspot's name.

Ta-da! 🪄 Your animation should appear aligned to the Wayspot in the real world.

Part 3: Adding occlusion and shadows

1. In your scene, add `<a-entity named-wayspot="name: YOURWAYSPOTNAME"><a-entity>`
2. Add three `<a-entity>` inside this element as its children. These will be your occluder mesh, shadow mesh and VPS animation.
3. In the first `<a-entity>`, add `xrextras-hider-material` and `gltf-model="#vps-mesh"`. "`#vps-mesh`" should refer
to a version of your reference GLB that has had its textures removed and geometry decimated.
4. In the second `<a-entity>`, add `shadow-shader`, `gltf-model="#vps-mesh"`, and `shadow="cast: false"`. 
The shadow shader applies a shadow material to the reference mesh with a polygon offset to prevent Z-fighting. 
You can choose whether you want the vps-mesh to cast a shadow on the real world with `shadow="cast: true"`.
5. In the third `<a-entity>`, add `gltf-model="#vps-anim"`, `reflections="type: realtime"`, `play-vps-animation` and `shadow="receive:false"`. 
`play-vps-animation` waits until the `vps-coaching-overlay` has disappeared before playing the VPS animation.

### *Remote Desktop Development Setup* 

![](https://i.giphy.com/media/cBr0UnA7jjqAzAOGTi/giphy.gif)

It is often helpful to use the A-Frame inspector to position content remotely on your desktop. 
To set up this project's scene for remote desktop development, disable the following components 
by adding a letter to the beginning (i.e. "Znamed-wayspot"):

- xrweb -> Zxrweb
- xrextras-loading -> Zxrextras-loading
- named-wayspot -> Znamed-wayspot
- xrextras-hider-material -> Zxrextras-hider-material

Now you can open the [A-Frame Inspector](https://aframe.io/docs/1.3.0/introduction/visual-inspector-and-dev-tools.html)
(Mac: ctrl + opt + i, PC: ctrl + alt + i) and position content relative to the vps mesh imported from the Geospatial Browser.
Remember: this is an *inspector*. You will need to copy the transform values back into your code.

Optionally, you can temporarily reposition the <a-entity named-wayspot> to the center of the scene
to assist with iteration speed. NOTE: reset <a-entity named-wayspot> to position="0 0 0" to ensure VPS
content is aligned correctly.

### *Remote Mobile Development Setup* 

![](https://i.giphy.com/media/ZVQCdOhIHx10Dsrxnf/giphy.gif)

It is often helpful to use the A-Frame inspector to simulate VPS remotely on your mobile device. 
To set up this project's scene for remote mobile development, disable the following components 
by adding a letter to the beginning (i.e. "Znamed-wayspot"):

- named-wayspot -> Znamed-wayspot
- xrextras-hider-material -> Zxrextras-hider-material

Next, you'll need to disable VPS and enable absolute scale. This will ensure the reference mesh
is sized correctly for accurate simulation:

`xrweb="enableVps: false; scale: absolute;"`

You should temporarily reposition the <a-entity named-wayspot> to the center of the scene
to assist with iteration speed. Try to align the base of your reference mesh with y="0" (the ground).
NOTE: Before deploying your VPS project, reset <a-entity named-wayspot> to position="0 0 0" 
to ensure VPS content is aligned correctly.

### About Lightship VPS

https://www.youtube.com/watch?v=PTgtuBrJaOc
https://youtu.be/laK-QxFLELw

With the Lightship Visual Positioning System (VPS) 8th Wall developers now have the power to determine
a user's position and orientation with centimeter-level accuracy - in seconds. Using the 8th Wall platform, 
you can use Lightship VPS in your WebAR projects to create location-based web AR experiences that connect 
the real world with the digital one. WebAR content can be anchored to locations, enabling virtual objects 
to interact with the space they are in. This makes the augmented reality experience feel more personal, 
more meaningful, more real, and gives users new reasons to explore the world around them.

Learn how to create your own public and private Wayspots in the [docs](https://www.8thwall.com/docs/web/#create-new-wayspot).
