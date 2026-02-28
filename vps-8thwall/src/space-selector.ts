import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'space-selector',
  schema: {
    space1: ecs.string,
    space2: ecs.string,
    option1: ecs.eid,
    option2: ecs.eid,
    activeSpaceName: ecs.eid,
    option1Name: ecs.eid,
    option2Name: ecs.eid,
    option1Icon: ecs.eid,
    option2Icon: ecs.eid,
  },
  add: (world, component) => {
    const {
      space1, space2,
      option1Name, option2Name,
    } = component.schema

    ecs.Ui.set(world, option1Name, {text: space1})
    ecs.Ui.set(world, option2Name, {text: space2})
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    const {
      space1, space2,
      option1, option2,
      activeSpaceName,
      option1Icon, option2Icon,
    } = schemaAttribute.get(eid)

    ecs.defineState('space1')
      .initial()
      .onEnter(() => {
        console.log('space1')
        world.spaces.loadSpace(space1)
        ecs.Ui.set(world, activeSpaceName, {text: space1})
        ecs.Hidden.remove(world, option1Icon)
      })
      .onExit(() => {
        ecs.Hidden.set(world, option1Icon, {})
      })
      .onEvent(ecs.input.UI_CLICK, 'space2', {target: option2})

    ecs.defineState('space2')
      .onEnter(() => {
        console.log('space2')
        world.spaces.loadSpace(space2)
        ecs.Ui.set(world, activeSpaceName, {text: space2})
        ecs.Hidden.remove(world, option2Icon)
      })
      .onExit(() => {
        ecs.Hidden.set(world, option2Icon, {opacity: 0})
      })
      .onEvent(ecs.input.UI_CLICK, 'space1', {target: option1})
  },
})
