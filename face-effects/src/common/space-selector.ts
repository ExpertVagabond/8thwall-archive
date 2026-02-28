import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'space-selector',
  schema: {
    space1: ecs.string,
    space2: ecs.string,
    space3: ecs.string,
    option1: ecs.eid,
    option2: ecs.eid,
    option3: ecs.eid,
    activeSpaceName: ecs.eid,
    option1Name: ecs.eid,
    option2Name: ecs.eid,
    option3Name: ecs.eid,
    option1Icon: ecs.eid,
    option2Icon: ecs.eid,
    option3Icon: ecs.eid,
  },
  add: (world, component) => {
    const {
      space1, space2, space3,
      option1Name, option2Name, option3Name,
    } = component.schema

    ecs.Ui.set(world, option1Name, {text: space1})
    ecs.Ui.set(world, option2Name, {text: space2})
    ecs.Ui.set(world, option3Name, {text: space3})
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    const {
      space1, space2, space3,
      option1, option2, option3,
      activeSpaceName,
      option1Icon, option2Icon, option3Icon,
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
      .onEvent(ecs.input.UI_CLICK, 'space3', {target: option3})

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
      .onEvent(ecs.input.UI_CLICK, 'space3', {target: option3})

    ecs.defineState('space3')
      .onEnter(() => {
        console.log('space3')
        world.spaces.loadSpace(space3)
        ecs.Ui.set(world, activeSpaceName, {text: space3})
        ecs.Hidden.remove(world, option3Icon)
      })
      .onExit(() => {
        ecs.Hidden.set(world, option3Icon, {opacity: 0})
      })
      .onEvent(ecs.input.UI_CLICK, 'space1', {target: option1})
      .onEvent(ecs.input.UI_CLICK, 'space2', {target: option2})
  },
})
