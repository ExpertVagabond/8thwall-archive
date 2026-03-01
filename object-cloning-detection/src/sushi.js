import * as ecs from '@8thwall/ecs'

const Sushi = ecs.registerComponent({
  name: 'Sushi',
  schema: {
    speed: ecs.f32,
    isMoving: ecs.boolean,
    type: ecs.string,
  },
  schemaDefaults: {
    speed: 0.01,
    isMoving: false,
    type: 'regular',
  },
  add: (world, component) => {
    const { eid } = component
    const sushiData = component.schemaAttribute.get(eid)

    if (sushiData.isMoving) {
      component.destroyTimer = setTimeout(() => {
        world.deleteEntity(eid)
      }, 5000)
    }
  },
  tick: (world, component) => {
    const { eid } = component
    const sushiData = component.schemaAttribute.get(eid)

    if (sushiData.isMoving) {
      if (ecs.Position.has(world, eid)) {
        const currentPosition = ecs.Position.get(world, eid)        
        if (currentPosition) {
          currentPosition.y -= sushiData.speed

          if (currentPosition.y < -5.0) {
            world.deleteEntity(eid)
          } else {
            ecs.Position.set(world, eid, currentPosition)
          }
        }
      } else {
        console.warn(`Position component missing for entity ${eid}`)
      }
    }
  },
  remove: (world, component) => {
    if (component.destroyTimer) {
      clearTimeout(component.destroyTimer)
     //  console.log(`Sushi object removed before destruction.`)
    }
  },
})

export { Sushi }
