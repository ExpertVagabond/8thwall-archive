import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'select',
  schema: {
    // Add data that can be configured on the component.
    left: ecs.eid,
    right: ecs.eid,
    leftLogo: ecs.eid,
    rightLogo: ecs.eid,
  },
  schemaDefaults: {
    // Add defaults for the schema fields.
  },
  data: {
    // Add data that cannot be configured outside of the component.
  },
  add: (world, component) => {
    // Runs when the component is added to the world.
    let updating = false  // if the options are updating

    const options = [['mcdonalds', 'cfa'], ['tesla', 'mercedes'], ['chanel', 'lvmh']]
    let optionIdx = 0

    const {left, right, leftLogo, rightLogo} = component.schema

    // handle options update
    const update = () => {
      setTimeout(() => {
        // restore card colors
        ecs.Material.set(world, left, {r: 118, g: 17, b: 182})
        ecs.Material.set(world, right, {r: 118, g: 17, b: 182})

        // update options
        optionIdx = (optionIdx + 1) % options.length
        const newOptions = options[optionIdx]
        ecs.Material.set(world, leftLogo, {textureSrc: `${require(`../assets/this-or-that/${newOptions[0]}.png`)}`})
        ecs.Material.set(world, rightLogo, {textureSrc: `${require(`../assets/this-or-that/${newOptions[1]}.png`)}`})

        // update state
        updating = false
      }, 1000)
    }

    const show = ({data}) => {
      if (!updating) {
        updating = true
        const xRot = data.transform.rotation.x
        if (xRot < -0.15) {
          // right selected
          ecs.Material.set(world, right, {r: 0, g: 255, b: 0})
          update()
        } else if (xRot > 0.15) {
          // left selected
          ecs.Material.set(world, left, {r: 0, g: 255, b: 0})
          update()
        } else {
          updating = false
        }
      }
    }
    world.events.addListener(world.events.globalId, 'facecontroller.faceupdated', show)
  },
})
