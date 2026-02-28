// app.js is the main entry point for your 8th Wall app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

import {xrComponents} from './avatar-components'

const registerComponents = components => Object.keys(components).map(k => AFRAME.registerComponent(k, components[k]))
registerComponents(xrComponents())
