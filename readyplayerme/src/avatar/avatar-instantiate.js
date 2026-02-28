// ////////////////////////////
// DYNAMICALLY ADDING AVATAR TO SCENE
// ////////////////////////////
const getGender = async (glbFile) => {
  let genderAnim
  const jsonUrl = glbFile.replace('.glb', '.json')
  const response = await fetch(jsonUrl)
  const data = await response.json()
  // Masculine models are larger in size so they use a larger animation rig
  if (data.outfitGender === 'masculine') {
    genderAnim = 'animated-m'
  } else {
    genderAnim = 'animated-f'
  }
  return genderAnim
}
async function receiveMessage(event) {
  const genderAnim = await getGender(event.data)
  // Filter out events that are not GLB URL strings from RPM
  if (typeof event.data !== 'string' || event.data.indexOf('.glb') === -1) return
  document.querySelector('a-scene').setAttribute('xrweb', {
    allowedDevices: 'any',
    disableDesktopCameraControls: 'true',
    defaultEnvironmentFogIntensity: 0.5,
    defaultEnvironmentFloorColor: '#FFF',
    defaultEnvironmentFloorTexture: '#tile',
    defaultEnvironmentSkyBottomColor: '#BCE9FD',
    defaultEnvironmentSkyTopColor: '#5ac8fa',
    defaultEnvironmentSkyGradientStrength: 0.5,

  })
  // Dynamically add RPM Avatar to scene
  const model = document.createElement('a-entity')
  model.id = 'avatar'
  model.setAttribute('gltf-model', event.data)
  model.setAttribute('scale', '2.5 2.5 2.5')
  model.setAttribute('avatar-move', '')
  model.setAttribute('avatar-recenter', '')
  model.setAttribute('shadow', 'receive: false')
  model.setAttribute('rig-animation', {
    remoteId: genderAnim,
    clip: 'IDLE',
    loop: 'repeat',
    crossFadeDuration: 0.2,
  })
  document.querySelector('a-scene').appendChild(model)
  // Dynamically adding light to follow avatar
  const light = document.getElementById('light')
  light.setAttribute('light', {
    type: 'directional',
    intensity: '1.5',
    castShadow: 'true',
    shadowMapHeight: '2048',
    shadowMapWidth: '2048',
    target: '#avatar',
    shadowRadius: '10',
  })
  light.setAttribute('xrextras-attach', {
    target: 'avatar',
    offset: '6 16 4',
  })
  // Hide the RPM iframe
  document.getElementById('rpmContainer').style.display = 'none'
}
export {receiveMessage}
