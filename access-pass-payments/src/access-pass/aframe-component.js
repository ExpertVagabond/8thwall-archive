const {AccessPassFactory} = require('./pipeline-module')

const accessPassComponent = {
  init() {
    XR8.addCameraPipelineModule(AccessPassFactory().pipelineModule())
  },

  remove() {
    XR8.removeCameraPipelineModule('access-pass')
  },
}

export {
  accessPassComponent,
}

