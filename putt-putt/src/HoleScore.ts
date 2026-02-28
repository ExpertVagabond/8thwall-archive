import * as ecs from '@8thwall/ecs'
import {golfOrbitControls} from './GolfOrbitControls'

ecs.registerComponent({
  name: 'Hole Score',
  schema: {
    // @label This Hole's Par
    holePar: ecs.i32,
    // @label Final Hole
    finalHole: ecs.boolean,
    // @label Entity: Player
    playerObj: ecs.eid,
    // @label Entity: Golf Ball
    golfBallObj: ecs.eid,
    // @label Entity: Score Particles
    scoreParticles: ecs.eid,
    // @label UI: Result
    result: ecs.eid,
    // @label UI: Result Text
    resultText: ecs.eid,
    // @label UI: Overlay
    overlayUI: ecs.eid,
    // @label UI: Next Hole Button
    nextHoleBtn: ecs.eid,
    // @label UI: Next Hole Text
    nextHoleText: ecs.eid,
    // @label UI: Strokes Text
    strokesText: ecs.eid,
    // @label UI: Hole Text
    holeText: ecs.eid,
    // @label UI: Par Text
    parText: ecs.eid,
    // @label Audio: Positive Score
    // @asset
    posScoreSnd: ecs.string,
    // @label Audio: Neutral Score
    // @asset
    neuScoreSnd: ecs.string,
    // @label Audio: Negative Score
    // @asset
    negScoreSnd: ecs.string,
  },

  schemaDefaults: {
    holePar: 3,  // Default par for the hole (typically 3 for most mini-golf holes)
  },

  // Internal component data that doesn't need to be configured externally
  data: {
    currentStrokes: ecs.i32,  // Track how many strokes the player has taken
    hasScored: ecs.boolean,   // Prevent duplicate scoring events
  },

  stateMachine: ({world, eid, schemaAttribute, dataAttribute}) => {
    // Helper function to determine golf terminology based on score vs par
    const getGolfTerm = (score, par) => {
      const diff = score - par
      if (score === 1 && par >= 3) return 'Hole-in-One'  // Single stroke on par 3+
      if (diff <= -3) return 'Albatross'                 // 3 under par
      if (diff === -2) return 'Eagle'                    // 2 under par
      if (diff === -1) return 'Birdie'                   // 1 under par
      if (diff === 0) return 'Par'                       // Exactly par
      if (diff === 1) return 'Bogey'                     // 1 over par
      if (diff === 2) return 'Double Bogey'              // 2 over par
      if (diff === 3) return 'Triple Bogey'              // 3 over par
      return 'Yikes'                                     // More than 3 over par
    }

    // Reset hole state and UI for a new hole
    const resetHole = () => {
      const schema = schemaAttribute.get(eid)
      const data = dataAttribute.cursor(eid)

      // Reset internal game state
      data.currentStrokes = 0
      data.hasScored = false

      // Reset UI button appearance to default state
      ecs.Ui.set(world, schema.nextHoleBtn, {background: '#003975'})
      ecs.Ui.set(world, schema.nextHoleText, {text: 'Next Hole'})

      // Update stroke and par display
      ecs.Ui.set(world, schema.strokesText, {text: 'Strokes: 0'})
      ecs.Ui.set(world, schema.holeText, {text: `Hole: ${parseInt(world.spaces.getActiveSpace()?.name.match(/\d+/)?.[0] || '0', 10)}`})
      ecs.Ui.set(world, schema.parText, {text: `Par: ${schema.holePar}`})

      // Show game UI, hide result UI
      world.getEntity(schema.overlayUI).enable()
      world.getEntity(schema.result).disable()

      // Re-enable player and hide celebration particles
      if (schema.playerObj) world.getEntity(schema.playerObj).enable()
      ecs.ParticleEmitter.set(world, schema.scoreParticles, {stopped: true})
    }

    // Handle when the ball reaches the hole
    const handleScoring = () => {
      const schema = schemaAttribute.get(eid)
      const data = dataAttribute.get(eid)

      // Trigger celebration effects
      ecs.ParticleEmitter.set(world, schema.scoreParticles, {stopped: false})
      if (schema.playerObj) world.getEntity(schema.playerObj).disable()

      // Focus camera on the hole for dramatic effect
      const activeCam = world.camera.getActiveEid()
      if (activeCam && ecs.getAttribute('Golf Orbit Controls')) {
        world.getEntity(activeCam).set(golfOrbitControls, {focusEntity: eid})
      }

      // Display the result based on golf terminology
      const golfTerm = getGolfTerm(data.currentStrokes, schema.holePar)
      ecs.Ui.set(world, schema.resultText, {
        text: golfTerm,
        color:
          ['Hole-in-One', 'Albatross', 'Eagle', 'Birdie'].includes(golfTerm)
            ? '#00FF00'
            : golfTerm === 'Par'
              ? '#FFFFFF'
              : '#FF0000',
      })

      // play score SFX depending on result
      if (ecs.Audio.has(world, eid)) {
        ecs.Audio.mutate(world, eid, (cursor) => {
          cursor.url = ['Hole-in-One', 'Albatross', 'Eagle', 'Birdie'].includes(golfTerm)
            ? schema.posScoreSnd
            : golfTerm === 'Par'
              ? schema.neuScoreSnd
              : schema.negScoreSnd
          cursor.paused = false
        })
      }

      // emit event with score for ScoreKeeper
      world.events.dispatch(world.events.globalId, 'hole-scored', {
        // this checks for the number in the space name, so stick to "Hole 1", "Hole 2", etc
        hole: parseInt(world.spaces.getActiveSpace()?.name.match(/\d+/)?.[0] || '0', 10),
        par: schema.holePar,
        score: data.currentStrokes,
      })

      // Show result screen and hide game UI
      if (schemaAttribute.get(eid).finalHole === true) {
        world.getEntity(schema.nextHoleBtn).disable()
      }

      world.getEntity(schema.result).enable()
      world.getEntity(schema.overlayUI).disable()
      world.getEntity(schema.golfBallObj).hide()
    }

    // Define the progression between holes/spaces dynamically
    const getNextHoleSpace = (currentSpace) => {
      // Handle the special case of Start Screen
      if (currentSpace === 'Start Screen') {
        return 'Hole 1'
      }

      // Check if this is the final hole
      if (schemaAttribute.get(eid).finalHole) {
        return null  // No next hole after the final hole
      }

      // Extract hole number from current space name (e.g., "Hole 1" -> 1)
      const holeMatch = currentSpace.match(/Hole (\d+)/)
      if (holeMatch) {
        const currentHoleNumber = parseInt(holeMatch[1], 10)
        const nextHoleNumber = currentHoleNumber + 1
        return `Hole ${nextHoleNumber}`
      }

      // Fallback for unexpected space names
      console.warn(`Unknown space format: ${currentSpace}`)
      return null
    }

    // Initial playing state - hole is active and player can take shots
    ecs.defineState('playing')
      .initial()
      .onEnter(resetHole)  // Reset everything when entering playing state
      // Listen for golf swing events to increment stroke count
      .listen(world.events.globalId, 'golf-swing', () => {
        const data = dataAttribute.cursor(eid)
        const schema = schemaAttribute.get(eid)

        // Don't count strokes after scoring
        if (data.hasScored) return

        // Increment stroke counter and update UI
        data.currentStrokes += 1
        ecs.Ui.set(world, schema.strokesText, {
          text: `Strokes: ${data.currentStrokes}`,
        })
      })
      // Transition to scored state when ball hits the hole
      .onEvent(ecs.physics.COLLISION_START_EVENT, 'scored')

    // Scored state - ball is in hole, show results and next hole button
    ecs.defineState('scored')
      .onEnter(() => {
        const data = dataAttribute.cursor(eid)

        // Prevent multiple scoring events for the same hole
        if (data.hasScored) return
        data.hasScored = true

        handleScoring()  // Trigger scoring sequence
      })
      // Handle next hole button hover effects
      .listen(schemaAttribute.get(eid).nextHoleBtn, ecs.input.UI_HOVER_START, () => {
        const schema = schemaAttribute.get(eid)
        // Darken button and change text on hover
        ecs.Ui.set(world, schema.nextHoleBtn, {background: '#002042'})
        ecs.Ui.set(world, schema.nextHoleText, {text: 'Ready?'})
      })
      // Restore button appearance when hover ends
      .listen(schemaAttribute.get(eid).nextHoleBtn, ecs.input.UI_HOVER_END, () => {
        const schema = schemaAttribute.get(eid)
        ecs.Ui.set(world, schema.nextHoleBtn, {background: '#003975'})
        ecs.Ui.set(world, schema.nextHoleText, {text: 'Next Hole'})
      })
      // Handle next hole button click
      .listen(schemaAttribute.get(eid).nextHoleBtn, ecs.input.UI_CLICK, () => {
        // Get current space and determine next hole
        const activeSpace = world.spaces.getActiveSpace()?.name
        const nextSpace = getNextHoleSpace(activeSpace)
        // Load the next hole space if it exists
        if (nextSpace) {
          world.spaces.loadSpace(nextSpace)
        }
      })
  },
})
