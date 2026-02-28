/* globals HoloStream */

// This component waits for a tap to place a hologram, and then starts the hologram after dismissing
// prompt text. The hologram uses an invisible cylindar for a touch target.
const holostreamComponent = () => ({
  schema: {
    'src': {default: ''},                         // holostream asset path
    'size': {default: 1},                         // hologram starting size
    'touch-target-size': {default: '1.65 0.35'},  // size of touch target cylinder: height, radius
    'touch-target-offset': {default: '0 0'},      // offset of touch target cylinder: x, z
    'touch-target-visible': {default: false},     // show touch target for debugging
  },
  init() {
    this.meshInitialized = false
    this.showedPrompt = false
    this.camera = document.getElementById('camera')
    this.ground = document.getElementById('ground')
    this.prompt = document.getElementById('promptText')

    const holoStreamOptions = {
      debugEnabled: false,
      targetCanvasID: '',
      threeScene: this.el.sceneEl.object3D,
      threeCamera: this.camera.object3D,
      threeRenderer: this.el.sceneEl.renderer,
      hideUI: true,
      overrideRender: true,
      showPlayButtonOnLoadingScreen: false,
    }

    // create the holostream hologram
    this.holoStream = new HoloStream(holoStreamOptions)
    this.holoStream.openURL(this.data.src)

    // hide hologram entity before placement
    this.holoStream.getThreeMesh().scale.set(0.001, 0.001, 0.001)

    // add a cylinder primitive to receive raycasting for gestures. It is raised slightly
    // off the ground to support tapping on the ground.
    const [tapVolumeHeight, tapVolumeRadius] =
      this.data['touch-target-size'].split(' ').map(v => Number(v))
    const [tapTargetOffsetX, tapTargetOffsetZ] =
      this.data['touch-target-offset'].split(' ').map(v => Number(v))
    const touchTargetAlpha = this.data['touch-target-visible'] ? 0.2 : 0.0

    this.el.insertAdjacentHTML('beforeend', `
    <a-entity 
      id="tap-volume"
      geometry="primitive: cylinder; height: ${tapVolumeHeight}; radius: ${tapVolumeRadius}" 
      material="transparent: true; opacity: ${touchTargetAlpha}; depthTest: false;" 
      position="${tapTargetOffsetX} ${tapVolumeHeight / 2} ${tapTargetOffsetZ}" 
      class="cantap"
      shadow="cast: false; receive: false">
    </a-entity>`)

    // Play/Pause functionality
    this.pauseBtn = document.getElementById('pauseBtn')
    let pause = this.holoStream.playing
    const playImg = require('./assets/icons/play.svg')
    const pauseImg = require('./assets/icons/pause.svg')
    const pauseHcap = () => {
      pause = !pause
      if (pause) {
        this.pauseBtn.src = playImg
        this.holoStream.handlePlay(false)  // pause hcap
      } else {
        this.pauseBtn.src = pauseImg
        this.holoStream.handlePlay(true)  // play hcap
      }
    }
    this.pauseBtn.addEventListener('click', pauseHcap)

    // Mute/Unmute functionality
    this.muteBtn = document.getElementById('muteBtn')
    let mute = this.holoStream.videoWorker.videoPlayer.muted
    const muteImg = require('./assets/icons/mute.svg')
    const soundImg = require('./assets/icons/sound.svg')
    const muteHcap = () => {
      mute = !mute
      if (mute) {
        this.muteBtn.src = muteImg
        this.holoStream.videoWorker.videoPlayer.muted = true  // mute hcap
      } else {
        this.muteBtn.src = soundImg
        this.holoStream.videoWorker.videoPlayer.muted = false  // unmute hcap
      }
    }
    this.muteBtn.addEventListener('click', muteHcap)

    this.placeHologram = (event) => {
      // Dismiss the prompt text.
      this.prompt.style.display = 'none'
      this.pauseBtn.style.display = 'block'
      this.muteBtn.style.display = 'block'

      // add hologram mesh to scene
      const mesh = this.holoStream.getThreeMesh()
      mesh.scale.set(this.data.size, this.data.size, this.data.size)
      mesh.castShadow = true
      this.el.object3D.add(mesh)

      // Make the hologram visible at the touch point
      const touchPoint = event.detail.intersection.point
      this.el.setAttribute('position', touchPoint)
      const camRot = this.el.sceneEl.camera.el.getAttribute('rotation')
      const thisRot = this.el.getAttribute('rotation')
      this.el.setAttribute('rotation', `${thisRot.x} ${camRot.y} ${thisRot.z}`)

      // begin hologram playback
      this.holoStream.handlePlay(true)

      // animate hologram in from a small scale to its end scale
      const minS = this.data.size / 50
      const maxS = this.data.size
      this.el.setAttribute('scale', `${minS} ${minS} ${minS}`)
      this.el.setAttribute('animation__scale', {
        property: 'scale',
        to: `${maxS} ${maxS} ${maxS}`,
        easing: 'easeOutExpo',
        delay: 500,
        dur: 750,
      })

      this.meshInitialized = true
    }
  },
  tick() {
    // Display loading
    if (!this.showedPrompt && !this.meshInitialized) {
      this.prompt.style.display = 'block'
      this.prompt.innerHTML = 'Loading...'
    }

    // Show 'Tap to Place Hologram'
    if (!this.showedPrompt) {
      this.prompt.style.display = 'block'
      this.prompt.innerHTML = 'Tap to Place<br>Hologram'
      this.ground.addEventListener('mousedown', this.placeHologram, {once: true})
      this.showedPrompt = true
    }
  },
})
const holostreamPrimitive = () => ({
  defaultComponents: {
    holostream: {},
  },
  mappings: {
    'src': 'holostream-component.src',
    'size': 'holostream-component.size',
    'touch-target-size': 'holostream-component.touch-target-size',
    'touch-target-offset': 'holostream-component.touch-target-offset',
    'touch-target-visible': 'holostream-component.touch-target-visible',
  },
})
export {holostreamComponent, holostreamPrimitive}
