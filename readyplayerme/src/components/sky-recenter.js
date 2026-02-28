// sky-recenter.js - Reconstructed from 8th Wall export (original lost during export)
// Recenters the sky effects layer when the scene loads

const recenterComponent = {
  init() {
    const scene = this.el.sceneEl || this.el
    scene.addEventListener('realityready', () => {
      try {
        XR8.LayersController.recenter()
      } catch (e) {
        // LayersController may not be available outside 8th Wall
      }
    })
  },
}

export {recenterComponent}
