const distance = (from, to) => {
  // Computational optimization for no change.
  if (from.lat === to.lat && from.lng === to.lng) {
    return 0
  }
  const lat1R = (from.lat * Math.PI) / 180
  const lat2R = (to.lat * Math.PI) / 180
  const halfLatD = 0.5 * (lat2R - lat1R)
  const halfLngD = 0.5 * ((to.lng * Math.PI) / 180 - (from.lng * Math.PI) / 180)
  const v = Math.sin(halfLatD) ** 2 + (Math.sin(halfLngD) ** 2) * Math.cos(lat1R) * Math.cos(lat2R)
  const arc = 2 * Math.atan2(Math.sqrt(v), Math.sqrt(1 - v))
  return arc * 6371008.8  // Earth arithmetic mean radius, per en.wikipedia.org/wiki/Earth_radius
}

const focusedWayspotComponent = {
  init() {
    this.activeWayspot = null
    this.uiSection = document.getElementById('ui-section')
    this.wayspotDistance = document.getElementById('wayspot-distance')
    this.wayspotTitle = document.getElementById('wayspot-title')
    this.startBtn = document.getElementById('start-btn')

    this.startBtn.addEventListener('click', () => this.swapScene())

    this.wayspotInfo = {}

    this.el.sceneEl.addEventListener('enteredGeofence', ({detail}) => {
      this.wayspotInfo[detail.title] = {...detail}
      this.wayspotInfo[detail.name] = {...detail}

      if (!this.activeWayspot) {
        this.activeWayspot = detail.title
        this.updateActive()
      }
    })

    this.el.sceneEl.addEventListener('updatedDistance', ({detail}) => {
      this.wayspotInfo[detail.title] = {...detail}
      this.wayspotInfo[detail.name] = {...detail}

      if (detail.title !== this.activeWayspot) {
        return
      }

      this.updateActive()

      if (detail.distance < 20) {
        this.startBtn.removeAttribute('disabled')
      }
    })

    this.el.sceneEl.addEventListener('wayspotClicked', ({detail}) => {
      this.activeWayspot = detail.title
      this.updateActive()
    })

    this.el.sceneEl.addEventListener('exitedGeofence', ({detail}) => {
      delete this.wayspotInfo[detail.title]

      if (this.activeWayspot === detail.title) {
        const remainingWayspots = Object.values(this.wayspotInfo)
        if (!remainingWayspots.length) {
          this.activeWayspot = null
          this.updateActive()
        } else {
          remainingWayspots.sort((a, b) => a.distance - b.distance)
          this.activeWayspot = remainingWayspots[0].title
          this.updateActive()
        }
      }
    })
  },
  updateActive() {
    if (this.activeWayspot === null) {
      this.uiSection.classList.remove('slide-up')
      this.uiSection.classList.add('slide-down')
      return
    }
    this.uiSection.classList.remove('slide-down')
    this.uiSection.classList.add('slide-up')

    const current = this.wayspotInfo[this.activeWayspot]

    if (current.distance < 20) {
      this.startBtn.removeAttribute('disabled')
    } else {
      this.startBtn.setAttribute('disabled', '')
    }
    this.wayspotDistance.textContent = `${current.distance.toFixed(0)}m`
    this.wayspotTitle.textContent =
            current.title.length >= 43
              ? `${current.title.slice(0, 43)}...`
              : current.title
  },
  swapScene() {
    const startAr = new CustomEvent('startar', {detail: this.wayspotInfo[this.activeWayspot]})
    this.activeWayspot = null
    window.dispatchEvent(startAr)
  },
}

const customWayspotComponent = {
  schema: {
    name: {type: 'string'},
    title: {type: 'string'},
    imageUrl: {type: 'string'},
  },
  init() {
    if (!this.data.name) {
      return
    }

    const scene = this.el.sceneEl
    const projectWayspotColor = new THREE.Color('#94eaff').convertSRGBToLinear()
    const anyWayspotColor = new THREE.Color('#ffc894').convertSRGBToLinear()
    const texLoader = new THREE.TextureLoader().load(this.data.imageUrl)

    let isInside = false

    this.wayspotHolder = document.createElement('a-entity')
    this.wayspotHolder.setAttribute('position', '0 1.5 0')
    const randomYRotation = Math.random() * 360
    this.wayspotHolder.setAttribute('shadow', 'receive: false')
    this.wayspotHolder.setAttribute('rotation', `0 ${randomYRotation} 0`)  // apply random rotation

    const disc = document.createElement('a-entity')
    disc.addEventListener('model-loaded', () => {
      disc.getObject3D('mesh').getObjectByName('inner').material.map = texLoader
      disc.getObject3D('mesh').getObjectByName('outer').material.color =
      this.data.name ? projectWayspotColor : anyWayspotColor
    })
    disc.setAttribute('gltf-model', '#poi-model')
    disc.setAttribute('scale', '0.001 0.001 0.001')
    disc.setAttribute('xrextras-spin', 'speed: 12000')
    disc.object3D.visible = false
    disc.id = this.data.title
    this.wayspotHolder.appendChild(disc)

    const orb = document.createElement('a-sphere')
    orb.setAttribute('geometry', 'primitive: sphere')
    orb.setAttribute('material', {color: this.data.name ? '#94eaff' : '#ffc894'})
    orb.setAttribute('scale', '0.2 0.2 0.2')
    this.wayspotHolder.appendChild(orb)

    this.el.appendChild(this.wayspotHolder)

    const transitionSpeed = 1000

    const enteredGeofence = (d) => {
      scene.emit('enteredGeofence', {...this.data, distance: d})
      disc.object3D.visible = true
      disc.classList.add('cantap')
      disc.setAttribute('animation__grow', {
        property: 'scale',
        from: '0.001 0.001 0.001',
        to: '0.5 0.5 0.5',
        dur: transitionSpeed,
        easing: 'easeInOutElastic',
      })

      orb.setAttribute('animation__shrink', {
        property: 'scale',
        from: '0.2 0.2 0.2',
        to: '0.001 0.001 0.001',
        dur: transitionSpeed,
        easing: 'easeInOutElastic',
      })
      setTimeout(() => {
        disc.removeAttribute('animation__grow')
        orb.removeAttribute('animation__shrink')
        orb.object3D.visible = false
      }, transitionSpeed + 200)
    }

    const exitedGeofence = (d) => {
      scene.emit('exitedGeofence', {...this.data, distance: d})
      orb.object3D.visible = true
      disc.classList.remove('cantap')
      disc.setAttribute('animation__shrink', {
        property: 'scale',
        from: '0.5 0.5 0.5',
        to: '0.001 0.001 0.001',
        dur: transitionSpeed,
        easing: 'easeInOutElastic',
      })

      orb.setAttribute('animation__grow', {
        property: 'scale',
        from: '0.001 0.001 0.001',
        to: '0.2 0.2 0.2',
        dur: transitionSpeed,
        easing: 'easeInOutElastic',
      })
      setTimeout(() => {
        disc.removeAttribute('animation__shrink')
        orb.removeAttribute('animation__grow')
        disc.object3D.visible = false
      }, transitionSpeed + 200)
    }

    disc.addEventListener('click', () => {
      this.el.sceneEl.emit('wayspotClicked', this.data)
    })

    this.el.parentEl.addEventListener('distance', ({detail}) => {
      if (detail.distance < 40) {
        if (!isInside) {
          enteredGeofence(detail.distance)
          isInside = true
        } else {
          this.el.sceneEl.emit('updatedDistance', {...this.data, distance: detail.distance})
        }
      }

      if (detail.distance > 40) {
        if (isInside) {
          exitedGeofence(detail.distance)
          isInside = false
        }
      }
    })
  },
  tick() {
    if (this.isInsideOuter) {
      const map = this.el.parentEl.parentEl.components['lightship-map']
      if (!map) {
        return
      }

      const {x: lat, y: lng} = map.data['lat-lng']
      const mapPt = this.el.parentEl.components['lightship-map-point']
      if (!mapPt) {
        return
      }
      const {x: lat2, y: lng2} = mapPt.data['lat-lng']
      this.d = distance({lat, lng}, {lat: lat2, lng: lng2})
    }
  },
}

const customWayspotPrimitive = {
  defaultComponents: {
    'custom-wayspot': {},
  },
  mappings: {
    'name': 'custom-wayspot.name',
    'title': 'custom-wayspot.title',
    'image-url': 'custom-wayspot.imageUrl',
  },
}

const returnToMapComponent = {
  init() {
    const mapBtn = document.getElementById('map-btn')
    this.exitToMap = () => {
      const stopAr = new CustomEvent('stopar')
      window.dispatchEvent(stopAr)
    }

    this.el.setAttribute('vps-coaching-overlay', {
      wayspotName: window._startAR ? window._startAR.title : null,
      hintImage: window._startAR ? window._startAR.imageUrl : null,
    })

    mapBtn.addEventListener('click', this.exitToMap)
  },
}

const responsiveMapThemeComponent = {
  schema: {
    mode: {type: 'string', default: 'time'},
    lightTheme: {type: 'string', default: 'nianticlight'},
    darkTheme: {type: 'string', default: 'nighttime'},
  },
  update() {
    const switchTheme = (theme) => {
      if (theme === 'dark') {
        this.el.setAttribute('lightship-map-theme', {
          theme: this.data.darkTheme,
        })
      } else {
        this.el.setAttribute('lightship-map-theme', {
          theme: this.data.lightTheme,
        })
      }
    }

    if (this.data.mode === 'time') {
      // checks current time of day by location and sets theme accordingly
      const sunsetURL = 'https://api.sunrise-sunset.org/json?'
      navigator.geolocation.getCurrentPosition((pos) => {
        const now = new Date()
        const dayString = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
        const checkSunset = () => {
          fetch(`${sunsetURL}lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&date=${dayString}&formatted=0`)
            .then(response => response.json())
            .then((data) => {
              const sunrise = new Date(`${data.results.sunrise}`)
              const sunset = new Date(`${data.results.nautical_twilight_end}`)
              if (now > sunrise && now < sunset) {
                switchTheme('light')
              } else {
                switchTheme('dark')
              }
            })
        }

        checkSunset()
      })
    } else if (this.data.mode === 'device') {
      this.deviceTheme = window.matchMedia('(prefers-color-scheme: dark)')

      // checks device light/dark theme on load
      this.deviceTheme.matches ? switchTheme('dark') : switchTheme('light')

      // changes map theme when user switches device themes
      this.deviceTheme.addEventListener('change', (e) => {
        e.matches ? switchTheme('dark') : switchTheme('light')
      })
    }
  },
}

const mapLoadingScreenComponent = {
  init() {
    const scene = this.el.sceneEl
    const gradient = document.getElementById('gradient')
    const poweredby = document.getElementById('poweredby')

    const dismissLoadScreen = () => {
      setTimeout(() => {
        poweredby.classList.add('fade-out')
        gradient.classList.add('fade-out')
      }, 1500)

      setTimeout(() => {
        poweredby.style.display = 'none'
        gradient.style.display = 'none'
      }, 2000)
    }

    const getPosition = function (options) {
      return new Promise(((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options)
      }))
    }

    getPosition()
      .then((position) => {
        scene.hasLoaded ? dismissLoadScreen() : scene.addEventListener('loaded', dismissLoadScreen)
      })
      .catch((err) => {
        console.error(err.message)
      })
  },
}

const mapDebugControlsComponent = {
  schema: {
    distance: {default: 0.0001},
  },
  init() {
    this.char = this.el.children[0]

    const handleKeyDown = (e) => {
      this.el.setAttribute('enable-gps', false)
      this.latlng = this.el.getAttribute('lat-lng')
      this.locArr = this.latlng.split(' ')

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
  tick() {
    // diagonal controls
    if (this.fwd && this.left) {  // NW
      const plusLat = parseFloat(this.locArr[0]) + this.data.distance
      const plusLng = parseFloat(this.locArr[1]) + this.data.distance
      this.el.setAttribute('lat-lng', `${plusLat} ${plusLng}`)
      if (this.char !== undefined) {
        this.char.setAttribute('rotation', '0 120 0')
      }
    }

    if (this.fwd && this.right) {  // NE
      const minusLat = parseFloat(this.locArr[0]) - this.data.distance
      const plusLng = parseFloat(this.locArr[1]) + this.data.distance
      this.el.setAttribute('lat-lng', `${minusLat} ${plusLng}`)
      if (this.char !== undefined) {
        this.char.setAttribute('rotation', '0 45 0')
      }
    }

    if (this.back && this.left) {  // SW
      const plusLat = parseFloat(this.locArr[0]) + this.data.distance
      const minusLng = parseFloat(this.locArr[1]) - this.data.distance
      this.el.setAttribute('lat-lng', `${plusLat} ${minusLng}`)
      if (this.char !== undefined) {
        this.char.setAttribute('rotation', '0 -120 0')
      }
    }

    if (this.back && this.right) {  // SE
      const minusLat = parseFloat(this.locArr[0]) - this.data.distance
      const minusLng = parseFloat(this.locArr[1]) - this.data.distance
      this.el.setAttribute('lat-lng', `${minusLat} ${minusLng}`)
      if (this.char !== undefined) {
        this.char.setAttribute('rotation', '0 -45 0')
      }
    }

    // cardinal controls
    if (this.fwd && !this.left && !this.right) {  // N
      const plusLng = parseFloat(this.locArr[1]) + this.data.distance
      this.el.setAttribute('lat-lng', `${this.locArr[0]} ${plusLng}`)
      if (this.char !== undefined) {
        this.char.setAttribute('rotation', '0 90 0')
      }
    }

    if (this.back && !this.left && !this.right) {  // S
      const minusLng = parseFloat(this.locArr[1]) - this.data.distance
      this.el.setAttribute('lat-lng', `${this.locArr[0]} ${minusLng}`)
      if (this.char !== undefined) {
        this.char.setAttribute('rotation', '0 -90 0')
      }
    }

    if (this.left && !this.fwd && !this.back) {  // E
      const plusLat = parseFloat(this.locArr[0]) + this.data.distance
      this.el.setAttribute('lat-lng', `${plusLat} ${this.locArr[1]}`)
      if (this.char !== undefined) {
        this.char.setAttribute('rotation', '0 180 0')
      }
    }

    if (this.right && !this.fwd && !this.back) {  // W
      const minusLat = parseFloat(this.locArr[0]) - this.data.distance
      this.el.setAttribute('lat-lng', `${minusLat} ${this.locArr[1]}`)
      if (this.char !== undefined) {
        this.char.setAttribute('rotation', '0 0 0')
      }
    }
  },
}

export {
  focusedWayspotComponent, customWayspotComponent,
  customWayspotPrimitive, responsiveMapThemeComponent,
  returnToMapComponent, mapLoadingScreenComponent,
  mapDebugControlsComponent,
}
