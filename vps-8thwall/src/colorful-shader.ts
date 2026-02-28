import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'Colorful Shader',
  schema: {
    wireframeColor: ecs.string,  // The base color to mix with our wave effect
    animationSpeed: ecs.f32,     // How fast the colors wave and change
    opacity: ecs.f32,            // How transparent the wireframe is
    waveScale: ecs.f32,          // How large the waves of color are
  },
  schemaDefaults: {
    wireframeColor: '#ffffff',   // Default to white
    animationSpeed: 0.002,       // Very slow peaceful movement
    opacity: 0.5,                // Semi-transparent
    waveScale: 0.1,              // Large, gentle waves
  },
  data: {
    time: ecs.f32,               // Keep track of time for our animation
  },
  stateMachine: ({world, eid, schemaAttribute, dataAttribute}) => {
    let mesh = null
    let meshFound = null

    ecs.defineState('default')
      .initial()
      .onTick(() => {
        const foundMesh = world.three.scene.getObjectByName('shader-mesh')

        if (foundMesh && foundMesh.material.uniforms) {
          dataAttribute.mutate(eid, (cursor) => {
            cursor.time += world.time.delta
          })

          const {wireframeColor, animationSpeed, opacity, waveScale} = schemaAttribute.get(eid)
          const {time} = dataAttribute.get(eid)

          mesh.material.uniforms.time.value = time
          mesh.material.uniforms.wireframeColor.value.setStyle(wireframeColor)
          mesh.material.uniforms.animationSpeed.value = animationSpeed
          mesh.material.uniforms.opacity.value = opacity
          mesh.material.uniforms.waveScale.value = waveScale
        }
      })
      .listen(world.events.globalId, 'reality.meshfound', (e: any) => {
        const {THREE} = window as any
        const {wireframeColor, animationSpeed, opacity, waveScale} = schemaAttribute.get(eid)
        const {bufferGeometry} = e.data
        const existingMesh = world.three.scene.getObjectByName('shader-mesh')

        if (existingMesh) {
          existingMesh.visible = true
          console.log('VPS Mesh Found')
          return
        }

        if (meshFound === true) {
          return
        }

        // Create our special material that will create the colorful effect
        const shaderMaterial = new THREE.ShaderMaterial({
          uniforms: {
            time: {value: 0},  // Time for animation
            wireframeColor: {value: new THREE.Color(wireframeColor)},
            animationSpeed: {value: animationSpeed},
            opacity: {value: opacity},
            waveScale: {value: waveScale},
          },
          vertexShader: `
          varying vec3 vPosition;
          
          void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
          fragmentShader: `
          uniform float time;
          uniform vec3 wireframeColor;
          uniform float animationSpeed;
          uniform float opacity;
          uniform float waveScale;
          
          varying vec3 vPosition;
          
          void main() {
            vec3 pos = vPosition * waveScale;
            // Create three waves with slightly different speeds for a rainbow effect
            float wave1 = sin(pos.x + pos.y + pos.z + time * animationSpeed) * 0.5 + 0.5;
            float wave2 = sin(pos.x + pos.y + pos.z + time * animationSpeed * 0.7) * 0.5 + 0.5;
            float wave3 = sin(pos.x + pos.y + pos.z + time * animationSpeed * 1.3) * 0.5 + 0.5;
            
            vec3 color = vec3(wave1, wave2, wave3);
            color = mix(color, wireframeColor, 0.5);
            
            gl_FragColor = vec4(color, opacity);
          }
        `,
          transparent: true,
          wireframe: true,
        })

        mesh = new THREE.Mesh(bufferGeometry, shaderMaterial)
        mesh.name = 'shader-mesh'
        world.three.scene.add(mesh)
        meshFound = true
        console.log('VPS Mesh Found')
      })
      .listen(world.events.globalId, 'reality.meshlost', (e) => {
        const existingMesh = world.three.scene.getObjectByName('shader-mesh')

        if (existingMesh) {
          existingMesh.visible = false
          console.log('VPS Mesh Lost')
        }
      })
      .listen(world.events.globalId, 'reality.locationfound', (e: any) => {
        console.log('VPS Location Found')
      })
      .listen(world.events.globalId, 'reality.locationlost', (e: any) => {
        console.log('VPS Location Lost. Please look around to relocate yourself.')
      })
  },
})
