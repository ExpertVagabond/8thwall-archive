import * as ecs from '@8thwall/ecs'  // This is how you access the ecs library.

ecs.registerComponent({
  name: 'options-toggle',
  schema: {
    selectorButton: ecs.eid,
    options: ecs.eid,
  },
  stateMachine: ({world, eid, defineState}) => {
    defineState('hide-options')
      .onEnter(({schema}) => {
        ecs.Hidden.set(world, schema.options)
      })
      .onEvent(ecs.input.UI_CLICK, 'show-options')
      .initial()

    defineState('show-options')
      .onEnter(({schema}) => {
        ecs.Hidden.remove(world, schema.options)
      })
      .onEvent(ecs.input.UI_CLICK, 'hide-options')
  },
})
