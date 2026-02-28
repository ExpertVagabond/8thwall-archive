const myHiderMaterialComponent = {
  init() {
    const hiderMaterial = new THREE.MeshStandardMaterial()
    hiderMaterial.colorWrite = false

    console.log('hider')

    const applyHiderMaterial = (mesh) => {
      if (!mesh) {
        return
      }
      if (mesh.material) {
        mesh.material = hiderMaterial
      }
      mesh.traverse((node) => {
        if (node.isMesh) {
          node.material = hiderMaterial
        }
      })
    }

    applyHiderMaterial(this.el.getObject3D('mesh'))
    this.el.addEventListener(
      'model-loaded', () => applyHiderMaterial(this.el.getObject3D('mesh'))
    )
  },
}

export {myHiderMaterialComponent}
