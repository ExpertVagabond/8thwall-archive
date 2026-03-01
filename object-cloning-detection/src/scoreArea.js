import * as ecs from '@8thwall/ecs'
import { Sushi } from './sushi'
function destroySushi(world, eid) {
  const areadata = ecs.getComponent(world, eid)
  // Only delete sushi if hasSushi is true
  if (areadata.hasSushi && areadata.sushiEntity !== 0) {
    world.deleteEntity(areadata.sushiEntity)
    areadata.sushiEntity = 0
    areadata.hasSushi = false
    ecs.Material.set(world, eid, { r: 0, g: 255, b: 0 })
    console.log('Sushi destroyed from score area!');
  } else {
    console.log('No sushi to destroy in the score area.');
  }
}

const scoreArea = ecs.registerComponent({
  name: 'scoreArea',
  schema: {
    hasSushi: ecs.boolean,
    score: ecs.i32,
    sushiEntity: ecs.eid,
    collected: ecs.boolean,
  },
  schemaDefaults: {
    hasSushi: false,
    score: -1,
    collected: false,
  },
  data: {
    deletesushi: ecs.boolean,
  },
  add: (world, component) => {
    const { eid } = component
    // component.data.deletesushi = false
     const handleCollisionStart = (e) => {
      if(Sushi.has(world, e.data.other))
      {
        // console.log('Sushi hit box')
        // schemaAttribute.hasSushi =true
        const areadata = component.schemaAttribute.get(eid)
        // component.schemaAttribute.get(eid).hasSushi = true
        areadata.hasSushi = true
        areadata.sushiEntity = e.data.other
        
        ecs.Material.set(world, eid, {r: 225, g: 225, b: 0})
        const rightScoreAreaData = Sushi.get(world, areadata.sushiEntity)
        if(rightScoreAreaData.type === "regular")
        {
            // console.log("regular color in")
            areadata.score = Math.floor(Math.random() * 3) + 1
            world.events.dispatch(world.events.globalId, 'scoreIncrease', { increment: areadata.score  })
        }
        else if(rightScoreAreaData.type === "super"){
          // console.log(rightScoreAreaData.type)
          areadata.score = 10
          world.events.dispatch(world.events.globalId, 'scoreIncrease', { increment: areadata.score  })
        }
        else{
          areadata.score = -1
        }
        
      }
    }

    const handleCollisionEnd = (e) => {
        //console.log('Sushi left box')
        const areadata = component.schemaAttribute.get(eid)
        areadata.hasSushi = false
        // areadata.sushiEntity = ecs.
       ecs.Material.set(world, eid, {r: 255, g: 255, b: 255})
    }
    world.events.addListener(eid, ecs.physics.COLLISION_START_EVENT, handleCollisionStart)
    world.events.addListener(eid, ecs.physics.COLLISION_END_EVENT, handleCollisionEnd)
  },
  tick: (world, component, dataAttribute) => {
    const { eid } = component
    const areadata = component.schemaAttribute.get(eid)
    if(areadata.collected === true)
    {
       //  console.log(`michi michi`)

        areadata.collected = false
        if (areadata.hasSushi) {
          world.deleteEntity(areadata.sushiEntity)
          areadata.hasSushi = false
          // console.log('Sushi destroyed from score area!');
        } else {
          // console.log('No sushi to destroy in the score area.');
        }
     }
  }
})

export {scoreArea}