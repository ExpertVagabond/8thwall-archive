// This component is an example of how to separate behavior by device category
// using 8th Wall Engine sessionAttributes

const responsiveImmersiveComponent = {
  init() {
    const onAttach = ({sessionAttributes}) => {
      const camera = document.querySelector('a-camera')
      const swapCamBtn = document.querySelector('#swap-cam-btn')
      const s = sessionAttributes
      if (
        !s.cameraLinkedToViewer &&
        !s.controlsCamera &&
        !s.fillsCameraTexture &&
        !s.supportsHtmlEmbedded &&
        s.supportsHtmlOverlay &&
        !s.usesMediaDevices &&
        !s.usesWebXr
      ) {  // Desktop-specific behavior goes here
        camera.setAttribute('xrextras-attach',
          {
            'target': 'avatar',
            'offset': '0 5 5',
          })
        camera.setAttribute('rotation', '-30 0 0')
      } else if (
        s.cameraLinkedToViewer &&
        s.controlsCamera &&
        !s.fillsCameraTexture &&
        s.supportsHtmlEmbedded &&
        !s.supportsHtmlOverlay &&
        !s.usesMediaDevices &&
        s.usesWebXr
      ) {  // HMD-specific behavior goes here
        if (this.el.sceneEl.xrSession.environmentBlendMode === 'opaque') {
          // VR HMD (i.e. Oculus Quest) behavior goes here

        } else if (this.el.sceneEl.xrSession.environmentBlendMode === 'additive' || 'alpha-blend') {
          // AR HMD (i.e. Hololens) behavior goes here

        }
        swapCamBtn.style.display = 'none'
      } else if (
        !s.cameraLinkedToViewer &&
        !s.controlsCamera &&
        s.fillsCameraTexture &&
        !s.supportsHtmlEmbedded &&
        s.supportsHtmlOverlay &&
        s.usesMediaDevices &&
        !s.usesWebXr
      ) {  // Mobile-specific behavior goes here

      }
    }

    const onxrloaded = () => {
      XR8.addCameraPipelineModules([{'name': 'responsiveImmersive', onAttach}])
    }
    window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
  },
}

export {responsiveImmersiveComponent}
