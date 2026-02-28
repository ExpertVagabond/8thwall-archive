// Copyright (c) 2022 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

import './main.css'

import {
  focusedWayspotComponent,
  customWayspotComponent, customWayspotPrimitive,
  responsiveMapThemeComponent, returnToMapComponent,
  mapLoadingScreenComponent, mapDebugControlsComponent,
} from './components/custom-wayspot'
AFRAME.registerComponent('focused-wayspot', focusedWayspotComponent)
AFRAME.registerComponent('custom-wayspot', customWayspotComponent)
AFRAME.registerPrimitive('custom-wayspot', customWayspotPrimitive)
AFRAME.registerComponent('responsive-map-theme', responsiveMapThemeComponent)
AFRAME.registerComponent('return-to-map', returnToMapComponent)
AFRAME.registerComponent('map-loading-screen', mapLoadingScreenComponent)
AFRAME.registerComponent('map-debug-controls', mapDebugControlsComponent)

// VPS components
import {namedWayspotComponent, playVpsAnimationComponent} from './components/named-wayspot'
AFRAME.registerComponent('named-wayspot', namedWayspotComponent)
AFRAME.registerComponent('play-vps-animation', playVpsAnimationComponent)

// shadow shader component
import {shadowShaderComponent} from './components/shadow-shader'
AFRAME.registerComponent('shadow-shader', shadowShaderComponent)

// Load scene using URL params
// sample URL: https://workspace.8thwall.app/vps-beta/?scene=detect-mesh
const params = new URLSearchParams(document.location.search.substring(1))
const s = params.get('scene') ? params.get('scene') : 'world-map'
document.body.insertAdjacentHTML('beforeend', require(`./scenes/${s}.html`))

const swapBody = (newHtml) => {
  const scene = document.body.querySelector('a-scene')
  scene.parentElement.removeChild(scene)
  document.body.insertAdjacentHTML('beforeend', newHtml)
}

window.addEventListener('startar', ({detail}) => {
  swapBody(require(`./scenes/${detail.name}.html`))
  window._startAR = detail
})

window.addEventListener('stopar', () => {
  swapBody(require('./scenes/world-map.html'))
})

// Load scene manually
// document.body.insertAdjacentHTML('beforeend', require('./scenes/fountain.html'))

// Check Location Permissions at beginning of session
const errorCallback = (error) => {
  if (error.code === error.PERMISSION_DENIED) {
    alert('LOCATION PERMISSIONS DENIED. PLEASE ALLOW AND TRY AGAIN.')
  }
}
navigator.geolocation.getCurrentPosition((pos) => {}, errorCallback)
