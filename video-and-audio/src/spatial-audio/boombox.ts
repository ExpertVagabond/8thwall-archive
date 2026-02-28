import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'boombox',
  schema: {
    screenRef: ecs.eid,
    // @asset
    imagePlay: ecs.string,
    // @asset
    imagePause: ecs.string,
  },
  schemaDefaults: {
  },
  data: {
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    ecs.defineState('on')
      .onEnter(() => {
        console.log('on')
        ecs.Audio.mutate(world, eid, (cursor) => {
          cursor.paused = false
        })
        ecs.Ui.mutate(world, schemaAttribute.get(eid).screenRef, (cursor) => {
          cursor.image = schemaAttribute.get(eid).imagePause
        })
      })
      .onEvent(
        ecs.input.SCREEN_TOUCH_START,
        'off',
        {
          target: schemaAttribute.get(eid).screenRef,
        }
      )
      .initial()
    ecs.defineState('off')
      .onEnter(() => {
        console.log('off')
        ecs.Audio.mutate(world, eid, (cursor) => {
          cursor.paused = true
        })
        ecs.Ui.mutate(world, schemaAttribute.get(eid).screenRef, (cursor) => {
          cursor.image = schemaAttribute.get(eid).imagePlay
        })
      })
      .onEvent(
        ecs.input.SCREEN_TOUCH_START,
        'on',
        {
          target: schemaAttribute.get(eid).screenRef,
        }
      )
  },
  add: (world, component) => {
  },
  tick: (world, component) => {
  },
  remove: (world, component) => {
  },
})
