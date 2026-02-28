// Copyright (c) 2022 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

import {startScene} from './babylonjs-scene-init'
import * as camerafeedHtml from './camerafeed.html'
import './index.css'

const onxrloaded = () => {
  // Add camera pipeline modules.
  XR8.addCameraPipelineModules([
    window.LandingPage.pipelineModule(),     // Detects unsupported browsers and gives hints.
    XRExtras.Loading.pipelineModule(),       // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),  // Shows an error image on runtime error.
  ])

  // Add a canvas to the document for our xr scene.
  document.body.insertAdjacentHTML('beforeend', camerafeedHtml)

  // Open the camera and start running the camera run loop.
  startScene(document.getElementById('camerafeed'))
}

window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
