const style = document.createElement('style')
style.innerHTML = `
  #debugOptions {
    display: flex;
    flex-direction: column;
    position: absolute;
    bottom: 10vh;
    right: 5px;
    z-index: 10;
    align-items: center;
    -webkit-user-select: none; /* Safari */        
    user-select: none; /* Standard */
  }

  .debugImg {
    width: 100%;
    height: 100%;
    max-height: 35px;
    background-repeat: no-repeat;
    background-size: contain;
    background-position: bottom;
    filter: drop-shadow(0px 0px 4px rgba(0,0,0,0.25));
    pointer-events: none;
  }

  .debugTxt {
    font-family: 'Nunito', sans-serif;
    pointer-events: none;
    font-size: 14px;
    color: white;
    line-height: 15px;
    text-align: center;
    margin-top: 0;
    text-shadow: 0px 0px 4px rgba(0, 0, 0, 0.25);
  }
  `

const debugComponent = {
  schema: {},
  init() {
    const {el} = this

    let invertMaskBoolean = false
    let swapTextureBoolean = true

    const swapTextureIcon = require('../assets/UI/swapTexture.svg')
    const invertMaskIcon = require('../assets/UI/invertMask.svg')
    const recenterIcon = require('../assets/UI/recenter.svg')

    const skybox = this.el.querySelector('a-sky')

    const handleInvertMask = () => {
      invertMaskBoolean = !invertMaskBoolean
      XR8.LayersController.configure({layers: {sky: {invertLayerMask: invertMaskBoolean}}})
    }

    const handleSwapTexture = () => {
      swapTextureBoolean = !swapTextureBoolean
      swapTextureBoolean ? skybox.setAttribute('material', 'opacity: 0') : skybox.setAttribute('material', 'opacity: 1')
    }

    const handleRecenter = () => {
      XR8.LayersController.recenter()
    }

    document.head.appendChild(style)

    const debugOptions = document.createElement('div')
    debugOptions.id = 'debugOptions'
    document.body.appendChild(debugOptions)

    // Swap Texture Button
    const swapTextureGrid = document.createElement('div')
    debugOptions.appendChild(swapTextureGrid)

    const swapTextureImg = document.createElement('img')
    swapTextureImg.classList.add('debugImg')
    swapTextureImg.src = swapTextureIcon
    swapTextureGrid.appendChild(swapTextureImg)

    const swapTextureTxt = document.createElement('p')
    swapTextureTxt.classList.add('debugTxt')
    swapTextureTxt.innerHTML = 'Swap'
    swapTextureGrid.appendChild(swapTextureTxt)

    // Invert Mask Button
    const invertMaskGrid = document.createElement('div')
    debugOptions.appendChild(invertMaskGrid)

    const invertMaskImg = document.createElement('img')
    invertMaskImg.classList.add('debugImg')
    invertMaskImg.src = invertMaskIcon
    invertMaskGrid.appendChild(invertMaskImg)

    const invertMaskTxt = document.createElement('p')
    invertMaskTxt.innerHTML = 'Invert'
    invertMaskTxt.classList.add('debugTxt')
    invertMaskGrid.appendChild(invertMaskTxt)

    // Recenter Button
    const recenterGrid = document.createElement('div')
    debugOptions.appendChild(recenterGrid)

    const recenterImg = document.createElement('img')
    recenterImg.src = recenterIcon
    recenterImg.classList.add('debugImg')
    recenterGrid.appendChild(recenterImg)

    const recenterTxt = document.createElement('p')
    recenterTxt.innerHTML = 'Reset'
    recenterTxt.classList.add('debugTxt')
    recenterGrid.appendChild(recenterTxt)

    invertMaskGrid.addEventListener('touchstart', handleInvertMask)
    recenterGrid.addEventListener('touchstart', handleRecenter)
    swapTextureGrid.addEventListener('touchstart', () => {
      handleSwapTexture(el)
    })
  },
}
export {debugComponent}
