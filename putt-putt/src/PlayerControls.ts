import * as ecs from '@8thwall/ecs'

// Utility function: degrees to radians
const degToRad = (deg: number) => deg * Math.PI / 180

// Reusable math objects to avoid allocations
const tempQuat = ecs.math.quat.zero()
const tempVec3 = ecs.math.vec3.zero()
const tempMat4 = ecs.math.mat4.i()

// --- Main Component: Golf Ball Launch ---
// This handles aiming, power meter, swinging, club animation, physics, and simple respawn.
// Attach to the Player entity for each hole.

ecs.registerComponent({
  name: 'Player Controls',
  // --- Configuration exposed in Inspector ---
  schema: {
    // @label Player Rotation Speed
    rotationSpeed: ecs.f32,  // How fast the ball/club rotates (deg/sec)
    // @label Player Initial Rotation
    initialYRotation: ecs.f32,  // Starting Y rotation (degrees)
    // @label Reset Ball Height
    resetY: ecs.f32,  // Y position threshold for out-of-bounds respawn
    // @label Entity: Golf Ball
    golfBallObj: ecs.eid,  // Entity ID of the golf ball
    // @label Entity: Golf Club
    golfClubObj: ecs.eid,  // Entity ID of the golf club
    // @label UI: Controls
    controls: ecs.eid,  // Entity ID of the controls UI group
    // @label UI: Swing Button
    swingButton: ecs.eid,  // Entity ID of the swing button
    // @label UI: Left Arrow Button
    leftButton: ecs.eid,  // Entity ID of the left button
    // @label UI: Right Arrow Button
    rightButton: ecs.eid,  // Entity ID of the right button
    // @label UI: Swing Label
    swingLabel: ecs.eid,  // Entity ID of the label behind the swing button
    // @label UI: Power Meter Bar
    powerMeterBar: ecs.eid,  // Entity ID of the parent/container for the power meter
    // @label UI: Overlay
    overlay: ecs.eid,  // Entity ID of the overlay UI
  },
  // --- Default Inspector values ---
  schemaDefaults: {
    rotationSpeed: 2.0,
    initialYRotation: 90,
    resetY: -3,
  },
  // --- Internal state not exposed in Inspector ---
  data: {
    velocity: ecs.f32,  // Launch power (derived from power meter)
    highPrecisionMode: ecs.boolean,  // Set high precision mode on high FPS devices
    currentAngle: ecs.f32,  // Current aiming angle (radians)
    animStarted: ecs.boolean,  // Whether the power meter anim is running
    swingAnimTime: ecs.f32,  // Time since swing started
    lastSafeX: ecs.f32,  // Last safe ball X (where it was hit from)
    lastSafeY: ecs.f32,  // Last safe ball Y (where it was hit from)
    lastSafeZ: ecs.f32,  // Last safe ball Z (where it was hit from)
    leftHeld: ecs.boolean,  // Left UI/button/key held
    rightHeld: ecs.boolean,  // Right UI/button/key held
    hasInitializedAngle: ecs.boolean,  // Only apply initial rotation once
    ballStopped: ecs.boolean,  // Track if ball has stopped
    resetTriggered: ecs.boolean,  // Prevent multiple reset calls
    hasRecordedInitialPosition: ecs.boolean,  // Track if we've recorded the first position

    // Track the last rolling direction so we can orient the club when the ball stops
    lastVelX: ecs.f32,
    lastVelZ: ecs.f32,
  },

  // --- The State Machine: Controls behavior, animation, and transitions ---
  stateMachine: ({world, eid, schemaAttribute, dataAttribute}) => {
    const levelLoaded = ecs.defineTrigger()
    // --- Helper: Reset ball to last safe position ---
    const resetBallPosition = () => {
      const {golfBallObj, powerMeterBar, controls} = schemaAttribute.get(eid)
      const data = dataAttribute.get(eid)

      if (typeof data.lastSafeX === 'number') {
        ecs.Position.set(world, golfBallObj, {
          x: data.lastSafeX,
          y: data.lastSafeY,
          z: data.lastSafeZ,
        })
        ecs.physics.setLinearVelocity(world, golfBallObj, 0, 0, 0)
        ecs.physics.setAngularVelocity(world, golfBallObj, 0, 0, 0)
        world.getEntity(eid).show()
        world.getEntity(powerMeterBar).show()
        world.getEntity(controls).show()
      }
    }

    // Helper: Check if ball is moving
    const isBallMoving = () => {
      const {golfBallObj} = schemaAttribute.get(eid)
      const vel = ecs.physics.getLinearVelocity(world, golfBallObj)
      const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
      return speed > 0.005
    }

    // --- Helper: For power meter color ---
    const colorStops = [
      {r: 255, g: 0, b: 0},
      {r: 255, g: 153, b: 0},
      {r: 255, g: 255, b: 0},
      {r: 0, g: 255, b: 0},
    ]
    const rgbToHex = (r, g, b) => {
      r = Math.max(0, Math.min(255, Math.round(r)))
      g = Math.max(0, Math.min(255, Math.round(g)))
      b = Math.max(0, Math.min(255, Math.round(b)))
      const toHex = c => c.toString(16).padStart(2, '0')
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`
    }

    let frameCount = 0
    let runningTotal = 0

    ecs.defineState('init')
      .initial()
      .onTick(() => {
        frameCount++
        runningTotal += world.time.delta
        if (frameCount >= 10) {
          const average = runningTotal / frameCount
          if (average < 10) {
            // high precision enabled for high framerate devices
            dataAttribute.cursor(eid).highPrecisionMode = true
          } else {
            // high precision disabled for low framerate devices
            dataAttribute.cursor(eid).highPrecisionMode = false
          }
          runningTotal = 0
          frameCount = 0
        }
      })
      .listen(world.events.globalId, 'level-loaded', () => {
        // Show overlay when level is loaded
        const {overlay} = schemaAttribute.get(eid)
        const overlayEnt = world.getEntity(overlay)
        overlayEnt.enable()

        // Set up collider with high precision mode
        ecs.Collider.set(world, schemaAttribute.get(eid).golfBallObj, {
          gravityFactor: 1,
          highPrecision: dataAttribute.cursor(eid).highPrecisionMode,
        })

        levelLoaded.trigger()
      })
      .onTrigger(levelLoaded, 'powerMeter')  // Move to "powerMeter" state after load screen dismissed

    // --- State 1: Power Meter/Aiming ---
    ecs.defineState('powerMeter')
      .onEnter(() => {
        // Show UI, reset state, and record initial safe position only if not recorded yet
        const {golfBallObj, powerMeterBar, controls} = schemaAttribute.get(eid)
        const dataCursor = dataAttribute.cursor(eid)

        world.getEntity(powerMeterBar).show()
        world.getEntity(controls).show()

        // Only record the initial position if we haven't already
        if (!dataCursor.hasRecordedInitialPosition) {
          const pos = ecs.Position.get(world, golfBallObj)
          dataCursor.lastSafeX = pos?.x || 0
          dataCursor.lastSafeY = pos?.y || 0
          dataCursor.lastSafeZ = pos?.z || 0
          dataCursor.hasRecordedInitialPosition = true
        }

        dataCursor.animStarted = false
        dataCursor.leftHeld = false
        dataCursor.rightHeld = false
        dataCursor.ballStopped = false
        dataCursor.resetTriggered = false
        // Only apply initial rotation on first time
        dataCursor.hasInitializedAngle = dataCursor.hasInitializedAngle || false
      })
      .onTick(() => {
        // Get everything needed from schema
        const {powerMeterBar, rotationSpeed, initialYRotation} = schemaAttribute.get(eid)
        const data = dataAttribute.cursor(eid)
        const delta = world.time.delta * 0.001

        // Check if ball is still moving and transition if needed
        if (isBallMoving()) {
          world.events.dispatch(eid, 'ball-moving')
          return
        }

        // --- INITIAL ROTATION (applies only once per entity) ---
        if (!data.hasInitializedAngle) {
          data.currentAngle = degToRad(initialYRotation)
          tempQuat.makeYRadians(data.currentAngle)
          world.setQuaternion(eid, tempQuat.x, tempQuat.y, tempQuat.z, tempQuat.w)
          data.hasInitializedAngle = true
        }

        // --- Animate the Power Meter Bar ---
        if (!data.animStarted && powerMeterBar) {
          ecs.CustomPropertyAnimation.set(world, powerMeterBar, {
            attribute: 'ui',
            property: 'height',
            from: 1,
            to: 150,
            duration: 1000,
            loop: true,
            reverse: true,
          })
          data.animStarted = true
        }

        // --- Power/Velocity Calculation and Color ---
        if (powerMeterBar) {
          const powerMeterUi = ecs.Ui.get(world, powerMeterBar)
          const heightValue = parseFloat(powerMeterUi.height)
          data.velocity = Math.max(1, Math.min(10, heightValue / 15))

          // Animate color based on bar height
          const t = Math.max(0, Math.min(1, (heightValue - 1) / 149))
          const segmentIndex = Math.floor(t * 3)
          const segmentT = (t - segmentIndex / 3) * 3
          const fromColor = colorStops[segmentIndex]
          const toColor = colorStops[Math.min(segmentIndex + 1, colorStops.length - 1)]
          const r = fromColor.r + (toColor.r - fromColor.r) * segmentT
          const g = fromColor.g + (toColor.g - fromColor.g) * segmentT
          const b = fromColor.b + (toColor.b - fromColor.b) * segmentT
          const hex = rgbToHex(r, g, b)
          ecs.Ui.mutate(world, powerMeterBar, (cursor) => {
            cursor.background = hex
            return false
          })
        }

        // --- INPUT HANDLING (UI + keyboard/gamepad) ---
        // Hold-to-turn via UI buttons
        if (world.input.getAction('left') || data.leftHeld) {
          data.currentAngle += rotationSpeed * delta
        }
        if (world.input.getAction('right') || data.rightHeld) {
          data.currentAngle -= rotationSpeed * delta
        }

        // Keep angle in -PI..PI
        if (data.currentAngle > Math.PI) data.currentAngle -= Math.PI * 2
        if (data.currentAngle < -Math.PI) data.currentAngle += Math.PI * 2

        // Apply rotation to ball entity (will also rotate club)
        tempQuat.makeYRadians(data.currentAngle)
        world.setQuaternion(eid, tempQuat.x, tempQuat.y, tempQuat.z, tempQuat.w)

        // --- SWING input ---
        if (world.input.getAction('swing')) {
          world.events.dispatch(eid, 'golf-swing')
        }
      })

      // --- UI Button events ---
      .listen(() => schemaAttribute.get(eid).leftButton, ecs.input.UI_PRESSED, () => {
        dataAttribute.cursor(eid).leftHeld = true
      })
      .listen(() => schemaAttribute.get(eid).leftButton, ecs.input.UI_RELEASED, () => {
        dataAttribute.cursor(eid).leftHeld = false
      })
      .listen(() => schemaAttribute.get(eid).rightButton, ecs.input.UI_PRESSED, () => {
        dataAttribute.cursor(eid).rightHeld = true
      })
      .listen(() => schemaAttribute.get(eid).rightButton, ecs.input.UI_RELEASED, () => {
        dataAttribute.cursor(eid).rightHeld = false
      })
      .listen(() => schemaAttribute.get(eid).swingButton, ecs.input.UI_HOVER_START, () => {
        ecs.Ui.set(world, schemaAttribute.get(eid).swingLabel, {
          background: '#14498F',
        })
      })
      .listen(() => schemaAttribute.get(eid).swingButton, ecs.input.UI_HOVER_END, () => {
        ecs.Ui.set(world, schemaAttribute.get(eid).swingLabel, {
          background: '#006EFF',
        })
      })
      .listen(() => schemaAttribute.get(eid).swingButton, ecs.input.UI_CLICK, () => {
        world.events.dispatch(eid, 'golf-swing')
      })
      // Listen for ball collision events
      .listen(() => schemaAttribute.get(eid).golfBallObj, ecs.physics.COLLISION_START_EVENT, () => {
        world.events.dispatch(eid, 'ball-struck')
      })
      .onEvent('golf-swing', 'swing')  // Transition to swing
      .onEvent('ball-struck', 'waitForBall')  // Transition to waitForBall when ball is struck
      .onEvent('ball-moving', 'waitForBall')  // Transition to waitForBall when ball is still moving

    // --- State 2: Club Animation and Ball Launch ---
    ecs.defineState('swing')
      .onEnter(() => {
        // Hide UI, start club animation, and record position where ball is being hit FROM
        const {golfBallObj, powerMeterBar, controls} = schemaAttribute.get(eid)
        world.getEntity(powerMeterBar).hide()
        world.getEntity(controls).hide()

        // Record the position where the ball is being hit from
        const pos = ecs.Position.get(world, golfBallObj)
        if (pos) {
          const data = dataAttribute.cursor(eid)
          data.lastSafeX = pos.x
          data.lastSafeY = pos.y
          data.lastSafeZ = pos.z
        }

        dataAttribute.cursor(eid).swingAnimTime = 0
      })
      .onTick(() => {
        // Animate the club swinging forward/back
        const {golfClubObj} = schemaAttribute.get(eid)
        const data = dataAttribute.cursor(eid)
        const duration = 0.5
        data.swingAnimTime += world.time.delta * 0.001
        const t = Math.min(1, data.swingAnimTime / duration)
        let angle
        if (t < 0.45) {
          // Backswing cubic ease-out
          const t2 = t / 0.45
          angle = 30 + 30 * (t2 * t2 * t2)
        } else {
          // Downswing cubic ease-in
          const t2 = (t - 0.45) / 0.55
          angle = 60 + (-90) * (1 - Math.pow(1 - t2, 3))
        }
        const zRotation = ecs.math.quat.zRadians(angle * Math.PI / 180)
        const xRotation = ecs.math.quat.xDegrees(14)
        const combinedRotation = xRotation.times(zRotation)
        world.setQuaternion(golfClubObj, combinedRotation.x, combinedRotation.y, combinedRotation.z, combinedRotation.w)
        world.setPosition(golfClubObj, 0.1, 0.7, 0.2)
      })
      .wait(325, 'hitBall')  // After 325ms, hit the ball

    // --- State 3: Apply physics impulse to golf ball on swing ---
    ecs.defineState('hitBall')
      .onEnter(() => {
        const {golfBallObj} = schemaAttribute.get(eid)
        // play ball hit SFX
        if (ecs.Audio.has(world, golfBallObj)) {
          ecs.Audio.mutate(world, golfBallObj, (cursor) => {
            cursor.paused = false
          })
        }
        // Calculate forward direction based on current angle
        const data = dataAttribute.cursor(eid)
        tempQuat.makeYRadians(data.currentAngle)
        world.setQuaternion(golfBallObj, tempQuat.x, tempQuat.y, tempQuat.z, tempQuat.w)
        // Forward vector in local space (-X)
        world.getWorldTransform(golfBallObj, tempMat4)
        const {r} = tempMat4.decomposeTrs()
        const forward = r.timesVec(tempVec3.setXyz(-1, 0, 0))
        ecs.physics.applyImpulse(
          world, golfBallObj,
          forward.x * data.velocity,
          forward.y * data.velocity,
          forward.z * data.velocity
        )
      })
      .wait(100, 'waitForBall')  // Wait a moment for launch

    // --- State 4: Ball in flight (waiting to stop or go out-of-bounds) ---
    ecs.defineState('waitForBall')
      .onEnter(() => {
        // Hide UI and club while the ball is moving
        const {golfBallObj, powerMeterBar, controls} = schemaAttribute.get(eid)
        world.getEntity(powerMeterBar).hide()
        world.getEntity(controls).hide()
        world.getEntity(eid).hide()
        const data = dataAttribute.cursor(eid)
        data.ballStopped = false
        data.resetTriggered = false

        // Seed last rolling direction with current velocity (projected to XZ)
        const vel = ecs.physics.getLinearVelocity(world, golfBallObj)
        data.lastVelX = vel.x
        data.lastVelZ = vel.z
      })
      .onTick(() => {
        // Watch the ball position/speed for reset or next turn
        const {golfBallObj, resetY} = schemaAttribute.get(eid)
        const vel = ecs.physics.getLinearVelocity(world, golfBallObj)
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
        const ballPos = ecs.Position.get(world, golfBallObj)
        const data = dataAttribute.cursor(eid)

        // While moving, continuously capture last horizontal rolling direction
        const movingThreshold = 0.005
        if (speed > movingThreshold) {
          data.lastVelX = vel.x
          data.lastVelZ = vel.z
        }

        // Check for out-of-bounds condition
        const isOutOfBounds = ballPos?.y < resetY

        // If ball is out of bounds and reset hasn't been triggered yet
        if (isOutOfBounds && !data.resetTriggered) {
          data.resetTriggered = true
          resetBallPosition()
          world.events.dispatch(eid, 'golf-reset')
          return
        }

        // Check if ball has stopped moving and reset hasn't been triggered
        if (speed < movingThreshold && !data.ballStopped && !data.resetTriggered) {
          data.ballStopped = true

          // Orient the player/club toward the last rolling direction on stop
          const xzLen = Math.hypot(data.lastVelX, data.lastVelZ)
          if (xzLen > 1e-4) {
            const nx = data.lastVelX / xzLen
            const nz = data.lastVelZ / xzLen
            // FIX: our forward is local -X; for world dir (nx, nz), yaw must satisfy
            // R_y(yaw) * (-1,0,0) = (nx, 0, nz) => yaw = atan2(nz, -nx)
            const yaw = Math.atan2(nz, -nx)

            data.currentAngle = yaw
            // keep in -PI..PI
            if (data.currentAngle > Math.PI) data.currentAngle -= Math.PI * 2
            if (data.currentAngle < -Math.PI) data.currentAngle += Math.PI * 2

            tempQuat.makeYRadians(data.currentAngle)
            // Apply to the aiming/player entity so when we return to powerMeter, the club faces this way
            world.setQuaternion(eid, tempQuat.x, tempQuat.y, tempQuat.z, tempQuat.w)
          }

          // Start 800ms timer after ball stops (reacquire cursor inside timeout)
          world.time.setTimeout(() => {
            const d = dataAttribute.cursor(eid)
            if (!d.resetTriggered) {
              d.resetTriggered = true
              world.events.dispatch(eid, 'golf-reset')
            }
          }, 800)
        }
      })
      .onEvent('golf-reset', 'powerMeter')  // Transition back to aiming
      .onExit(() => {
        // Reset club position and UI for next shot
        const {golfBallObj, golfClubObj, powerMeterBar, controls} = schemaAttribute.get(eid)
        const golfBallPos = ecs.Position.get(world, golfBallObj)
        if (golfBallPos) {
          ecs.Position.set(world, eid, {
            x: golfBallPos.x,
            y: golfBallPos.y,
            z: golfBallPos.z,
          })
        }
        tempQuat.makePitchYawRollDegrees(tempVec3.setXyz(14, 0, 0))
        world.setQuaternion(golfClubObj, tempQuat.x, tempQuat.y, tempQuat.z, tempQuat.w)
        world.getEntity(powerMeterBar).show()
        world.getEntity(controls).show()
        world.getEntity(eid).show()
      })
  },
})
