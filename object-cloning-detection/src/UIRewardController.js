import * as ecs from '@8thwall/ecs'

function createScoreAndComboDisplay(world) {
  const scoreText = document.createElement('div')
  scoreText.style.position = 'absolute'
  scoreText.style.top = '10px'
  scoreText.style.right = '10px'
  scoreText.style.color = 'white'
  scoreText.style.fontSize = '24px'
  scoreText.style.fontFamily = 'Arial, sans-serif'
  scoreText.style.zIndex = '2'
  scoreText.innerText = 'Score: 0'
  document.body.appendChild(scoreText)
  world.scoreText = scoreText
}

function showTextElements(world) {
  if (world.scoreText) {
     world.scoreText.style.display = 'block'
  }
}
function hideTextElements(world) {
  if (world.scoreText) {
     world.scoreText.style.display = 'none'
  }
}
function updateScore(world, eid, dataAttribute, scoreNumber) {
  const data = dataAttribute.cursor(eid)
  data.score += scoreNumber
    // console.log(`Score: 3333 ${scoreNumber.toString().padStart(5, ' ')}`)
  if (world.scoreText) {
    // console.log(`Score: ${scoreNumber.toString().padStart(5, ' ')}`)
    world.scoreText.innerText = `Score: ${data.score.toString().padStart(5, ' ')}`
  }
}
function createRewardDisplay(world) {
  document.addEventListener('ShowScore', () => showTextElements(world))
  
  createScoreAndComboDisplay(world)
  hideTextElements(world)
}

const UIRewardController = ecs.registerComponent({
  name: 'UIRewardController',
  data: {
    score: ecs.i32,
  },
  add: (world, component) => {
    const { eid, dataAttribute } = component
    component.data.score = 0
   // console.log(`UIController added to entity ${component.eid}`)
    createRewardDisplay(world)
    // document.dispatchEvent(new Event('startRewards'))
    world.events.addListener(world.events.globalId, 'scoreIncrease', (event) => {
      const { increment } = event.data || {}
      updateScore(world, eid, dataAttribute, increment)
    })
  },
  tick: (world, component) => {},
  remove: (world, component) => {
    //vconsole.log(`UIController removed from entity ${component.eid}`)
    //vremoveRewardDisplay(world)
  }
})

export { UIRewardController }
