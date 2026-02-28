// Copyright (c) 2022 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

import './main.css'

import {imageTargetPortalComponent} from './components/image-target-portal'
AFRAME.registerComponent('image-target-portal', imageTargetPortalComponent())

import {characterMoveComponent} from './components/character-movement'
AFRAME.registerComponent('character-move', characterMoveComponent)

import {navMeshComponent} from './components/nav-mesh'
AFRAME.registerComponent('navmesh-constraint', navMeshComponent)

import {myHiderMaterialComponent} from './components/hider-material'
AFRAME.registerComponent('my-hider-material', myHiderMaterialComponent)

import {resetButtonComponent} from './components/reset-character'
AFRAME.registerComponent('reset-button', resetButtonComponent)

