const GAME_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'Space',
  'Enter',
]);

export class Input {
  constructor() {
    this.keys = new Set();
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onBlur = this._onBlur.bind(this);
  }

  attach() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
  }

  detach() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);
    this.keys.clear();
  }

  isDown(code) {
    return this.keys.has(code);
  }

  _onKeyDown(event) {
    if (GAME_KEYS.has(event.code)) {
      event.preventDefault();
    }
    this.keys.add(event.code);
  }

  _onKeyUp(event) {
    this.keys.delete(event.code);
  }

  _onBlur() {
    this.keys.clear();
  }
}
