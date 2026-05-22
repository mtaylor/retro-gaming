export class Game {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ update: (dt: number) => void, render: (ctx: CanvasRenderingContext2D) => void, width?: number, height?: number }} options
   */
  constructor(canvas, { update, render, width = 640, height = 480 }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.update = update;
    this.render = render;
    this.logicalWidth = width;
    this.logicalHeight = height;
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this._frameId = null;
    this._onResize = this._onResize.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    window.addEventListener('resize', this._onResize);
    this._onResize();
    this._loop(this.lastTime);
  }

  stop() {
    this.running = false;
    if (this._frameId !== null) {
      cancelAnimationFrame(this._frameId);
      this._frameId = null;
    }
    window.removeEventListener('resize', this._onResize);
  }

  pause() {
    this.paused = true;
  }

  resume() {
    if (!this.running) return;
    this.paused = false;
    this.lastTime = performance.now();
  }

  _loop(now) {
    if (!this.running) return;
    this._frameId = requestAnimationFrame((t) => this._loop(t));

    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (!this.paused) {
      this.update(dt);
    }
    this.render(this.ctx);
  }

  _onResize() {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;

    this.canvas.width = Math.floor(displayWidth * dpr);
    this.canvas.height = Math.floor(displayHeight * dpr);

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(
      this.canvas.width / this.logicalWidth,
      this.canvas.height / this.logicalHeight
    );
  }
}
