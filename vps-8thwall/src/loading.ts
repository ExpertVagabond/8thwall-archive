// This is a component file. You can use this file to define a custom component for your project.
// This component will appear as a custom component in the editor.

import * as ecs from '@8thwall/ecs'  // This is how you access the ecs library.

ecs.registerComponent({
  name: 'loading',
  // schema: {
  // },
  // schemaDefaults: {
  // },
  // data: {
  // },
  add: (world, component) => {
    // Check Location Permissions at beginning of session
    const errorCallback = (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        alert('LOCATION PERMISSIONS DENIED. PLEASE ALLOW AND TRY AGAIN.')
      }
    }
    navigator.geolocation.getCurrentPosition((pos) => {}, errorCallback)
  },
  // tick: (world, component) => {
  // },
  // remove: (world, component) => {
  // },
  // stateMachine: ({world, eid, schemaAttribute, dataAttribute}) => {
  //   ecs.defineState('default').initial()
  // },
})
