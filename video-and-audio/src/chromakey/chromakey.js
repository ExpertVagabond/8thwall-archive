// This is a component file. You can use this file to define a custom component for your project.
// This component will appear as a custom component in the editor.

import * as ecs from '@8thwall/ecs'  // This is how you access the ecs library.
import {ChromaKeyMaterial} from './chromakey-material'

ecs.registerComponent({
  name: 'chromakey',
  schema: {
    // @asset
    video: ecs.string,
    width: ecs.f32,
    height: ecs.f32,
    // @group start background:color
    r: ecs.f32,
    g: ecs.f32,
    b: ecs.f32,
    // @group end
    similarity: ecs.f32,
    smoothness: ecs.f32,
    spill: ecs.f32,
  },
  add: (world, component) => {
    const {video, r, g, b, width, height, similarity, smoothness, spill} = component.schema
    if (video === '') {
      console.error('No video defined on chromakey component')
      return
    }

    const object3d = world.three.entityToObject.get(component.eid)
    const keyColor = new THREE.Color(`rgb(${r}, ${g}, ${b})`)

    const greenScreenMaterial = new ChromaKeyMaterial(
      video, keyColor, width, height, similarity, smoothness, spill
    )

    setTimeout(() => {
      object3d.material = greenScreenMaterial
    }, 0)
  },
  remove: (world, component) => {
    // Runs when the component is removed from the world.
  },
})
