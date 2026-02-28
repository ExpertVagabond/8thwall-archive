const resetButtonComponent = {
  init() {
    const recenterBtn = document.getElementById('recenterButtonContainer')
    const character = document.getElementById('character')

    const handleClickEvent = (e) => {
      character.setAttribute('position', '0 -.7 -.5')
    }
    recenterBtn.addEventListener('click', handleClickEvent, true)
  },
}

export {resetButtonComponent}
