// Copyright (c) 2021 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

import './main.css'

import {characterMoveComponent, characterRecenterComponent} from './components'
AFRAME.registerComponent('character-move', characterMoveComponent)
AFRAME.registerComponent('character-recenter', characterRecenterComponent)

import {proximityTriggerComponent} from './proximity-trigger'
AFRAME.registerComponent('proximity-trigger', proximityTriggerComponent)

import {cubeMapRealtimeComponent} from './cubemap-realtime'
AFRAME.registerComponent('cubemap-realtime', cubeMapRealtimeComponent)

