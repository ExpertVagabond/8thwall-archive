// Component that places cacti where the ground is clicked
let rotation
export const tapPlaceComponent = {
  schema: {
    min: {default: 6},
    max: {default: 10},
  },
  init() {
    const mesh = document.getElementById('mesh')
    const camera = document.getElementById('camera')

    mesh.addEventListener('click', (event) => {
      // Create new entity for the new object
      const newElement = document.createElement('a-entity')

      // The raycaster gives a location of the touch in the scene
      const touchPoint = event.detail.intersection.point
      const faceNormal = event.detail.intersection.face.normal.normalize()

      newElement.setAttribute('position', touchPoint)
      newElement.setAttribute('animation-mixer', 'clip: *; loop: once')
      // newElement.object3D.lookAt(camera.object3D.rotation)

      const randomScale = Math.floor(Math.random() * (Math.floor(this.data.max) - Math.ceil(this.data.min)) + Math.ceil(this.data.min))

      newElement.setAttribute('visible', 'false')
      newElement.setAttribute('scale', '0.0001 0.0001 0.0001')

      newElement.setAttribute('shadow', {
        receive: false,
      })

      newElement.setAttribute('gltf-model', '#cactus')
      this.el.sceneEl.appendChild(newElement)

      newElement.addEventListener('model-loaded', () => {
        // Once the model is loaded, we are ready to show it popping in using an animation
        newElement.setAttribute('visible', 'true')
        newElement.setAttribute('animation', {
          property: 'scale',
          to: '3 3 3',  // ${randomScale} ${randomScale} ${randomScale}
          easing: 'easeOutElastic',
          dur: 800,
        })
        const {quaternion} = newElement.object3D
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), faceNormal)
      })
    })
  },
}
