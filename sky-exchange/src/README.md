# A-Frame: Sky Effects

This Sky Effects sample project showcases the sky coaching overlay, explains how to use the `<sky-scene>` to attach assets to the sky segmentation layer, and how to replace the sky texture.

![](https://i.giphy.com/media/AeFdztc3ffUyHIE9R5/giphy.gif)

For detailed documentation, visit the [Sky Effects docs](https://www.8thwall.com/docs/web/#xr8layerscontroller) 🔗

NOTE: SLAM + Sky Effects is currently not supported.

#### Sky Effects Overview
* components/
  * **sky-debug.js** adds debug UI and configures functionality to swap textures, invert the segmentation mask, and to recenter the sky scene.
  * **sky-arrows.js** adds UI arrows to control the horizontal movement of the Doty model. 
  * **sky-recenter.js** recenters the sky scene automatically when sky is initially detected to ensure that the scene forward direction is the same as where sky was found.
  * **sky-coaching-overlay** configures a sky coaching overlay to instruct users to look towards the sky when they are not looking at it. This component comes from the API 
  and can be added using `<meta name="8thwall:package" content="@8thwall.coaching-overlay">`
  * **sky-remote-authoring** reconfigures your scene for sky effects desktop development and allows for remote authoring.

* assets/models/
  * **airship.glb** animated Niantic airship fixed to the world
  * **doty.glb** animated Niantic mascot that can be controlled with sky-arrows
* assets/textures/
  * **space.png** default space texture with an opacity gradient applied to the bottom to help with edge feathering
  * **foreground.svg** used by the `sky-remote-authoring` componenent to mimic foreground objects such as buildings and textures
  * **ground.svg** used by the `sky-remote-authoring` component to attach a grid-style texture to the ground
* assets/UI/
  * **invertMask.svg** used by the `sky-debug` component as the icon for the Invert button
  * **recenter.svg** used by the `sky-debug` component as the icon for the Reset button
  * **swapTexture.svg** used by the `sky-debug` component as the icon for the Swap button
  * **triangle.svg** used by the `sky-arrows` component as the icon for the arrows

![](https://i.giphy.com/media/Bv3GSyMhX1Qisc0VWW/giphy.gif)

### *Developing Sky Effects Experiences*
Sky effects scenes are designed for scenes that exist only in the sky.

1. In your `<a-scene>` add the `xrlayers` component
2. In your scene, add a sky scene using `<sky-scene> </sky-scene>`
3. Parent objects under the sky scene to attach them to the sky layer.

Using Components for Sky Effects

* The `#pivot` `<a-entity>` will help you position assets in a spherical manner, it acts as a pivot that you offset your object from
and then lets you position the object by rotating the pivot on the x and y axes. You may have to alter the rotation of the object itself depending on where you
are positioning the object.

* The `sky-debug` component surfaces some useful API features which include: inverting the sky mask to expose a layer that includes everything that is not sky, swapping
the texture that replaces the sky, and recentering the sky scene.

* The `sky-coaching-overlay` helps instruct users to find the sky in order to start the sky effects experience.

### *Remote Desktop Development Setup*
![](https://media.giphy.com/media/HyrfHNnj0UKpnDj7PM/giphy-downsized-large.gif)


It is often helpful to use the `sky-remote-authoring` component to position sky effects content remotely on your desktop. 
To set up this project's scene for remote desktop development, disable any components related to 8thWall's AR engine or mobile development
by adding a letter to the beginning (i.e. "Zxrlayers") or removing it altogether. The `sky-remote-authoring` component will automatically remove the following components:

- xrlayers
- xrextras-loading
- xrextras-runtime-error
- landing-page
- sky-coaching-overlay

Next, add the `sky-remote-authoring` component to your <a-scene> element as last component in the list of attached components (after `xrlayers`).

Now you can open the sky effects scene and position content relative to the sky through any desktop browser!

Extra Notes:
* Make sure opacity is set to 1 on the <a-sky> element if the sky texture is not visible.
* Toggle the foreground element using the schema value `foreground` on the `sky-remote-authoring` component.
* The `sky-remote-authoring` component will automatically reparent elements in your <sky-scene> to the <a-scene> for desktop development
* Ensure `sky-remote-authoring` is listed last/in the correct order on the <a-scene> element or else remote authoring may not work correctly.

### *Other Features* 
* Laptop Mode: Sky effects also work on laptop cameras.
* Pin to Camera: Pin sky effects to the camera instead of to the world by nesting the whole `<sky-scene>` within the `<a-camera>` or you can
append the camera to the `<sky-scene>` and append specific objects to the camera. 
* Remote Development: An alternative to using the `sky-remote-authoring` component would be to use a stock image of the sky ([example](https://wallpapercave.com/wp/wp2894344.jpg)) on a monitor.

### About Sky Effects
With Sky Effects for 8th Wall, developers now have the power to turn day into night, stage an AR alien 
invasion with flying UFOs and let users interact with larger than life characters that tower over 
the city skyline. While the sky's the limit in the use of this new feature, Sky Effects are a perfect 
way to celebrate a new movie release, add visual effects to an outdoor concert  or take a sports game to the next level
