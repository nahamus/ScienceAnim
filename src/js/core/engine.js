// Runner: owns a canvas, a simulation instance, the frame loop, params and pointer input.
//
// A simulation definition looks like:
// {
//   id, title, category, blurb, renderer: '2d' | 'webgl',
//   params: [{ key, label, type: 'range'|'toggle'|'select'|'button', ... }],
//   story:  [{ title, text, formula?, duration, params?, enter?(sim, runner) }],
//   create(api) -> { resize?(w,h), update?(dt), draw(), stats?(), charts?(),
//                    pointerDown?(p), pointerMove?(p), pointerUp?(p), onParam?(key, v), reset?() }
// }

import { clamp, easeInOut } from './util.js';

export class Runner {
  constructor(host, def, opts = {}) {
    this.def = def;
    this.host = host;
    this.opts = opts;
    this.speed = 1;
    this.paused = false;
    this.time = 0;
    this.frame = 0;
    this.tweens = new Map();
    this.params = {};
    this.paramDefs = {};
    for (const p of def.params || []) {
      this.paramDefs[p.key] = p;
      if ('value' in p) this.params[p.key] = p.value;
    }
    Object.assign(this.params, opts.params || {});
    this.pointer = { x: 0, y: 0, px: 0, py: 0, down: false, inside: false, button: 0, shift: false };

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'sim-canvas';
    host.appendChild(this.canvas);
    if (def.renderer === 'webgl') {
      this.gl = this.canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: !!opts.preserve });
      if (!this.gl) throw new Error('WebGL is not available in this browser.');
    } else {
      this.ctx = this.canvas.getContext('2d');
    }
    this.dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr || 2);
    this.w = 0;
    this.h = 0;
    const self = this;
    this.api = {
      canvas: this.canvas,
      ctx: this.ctx,
      gl: this.gl,
      params: this.params,
      pointer: this.pointer,
      runner: this,
      get w() { return self.w; },
      get h() { return self.h; },
      get dpr() { return self.dpr; },
      get time() { return self.time; },
      get frame() { return self.frame; },
      thumbnail: !!opts.thumbnail,
    };
    if (opts.width) this.setSize(opts.width, opts.height);
    else this.measure();
    this.sim = def.create(this.api);
    this.sim.resize?.(this.w, this.h);
    if (!opts.width) {
      this.ro = new ResizeObserver(() => this.measure());
      this.ro.observe(host);
    }
    if (opts.interactive !== false) this.bindPointer();
  }

  measure() {
    const r = this.host.getBoundingClientRect();
    this.setSize(Math.max(1, Math.round(r.width)), Math.max(1, Math.round(r.height)));
  }

  setSize(w, h) {
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    const s = this.def.renderScale || 1;
    this.canvas.width = Math.round(w * this.dpr * s);
    this.canvas.height = Math.round(h * this.dpr * s);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.sim?.resize?.(w, h);
    if (this.paused && this.sim) this.render();
  }

  bindPointer() {
    const c = this.canvas;
    const pos = (e) => {
      const r = c.getBoundingClientRect();
      const p = this.pointer;
      p.px = p.x;
      p.py = p.y;
      p.x = e.clientX - r.left;
      p.y = e.clientY - r.top;
      p.shift = e.shiftKey;
      p.alt = e.altKey || e.ctrlKey || e.metaKey;
    };
    this._handlers = {
      pointerdown: (e) => {
        pos(e);
        this.pointer.down = true;
        this.pointer.button = e.button;
        this.pointer.inside = true;
        c.setPointerCapture?.(e.pointerId);
        this.sim.pointerDown?.(this.pointer, e);
        this.onInteract?.();
      },
      pointermove: (e) => {
        pos(e);
        this.pointer.inside = true;
        this.sim.pointerMove?.(this.pointer, e);
      },
      pointerup: (e) => {
        pos(e);
        this.pointer.down = false;
        this.sim.pointerUp?.(this.pointer, e);
      },
      pointerleave: () => {
        this.pointer.inside = false;
      },
      contextmenu: (e) => e.preventDefault(),
      wheel: (e) => {
        if (this.sim.wheel) {
          e.preventDefault();
          pos(e);
          this.sim.wheel(this.pointer, e.deltaY);
        }
      },
    };
    for (const [k, fn] of Object.entries(this._handlers)) c.addEventListener(k, fn, { passive: k !== 'wheel' && k !== 'contextmenu' });
  }

  /** Set a param. Numbers tween smoothly when `dur` > 0. */
  set(key, value, dur = 0) {
    const cur = this.params[key];
    const def = this.paramDefs[key];
    // only continuous sliders tween; selects, toggles and "instant" params jump
    const tweenable = !def || (def.type === 'range' && !def.instant);
    if (typeof value === 'number' && typeof cur === 'number' && dur > 0 && cur !== value && tweenable) {
      this.tweens.set(key, { from: cur, to: value, t: 0, dur });
      return;
    }
    this.tweens.delete(key);
    if (cur === value) return;
    this.params[key] = value;
    this.sim.onParam?.(key, value);
    this.onParamChange?.(key, value);
  }

  applyParams(obj, dur = 1.2) {
    for (const [k, v] of Object.entries(obj || {})) this.set(k, v, dur);
  }

  step(realDt) {
    const dt = clamp(realDt, 0, 1 / 20);
    for (const [k, tw] of this.tweens) {
      tw.t += dt / tw.dur;
      const t = Math.min(1, tw.t);
      this.params[k] = tw.from + (tw.to - tw.from) * easeInOut(t);
      this.sim.onParam?.(k, this.params[k]);
      this.onParamChange?.(k, this.params[k]);
      if (t >= 1) this.tweens.delete(k);
    }
    if (!this.paused) {
      const sdt = dt * this.speed;
      this.time += sdt;
      this.sim.update?.(sdt);
    }
    this.render();
    this.frame++;
  }

  render() {
    if (this.ctx) this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.sim.draw?.();
  }

  start() {
    if (this.raf) return;
    let last = performance.now();
    const loop = (now) => {
      this.raf = requestAnimationFrame(loop);
      const dt = (now - last) / 1000;
      last = now;
      if (document.hidden) return;
      this.step(dt);
      this.onFrame?.(dt);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  reset() {
    this.time = 0;
    if (this.sim.reset) this.sim.reset();
    else {
      this.sim.destroy?.();
      this.sim = this.def.create(this.api);
      this.sim.resize?.(this.w, this.h);
    }
  }

  destroy() {
    this.stop();
    this.ro?.disconnect();
    this.sim?.destroy?.();
    if (this._handlers) for (const [k, fn] of Object.entries(this._handlers)) this.canvas.removeEventListener(k, fn);
    if (this.gl) this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.canvas.remove();
  }
}
