const arrowsComponent = {
  init() {
    const {el} = this
    const model = el.object3D
    const scene = this.el.sceneEl
    const pivot = this.el.parentNode
    let rightWalkingInterval
    let leftWalkingInterval

    const bottomBar = document.getElementById('bottomBar')
    const rightButton = document.getElementById('rightButton')
    const leftButton = document.getElementById('leftButton')

    scene.addEventListener('sky-coaching-overlay.hide', () => {
      bottomBar.style.display = 'flex'
    })

    // The current value of the pivot's 'rotation' attribute
    let currentSkyPosition
    // The updated value of the pivot's 'rotation' attribute
    let updatedSkyPosition

    rightButton.addEventListener('touchstart', (e) => {
      rightWalkingInterval = setInterval(() => {
        currentSkyPosition = pivot.getAttribute('rotation')

        // Subtract .5 from the "y" rotation of the pivot
        updatedSkyPosition = {
          x: currentSkyPosition.x,
          y: currentSkyPosition.y - 0.5,
          z: currentSkyPosition.z,
        }
        // Set the updated pivot 'rotation' attribute
        pivot.setAttribute('rotation', updatedSkyPosition)
      }, 25)
      model.rotation.y = Math.PI / 3
      this.el.setAttribute('animation-mixer', {clip: 'walk'})

      e.returnValue = false  // prevents ios magnify/selection on tap hold
    })

    rightButton.addEventListener('touchend', () => {
      this.el.setAttribute('animation-mixer', {clip: 'idle'})
      model.rotation.y = 0
      clearInterval(rightWalkingInterval)
    })

    leftButton.addEventListener('touchstart', () => {
      leftWalkingInterval = setInterval(() => {
        currentSkyPosition = pivot.getAttribute('rotation')

        // Add .5 to the 'y' rotation of the pivot
        updatedSkyPosition = {
          x: currentSkyPosition.x,
          y: currentSkyPosition.y + 0.5,
          z: currentSkyPosition.z,
        }
        // Set the updated pivot 'rotation' attribute
        pivot.setAttribute('rotation', updatedSkyPosition)
      }, 25)
      model.rotation.y = -(Math.PI / 3)
      this.el.setAttribute('animation-mixer', {clip: 'walk'})
    })

    leftButton.addEventListener('touchend', () => {
      this.el.setAttribute('animation-mixer', {clip: 'idle'})
      clearInterval(leftWalkingInterval)
      model.rotation.y = 0
    })

    // Prevent double tap zoom
    document.ondblclick = function (e) {
      e.preventDefault()
    }
  },
}

export {arrowsComponent}
