let cylinder

const skyRemoteAuthoringComponent = {
  schema: {
    foreground: {type: 'boolean', default: true},
  },
  init() {
    // reparent elements from sky-scene to the regular a-scene
    const skyScene = document.querySelector('sky-scene')
    Array.from(skyScene.children).forEach((child) => {
      this.el.object3D.add(child.object3D)
    })

    // Remove mobile-specific components from scene
    setTimeout(() => {
      this.el.removeAttribute('xrlayers')
    }, 0)
    this.el.removeAttribute('xrextras-loading')
    this.el.removeAttribute('xrextras-runtime-error')
    this.el.removeAttribute('landing-page')
    this.el.removeAttribute('sky-coaching-overlay')

    // fixes A-frame inspector visual lag bug
    this.el.renderer.autoClearColor = true

    // Create the cylinder element that the foreground is attached to
    cylinder = document.createElement('a-cylinder')
    cylinder.setAttribute('open-ended', true)
    cylinder.setAttribute('material', 'depthTest:false; fog:false; opacity:.96')
    cylinder.setAttribute('transparent', true)
    cylinder.setAttribute('src', '#foreground')
    cylinder.setAttribute('side', 'back')
    cylinder.setAttribute('position', '0 -.5 0')
    cylinder.setAttribute('scale', '100 350 100')

    // Create the plane element
    const plane = document.createElement('a-plane')
    plane.setAttribute('material', 'src: #groundTex; repeat:1500 15000;')
    plane.setAttribute('color', '#808080')
    plane.setAttribute('height', '1000')
    plane.setAttribute('width', '100')
    plane.setAttribute('scale', '100 100 100')
    plane.setAttribute('rotation', '-90 0 0')
    plane.setAttribute('position', '0 0 0')

    // raise camera to human height to mimic eye-level
    const camera = document.querySelector('a-camera')
    camera.setAttribute('position', '0 2 0')

    // Add fog element
    this.el.setAttribute('fog', 'type: exponential; color: #AAA; density:0.01')

    // Attach the elements to the scene
    this.el.appendChild(cylinder)
    this.el.appendChild(plane)
  },
  update(oldData) {
    // allows you to toggle foreground in the aframe inspector
    if (this.data.foreground !== oldData.foreground) {
      if (this.data.foreground) {
        cylinder.setAttribute('visible', true)
      } else {
        cylinder.setAttribute('visible', false)
      }
    }
  },
}
export {skyRemoteAuthoringComponent}
