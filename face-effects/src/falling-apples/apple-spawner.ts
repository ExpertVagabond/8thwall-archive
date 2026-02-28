import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'Apple Spawner',
  schema: {
    // @required
    prefab: ecs.eid,
  },
  schemaDefaults: {
  },
  data: {
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    ecs.defineState('wait')
      .initial()
      .wait(1000, 'spawn')

    ecs.defineState('spawn')
      .onEnter(() => {
        const {prefab} = schemaAttribute.get(eid)

        const apple = world.createEntity(prefab)
        ecs.Collider.set(world, apple, {
          type: ecs.ColliderType.Dynamic,
          shape: ecs.ColliderShape.Sphere,
          radius: 0.25,
          mass: 0.5,
        })

        const mat4 = ecs.math.mat4.i()
        const position = ecs.math.vec3.zero()
        const rotation = ecs.math.quat.zero()
        const scale = ecs.math.vec3.zero()

        world.getWorldTransform(eid, mat4)
        mat4.decomposeTrs({t: position, r: rotation, s: scale})

        ecs.Position.set(world, apple, {
          x: position.x,
          y: position.y + (3 * scale.length()),
          z: position.z,
        })

        ecs.Scale.set(world, apple, {
          x: scale.x,
          y: scale.y,
          z: scale.z,
        })
      })
      .wait(1, 'wait')
  },
})
