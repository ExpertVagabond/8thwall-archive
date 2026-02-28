import * as ecs from '@8thwall/ecs'
import {golfOrbitControls} from './GolfOrbitControls'

// Returns true if the device appears to be a mobile device (phone or tablet)
function isMobileDevice(): boolean {
  // User agent test (classic approach)
  const userAgentMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)

  // Touch support test (true for most phones/tablets, some laptops)
  const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)

  // Screen width test (adjust threshold as needed, e.g. 900px for tablets)
  const smallScreen = window.innerWidth < 900

  // Consider device mobile if 2 out of 3 are true
  let trueCount = 0
  if (userAgentMobile) trueCount++
  if (hasTouch) trueCount++
  if (smallScreen) trueCount++

  return trueCount >= 2
}

ecs.registerComponent({
  name: 'Start Game',
  schema: {
    // @label Start Button Text
    startButtonText: ecs.eid,
    // @label UI: Desktop Controls
    desktopControls: ecs.eid,
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    const {startButtonText, desktopControls} = schemaAttribute.get(eid)
    ecs.defineState('default').initial()
      .onEnter(() => {
        const onMobile = isMobileDevice()

        if (onMobile) {
          // hide desktop controls on mobile
          ecs.Hidden.set(world, desktopControls)
          // set camera start distance further back
          const activeCam = world.camera.getActiveEid()
          if (activeCam && ecs.getAttribute('Golf Orbit Controls')) {
            world.getEntity(activeCam).set(golfOrbitControls, {startDistance: 1.5})
          }
        }
      })
      .listen(eid, ecs.input.UI_HOVER_START, () => {
        ecs.Ui.set(world, eid, {
          background: '#002042',
        })
        ecs.Ui.set(world, startButtonText, {
          text: 'Ready?',
        })
      })
      .listen(eid, ecs.input.UI_HOVER_END, () => {
        ecs.Ui.set(world, eid, {
          background: '#003975',
        })
        ecs.Ui.set(world, startButtonText, {
          text: 'New Game',
        })
      })
      .listen(eid, ecs.input.UI_CLICK, () => {
        world.spaces.loadSpace('Hole 1')
      })
  },
})
