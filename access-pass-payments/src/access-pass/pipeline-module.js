const {showAccessPassModal} = require('./access-pass-modal')

let accessPassModule_ = null

const create = () => {
  const pipelineModule = () => {
    return {
      name: 'access-pass',
      onBeforeRun: ({config}) => {
        if (!XR8.XrDevice.isDeviceBrowserCompatible(config)) {
          return Promise.resolve()
        }

        return showAccessPassModal()
      },
    }
  }

  return {
    pipelineModule,
  }
}

const AccessPassFactory = () => {
  if (!accessPassModule_) {
    accessPassModule_ = create()
  }
  return accessPassModule_
}

export {
  AccessPassFactory,
}

