# A-Frame: Image Target Portal with Navigation Mesh

This experience combines image targets, portals and nav mesh. 

Move the character around with the joystick and if you want to reset the character to the starting position, just click the reset button. 

![](https://media.giphy.com/media/Sikm1W3qgLqOZmOLtX/giphy.gif)

The nav-mesh 3d model is a single mesh that constrains the character within its boundaries. This mesh is set to visible=false within the scene so that you do not see the mesh itself.

The environment 3d model doesn't include any logic of the navigation mesh, but instead is what is rendered within the experience.

The environment and nav-mesh were built and created using Blender

A good workflow is to create your 3D environment and then build the nav-mesh on top of your final environment. Then export both the nav-mesh and 3D enviornment as TWO seperate files and import them into the project.

For more information about nav-meshes you can reference this project [here](https://www.8thwall.com/8thwall/navigation-mesh).

For more information about image targets and image target events reference this project [here] (https://www.8thwall.com/8thwall/image-target-portal-aframe).

TEST THE EXPERIENCE ON THE IMAGE TARGET BELOW

![](https://i.imgur.com/eINFMOS.png)

#### Attribution

[Navigation Mesh Component](https://github.com/AdaRoseCannon/aframe-xr-boilerplate)

[Robot 3D Model](https://threejs.org/examples/?q=morph#webgl_animation_skinning_morph)

[Platformer Kit] (https://kenney.nl/assets/platformer-kit)
