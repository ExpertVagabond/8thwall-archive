import * as ecs from '@8thwall/ecs'

const EULER_ORDER = 'YXZ'

// Objects that persist across ticks during animations to avoid creating
// new instances (and therefore unnecessary garbage) every tick:
const transform = ecs.math.mat4.i()
const entityPos = ecs.math.vec3.zero()
const parentPos = ecs.math.vec3.zero()
const targetDir = ecs.math.vec3.zero()
const parentScale = ecs.math.vec3.zero()
const upVector = ecs.math.vec3.xyz(0, 1, 0)
const parentRotation = ecs.math.quat.zero()
const targetRotation = ecs.math.quat.zero()
const tempRotation = ecs.math.quat.zero()

let didWarnInvalidLock = false

ecs.registerComponent({
  name: 'Custom Look At',
  schema: {
    target: 'eid',
    // @group start targetVector:vector3
    // @group condition target=null
    targetX: 'f32',
    targetY: 'f32',
    targetZ: 'f32',
    // @group end
    lockX: 'boolean',
    lockY: 'boolean',
  },
  tick: (world, component) => {
    const {schema} = component

    if (!didWarnInvalidLock && !schema.lockX && schema.lockY) {
      didWarnInvalidLock = true
      console.warn('Unsupported lock combo (X unlocked, Y locked). Lock X or unlock Y to resolve.')
    }

    if (schema.lockY) {
      return
    }

    // Get the entity position using ECS math
    world.transform.getWorldPosition(component.eid, entityPos)

    // Get the target position
    if (schema.target) {
      world.transform.getWorldPosition(schema.target, targetDir)
    } else {
      // If no target entity is set, use the target x, y and z
      targetDir.setXyz(schema.targetX, schema.targetY, schema.targetZ)
    }

    // Calculate look-at rotation using ECS math
    targetRotation.makeLookAt(entityPos, targetDir, upVector)

    // Get the parent rotation (in world space) if there is a parent
    const parentId = world.getParent(component.eid)
    if (parentId) {
      world.transform.getWorldTransform(parentId, transform)
      const decomposed = transform.decomposeTrs({
        t: parentPos,
        r: parentRotation,
        s: parentScale,
      })

      // Convert target rotation to local space by applying inverse parent rotation
      targetRotation.setPremultiply(decomposed.r.conjugate())
    }

    const cursor = ecs.Quaternion.cursor(world, component.eid)
    if (schema.lockX) {
      tempRotation.setXyzw(cursor.x, cursor.y, cursor.z, cursor.w)

      // For X-axis locking, we need to preserve the current X rotation
      // This is a simplified approach - you might need more complex logic
      // depending on your specific requirements
      const currentEuler = tempRotation.pitchYawRollRadians()
      const targetEuler = targetRotation.pitchYawRollRadians()

      // Keep current X (pitch), use target Y (yaw), keep current Z (roll)
      targetRotation.makePitchYawRollRadians(ecs.math.vec3.xyz(
        currentEuler.x,
        targetEuler.y,
        currentEuler.z
      ))
    }

    // Update entity with the final rotation
    cursor.x = targetRotation.x
    cursor.y = targetRotation.y
    cursor.z = targetRotation.z
    cursor.w = targetRotation.w
  },
})
