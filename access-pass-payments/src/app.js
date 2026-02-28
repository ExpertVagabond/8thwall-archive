// Copyright (c) 2022 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

import './index.css'

import {holostreamComponent, holostreamPrimitive} from './holostream-component'
import {accessPassComponent} from './access-pass/aframe-component'

AFRAME.registerComponent('access-pass', accessPassComponent)
AFRAME.registerComponent('holostream-component', holostreamComponent())
AFRAME.registerPrimitive('holostream-hologram', holostreamPrimitive())

