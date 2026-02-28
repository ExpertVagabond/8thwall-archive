const productLinkComponent = {
  schema: {
    text: {type: 'string'},
    href: {type: 'string'},
  },
  init() {
    this.scene = new THREE.Scene()
    this.camera = this.el.sceneEl.camera
    this.labelRenderer = new THREE.CSS2DRenderer()
    this.lengthMeshBounds = new THREE.Vector3()

    // Calculate glb-model bounding box
    this.el.addEventListener('model-loaded', () => {
      this.meshBounds = new THREE.Box3().setFromObject(this.el.object3D)

      this.lengthMeshBounds = {
        x: Math.abs(this.meshBounds.max.x - this.meshBounds.min.x),
        y: Math.abs(this.meshBounds.max.y - this.meshBounds.min.y),
        z: Math.abs(this.meshBounds.max.z - this.meshBounds.min.z),
      }
    })

    this.labelRenderer.setSize(window.innerWidth, window.innerHeight)
    this.labelRenderer.domElement.style.position = 'absolute'
    this.labelRenderer.domElement.style.top = '0px'
    this.labelRenderer.domElement.style.pointerEvents = 'none'
    document.body.appendChild(this.labelRenderer.domElement)

    this.label = document.createElement('div')
    this.label.className = 'label'
    this.label.id = 'pill'

    this.img = document.createElement('img')
    this.img.src = require('./assets/nav.svg')
    this.img.width = 15

    this.a = document.createElement('a')
    this.a.href = this.data.href
    this.a.target = '_blank'
    this.a.textContent = this.data.text
    this.a.style.textDecoration = 'none'

    document.body.appendChild(this.label)

    const pill = document.getElementById('pill')
    pill.appendChild(this.img)
    pill.appendChild(this.a)

    this.labelObj = new THREE.CSS2DObject(this.label)
    this.scene.add(this.labelObj)
  },
  tick() {
    this.labelObj.position.copy(new THREE.Vector3(this.el.object3D.position.x, this.lengthMeshBounds.y + 0.3, this.el.object3D.position.z))
    this.labelRenderer.render(this.scene, this.camera)
  },
}

export {productLinkComponent}
