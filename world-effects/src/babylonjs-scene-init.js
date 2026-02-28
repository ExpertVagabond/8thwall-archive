// Define an 8th Wall XR Camera Pipeline Module that adds a cube to a babylonjs scene on startup.

// Populates some object into an XR scene and sets the initial camera position.
const initXrScene = ({scene, camera}) => {
  // Light.
  const light = new BABYLON.DirectionalLight('light', new BABYLON.Vector3(-5, -10, 7), scene)
  light.intensity = 0.0

  // Cube.
  const box = BABYLON.MeshBuilder.CreateBox('box', {size: 1.0}, scene)
  box.material = new BABYLON.StandardMaterial('boxMaterial', scene)
  box.material.diffuseTexture = new BABYLON.Texture('https://cdn.8thwall.com/web/assets/cube-texture.png', scene)
  box.material.emissiveColor = new BABYLON.Color3.FromHexString('#AD50FF')
  box.position = new BABYLON.Vector3(0, 0.5, 2)

  // Shadow receiver.
  const ground = BABYLON.Mesh.CreatePlane('ground', 2000, scene)
  ground.rotation.x = Math.PI / 2
  ground.material = new BABYLON.ShadowOnlyMaterial('shadowOnly', scene)
  ground.receiveShadows = true
  ground.position.y = 0

  // Shadow generator.
  const shadowGenerator = new BABYLON.ShadowGenerator(512, light)
  shadowGenerator.addShadowCaster(box, true)
  shadowGenerator.useBlurExponentialShadowMap = true
  shadowGenerator.blurScale = 2
  shadowGenerator.setDarkness(0.33)

  // Set the initial camera position relative to the scene we just laid out. This must be at a
  // height greater than y=0.
  camera.position = new BABYLON.Vector3(0, 2, -2)
}

const recenterTouchHandler = (e) => {
  // Call XrController.recenter() when the canvas is tapped with one finger.
  // This resets the AR camera to the position specified by
  // XrController.updateCameraProjectionMatrix() above.
  if (e.touches.length === 1) {
    XR8.XrController.recenter()
  }
}

export const startScene = (canvas) => {
  const engine = new BABYLON.Engine(canvas, true /* antialias */)
  const scene = new BABYLON.Scene(engine)
  const camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, 0, 0), scene)

  initXrScene({scene, camera})

  // Connect camera to XR and show camera feed
  camera.addBehavior(XR8.Babylonjs.xrCameraBehavior(), true)

  canvas.addEventListener('touchstart', recenterTouchHandler, true)  // Add touch listener.
  engine.runRenderLoop(() => scene.render())

  window.addEventListener('resize', () => engine.resize())
}
