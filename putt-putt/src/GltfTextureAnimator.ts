import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'GLTF Texture Animator',
  schema: {
    // Horizontal texture scroll speed (UV U-axis)
    speedU: ecs.f32,
    // Vertical texture scroll speed (UV V-axis)
    speedV: ecs.f32,
    // Whether to apply pulsing emissive effect
    emissivePulse: ecs.boolean,
    // Minimum intensity of emissive pulse
    emissiveMin: ecs.f32,
    // Maximum intensity of emissive pulse
    emissiveMax: ecs.f32,
    // Overall material opacity
    opacity: ecs.f32,
    // Flip texture horizontally if true
    reverseX: ecs.boolean,
  },
  schemaDefaults: {
    speedU: 0.1,
    speedV: 0,
    emissivePulse: true,
    emissiveMin: 1,
    emissiveMax: 2,
    opacity: 1.0,
    reverseX: false,
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    const {THREE} = window as any
    let shaderMaterial = null
    let originalTexture = null

    // --- STATE 1: Waiting for GLTF model to load ---
    ecs.defineState('waiting')
      .initial()
      .onEvent(ecs.events.GLTF_MODEL_LOADED, 'setup')

    // --- STATE 2: Setup shader material once model is loaded ---
    ecs.defineState('setup')
      .onEnter(() => {
        const object = world.three.entityToObject.get(eid)

        if (!object) {
          console.warn('No THREE object found for entity')
          return
        }

        // Look through all meshes in the GLTF model to find textures
        object.traverse((node) => {
          if (node.isMesh && node.material) {
            const {material} = node

            // Handle both single materials and multi-material meshes
            const materials = Array.isArray(material) ? material : [material]

            materials.forEach((mat) => {
              if (mat.map) {
                // Save the diffuse/base texture to re-use in shader
                originalTexture = mat.map
              }
            })
          }
        })

        if (!originalTexture) {
          console.warn('No texture found on GLTF model')
          return
        }

        // Create a custom shader material that supports:
        // - UV scrolling
        // - Optional horizontal flip
        // - Pulsing emissive glow
        // - Adjustable opacity
        shaderMaterial = new THREE.ShaderMaterial({
          uniforms: {
            time: {value: 0},  // Animation timer (seconds)
            speedU: {value: schemaAttribute.get(eid).speedU},
            speedV: {value: schemaAttribute.get(eid).speedV},
            emissivePulse: {value: schemaAttribute.get(eid).emissivePulse},
            emissiveMin: {value: schemaAttribute.get(eid).emissiveMin},
            emissiveMax: {value: schemaAttribute.get(eid).emissiveMax},
            opacity: {value: schemaAttribute.get(eid).opacity},
            reverseX: {value: schemaAttribute.get(eid).reverseX},
            diffuseTexture: {value: originalTexture},
          },
          vertexShader: `
            varying vec2 vUv;

            void main() {
              // Pass through UV coordinates and position
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float time;
            uniform float speedU;
            uniform float speedV;
            uniform bool emissivePulse;
            uniform float emissiveMin;
            uniform float emissiveMax;
            uniform float opacity;
            uniform bool reverseX;
            uniform sampler2D diffuseTexture;

            varying vec2 vUv;

            void main() {
              // Animate UV offset using time and speed
              vec2 animatedUv = vUv;
              animatedUv.x += time * speedU;
              animatedUv.y += time * speedV;

              // Optionally flip X-axis (mirror image effect)
              if (reverseX) {
                animatedUv.x = 1.0 - animatedUv.x;
              }

              // Sample the diffuse texture at adjusted UVs
              vec4 texColor = texture2D(diffuseTexture, animatedUv);

              // Add pulsing emissive effect (orange glow) if enabled
              vec3 emissiveColor = vec3(1.0, 0.314, 0.0); // Orange
              if (emissivePulse) {
                float pulse = (sin(time * 1.5) + 1.0) / 2.0; // Normalized 0–1
                float emissiveIntensity = emissiveMin + (emissiveMax - emissiveMin) * pulse;
                texColor.rgb += emissiveColor * emissiveIntensity;
              }

              // Final output color with adjustable opacity
              gl_FragColor = vec4(texColor.rgb, texColor.a * opacity);
            }
          `,
          transparent: true,  // Needed for opacity control
        })

        // Replace all mesh materials with the new shader material
        object.traverse((node) => {
          if (node.isMesh) {
            node.material = shaderMaterial
          }
        })

        // Move to animation state after material setup
        world.events.dispatch(eid, 'material_ready')
      })
      .onEvent('material_ready', 'animating')

    // --- STATE 3: Animate shader over time ---
    ecs.defineState('animating')
      .onTick(() => {
        if (shaderMaterial?.uniforms) {
          const schema = schemaAttribute.get(eid)

          // Update elapsed time in seconds
          shaderMaterial.uniforms.time.value = world.time.elapsed / 1000

          // Sync shader uniforms with latest schema values
          shaderMaterial.uniforms.speedU.value = schema.speedU
          shaderMaterial.uniforms.speedV.value = schema.speedV
          shaderMaterial.uniforms.emissivePulse.value = schema.emissivePulse
          shaderMaterial.uniforms.emissiveMin.value = schema.emissiveMin
          shaderMaterial.uniforms.emissiveMax.value = schema.emissiveMax
          shaderMaterial.uniforms.opacity.value = schema.opacity
          shaderMaterial.uniforms.reverseX.value = schema.reverseX
        }
      })
  },
})
