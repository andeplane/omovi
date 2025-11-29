const keyMap: { [s: string]: string } = {
  ShiftLeft: 'shift',
  ShiftRight: 'shift',
  ControlLeft: 'ctrl',
  ControlRight: 'ctrl',
  AltLeft: 'alt',
  AltRight: 'alt',
  Escape: 'escape',
  Space: 'space',
  ArrowLeft: 'left',
  ArrowUp: 'up',
  ArrowRight: 'right',
  ArrowDown: 'down',
  KeyA: 'a',
  KeyD: 'd',
  KeyE: 'e',
  KeyQ: 'q',
  KeyS: 's',
  KeyW: 'w'
}

export default class Keyboard {
  private keys: { [s: string]: number } = {}
  private _disabled = false

  get disabled() {
    return this._disabled
  }

  set disabled(isDisabled: boolean) {
    this._disabled = isDisabled
    if (isDisabled) {
      this.removeEventListeners()
    } else {
      this.addEventListeners()
    }
  }

  constructor() {
    this.addEventListeners()
  }

  public isPressed = (key: string) => this.keys[key] >= 1

  public comsumePressed = (key: string) => {
    const p = this.keys[key] === 2
    if (p) {
      this.keys[key] = 1
    }
    return p
  }

  private addEventListeners = () => {
    this.clearPressedKeys()

    window.addEventListener('keydown', this.onKeydown)
    window.addEventListener('keyup', this.onKeyup)
    window.addEventListener('blur', this.clearPressedKeys)
  }

  private removeEventListeners = () => {
    window.removeEventListener('keydown', this.onKeydown)
    window.removeEventListener('keyup', this.onKeyup)
    window.removeEventListener('blur', this.clearPressedKeys)
  }

  private onKeydown = (event: KeyboardEvent) => {
    if (event.metaKey || event.altKey || event.ctrlKey) {
      return
    }

    if (event.code in keyMap) {
      if (this.keys[keyMap[event.code]] === 0) {
        this.keys[keyMap[event.code]] = 2
      }
      event.preventDefault()
    }
  }

  private onKeyup = (event: KeyboardEvent) => {
    if (event.code in keyMap) {
      this.keys[keyMap[event.code]] = 0
    }
  }

  private clearPressedKeys = () => {
    Object.keys(keyMap).forEach((key: string) => {
      this.keys[keyMap[key]] = 0
    })
  }
}
