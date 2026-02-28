// Copyright (c) 2023 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall web app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

import {arrowsComponent} from './components/sky-arrows'
AFRAME.registerComponent('sky-arrows', arrowsComponent)

import {debugComponent} from './components/sky-debug'
AFRAME.registerComponent('sky-debug', debugComponent)

import {recenterComponent} from './components/sky-recenter'
AFRAME.registerComponent('sky-recenter', recenterComponent)

import {skyRemoteAuthoringComponent} from './components/sky-remote-authoring'
AFRAME.registerComponent('sky-remote-authoring', skyRemoteAuthoringComponent)

import './index.css'
