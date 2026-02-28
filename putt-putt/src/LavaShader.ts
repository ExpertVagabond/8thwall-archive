import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'Lava Shader',
  schema: {
    // @asset
    lavaTexture: ecs.string,
    // @asset
    cloudTexture: ecs.string,
    lavaFlowRate: ecs.f32,
  },
  schemaDefaults: {
    lavaFlowRate: 0.5,
  },
  data: {
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    const {THREE} = window as any
    let material = null

    ecs.defineState('default')
      .initial()
      .onEnter(async () => {
        const {lavaTexture, cloudTexture, lavaFlowRate} = schemaAttribute.get(eid)
        ecs.Material.remove(world, eid)
        const object = world.three.entityToObject.get(eid)

        const lavaAsset = await ecs.assets.load({url: lavaTexture})
        const cloudAsset = await ecs.assets.load({url: cloudTexture})
        const textureLoader = new THREE.TextureLoader()

        material = new THREE.ShaderMaterial({
          uniforms: {
            time: {value: 0},
            speed: {value: lavaFlowRate},
            uvScale: {value: new THREE.Vector2(20.0, 10.0)},
            texture1: {value: textureLoader.load(cloudAsset.localUrl)},
            texture2: {value: textureLoader.load(lavaAsset.localUrl)},
          },
          vertexShader: `
          uniform vec2 uvScale;
          varying vec2 vUv;

          void main()
          {

            vUv = uvScale * uv;
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_Position = projectionMatrix * mvPosition;

          }
      `,
          fragmentShader: ` 
          uniform float time;
          uniform float speed;

          uniform float fogDensity;
          uniform vec3 fogColor;

          uniform sampler2D texture1;
          uniform sampler2D texture2;

          varying vec2 vUv;

          void main( void ) {

            vec2 position = - 1.0 + 2.0 * vUv;

            vec4 noise = texture2D( texture1, vUv );
            vec2 T1 = vUv + vec2( 1.5, - 1.5 ) * time * 0.02 * speed;
            vec2 T2 = vUv + vec2( - 0.5, 2.0 ) * time * 0.01 * speed;

            T1.x += noise.x * 2.0;
            T1.y += noise.y * 2.0;
            T2.x -= noise.y * 0.2;
            T2.y += noise.z * 0.2;

            float p = texture2D( texture1, T1 * 2.0 ).a;

            vec4 color = texture2D( texture2, T2 * 2.0 );
            vec4 temp = color * ( vec4( p, p, p, p ) * 2.0 ) + ( color * color - 0.1 );

            if( temp.r > 1.0 ) { temp.bg += clamp( temp.r - 2.0, 0.0, 100.0 ); }
            if( temp.g > 1.0 ) { temp.rb += temp.g - 1.0; }
            if( temp.b > 1.0 ) { temp.rg += temp.b - 1.0; }

            gl_FragColor = temp;

            float depth = gl_FragCoord.z / gl_FragCoord.w;
            const float LOG2 = 1.442695;
            float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
            fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );

            gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );

          }`,
        })

        material.uniforms.texture1.value.wrapS = material.uniforms.texture1.value.wrapT = THREE.RepeatWrapping
        material.uniforms.texture2.value.wrapS = material.uniforms.texture2.value.wrapT = THREE.RepeatWrapping

        object.material = material
        object.traverse((node: any) => {
          if (node.isMesh) {
            node.material = material
          }
        })
      })
      .onTick(() => {
        if (material?.uniforms) {
          material.uniforms.time.value = world.time.elapsed * 0.001
        }
      })
  },
})
