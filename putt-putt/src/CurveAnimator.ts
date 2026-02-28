// CurveAnimator.ts
// Move an entity along a curve with optional train-style arc-length movement,
// orientation to travel direction, and optional debug visualization.

import * as ecs from '@8thwall/ecs'
import {curveDataSets} from './CurveData'

const {Position, Quaternion, BoxGeometry, Material} = ecs
const {vec3, quat} = ecs.math

// Returns the curve data to use right now.
// If useCustomStartPosition is enabled, we persist a modified curve whose first
// point matches the entity's captured original start position.
function getCurrentCurveData(world, eid, schemaAttribute, dataAttribute) {
  const schema = schemaAttribute.get(eid)
  const data = dataAttribute.get(eid) || {}

  const baseCurveData = curveDataSets[schema.curveDataKey] || curveDataSets.default

  // Fast path: reuse previously built, persisted curve for this key
  if (schema.useCustomStartPosition && data.modifiedCurveData && data.cachedCurveKey === schema.curveDataKey) {
    try {
      return JSON.parse(data.modifiedCurveData)
    } catch (e) {
      console.warn('Failed to parse modified curve data:', e)
    }
  }

  // Not using a custom start -> just use the base data
  if (!schema.useCustomStartPosition) {
    return baseCurveData
  }

  // Custom start: ensure we have a captured start (position when component first ran)
  let startX = data.originalStartX
  let startY = data.originalStartY
  let startZ = data.originalStartZ

  if (!data.hasCapturedStart) {
    const p = Position.get(world, eid)
    startX = p?.x ?? 0
    startY = p?.y ?? 0
    startZ = p?.z ?? 0

    dataAttribute.set(eid, {
      hasCapturedStart: true,
      originalStartX: startX,
      originalStartY: startY,
      originalStartZ: startZ,
    })
  }

  // Prepend custom start; optionally close the loop at the same custom point
  const customStartPoint = {x: startX || 0, y: startY || 0, z: startZ || 0}

  let modifiedPoints
  if (schema.loopAtCustomPosition && schema.loop) {
    modifiedPoints = [customStartPoint, ...baseCurveData.points, customStartPoint]
  } else if (schema.loopAtCustomPosition) {
    modifiedPoints = [customStartPoint, ...baseCurveData.points, customStartPoint]
  } else {
    modifiedPoints = [customStartPoint, ...baseCurveData.points]
  }

  const modifiedCurveData = {...baseCurveData, points: modifiedPoints}

  // Persist for reuse (same curveDataKey)
  dataAttribute.set(eid, {
    modifiedCurveData: JSON.stringify(modifiedCurveData),
    cachedCurveKey: schema.curveDataKey,
  })

  return modifiedCurveData
}

// True if first and last control points are effectively the same (closed curve)
function isCurveClosed(curveData) {
  if (!curveData.points || curveData.points.length < 2) return false

  const first = curveData.points[0]
  const last = curveData.points[curveData.points.length - 1]

  const tolerance = 0.001
  return Math.abs(first.x - last.x) < tolerance &&
         Math.abs(first.y - last.y) < tolerance &&
         Math.abs((first.z || 0) - (last.z || 0)) < tolerance
}

// Removes the duplicated end point on closed curves so interpolation math is clean
function getEffectivePoints(curveData) {
  if (!curveData.points) return []

  if (isCurveClosed(curveData) && curveData.points.length > 2) {
    // Drop the final repeated point (equal to the first)
    return curveData.points.slice(0, -1)
  }

  return curveData.points
}

const CurveAnimator = ecs.registerComponent({
  name: 'CurveAnimator',
  schema: {
    curveDataKey: ecs.string,  // reference to the name of the curve in CurveData.ts
    duration: ecs.f32,  // the total duration of the curve animation
    loop: ecs.boolean,  // whether the animation should loop
    autoStart: ecs.boolean,  // whether the animation should start automatically
    autoStartDelay: ecs.f32,  // how long in ms to wait before autostarting
    orientToDirection: ecs.boolean,  // orients the entity in the direction of travel
    debugVisualization: ecs.boolean,  // displays boxes at each curve point
    useCustomStartPosition: ecs.boolean,  // if checked, the first point of the curve is the entity's transform
    // @condition useCustomStartPosition=true
    loopAtCustomPosition: ecs.boolean,  // if checked, the last position of the curve is also the entity's transform
    trainMode: ecs.boolean,  // Moves along the curve like a train on tracks, using distance, offsets, and speed adjustments for smoother, realistic motion
    // @condition trainMode=true
    carOffset: ecs.f32,  // Distance offset along track
    // @condition trainMode=true
    maintainSpacing: ecs.boolean,  // Keep consistent spacing between entities (reserved)
    // @condition trainMode=true
    trackTightness: ecs.f32,  // 0..1: 1 = snap to track, lower = smoothing/lag
    // @condition trainMode=true
    lookAheadDistance: ecs.f32,  // Distance along arc-length to sample direction
    // @condition trainMode=true
    speedCompensation: ecs.boolean,  // Adjust speed by curve curvature
    // @condition trainMode=true
    minSpeed: ecs.f32,  // Min speed multiplier when curvature is high
    // @condition trainMode=true
    maxSpeed: ecs.f32,  // Max speed multiplier on straights
  },
  schemaDefaults: {
    curveDataKey: 'train',
    duration: 10.0,
    loop: true,
    autoStart: true,
    autoStartDelay: 0.0,
    orientToDirection: true,
    debugVisualization: false,
    useCustomStartPosition: false,
    loopAtCustomPosition: true,
    trainMode: false,
    // Train-specific defaults
    carOffset: 0.0,
    maintainSpacing: true,
    trackTightness: 0.9,
    lookAheadDistance: 0.5,
    speedCompensation: true,
    minSpeed: 0.4,
    maxSpeed: 1.2,
  },
  data: {
    // In train mode: traveled arc length along curve.
    // In non-train mode: elapsed time into the animation.
    currentDistance: ecs.f32,
    // Cached total arc length of the curve (train mode only).
    totalTrackLength: ecs.f32,
    // Whether the animation is currently running.
    isPlaying: ecs.boolean,
    // Direction of travel: 1 = forward, -1 = backward.
    direction: ecs.f32,
    // Last frame’s position, used for orientation calculations.
    previousPositionX: ecs.f32,
    previousPositionY: ecs.f32,
    previousPositionZ: ecs.f32,
    // Countdown timer for autoStartDelay before starting playback.
    delayCountdown: ecs.f32,
    // JSON-encoded list of entity IDs for spawned debug cubes.
    debugBoxes: ecs.string,
    // JSON-encoded array mapping arc length distance to param t (0–1).
    arcLengthTable: ecs.string,
    // Current speed multiplier in train mode, smoothed for curvature.
    currentSpeed: ecs.f32,
    // Persisted curve JSON with a custom start position applied.
    modifiedCurveData: ecs.string,
    // Whether the entity’s original transform has been captured yet.
    hasCapturedStart: ecs.boolean,
    // Captured original position (persisted for resets).
    originalStartX: ecs.f32,
    originalStartY: ecs.f32,
    originalStartZ: ecs.f32,
    // Captured original rotation quaternion (persisted for resets).
    originalQuatX: ecs.f32,
    originalQuatY: ecs.f32,
    originalQuatZ: ecs.f32,
    originalQuatW: ecs.f32,
    // Key of the curveData used to build modifiedCurveData (for cache invalidation).
    cachedCurveKey: ecs.string,
  },
  stateMachine: ({world, eid, schemaAttribute, dataAttribute}) => {
    // Scratch vectors reused each frame
    const directionVec = vec3.zero()
    const upVec = vec3.up()
    const targetPosition = vec3.zero()

    // ===== Helpers (math + utilities) =====

    // Build an arc-length lookup table to convert distance -> param t (0..1)
    function calculateArcLengthTable(curveData, segments = 200) {
      const table = [0]
      let totalLength = 0
      let previousPoint = getCurvePoint(curveData, 0)

      for (let i = 1; i <= segments; i++) {
        const t = i / segments
        const currentPoint = getCurvePoint(curveData, t)

        if (currentPoint && previousPoint) {
          const dx = (currentPoint.x - previousPoint.x)
          const dy = (currentPoint.y - previousPoint.y)
          const dz = ((currentPoint.z || 0) - (previousPoint.z || 0))
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
          totalLength += distance
          table.push(totalLength)
          previousPoint = currentPoint
        }
      }

      return {table, totalLength}
    }

    // Binary search in the arc-length table to find the param for a target distance
    function getParameterForDistance(arcLengthTable, totalLength, targetDistance) {
      if (!arcLengthTable || arcLengthTable.length === 0) return 0
      targetDistance %= totalLength
      if (targetDistance < 0) targetDistance += totalLength
      let low = 0
      let high = arcLengthTable.length - 1
      while (low < high - 1) {
        const mid = Math.floor((low + high) / 2)
        if (arcLengthTable[mid] <= targetDistance) low = mid; else high = mid
      }
      const segmentLength = arcLengthTable[high] - arcLengthTable[low]
      const segmentProgress = segmentLength > 0 ? (targetDistance - arcLengthTable[low]) / segmentLength : 0
      return (low + segmentProgress) / (arcLengthTable.length - 1)
    }

    // Approximate curvature around t by sampling ahead/behind
    function calculateCurvature(curveData, t, delta = 0.01) {
      const t1 = Math.max(0, Math.min(1, t - delta))
      const t2 = Math.max(0, Math.min(1, t + delta))
      const p1 = getCurvePoint(curveData, t1)
      const p2 = getCurvePoint(curveData, t2)
      if (!p1 || !p2) return 0
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const dz = (p2.z || 0) - (p1.z || 0)
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
      return distance > 0 ? Math.min(1, (2 * delta) / distance - 1) : 0
    }

    // Get a forward direction by sampling a short distance ahead along the curve
    function getSmoothedDirection(curveData, arcLengthTable, totalLength, currentDistance, lookAhead) {
      const currentT = getParameterForDistance(arcLengthTable, totalLength, currentDistance)
      const futureDistance = currentDistance + lookAhead
      const futureT = getParameterForDistance(arcLengthTable, totalLength, futureDistance)
      const currentPoint = getCurvePoint(curveData, currentT)
      const futurePoint = getCurvePoint(curveData, futureT)
      if (!currentPoint || !futurePoint) return null
      return {x: futurePoint.x - currentPoint.x, y: futurePoint.y - currentPoint.y, z: (futurePoint.z || 0) - (currentPoint.z || 0)}
    }

    // True when we want the loop to start/end at the captured custom start point
    function shouldUseSeamlessLoop(schema) {
      return schema.useCustomStartPosition && schema.loop && schema.loopAtCustomPosition
    }

    // Create/destroy/update small debug cubes at each control point
    function createDebugVisualization() {
      const curveData = getCurrentCurveData(world, eid, schemaAttribute, dataAttribute)
      if (!curveData.points) return
      const debugBoxIds = []
      curveData.points.forEach((point, index) => {
        const debugBox = world.createEntity()
        Position.set(world, debugBox, {x: point.x || 0, y: point.y || 0, z: point.z || 0})
        BoxGeometry.set(world, debugBox, {width: 0.5, height: 0.5, depth: 0.5})
        const schema = schemaAttribute.get(eid)
        const isCustomStartOrEnd = schema.useCustomStartPosition && (index === 0 || (schema.loopAtCustomPosition && index === curveData.points.length - 1))
        const isNormalPoint = !isCustomStartOrEnd
        // Cyan for custom start/end, Red for normal points
        Material.set(world, debugBox, {
          r: isCustomStartOrEnd ? 0 : (isNormalPoint ? 255 : 0),
          g: isCustomStartOrEnd ? 255 : 0,
          b: isCustomStartOrEnd ? 255 : 0,
          opacity: 0.7,
        })
        debugBoxIds.push(debugBox.toString())
      })
      dataAttribute.set(eid, {debugBoxes: JSON.stringify(debugBoxIds)})
    }

    function removeDebugVisualization() {
      const data = dataAttribute.get(eid)
      if (data.debugBoxes) {
        try {
          const debugBoxIds = JSON.parse(data.debugBoxes)
          debugBoxIds.forEach((idStr) => {
            const boxEid = BigInt(idStr)
            if (world.getEntity(boxEid)) world.deleteEntity(boxEid)
          })
        } catch (e) {
          console.warn('Failed to parse debug box IDs:', e)
        }
        dataAttribute.set(eid, {debugBoxes: ''})
      }
    }

    function updateDebugVisualization() {
      const schema = schemaAttribute.get(eid)
      if (schema.debugVisualization) {
        removeDebugVisualization()
        createDebugVisualization()
      } else {
        removeDebugVisualization()
      }
    }

    // Capture the original transform once so resets can restore it
    function captureOriginalTransformOnce() {
      const d = dataAttribute.get(eid)
      if (!d.hasCapturedStart) {
        const p = Position.get(world, eid)
        const q = Quaternion.get(world, eid)
        dataAttribute.set(eid, {
          hasCapturedStart: true,
          originalStartX: p?.x ?? 0,
          originalStartY: p?.y ?? 0,
          originalStartZ: p?.z ?? 0,
          originalQuatX: q?.x ?? 0,
          originalQuatY: q?.y ?? 0,
          originalQuatZ: q?.z ?? 0,
          originalQuatW: q?.w ?? 1,
        })
      }
    }

    // If we captured a start, restore it immediately (position + rotation)
    function restoreOriginalTransformIfCaptured() {
      const d = dataAttribute.get(eid)
      if (d.hasCapturedStart) {
        Position.set(world, eid, {x: d.originalStartX || 0, y: d.originalStartY || 0, z: d.originalStartZ || 0})
        Quaternion.set(world, eid, {x: d.originalQuatX || 0, y: d.originalQuatY || 0, z: d.originalQuatZ || 0, w: d.originalQuatW || 1})
      }
    }

    // Initialize entity placement based on mode and first point
    function initializeCurve() {
      const schema = schemaAttribute.get(eid)
      const curveData = getCurrentCurveData(world, eid, schemaAttribute, dataAttribute)

      if (schema.trainMode) {
        // Arc-length parametrization for constant-ish world-space speed
        const {table, totalLength} = calculateArcLengthTable(curveData)
        const initialDistance = schema.carOffset % totalLength
        const initialT = getParameterForDistance(table, totalLength, initialDistance)
        const initialPoint = getCurvePoint(curveData, initialT)

        if (initialPoint) {
          Position.set(world, eid, {
            x: initialPoint.x || 0,
            y: initialPoint.y || 0,
            z: initialPoint.z || 0,
          })

          dataAttribute.set(eid, {
            currentDistance: initialDistance,
            totalTrackLength: totalLength,
            arcLengthTable: JSON.stringify(table),
            previousPositionX: initialPoint.x || 0,
            previousPositionY: initialPoint.y || 0,
            previousPositionZ: initialPoint.z || 0,
            currentSpeed: 1.0,
          })
        }
      } else if (curveData.points && curveData.points.length > 0) {
        // Place at first control point for time-based interpolation
        const firstPoint = curveData.points[0]
        Position.set(world, eid, {
          x: firstPoint.x || 0,
          y: firstPoint.y || 0,
          z: firstPoint.z || 0,
        })

        dataAttribute.set(eid, {
          currentDistance: 0,
          previousPositionX: firstPoint.x || 0,
          previousPositionY: firstPoint.y || 0,
          previousPositionZ: firstPoint.z || 0,
        })
      }
    }

    // Clear persisted custom-start curve if user changed curveDataKey
    function clearModifiedCurveData() {
      const schema = schemaAttribute.get(eid)
      const data = dataAttribute.get(eid)
      if (data.cachedCurveKey && data.cachedCurveKey !== schema.curveDataKey) {
        dataAttribute.set(eid, {modifiedCurveData: '', cachedCurveKey: ''})
      }
    }

    // Reset to initial conditions but keep the same captured custom start
    function resetAnimation() {
      const schema = schemaAttribute.get(eid)

      // Do not clear modifiedCurveData here; we want the same custom start to persist
      dataAttribute.set(eid, {
        isPlaying: false,
        direction: 1,
        delayCountdown: schema.autoStartDelay,
        currentDistance: 0,
        currentSpeed: 1.0,
      })

      restoreOriginalTransformIfCaptured()
      initializeCurve()
      updateDebugVisualization()
    }

    // ===== State Machine =====

    // Initializes placement and decides whether to auto-start
    const sInitializing = ecs.defineState('initializing')
      .initial()
      .onEnter(() => {
        captureOriginalTransformOnce()
        clearModifiedCurveData()

        const schema = schemaAttribute.get(eid)
        initializeCurve()

        dataAttribute.set(eid, {
          isPlaying: false,
          direction: 1,
          delayCountdown: schema.autoStartDelay,
        })

        if (schema.debugVisualization) {
          createDebugVisualization()
        }

        if (schema.autoStart) {
          if (schema.autoStartDelay > 0) {
            world.events.dispatch(eid, 'begin_delay')
          } else {
            world.events.dispatch(eid, 'start_animation')
          }
        }
      })
      .onEvent('begin_delay', 'delaying')
      .onEvent('start_animation', 'animating')
      .onEvent('stop_animation', 'stopped')
      .onEvent('toggle_debug', 'debug_toggled')
      .onEvent('reset_animation', 'resetting')

    // Toggles debug boxes whenever this state is entered
    const sDebug = ecs.defineState('debug_toggled')
      .onEnter(() => {
        updateDebugVisualization()
      })
      .onEvent('begin_delay', 'delaying')
      .onEvent('start_animation', 'animating')
      .onEvent('stop_animation', 'stopped')
      .onEvent('reset_animation', 'resetting')

    // Counts down autoStartDelay then starts animating
    const sDelaying = ecs.defineState('delaying')
      .onTick(({data}) => {
        const deltaTime = world.time.delta / 1000
        data.delayCountdown -= deltaTime
        if (data.delayCountdown <= 0) {
          world.events.dispatch(eid, 'delay_complete')
        }
      })
      .onEvent('delay_complete', 'animating')
      .onEvent('start_animation', 'animating')
      .onEvent('stop_animation', 'stopped')
      .onEvent('toggle_debug', 'debug_toggled')
      .onEvent('reset_animation', 'resetting')

    // Main animation loop (trainMode: arc-length, else: time-based)
    const sAnimating = ecs.defineState('animating')
      .onEnter(() => {
        dataAttribute.set(eid, {isPlaying: true})
      })
      .onTick(({data, schema}) => {
        if (!data.isPlaying) return

        const deltaTime = world.time.delta / 1000
        const curveData = getCurrentCurveData(world, eid, schemaAttribute, dataAttribute)

        if (schema.trainMode) {
          // ---- TRAIN MODE (arc-length driven) ----
          let arcLengthTable = []
          try {
            arcLengthTable = JSON.parse(data.arcLengthTable || '[]')
          } catch (e) {
            console.warn('Failed to parse arc length table')
            return
          }

          let baseSpeed = data.totalTrackLength / schema.duration

          if (schema.speedCompensation) {
            const currentT = getParameterForDistance(arcLengthTable, data.totalTrackLength, data.currentDistance)
            const curvature = calculateCurvature(curveData, currentT)
            const targetSpeed = schema.minSpeed + (schema.maxSpeed - schema.minSpeed) * (1 - curvature)
            data.currentSpeed += (targetSpeed - data.currentSpeed) * deltaTime * 3
            baseSpeed *= data.currentSpeed
          }

          const distanceDelta = baseSpeed * deltaTime * data.direction
          data.currentDistance += distanceDelta

          // Looping / clamping rules (respect custom-start behavior)
          if (schema.loop) {
            if (data.currentDistance >= data.totalTrackLength) {
              if (!schema.useCustomStartPosition) {
                data.currentDistance = 0
                const firstT = getParameterForDistance(arcLengthTable, data.totalTrackLength, 0)
                const firstPoint = getCurvePoint(curveData, firstT)
                if (firstPoint) {
                  Position.set(world, eid, {x: firstPoint.x || 0, y: firstPoint.y || 0, z: firstPoint.z || 0})
                  data.previousPositionX = firstPoint.x || 0
                  data.previousPositionY = firstPoint.y || 0
                  data.previousPositionZ = firstPoint.z || 0
                }
              } else {
                data.currentDistance %= data.totalTrackLength
              }
            } else if (data.currentDistance < 0) {
              data.currentDistance = data.totalTrackLength + (data.currentDistance % data.totalTrackLength)
            }
          } else {
            data.currentDistance = Math.max(0, Math.min(data.totalTrackLength, data.currentDistance))
            if (data.currentDistance >= data.totalTrackLength || data.currentDistance <= 0) {
              dataAttribute.set(eid, {isPlaying: false})
              world.events.dispatch(eid, 'animation_complete')
              return
            }
          }

          // Move/orient toward the current arc-length sample (with trackTightness smoothing)
          if (!(schema.loop && !schema.useCustomStartPosition && data.currentDistance === 0)) {
            const t = getParameterForDistance(arcLengthTable, data.totalTrackLength, data.currentDistance)
            const point = getCurvePoint(curveData, t)
            if (point) {
              const currentPos = Position.get(world, eid)
              const tightness = schema.trackTightness
              const finalPosition = {
                x: currentPos.x + ((point.x || 0) - currentPos.x) * tightness,
                y: currentPos.y + ((point.y || 0) - currentPos.y) * tightness,
                z: currentPos.z + (((point.z || 0) - currentPos.z) * tightness),
              }
              Position.set(world, eid, finalPosition)

              if (schema.orientToDirection) {
                const smoothedDir = getSmoothedDirection(curveData, arcLengthTable, data.totalTrackLength, data.currentDistance, schema.lookAheadDistance)
                if (smoothedDir && (Math.abs(smoothedDir.x) > 0.001 || Math.abs(smoothedDir.y) > 0.001 || Math.abs(smoothedDir.z) > 0.001)) {
                  directionVec.setXyz(smoothedDir.x, smoothedDir.y, smoothedDir.z).setNormalize()
                  targetPosition.setXyz(finalPosition.x + directionVec.x, finalPosition.y + directionVec.y, finalPosition.z + directionVec.z)
                  const lookAtQuat = quat.lookAt(
                    vec3.xyz(finalPosition.x, finalPosition.y, finalPosition.z),
                    targetPosition,
                    upVec
                  )
                  Quaternion.set(world, eid, {x: lookAtQuat.x, y: lookAtQuat.y, z: lookAtQuat.z, w: lookAtQuat.w})
                }
              }

              data.previousPositionX = finalPosition.x
              data.previousPositionY = finalPosition.y
              data.previousPositionZ = finalPosition.z
            }
          }
        } else {
          // ---- NON-TRAIN MODE (time-based t) ----
          data.currentDistance += deltaTime * data.direction

          const useSeamlessLoop = shouldUseSeamlessLoop(schema)
          const isClosedCurve = isCurveClosed(curveData)

          if (data.currentDistance >= schema.duration) {
            if (schema.loop) {
              // In both cases we wrap to start; custom-start affects where "start" is
              if (useSeamlessLoop || isClosedCurve) {
                data.currentDistance = 0
              } else {
                data.currentDistance = 0
              }
            } else {
              data.currentDistance = schema.duration
              dataAttribute.set(eid, {isPlaying: false})
              world.events.dispatch(eid, 'animation_complete')
              return
            }
          } else if (data.currentDistance <= 0 && data.direction === -1) {
            if (schema.loop) {
              data.currentDistance = 0
              data.direction = 1
            } else {
              data.currentDistance = 0
              dataAttribute.set(eid, {isPlaying: false})
              world.events.dispatch(eid, 'animation_complete')
              return
            }
          }

          const t = Math.max(0, Math.min(1, data.currentDistance / schema.duration))
          const point = getCurvePoint(curveData, t)

          if (point) {
            const newPosition = {x: point.x || 0, y: point.y || 0, z: point.z || 0}
            Position.set(world, eid, newPosition)

            if (schema.orientToDirection) {
              const prevX = data.previousPositionX
              const prevY = data.previousPositionY
              const prevZ = data.previousPositionZ

              directionVec.setXyz(newPosition.x - prevX, newPosition.y - prevY, newPosition.z - prevZ)

              if (directionVec.length() > 0.001) {
                directionVec.setNormalize()
                targetPosition.setXyz(newPosition.x + directionVec.x, newPosition.y + directionVec.y, newPosition.z + directionVec.z)
                const lookAtQuat = quat.lookAt(
                  vec3.xyz(newPosition.x, newPosition.y, newPosition.z),
                  targetPosition,
                  upVec
                )
                Quaternion.set(world, eid, {x: lookAtQuat.x, y: lookAtQuat.y, z: lookAtQuat.z, w: lookAtQuat.w})
              }
            }

            data.previousPositionX = newPosition.x
            data.previousPositionY = newPosition.y
            data.previousPositionZ = newPosition.z
          }
        }
      })
      .onEvent('pause_animation', 'paused')
      .onEvent('stop_animation', 'stopped')
      .onEvent('animation_complete', 'completed')
      .onEvent('toggle_debug', 'debug_toggled')
      .onEvent('reset_animation', 'resetting')

    // Holds position, not playing, until resume/start/stop
    const sPaused = ecs.defineState('paused')
      .onEnter(() => {
        dataAttribute.set(eid, {isPlaying: false})
      })
      .onEvent('resume_animation', 'animating')
      .onEvent('start_animation', 'animating')
      .onEvent('stop_animation', 'stopped')
      .onEvent('toggle_debug', 'debug_toggled')
      .onEvent('reset_animation', 'resetting')

    // Clean stop; reinitialize to current curve start but do not auto-start
    const sStopped = ecs.defineState('stopped')
      .onEnter(() => {
        const schema = schemaAttribute.get(eid)
        // Only clear if key changed (preserve custom start otherwise)
        clearModifiedCurveData()
        dataAttribute.set(eid, {
          isPlaying: false,
          direction: 1,
          delayCountdown: schema.autoStartDelay,
        })
        initializeCurve()
      })
      .onEvent('begin_delay', 'delaying')
      .onEvent('start_animation', 'animating')
      .onEvent('toggle_debug', 'debug_toggled')
      .onEvent('reset_animation', 'resetting')

    // Reset pipeline then either begin delay, start animating, or stop
    const sResetting = ecs.defineState('resetting')
      .onEnter(() => {
        resetAnimation()
        const schema = schemaAttribute.get(eid)
        if (schema.autoStart) {
          if (schema.autoStartDelay > 0) {
            world.events.dispatch(eid, 'begin_delay')
          } else {
            world.events.dispatch(eid, 'start_animation')
          }
        } else {
          world.events.dispatch(eid, 'stop_animation')
        }
      })
      .onEvent('begin_delay', 'delaying')
      .onEvent('start_animation', 'animating')
      .onEvent('stop_animation', 'stopped')
      .onEvent('toggle_debug', 'debug_toggled')

    // Non-looping animations arrive here; emit a completion signal
    const sCompleted = ecs.defineState('completed')
      .onEnter(() => {
        dataAttribute.set(eid, {isPlaying: false})
        world.events.dispatch(eid, 'curve_animation_finished')
      })
      .onEvent('start_animation', 'animating')
      .onEvent('stop_animation', 'stopped')
      .onEvent('toggle_debug', 'debug_toggled')
      .onEvent('reset_animation', 'resetting')

    // Register a group-wide listener so reset works from any state (including globals)
    ecs
      .defineStateGroup([
        sInitializing, 'debug_toggled', 'delaying', 'animating',
        'paused', 'stopped', 'resetting', 'completed',
      ])
      .onEvent('reset_animation', 'resetting', {target: world.events.globalId})

    // ===== Curve interpolation (Spline or Linear) =====

    function getCurvePoint(curveData, t) {
      if (curveData.type === 'SplineCurve' && curveData.points) {
        return interpolateSpline(curveData, t)
      } else if (curveData.points && curveData.points.length >= 2) {
        return interpolateLinear(curveData, t)
      }
      return null
    }

    // Catmull-Rom spline interpolation across segments
    function interpolateSpline(curveData, t) {
      const effectivePoints = getEffectivePoints(curveData)
      if (effectivePoints.length < 2) return effectivePoints[0] || {x: 0, y: 0, z: 0}

      const isClosedCurve = isCurveClosed(curveData)
      const numSegments = isClosedCurve ? effectivePoints.length : effectivePoints.length - 1

      const scaledT = t * numSegments
      const index = Math.floor(scaledT) % numSegments
      const localT = scaledT - Math.floor(scaledT)

      const p0 = getControlPoint(effectivePoints, index - 1, isClosedCurve)
      const p1 = effectivePoints[index]
      const p2 = getControlPoint(effectivePoints, index + 1, isClosedCurve)
      const p3 = getControlPoint(effectivePoints, index + 2, isClosedCurve)

      return catmullRom(p0, p1, p2, p3, localT)
    }

    // Linear interpolation between consecutive control points
    function interpolateLinear(curveData, t) {
      const effectivePoints = getEffectivePoints(curveData)
      if (effectivePoints.length < 2) return effectivePoints[0] || {x: 0, y: 0, z: 0}

      const isClosedCurve = isCurveClosed(curveData)
      const numSegments = isClosedCurve ? effectivePoints.length : effectivePoints.length - 1

      const scaledT = t * numSegments
      const index = Math.floor(scaledT) % numSegments
      const localT = scaledT - Math.floor(scaledT)

      const p1 = effectivePoints[index]
      const p2 = getControlPoint(effectivePoints, index + 1, isClosedCurve)

      return {
        x: p1.x + (p2.x - p1.x) * localT,
        y: p1.y + (p2.y - p1.y) * localT,
        z: (p1.z || 0) + ((p2.z || 0) - (p1.z || 0)) * localT,
      }
    }

    // Accessor for control points; wraps indices for closed curves
    function getControlPoint(points, index, isClosedCurve) {
      if (isClosedCurve) {
        const wrappedIndex = ((index % points.length) + points.length) % points.length
        return points[wrappedIndex]
      } else {
        return points[Math.max(0, Math.min(points.length - 1, index))]
      }
    }

    // Classic Catmull-Rom formula in 3D
    function catmullRom(p0, p1, p2, p3, t) {
      const t2 = t * t
      const t3 = t2 * t

      return {
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
        z: 0.5 * ((2 * (p1.z || 0)) + (-(p0.z || 0) + (p2.z || 0)) * t + (2 * (p0.z || 0) - 5 * (p1.z || 0) + 4 * (p2.z || 0) - (p3.z || 0)) * t2 + (-(p0.z || 0) + 3 * (p1.z || 0) - 3 * (p2.z || 0) + (p3.z || 0)) * t3),
      }
    }
  },
  // Keep debug cubes in sync with the schema.toggle even outside explicit state transitions
  tick: (world, component) => {
    const {eid} = component
    const {schema} = component
    const {data} = component

    const currentDebugState = schema.debugVisualization
    const hasDebugBoxes = data.debugBoxes && data.debugBoxes !== ''

    if (currentDebugState && !hasDebugBoxes) {
      world.events.dispatch(eid, 'toggle_debug')
    } else if (!currentDebugState && hasDebugBoxes) {
      world.events.dispatch(eid, 'toggle_debug')
    }
  },
})

export {CurveAnimator}
