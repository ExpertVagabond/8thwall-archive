const recenterComponent = {
  schema: { },
  init() {
    const recenter = () => {
      this.el.emit('recenter')
      this.el.removeEventListener('sky-coaching-overlay.hide', recenter)
    }
    this.el.addEventListener('sky-coaching-overlay.hide', recenter)
  },
}
export {recenterComponent}