import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'Video Controls UI',
  schema: {
    // @required
    background: ecs.eid,
    // @required
    playbackImage: ecs.eid,
  },
  schemaDefaults: {
  },
  data: {
  },
  stateMachine: ({world, eid, schemaAttribute, dataAttribute}) => {
    const toPause = ecs.defineTrigger()
    const toPlaying = ecs.defineTrigger()

    ecs.defineState('setup')
      .initial()
      .listen(eid, ecs.events.VIDEO_CAN_PLAY_THROUGH, (e) => {
        toPause.trigger()
      })
      .onTrigger(toPause, 'paused')

    ecs.defineState('paused')
      .onEnter(() => {
        const {background, playbackImage} = schemaAttribute.get(eid)

        ecs.Ui.mutate(world, background, (cursor) => {
          cursor.backgroundOpacity = 0.5
        })

        ecs.Ui.mutate(world, playbackImage, (cursor) => {
          cursor.image = 'assets/icons/play-button.png'
          cursor.opacity = 1
        })

        ecs.VideoControls.set(world, eid, {
          paused: true,
        })
      })
      .listen(eid, ecs.input.SCREEN_TOUCH_START, (e) => {
        toPlaying.trigger()
      })
      .onTrigger(toPlaying, 'playing')

    ecs.defineState('playing')
      .onEnter(() => {
        const {playbackImage} = schemaAttribute.get(eid)

        ecs.Ui.mutate(world, playbackImage, (cursor) => {
          cursor.image = 'assets/icons/pause-button.png'
        })

        ecs.VideoControls.set(world, eid, {
          paused: false,
        })
      })
      .onTick(() => {
        const {background, playbackImage} = schemaAttribute.get(eid)

        ecs.Ui.mutate(world, background, (cursor) => {
          cursor.backgroundOpacity -= 0.1
        })

        ecs.Ui.mutate(world, playbackImage, (cursor) => {
          cursor.opacity -= 0.1
        })
      })
      .listen(eid, ecs.input.SCREEN_TOUCH_START, (e) => {
        toPause.trigger()
      })
      .onTrigger(toPause, 'paused')
  },
})
