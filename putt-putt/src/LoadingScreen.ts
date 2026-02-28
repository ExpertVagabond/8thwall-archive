import * as ecs from '@8thwall/ecs'

// Register a Loading Screen component for controlling a loading UI
ecs.registerComponent({
  name: 'Loading Screen',
  schema: {
    // @label End Timeout (ms)
    endTimeout: ecs.f32,  // Wait time before fade-out starts (ms)
    // @label Fade Duration (ms)
    fadeDuration: ecs.f32,  // Fade-out duration for the UI (ms)
    // @label UI: Loading Bar
    loadingBar: ecs.eid,  // Entity ID of the progress bar foreground
    // @label UI: Loading Bar Background
    loadingBarBg: ecs.eid,  // Entity ID of the bar background
    // @label UI: Loading Label Text
    loadingLabelText: ecs.eid,  // Entity ID for progress percent text
  },
  schemaDefaults: {
    endTimeout: 500,
    fadeDuration: 1000,
  },

  // The state machine manages the UI's behavior during the loading phase
  stateMachine: ({world, eid, schemaAttribute}) => {
    // Manual trigger to immediately transition to "done" state when ready
    const doneTrigger = ecs.defineTrigger()
    // Grab schema properties for this instance
    const {loadingBar, loadingBarBg, loadingLabelText, endTimeout, fadeDuration} = schemaAttribute.get(eid)
    // Get entity handle for easy enable/disable
    const eidEnt = world.getEntity(eid)
    // Minimum visible loading time (ms)
    const MIN_LOADING_TIME = 2000

    // Progress and animation state variables
    let startTime = 0
    let realComplete = 0                                           // Number of truly loaded assets
    let realTotal = 1                                              // Total assets to load (guard for zero)
    let visualComplete = 0                                         // Number to display visually (for smoothness)
    let visualPercent = 0                                          // Value from 0..1 for bar fill and percent
    let barWidth = window.innerWidth - (window.innerWidth * 0.15)  // Bar length in px
    let lerpedBarWidth = 0                                         // Smoothed/animated bar width in px
    let elapsedPercent = 0                                         // Fraction of minimum time elapsed

    // Updates the bar and text label with new progress values
    const update = () => {
      // If the assets API is missing, finish immediately (should not happen in normal use)
      if (!ecs.assets.getStatistics) {
        doneTrigger.trigger()
        return
      }
      const stats = ecs.assets.getStatistics()
      realComplete = stats.complete
      realTotal = stats.total || 1

      // Smoothly increment the displayed progress so the bar animates smoothly
      if (visualComplete < realComplete) visualComplete++
      if (visualComplete > realTotal) visualComplete = realTotal

      visualPercent = realTotal === 0 ? 0 : visualComplete / realTotal
      const percentLabel = Math.floor(visualPercent * 100)

      // Update the UI with the percent loaded
      ecs.Ui.set(world, loadingLabelText, {text: `Loading ${percentLabel}%`})

      // If everything is loaded, the min time has elapsed, and the bar is full, end loading
      if (stats.pending === 0 && elapsedPercent >= 1 && visualComplete >= realTotal) {
        doneTrigger.trigger()
      }
    }

    // "done" state: instantly fill bar, fade out loading UI, then disable loading screen
    const done = ecs.defineState('done').onEnter(() => {
      visualComplete = realTotal
      visualPercent = 1
      lerpedBarWidth = barWidth
      ecs.Ui.set(world, loadingLabelText, {text: 'Loading 100%'})
      if (loadingBar) {
        ecs.Ui.set(world, loadingBar, {width: `${barWidth}`})
      }
      // Animate opacity to 0 after a short timeout, then remove loading UI
      world.time.setTimeout(() => {
        ecs.CustomPropertyAnimation.set(world, eid, {
          attribute: 'ui',
          property: 'opacity',
          from: 1,
          to: 0,
          loop: false,
          duration: fadeDuration,
        })
      }, endTimeout)
      // Disable the loading screen and dispatch level-loaded event after fade completes
      world.time.setTimeout(() => {
        eidEnt.disable()
        world.events.dispatch(world.events.globalId, 'level-loaded')
      }, fadeDuration + endTimeout + 200)
    })

    // "loading" state: initial state, animates the loading bar and text
    let timer = 0
    ecs.defineState('loading').initial()
      .onEnter(() => {
        // Set up a repeating timer to update the bar and text
        timer = world.time.setInterval(update, 100)
        // Reset all state to initial
        startTime = world.time.elapsed
        realComplete = visualComplete = visualPercent = lerpedBarWidth = elapsedPercent = 0
        realTotal = 1
        barWidth = window.innerWidth - (window.innerWidth * 0.15)
        // Initialize bar/background/text UI
        if (loadingBarBg) ecs.Ui.set(world, loadingBarBg, {width: `${barWidth}`, opacity: 1})
        if (loadingBar) ecs.Ui.set(world, loadingBar, {width: '0', opacity: 1})
        if (loadingLabelText) ecs.Ui.set(world, loadingLabelText, {text: 'Loading 0%', opacity: 1})
      })
      .onTick(() => {
        // Track elapsed time and animate bar width
        const elapsed = world.time.elapsed - startTime
        elapsedPercent = Math.min(1, elapsed / MIN_LOADING_TIME)
        // Animate the bar and percent smoothly even if assets load quickly
        if (elapsedPercent < 1 && visualComplete / realTotal >= elapsedPercent) {
          visualComplete = Math.floor(realTotal * elapsedPercent)
        }
        // Smooth bar fill with lerp (linear interpolation)
        const targetWidth = Math.floor(barWidth * visualPercent)
        lerpedBarWidth += (targetWidth - lerpedBarWidth) * 0.1
        if (loadingBar) {
          ecs.Ui.set(world, loadingBar, {width: `${Math.round(lerpedBarWidth)}`})
        }
      })
      .onExit(() => {
        // Clear the repeating timer when leaving state
        world.time.clearTimeout(timer)
      })
      .onTrigger(doneTrigger, done)  // Move to "done" state when trigger fires
  },
})
