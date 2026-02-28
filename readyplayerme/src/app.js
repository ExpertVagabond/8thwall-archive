// Copyright (c) 2022 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

import {recenterComponent} from './components/sky-recenter'
AFRAME.registerComponent('sky-recenter', recenterComponent)

import {avatarMoveComponent, swapCamComponent, avatarRecenterComponent} from './components/components'

AFRAME.registerComponent('avatar-move', avatarMoveComponent)
AFRAME.registerComponent('avatar-recenter', avatarRecenterComponent)
AFRAME.registerComponent('swap-camera', swapCamComponent())

import {responsiveImmersiveComponent} from './components/responsive-immersive'
AFRAME.registerComponent('responsive-immersive', responsiveImmersiveComponent)

import {receiveMessage} from './avatar/avatar-instantiate'
window.addEventListener('message', receiveMessage, false)

import {avatarFaceComponent} from './avatar/avatar-face-effects'
const registerComponents = components => Object.keys(components).map(k => AFRAME.registerComponent(k, components[k]))
registerComponents(avatarFaceComponent())

import {animationRigComponent} from './avatar/rig-animation.js'
AFRAME.registerComponent('rig-animation', animationRigComponent)
