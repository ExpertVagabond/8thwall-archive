import * as ecs from '@8thwall/ecs'
import { Sushi } from './sushi'

const { Position, Quaternion, Scale, BoxGeometry, Material, Shadow } = ecs

let activeObjectSpawnerEid = null
// Clone components from the source to the target entity
const cloneComponents = (sourceEid, targetEid, world) => {
  const componentsToClone = [
    Position, Quaternion, Scale, Shadow, BoxGeometry, Material,
    ecs.PositionAnimation, ecs.RotateAnimation, ecs.GltfModel, ecs.Collider, ecs.Audio, Sushi
  ];

  let clonedAnyComponent = false;

  componentsToClone.forEach((component) => {
    if (component && component.has(world, sourceEid)) {
      const properties = component.get(world, sourceEid);
      component.set(world, targetEid, { ...properties });
      clonedAnyComponent = true;
    }
  });

  return clonedAnyComponent;
}

function randomizeSushi() {
  // Fallback to random selection
  const randomValue = Math.random()
  return randomValue < 0.75 ? 'regular' : 'super'
}

// Randomize sushi spawn location (left or right)
function randomizeSpawnLocation() {
  const leftPosition = -2.0  // Left side X position
  const rightPosition = 2.0  // Right side X position
  return Math.random() < 0.5 ? leftPosition : rightPosition
}

function spawnSushi(world, objectToSpawn, objectToSpawnSuper, spawnY, spawnZ)
{
  const sushiType = randomizeSushi()
  const newEid = world.createEntity()
  const spawnX = randomizeSpawnLocation()

  const clonedSuccessfully = sushiType === "regular"
    ? cloneComponents(objectToSpawn, newEid, world) 
    : cloneComponents(objectToSpawnSuper, newEid, world);

  if (!clonedSuccessfully) {
    world.deleteEntity(newEid)
    return
  }

  if (Sushi.has(world, newEid)) {
    Sushi.set(world, newEid, { isMoving: true, type: sushiType })
  } else {
    // console.warn(`Sushi component not set for entity: ${newEid}. Deleting entity.`);
    world.deleteEntity(newEid)
    return;
  }

  if (Position.has(world, newEid)) {
    Position.set(world, newEid, { x: spawnX, y: spawnY, z: spawnZ });
  } else {
    world.deleteEntity(newEid)
    return
  }

  setTimeout(() => spawnSushi(world, objectToSpawn, objectToSpawnSuper, spawnY, spawnZ), 1000)
}

let gameStarted = false

function startGame(world, objectToSpawn, objectToSpawnSuper, spawnY, spawnZ, eid) {
  if (eid !== activeObjectSpawnerEid) {
      console.warn(`Ignoring startGame call from non-active objectSpawner with eid: ${eid}`)
      return;
  }
  if (gameStarted) {
    console.log("Game already started.")
  }
  gameStarted = true
  setTimeout(() => spawnSushi(world, objectToSpawn, objectToSpawnSuper, spawnY, spawnZ), 1000)
}
// Add listener for 'gameStarted' global event
function initializeGameStartListener(world, objectToSpawn, objectToSpawnSuper, spawnY, spawnZ,eid) {
  // Add listener for gameStartedSlow
  world.events.addListener(world.events.globalId, "gameStartedSlow", () => {
    startGame(world, objectToSpawn, objectToSpawnSuper, spawnY, spawnZ, eid);
  })
}
ecs.registerComponent({
  name: 'objectSpawner',
  schema: {
    objectToSpawn: ecs.eid,
    spawnY: ecs.f32,
    spawnZ: ecs.f32,
    objectToSpawnSuper: ecs.eid,
  },
  schemaDefaults: {
    spawnY: 1.0,
    spawnZ: 0.0,
  },
  add: (world, component) => {
    const { eid, schemaAttribute } = component

    if (activeObjectSpawnerEid !== eid) {
      activeObjectSpawnerEid = eid
    }

    const objectToSpawn = schemaAttribute.get(eid).objectToSpawn
    const objectToSpawnSuper = schemaAttribute.get(eid).objectToSpawnSuper
    const spawnY = schemaAttribute.get(eid).spawnY
    const spawnZ = schemaAttribute.get(eid).spawnZ
    initializeGameStartListener(world, objectToSpawn, objectToSpawnSuper, spawnY, spawnZ, eid)
  },
  remove: (world, component) => {
    if (component.intervalId) {
      clearInterval(component.intervalId);
    }
  },
});
