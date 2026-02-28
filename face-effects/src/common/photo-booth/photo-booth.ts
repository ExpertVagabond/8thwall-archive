import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'Photo Booth',
  schema: {
    // @required
    captureButton: ecs.eid,
    // @required
    previewImage: ecs.eid,
    // @required
    shareButton: ecs.eid,
    // @required
    closeButton: ecs.eid,
  },
  schemaDefaults: {
  },
  data: {
  },
  stateMachine: ({world, eid, schemaAttribute, dataAttribute}) => {
    const {captureButton, shareButton, closeButton} = schemaAttribute.get(eid)
    const toPreCapture = ecs.defineTrigger()
    const toRetry = ecs.defineTrigger()

    let blob = null

    ecs.defineState('default')
      .initial()
      .onEnter(() => {
        const {previewImage} = schemaAttribute.get(eid)

        ecs.Hidden.set(world, previewImage)
        ecs.Disabled.set(world, shareButton)
        ecs.Disabled.set(world, closeButton)
        ecs.Disabled.remove(world, captureButton)
      })
      .listen(captureButton, ecs.input.UI_CLICK, (e) => {
        toPreCapture.trigger()
      })
      .onTrigger(toPreCapture, 'pre-capture')

    ecs.defineState('pre-capture')
      .onEnter(() => {
        ecs.Disabled.set(world, captureButton)

        ecs.CustomPropertyAnimation.set(world, eid, {
          from: 1,
          to: 0,
          duration: 500,
          attribute: 'ui',
          property: 'backgroundOpacity',
          easeOut: true,
          loop: false,
        })
      })
      .wait(500, 'capture')

    ecs.defineState('capture')
      .onEnter(() => {
        world.xr.takeScreenshot()
      })
      .listen(world.events.globalId, ecs.events.RECORDER_SCREENSHOT_READY, (e) => {
        const {previewImage} = schemaAttribute.get(eid)

        blob = e.data
        ecs.Disabled.remove(world, shareButton)
        ecs.Disabled.remove(world, closeButton)
        ecs.Hidden.remove(world, previewImage)
        ecs.Ui.set(world, previewImage, {
          // @ts-ignore
          image: URL.createObjectURL(blob),
        })
        ecs.CustomPropertyAnimation.set(world, previewImage, {
          from: 0,
          to: 1,
          duration: 100,
          attribute: 'ui',
          property: 'opacity',
          easeOut: true,
          loop: false,
        })
      })
      .listen(shareButton, ecs.input.UI_CLICK, (e) => {
        const file = new File([blob], 'screenshot.jpg', {type: 'image/jpeg'})
        const shareData = {
          title: '',
          text: '',
          // @ts-ignorew
          files: [file],
        }

        navigator.share(shareData)
          .then(() => {
            // console.log('Sucessfully shared')
          })
          .finally(() => {
            toRetry.trigger()
          })
      })
      .listen(closeButton, ecs.input.UI_CLICK, (e) => {
        toRetry.trigger()
      })
      .onTrigger(toRetry, 'default')
  },
})
