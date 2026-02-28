// ////////////////////////////
// AVATAR MOVEMENT COMPONENT
// ////////////////////////////
const avatarMoveComponent = {
  schema: {
    speed: {type: 'number', default: 0.007},  // base movement speed
  },
  init() {
    this.camera = document.getElementById('camera')
    this.avatar = this.el.object3D
    const instructText = document.getElementById('instructions')

    /// ////////////////////////////// TOUCHSCREEN SETUP //////////////////////////////////////////
    this.handleTouch = (e) => {
      this.positionRaw = e.detail.positionRaw
      this.startPositionRaw = this.startPositionRaw || this.positionRaw
    }

    this.clearTouch = (e) => {
      this.startPositionRaw = null
      this.isMoving = false
    }

    window.addEventListener('onefingerstart', this.handleTouch)
    window.addEventListener('onefingermove', this.handleTouch)
    window.addEventListener('onefingerend', this.clearTouch)

    const overlay = document.getElementById('overlay')

    this.joystickParent = document.createElement('div')
    this.joystickParent.classList.add('joystick-container', 'absolute-fill', 'shadowed')

    this.joystickPosition = document.createElement('div')
    this.joystickPosition.classList.add('joystick', 'position')
    this.joystickParent.appendChild(this.joystickPosition)

    this.joystickOrigin = document.createElement('div')
    this.joystickOrigin.classList.add('joystick', 'origin')
    this.joystickParent.appendChild(this.joystickOrigin)

    overlay.appendChild(this.joystickParent)

    /// ////////////////////////////// CONTROLLER SETUP //////////////////////////////////////////
    this.hasGamepad = false

    // traditional gamepad setup
    window.addEventListener('gamepadconnected', (e) => {
      const gp = navigator.getGamepads()[e.gamepad.index]
      this.hasGamepad = true
      instructText.innerText = 'MOVE LEFT JOYSTICK TO WALK'
    })

    // xr controller setup
    this.el.sceneEl.addEventListener('enter-vr', () => {
      this.el.sceneEl.xrSession.addEventListener('inputsourceschange', (e) => {
        if (e.added.length !== 0) {
          if (e.added[0].gamepad.axes.length === 0) {
            this.vrType = 'hands'
            instructText.innerText = 'PINCH AND DRAG TO WALK'
          } else if (e.added[0].gamepad.axes.length === 4) {
            this.vrType = 'controllers'
            instructText.innerText = 'MOVE LEFT JOYSTICK TO WALK'
          }
        }

        this.hasGamepad = true
        this.isInHeadset = true
      })
    })

    /// ////////////////////////////// KEYBOARD SETUP //////////////////////////////////////////
    this.usingKeyboard = true

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') {
        this.fwd = true
      }

      if (e.key === 'ArrowDown' || e.key === 's') {
        this.back = true
      }

      if (e.key === 'ArrowLeft' || e.key === 'a') {
        this.left = true
      }

      if (e.key === 'ArrowRight' || e.key === 'd') {
        this.right = true
      }

      if (!this.usingKeyboard) {
        this.usingKeyboard = true
      }
      instructText.innerText = 'WASD OR ARROWS TO WALK'
    }

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') {
        this.fwd = false
      }

      if (e.key === 'ArrowDown' || e.key === 's') {
        this.back = false
      }

      if (e.key === 'ArrowLeft' || e.key === 'a') {
        this.left = false
      }

      if (e.key === 'ArrowRight' || e.key === 'd') {
        this.right = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  },

  update() {
    this.speed = this.data.speed
  },

  tick(time, timeDelta) {
    const sensitivity = 0.3

    /// ////////////////////////////// INPUT SELECTION //////////////////////////////////
    const inputCheck = (input) => {
      switch (input) {
        case 'xrGamepad':
          // VR controller (i.e. Oculus Quest)
          if (this.vrType === 'controllers' && this.el.sceneEl.xrSession.inputSources.length > 0) {
            const controllers = Array.from(this.el.sceneEl.xrSession.inputSources)
            let vrLeftVert; let
              vrLeftHoriz

            // left thumbstick controls character
            for (let i = 0; i < controllers.length; i++) {
              if (controllers[i].handedness === 'left') {
                vrLeftVert = this.el.sceneEl.xrSession.inputSources[i].gamepad.axes[3]
                vrLeftHoriz = this.el.sceneEl.xrSession.inputSources[i].gamepad.axes[2]
              }
            }

            if (vrLeftVert > sensitivity || vrLeftVert < -sensitivity || vrLeftHoriz < -sensitivity || vrLeftHoriz > sensitivity) {
              this.forward = -Math.min(Math.max(-1, vrLeftVert), 1)
              this.side = -Math.min(Math.max(-1, vrLeftHoriz), 1)
              this.isMoving = true
            } else {
              this.isMoving = false
            }
          }
          break
        case 'gamepad':
          // traditional gamepad (i.e. Xbox, Playstation, etc)
          if (this.gamepads[0]) {
            const gamepadLeftVert = this.gamepads[0].axes[1]
            const gamepadLeftHoriz = this.gamepads[0].axes[0]
            if (gamepadLeftVert > sensitivity || gamepadLeftVert < -sensitivity || gamepadLeftHoriz < -sensitivity || gamepadLeftHoriz > sensitivity) {
              this.forward = -Math.min(Math.max(-1, gamepadLeftVert), 1)
              this.side = -Math.min(Math.max(-1, gamepadLeftHoriz), 1)
              this.isMoving = true
            } else {
              this.isMoving = false
            }
          }
          break
        case 'keyboard':
          if (!this.fwd && !this.back && !this.left && !this.right) {
            this.usingKeyboard = false
            this.isMoving = false
            return
          }

          // diagonal controls
          if (this.fwd && this.left) {
            this.forward = -Math.min(Math.max(-1, -1), 1)
            this.side = -Math.min(Math.max(-1, -1), 1)
          }

          if (this.fwd && this.right) {
            this.forward = -Math.min(Math.max(-1, -1), 1)
            this.side = -Math.min(Math.max(-1, 1), 1)
          }

          if (this.back && this.left) {
            this.forward = -Math.min(Math.max(-1, 1), 1)
            this.side = -Math.min(Math.max(-1, -1), 1)
          }

          if (this.back && this.right) {
            this.forward = -Math.min(Math.max(-1, 1), 1)
            this.side = -Math.min(Math.max(-1, 1), 1)
          }

          // cardinal controls
          if (this.fwd && !this.left && !this.right) {
            this.forward = -Math.min(Math.max(-1, -1), 1)
            this.side = 0
          }

          if (this.back && !this.left && !this.right) {
            this.forward = -Math.min(Math.max(-1, 1), 1)
            this.side = 0
          }

          if (this.left && !this.fwd && !this.back) {
            this.forward = 0
            this.side = -Math.min(Math.max(-1, -1), 1)
          }

          if (this.right && !this.fwd && !this.back) {
            this.forward = 0
            this.side = -Math.min(Math.max(-1, 1), 1)
          }

          this.isMoving = true
          break
        default:
          // touch input
          if (this.offsetY > sensitivity || this.offsetY < -sensitivity || this.offsetX < -sensitivity || this.offsetX > sensitivity) {
            this.forward = -Math.min(Math.max(-1, this.offsetY), 1)
            this.side = -Math.min(Math.max(-1, this.offsetX), 1)
            this.isMoving = true
          } else {
            this.isMoving = false
          }
      }
    }

    /// ////////////////////////////// TOUCHSCREEN MANAGEMENT //////////////////////////////////////////
    const {startPositionRaw, positionRaw, headModel} = this

    if (startPositionRaw) {
      const isDesktop = window.matchMedia('(min-width: 961px)').matches
      const maxRawDistance = Math.min(window.innerWidth, window.innerHeight) / (isDesktop ? 12 : 6.5)

      let rawOffsetX = positionRaw.x - startPositionRaw.x
      let rawOffsetY = positionRaw.y - startPositionRaw.y

      const rawDistance = Math.sqrt((rawOffsetX ** 2) + (rawOffsetY ** 2))

      if (rawDistance > maxRawDistance) {  // Normalize to maxRawDistance
        rawOffsetX *= maxRawDistance / rawDistance
        rawOffsetY *= maxRawDistance / rawDistance
      }

      const widthScale = 100 / window.innerWidth
      const heightScale = 100 / window.innerHeight

      this.joystickParent.classList.add('visible')
      this.joystickOrigin.style.left = `${startPositionRaw.x * widthScale}%`
      this.joystickOrigin.style.top = `${startPositionRaw.y * heightScale}%`
      this.joystickPosition.style.left = `${(startPositionRaw.x + rawOffsetX) * widthScale}%`
      this.joystickPosition.style.top = `${(startPositionRaw.y + rawOffsetY) * heightScale}%`

      this.offsetX = rawOffsetX / maxRawDistance
      this.offsetY = rawOffsetY / maxRawDistance

      inputCheck()
    } else if (this.hasGamepad === true) {
    /// ////////////////////////////// CONTROLLER MANAGEMENT //////////////////////////////////////////
      this.gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : [])
      if (!this.gamepads) {
        return
      }

      if (this.isInHeadset) {
        inputCheck('xrGamepad')
      } else {
        inputCheck('gamepad')
      }
    }

    if (this.usingKeyboard === true) {
      inputCheck('keyboard')
    }

    /// ////////////////////////////// CHARACTER MOVEMENT //////////////////////////////////

    if (this.isMoving) {
      const camY = this.camera.object3D.rotation.y  // get y rot of camera
      this.joystickRot = Math.atan2(this.forward, this.side)
      this.joystickRot -= camY

      this.avatar.position.z -= this.speed * Math.sin(this.joystickRot) * timeDelta
      this.avatar.position.x -= this.speed * Math.cos(this.joystickRot) * timeDelta
      this.avatar.rotation.y = -this.joystickRot - Math.PI / 2

      // Animations to call include RUNNING, WALKING, IDLE, VICTORY, DEFEAT
      this.el.setAttribute('rig-animation', {
        clip: 'RUNNING',
        loop: 'repeat',
        crossFadeDuration: 0.4,
      })
    } else {
      this.el.setAttribute('rig-animation', {
        clip: 'IDLE',
        loop: 'repeat',
        crossFadeDuration: 0.4,
      })
      this.joystickParent.classList.remove('visible')
      this.forward = 0
      this.side = 0
    }
  },

  remove() {
    window.removeEventListener('onefingerstart', this.handleTouch)
    window.removeEventListener('onefingermove', this.handleTouch)
    window.removeEventListener('onefingerend', this.clearTouch)

    this.joystickParent.parentNode.removeChild(this.joystickParent)
  },
}

// ////////////////////////////
// SWAP CAMERA COMPONENT
// ////////////////////////////
const swapCamComponent = () => ({
  init() {
    const scene = this.el.sceneEl
    const camera = document.getElementById('camera')
    const camBtn = document.getElementById('swap-cam-btn')
    const flipBg = document.getElementById('flipBg')
    const overlay = document.getElementById('overlay')
    const background = document.getElementById('faceEffectsBackground')

    let faceEffects = false

    scene.addEventListener('realityready', () => {
      // fade from black
      flipBg.classList.add('fade-out')
      setTimeout(() => {
        flipBg.classList.remove('fade-out')
        flipBg.style.opacity = 0
      }, 500)
    })
    camBtn.addEventListener('click', () => {
      const rpm = document.getElementById('avatar')
      const rpmSrc = rpm.components['gltf-model'].data

      camBtn.classList.add('pulse-once')

      setTimeout(() => {
        camBtn.classList.remove('pulse-once')
        flipBg.style.opacity = 1
        if (!faceEffects) {
          rpm.setAttribute('visible', 'false')
          overlay.style.display = 'none'
          background.setAttribute('visible', 'true')
          // Set scene for face effects
          scene.removeAttribute('xrweb')
          scene.setAttribute('xrface', {
            mirroredDisplay: true,
            cameraDirection: 'front',
            allowedDevices: 'any',
          })
          scene.insertAdjacentHTML('beforeend',
            ` 
            <a-entity id="avatarFaceEffects" avatar-anchor>
                <a-entity 
                 gltf-model='${rpmSrc}'
                 cubemap-static
                 scale="8.2 8.2 8.2" 
                 position="0 -13.75 0.2" 
                 rotation="0 180 0"
                ></a-entity>
            </a-entity>
        `)
          scene.insertAdjacentHTML('beforeend',
            ` 
          <xrextras-capture-button></xrextras-capture-button>
          <xrextras-capture-config request-mic="manual"></xrextras-capture-config>
          <xrextras-capture-preview></xrextras-capture-preview>
        `)
          // Set faceEffects true
          faceEffects = true
        } else {
          const captureBtn = document.querySelector('xrextras-capture-button')
          const avatar = document.getElementById('avatarFaceEffects')
          captureBtn.parentNode.removeChild(captureBtn)
          avatar.parentNode.removeChild(avatar)
          // Set scene for joystick
          scene.removeAttribute('xrface')
          scene.setAttribute('xrweb', {
            allowedDevices: 'any',
            disableDesktopCameraControls: 'true',
            defaultEnvironmentFogIntensity: 0.5,
            defaultEnvironmentFloorColor: '#FFF',
            defaultEnvironmentFloorTexture: '#tile',
            defaultEnvironmentSkyBottomColor: '#BCE9FD',
            defaultEnvironmentSkyTopColor: '#5ac8fa',
            defaultEnvironmentSkyGradientStrength: 0.5,
          })
          background.setAttribute('visible', 'false')
          overlay.style.display = 'block'
          // Re-center scene
          rpm.object3D.position.set(0, 0, 0)
          scene.emit('recenter')
          camera.setAttribute('position', {x: 0, y: 4, z: 4})
          // Set joystick avatar visible
          rpm.setAttribute('visible', 'true')
          window.dispatchEvent(new Event('resize'))
          // Set faceEffects false
          faceEffects = false
        }
      }, 500)
    })
  },
})
// ////////////////////////////
// AVATAR RECENTER COMPONENT
// ////////////////////////////
const avatarRecenterComponent = {
  init() {
    const recenterBtn = document.getElementById('recenterBtn')
    recenterBtn.addEventListener('click', () => {
      recenterBtn.classList.add('pulse-once')
      setTimeout(() => {
        recenterBtn.classList.remove('pulse-once')
      }, 500)
      this.el.sceneEl.emit('recenter')
      this.el.object3D.position.set(0, 0, 0)
    })
  },
}
export {avatarMoveComponent, swapCamComponent, avatarRecenterComponent}
