import * as ecs from '@8thwall/ecs'

const Apple = ecs.registerComponent({
  name: 'Apple',
  schema: {
    timeAlive: ecs.f32,
  },
  schemaDefaults: {
    timeAlive: 3000,
  },
  data: {
    lifetime: ecs.f32,
  },
  stateMachine: ({world, eid, dataAttribute, schemaAttribute}) => {
    ecs.defineState('default')
      .initial()
      .onEnter(() => {
        const {timeAlive} = schemaAttribute.get(eid)

        dataAttribute.set(eid, {
          lifetime: timeAlive,
        })
      })
      .onTick(() => {
        dataAttribute.mutate(eid, (cursor) => {
          cursor.lifetime -= 1 * world.time.delta
        })

        const {lifetime} = dataAttribute.get(eid)

        if (lifetime <= 0) {
          world.deleteEntity(eid)
        }
      })
  },
})

export {Apple}
