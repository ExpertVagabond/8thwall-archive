// RaceLogic.ts
// Custom component for managing a simple two-lap race flow using 8th Wall Studio's ECS state machine.
// The logic progresses through: pre-race intro -> start first lap -> start final lap.

import * as ecs from '@8thwall/ecs'

// Timing & position constants (ms)
const INTRO_CAMERA_TRACK_DURATION = 10_000
const INTRO_SWITCH_TO_CHOPPER_AT = INTRO_CAMERA_TRACK_DURATION  // 10s
const INTRO_SWITCH_TO_TRIPOD_AT = 23_000
const INTRO_PLACE_BALL_AND_START_AT = 33_000
const ENABLE_BALL_PHYSICS_DELAY = 2_000

// Camera animation presets
const CAMERA_TRACK_ANIM = {
  fromX: 3,
  fromY: 2,
  fromZ: -3,
  toX: 3,
  toY: 8,
  toZ: -3,
  duration: INTRO_CAMERA_TRACK_DURATION,
  loop: false,
  reverse: false,
  easeIn: true,
  easeOut: true,
}

// Spawn / move targets
const BALL_SPAWN_POS = {x: -0.5, y: 0.25, z: -3}
const LAST_TURN_TRIGGER_OFF_POS = {x: 3, y: -5, z: -8.5}
const LAP_BACKSTOP_OFF_POS = {x: -0.712, y: -5, z: -5.023}
const FIRST_TURN_TRIGGER_ON_POS = {x: -0.61, y: 0.5, z: 2.217}
const FIRST_TURN_TRIGGER_OFF_POS = {x: -0.61, y: -5, z: 2.217}
const LAST_TURN_TRIGGER_ON_POS = {x: 3, y: 0.5, z: -8.5}
const PODIUM_HOLE_ON_POS = {x: -0.45, y: -0.1, z: 1.2}

const show = (world: ecs.World, targetEid: ecs.eid) => world.getEntity(targetEid).show()
const hide = (world: ecs.World, targetEid: ecs.eid) => world.getEntity(targetEid).hide()
const move = (world: ecs.World, targetEid: ecs.eid, pos: {x: number; y: number; z: number}) => world.transform.setWorldPosition(targetEid, pos)

const setJumbotrons = (world: ecs.World, eids: ecs.eid[], text: string) => {
  for (const id of eids) ecs.Ui.set(world, id, {text})
}

const setBallPhysics = (world: ecs.World, ball: ecs.eid, gravityFactor: number, mass: number) => {
  ecs.Collider.set(world, ball, {gravityFactor, mass})
}

ecs.registerComponent({
  name: 'RaceLogic',
  schema: {
    // @label Entity: Player
    playerObj: ecs.eid,
    // @label Entity: Golf Ball
    golfBallObj: ecs.eid,
    // @label Entity: Lap Backstop
    lapBackstop: ecs.eid,
    // @label Entity: First Turn Trigger
    firstTurnTrigger: ecs.eid,
    // @label Entity: Last Turn Trigger
    lastTurnTrigger: ecs.eid,
    // @label Entity: Podium Hole
    podiumHole: ecs.eid,
    // @label UI: SFGPLogoOverlay
    SFGPLogoOverlay: ecs.eid,
    // @label UI: Overlay
    overlay: ecs.eid,
    // @label Camera: Track
    cameraTrack: ecs.eid,
    // @label Camera: Tripod
    cameraTripod: ecs.eid,
    // @label Camera: Chopper
    cameraChopper: ecs.eid,
    // @label Camera: Player
    cameraPlayer: ecs.eid,
    // @label Entity: Jumbotron 1 Text
    jumbotron1Text: ecs.eid,
    // @label Entity: Jumbotron 2 Text
    jumbotron2Text: ecs.eid,
    // @label Entity: Jumbotron 3 Text
    jumbotron3Text: ecs.eid,
  },

  stateMachine: ({world, eid, schemaAttribute}) => {
    // Triggers used for explicit transitions
    const startFirstLap = ecs.defineTrigger()
    const startFinalLap = ecs.defineTrigger()

    // Convenience accessor for current schema (safe inside async/event callbacks)
    const schema = () => schemaAttribute.get(eid)

    // ──────────────────────────────────────────────────────────────────────────
    // State: preRaceIntro
    // Sets up the scene, runs fly-by cameras, then spawns the ball and begins Lap 1.
    // ──────────────────────────────────────────────────────────────────────────
    ecs.defineState('preRaceIntro')
      .initial()
      .onEnter(() => {
        console.log('[RaceLogic] enter preRaceIntro')
      })
      .listen(world.events.globalId, 'level-loaded', () => {
        const s = schema()

        // Hide gameplay elements until the intro completes
        hide(world, s.playerObj)
        hide(world, s.golfBallObj)
        hide(world, s.overlay)
        hide(world, s.podiumHole)

        // Start on the Track camera with a slow vertical dolly
        world.camera.setActiveEid(s.cameraTrack)
        ecs.PositionAnimation.set(world, s.cameraTrack, CAMERA_TRACK_ANIM)

        // After camera track completes, show quick Chopper cutaway
        world.time.setTimeout(() => {
          hide(world, s.SFGPLogoOverlay)
          world.camera.setActiveEid(s.cameraChopper)
        }, INTRO_SWITCH_TO_CHOPPER_AT)

        // Then switch to Tripod and prep a physics-less ball
        world.time.setTimeout(() => {
          world.camera.setActiveEid(s.cameraTripod)
          setBallPhysics(world, s.golfBallObj, /* gravityFactor */ 0, /* mass */ 0)
          // Hide Player
          hide(world, s.playerObj)
        }, INTRO_SWITCH_TO_TRIPOD_AT)

        // Place ball at tee and kick off Lap 1
        world.time.setTimeout(() => {
          move(world, s.golfBallObj, BALL_SPAWN_POS)
          startFirstLap.trigger()
        }, INTRO_PLACE_BALL_AND_START_AT)
      })
      .onTrigger(startFirstLap, 'startFirstLap')

    // ──────────────────────────────────────────────────────────────────────────
    // State: startFirstLap
    // Reveals player HUD, enables ball physics, listens for turn triggers.
    // Transitions to startFinalLap after passing the first turn at the start of Lap 2.
    // ──────────────────────────────────────────────────────────────────────────
    ecs.defineState('startFirstLap')
      .onEnter(() => {
        console.log('[RaceLogic] enter startFirstLap')
        const s = schema()

        // Hide Player
        hide(world, s.playerObj)

        // Reveal ball and overlay
        show(world, s.golfBallObj)
        show(world, s.overlay)

        // Give the ball physics after a small delay
        world.time.setTimeout(() => setBallPhysics(world, s.golfBallObj, 1, 1), ENABLE_BALL_PHYSICS_DELAY)

        // Reset curve animations; in this case, cars to their starting spots
        world.events.dispatch(world.events.globalId, 'reset_animation')

        // Update in-scene signage
        setJumbotrons(world, [s.jumbotron1Text, s.jumbotron2Text, s.jumbotron3Text], 'LAP 1')

        // Switch to gameplay camera
        world.camera.setActiveEid(s.cameraPlayer)

        // Reveal player after ball has settled
        world.time.setTimeout(() => {
          show(world, s.playerObj)
          console.log('showing player')
        }, 3000)
      })

      // Drive through LAST turn to open track for Lap 2
      .listen(
        () => schema().lastTurnTrigger,
        ecs.physics.COLLISION_START_EVENT,
        (event) => {
          const s = schema()
          if (event.data.other === s.golfBallObj) {
            // Pull lastTurnTrigger + backstop out of the way, arm firstTurn for Lap 2
            move(world, s.lastTurnTrigger, LAST_TURN_TRIGGER_OFF_POS)
            move(world, s.lapBackstop, LAP_BACKSTOP_OFF_POS)
            move(world, s.firstTurnTrigger, FIRST_TURN_TRIGGER_ON_POS)
            console.log('[RaceLogic] lastTurnTrigger collided (Lap 1 end prep)')
          }
        }
      )

      // Cross FIRST turn at the start of the final lap -> transition
      .listen(
        () => schema().firstTurnTrigger,
        ecs.physics.COLLISION_START_EVENT,
        (event) => {
          const s = schema()
          if (event.data.other === s.golfBallObj) {
            // Swap triggers for the final-lap flow
            move(world, s.firstTurnTrigger, FIRST_TURN_TRIGGER_OFF_POS)
            move(world, s.lastTurnTrigger, LAST_TURN_TRIGGER_ON_POS)

            // Update signage
            setJumbotrons(world, [s.jumbotron1Text, s.jumbotron2Text, s.jumbotron3Text], 'FINAL LAP')

            startFinalLap.trigger()
          }
        }
      )
      .onTrigger(startFinalLap, 'startFinalLap')

    // ──────────────────────────────────────────────────────────────────────────
    // State: startFinalLap
    // When the player hits the final corner, reveal the podium hole and finish.
    // ──────────────────────────────────────────────────────────────────────────
    ecs.defineState('startFinalLap')
      .onEnter(() => {
        console.log('[RaceLogic] enter startFinalLap')
      })
      .listen(
        () => schema().lastTurnTrigger,
        ecs.physics.COLLISION_START_EVENT,
        (event) => {
          const s = schema()
          if (event.data.other === s.golfBallObj) {
            // Clear the last turn trigger and reveal the podium hole finish
            move(world, s.lastTurnTrigger, LAST_TURN_TRIGGER_OFF_POS)
            move(world, s.podiumHole, PODIUM_HOLE_ON_POS)
            show(world, s.podiumHole)
            console.log('[RaceLogic] FINAL LAP: lastTurnTrigger collided (podium revealed)')
          }
        }
      )
  },
})
