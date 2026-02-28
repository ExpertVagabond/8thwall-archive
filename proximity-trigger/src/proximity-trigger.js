const proximityTriggerComponent = {
  schema: {
    radius: {type: 'number', default: 1},
  },
  init() {
    this.pos = this.el.object3D.position
  },
  tick() {
    // get character position
    const characterPos = document.getElementById('character').object3D.position

    // calculate distance between character and this entity
    const distance = Math.hypot(characterPos.x - this.pos.x, characterPos.z - this.pos.z)

    // enter proximity radius
    if (distance <= this.data.radius && !this.el.classList.contains('inside')) {
      this.el.classList.add('inside')
      this.el.setAttribute('visible', 'false')
    }

    // leave proximity radius
    if (distance > this.data.radius && this.el.classList.contains('inside')) {
      this.el.classList.remove('inside')
      this.el.setAttribute('visible', 'true')
    }
  },
}

export {proximityTriggerComponent}
