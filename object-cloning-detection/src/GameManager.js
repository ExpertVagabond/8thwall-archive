import * as ecs from '@8thwall/ecs'

let activeGameManagerEid = null // Track the active state machine

function createBackground(world) {
  // Create the background container
  const backgroundContainer = document.createElement('div')
  backgroundContainer.style.position = 'absolute'
  backgroundContainer.style.top = '0'
  backgroundContainer.style.left = '0'
  backgroundContainer.style.width = '100vw'
  backgroundContainer.style.height = '100vh'
  backgroundContainer.style.backgroundColor = 'rgb(179, 209, 227)'
  backgroundContainer.style.zIndex = '0'
  document.body.appendChild(backgroundContainer)
  world.backgroundContainer = backgroundContainer
}

function removeBackground(world) {
  if (world.backgroundContainer && world.backgroundContainer.parentNode === document.body) {
    document.body.removeChild(world.backgroundContainer)
    delete world.backgroundContainer
  }
  if (world.imageContainer && world.imageContainer.parentNode === document.body) {
    document.body.removeChild(world.imageContainer)
    delete world.imageContainer
  }
}

ecs.registerComponent({
  name: 'gameManager',
  stateMachine: ({ world, eid }) => {
    let startButton = null
    let levelButtons = []
    let endButton = null

    // Function to clean up the start button
    const removeStartButton = () => {
      if (startButton) {
        document.body.removeChild(startButton)
        startButton = null
      }
    }

    // Function to clean up level selection buttons
    const removeLevelButtons = () => {
      levelButtons.forEach((button) => {
        document.body.removeChild(button)
      })
      levelButtons = []
    }

    // Function to clean up the end button
    const removeEndButton = () => {
      if (endButton) {
        document.body.removeChild(endButton)
        endButton = null
      }
    }

    ecs.defineState('startGame')
      .initial()
      .onEvent('interact', 'inGame', { target: world.events.globalId })
      .onEnter(() => {
        if (activeGameManagerEid !== null && activeGameManagerEid !== eid) {
          return
        }

        activeGameManagerEid = eid

        // Create the background and image
        createBackground(world)

        document.dispatchEvent(new Event('HideScore'))
        // Create the start button
        startButton = document.createElement('button')
        startButton.innerText = 'Start Game'
        startButton.style.position = 'absolute'
        startButton.style.top = '60%'
        startButton.style.left = '50%'
        startButton.style.transform = 'translate(-50%, -50%)'
        startButton.style.padding = '20px'
        startButton.style.fontSize = '24px'
        startButton.style.zIndex = '10';
        startButton.style.borderRadius = '10px'
        document.body.appendChild(startButton)
        
        startButton.addEventListener('click', () => {
          world.events.dispatch(world.events.globalId, 'gameStartedSlow')
          world.events.dispatch(world.events.globalId, 'interact')
        })

        world.events.addListener(world.events.globalId, 'interact', () => {
          if (activeGameManagerEid === eid) {
            removeStartButton()
          }
        })
      })
      .onExit(() => {
        // Remove the start button
        removeStartButton()

        // Remove the background and image
        removeBackground(world)
        world.events.removeListener(world.events.globalId, 'interact', () => {})
      })
    ecs.defineState('inGame')
      .onEvent('songEnded', 'reward', { target: world.events.globalId })
      .onEnter(() => {
        document.dispatchEvent(new Event('ShowScore'))
      })
      .onExit(() => {
        console.log(`Exiting inGame state for eid: ${eid}`)
      })
  },
  add: (world, component) => {
    console.log(`Adding gameManager component for eid: ${component.eid}`)
  },
  remove: (world, component) => {
    if (activeGameManagerEid === component.eid) {
      activeGameManagerEid = null
    }
  }
})
