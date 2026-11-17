/**
 * Tilt input: iPad motion sensors, permission handling, calibration,
 * smoothing, dead zone and the touch-control fallback.
 *
 * The sensor maths works in the *content* frame, so the marble always moves
 * the way the screen looks, whatever orientation the iPad is held in.
 *
 *   device orientation  -> gravity direction on the glass (x right, y down)
 *   calibrated baseline -> tilt relative to the child's comfy position
 *   dead zone + gain    -> normalised -1..1 input
 *   smoothing           -> gentle, jitter-free response
 */

const DEG = Math.PI / 180;
function normalizeAngle(angle) {
  let a = Number(angle) || 0;
  a = ((a % 360) + 360) % 360;
  // Snap to the nearest quarter turn (browsers report 0/90/180/-90).
  const snapped = Math.round(a / 90) * 90;
  const idx = ((snapped / 90) % 4 + 4) % 4;
  const table = [0, 90, 180, 270];
  return table[idx] === 270 ? -90 : table[idx];
}

function readScreenAngle() {
  try {
    if (window.screen && window.screen.orientation && typeof window.screen.orientation.angle === 'number') {
      return normalizeAngle(window.screen.orientation.angle);
    }
  } catch (err) { /* ignore */ }
  if (typeof window.orientation === 'number') return normalizeAngle(window.orientation);
  return 0;
}

/**
 * Gravity projected onto the device glass, expressed in device axes:
 * +x points to the right of the portrait screen, +y points to the top.
 */
function gravityDevice(beta, gamma) {
  const b = (Number(beta) || 0) * DEG;
  const g = (Number(gamma) || 0) * DEG;
  return {
    x: Math.sin(g) * Math.cos(b),
    y: -Math.sin(b),
  };
}

/**
 * Rotate that gravity vector into the frame the player actually sees.
 * angle 0 -> portrait, 90/-90 -> landscape, 180 -> upside down.
 */
function gravityContent(beta, gamma, angle) {
  const g = gravityDevice(beta, gamma);
  switch (normalizeAngle(angle)) {
    case 90: return { x: -g.y, y: -g.x };
    case -90: return { x: g.y, y: g.x };
    case 180: return { x: -g.x, y: g.y };
    default: return { x: g.x, y: -g.y };
  }
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export const MOTION_STATUS = {
  IDLE: 'idle',
  GRANTED: 'granted',
  DENIED: 'denied',
  UNSUPPORTED: 'unsupported',
  INSECURE: 'insecure',
  NODATA: 'nodata',
  TOUCH: 'touch',
};

export class TiltInput {
  constructor() {
    this.status = MOTION_STATUS.IDLE;
    this.listening = false;
    this.lastEvent = null;
    this.lastEventTime = 0;
    this.lastEventAngle = 0;
    this.baseline = null; // { beta, gamma }
    this.calibrating = false;
    this.calSamples = [];
    this.calAnchor = null;
    this.smoothed = { x: 0, y: 0 };
    this.target = { x: 0, y: 0 };
    this.touch = { up: false, down: false, left: false, right: false };
    this.settings = {
      sensitivity: 'normal',
      deadZone: 3,
      flipX: false,
      flipY: false,
    };
    this.sensitivityTable = {
      gentle: { rangeDeg: 24, smooth: 3.2, gain: 0.92 },
      normal: { rangeDeg: 19, smooth: 4.6, gain: 1.0 },
      sensitive: { rangeDeg: 15, smooth: 6.2, gain: 1.08 },
    };
    this.touchMode = false;
    this._onOrientation = this._onOrientation.bind(this);
    this._onDeviceOrientation = this._onDeviceOrientation.bind(this);
    this._nodataTimer = null;
  }

  /* ------------------------------ lifecycle ------------------------------ */

  configure(settings) {
    if (!settings) return;
    if (settings.sensitivity && this.sensitivityTable[settings.sensitivity]) {
      this.settings.sensitivity = settings.sensitivity;
    }
    if (Number.isFinite(settings.deadZone)) this.settings.deadZone = settings.deadZone;
    this.settings.flipX = !!settings.flipX;
    this.settings.flipY = !!settings.flipY;
  }

  get angle() {
    return readScreenAngle();
  }

  /**
   * Ask for motion permission. Must be called from a user gesture
   * (a real tap on the START button) on iOS.
   */
  async requestPermission() {
    const DOE = window.DeviceOrientationEvent;
    if (!DOE) {
      this.status = MOTION_STATUS.UNSUPPORTED;
      return this.status;
    }
    if (typeof DOE.requestPermission === 'function') {
      try {
        const result = await DOE.requestPermission();
        if (result !== 'granted') {
          this.status = MOTION_STATUS.DENIED;
          return this.status;
        }
      } catch (err) {
        this.status = MOTION_STATUS.DENIED;
        return this.status;
      }
    }
    if (!window.isSecureContext) {
      // Motion sensors are blocked on plain http:// pages in most browsers.
      this.status = MOTION_STATUS.INSECURE;
      return this.status;
    }
    this.status = MOTION_STATUS.GRANTED;
    return this.status;
  }

  start() {
    if (this.listening) return;
    this.listening = true;
    window.addEventListener('deviceorientation', this._onDeviceOrientation, true);
    window.addEventListener('orientationchange', this._onOrientation);
    window.addEventListener('resize', this._onOrientation);
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener?.('change', this._onOrientation);
    }
    this._restartNoDataTimer();
  }

  stop() {
    if (!this.listening) return;
    this.listening = false;
    window.removeEventListener('deviceorientation', this._onDeviceOrientation, true);
    window.removeEventListener('orientationchange', this._onOrientation);
    window.removeEventListener('resize', this._onOrientation);
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.removeEventListener?.('change', this._onOrientation);
    }
    if (this._nodataTimer) {
      window.clearTimeout(this._nodataTimer);
      this._nodataTimer = null;
    }
  }

  _restartNoDataTimer() {
    if (this._nodataTimer) window.clearTimeout(this._nodataTimer);
    this._nodataTimer = window.setTimeout(() => {
      if (!this.lastEvent) {
        this.status = MOTION_STATUS.NODATA;
      }
    }, 2600);
  }

  _onOrientation() {
    // Orientation changes are handled by re-reading the screen angle on the
    // next event; nothing else to do here.
    this.lastEventAngle = this.angle;
  }

  _onDeviceOrientation(event) {
    if (event.beta === null || event.gamma === null) return;
    this.lastEvent = { beta: event.beta, gamma: event.gamma, alpha: event.alpha };
    this.lastEventTime = performance.now();
    this.lastEventAngle = this.angle;

    if (this.status === MOTION_STATUS.NODATA) this.status = MOTION_STATUS.GRANTED;

    if (this.calibrating) {
      this.calSamples.push({ beta: event.beta, gamma: event.gamma });
      if (!this.calAnchor) {
        this.calAnchor = { beta: event.beta, gamma: event.gamma };
      }
    }
  }

  /* ------------------------------ calibration ---------------------------- */

  /**
   * Collects about `durationMs` of stillness and stores the average as the
   * neutral position. Resolves true when at least a few samples arrived.
   */
  calibrate(durationMs = 1200) {
    this.calibrating = true;
    this.calSamples = [];
    this.calAnchor = null;
    const started = performance.now();

    return new Promise((resolve) => {
      const tick = () => {
        const elapsed = performance.now() - started;
        // Give slow devices a little extra time to deliver at least a few
        // sensor readings instead of failing immediately.
        if (elapsed < durationMs) {
          requestAnimationFrame(tick);
          return;
        }
        if (this.calSamples.length < 3 && elapsed < durationMs + 1600) {
          requestAnimationFrame(tick);
          return;
        }
        this.calibrating = false;
        if (this.calSamples.length >= 3) {
          let sb = 0;
          let sg = 0;
          for (const s of this.calSamples) {
            sb += s.beta;
            sg += s.gamma;
          }
          this.baseline = { beta: sb / this.calSamples.length, gamma: sg / this.calSamples.length };
          this.resetSmoothing();
          resolve(true);
        } else {
          // Keep the previous baseline if we never got sensor data.
          resolve(false);
        }
      };
      requestAnimationFrame(tick);
    });
  }

  /** Immediately treat the current reading as neutral (used on resume). */
  captureBaselineNow() {
    if (!this.lastEvent) return false;
    this.baseline = { beta: this.lastEvent.beta, gamma: this.lastEvent.gamma };
    this.resetSmoothing();
    return true;
  }

  resetSmoothing() {
    this.smoothed.x = 0;
    this.smoothed.y = 0;
    this.target.x = 0;
    this.target.y = 0;
  }

  /* ------------------------------ sampling ------------------------------- */

  _rawTilt() {
    if (!this.lastEvent) return { x: 0, y: 0 };
    const angle = this.angle;
    const cur = gravityContent(this.lastEvent.beta, this.lastEvent.gamma, angle);
    let bx = 0;
    let by = 0;
    if (this.calAnchor) {
      const anchor = gravityContent(this.calAnchor.beta, this.calAnchor.gamma, angle);
      bx = anchor.x;
      by = anchor.y;
    } else if (this.baseline) {
      const base = gravityContent(this.baseline.beta, this.baseline.gamma, angle);
      bx = base.x;
      by = base.y;
    }
    let x = cur.x - bx;
    let y = cur.y - by;
    if (this.settings.flipX) x = -x;
    if (this.settings.flipY) y = -y;
    return { x, y };
  }

  _normalize(raw, dt) {
    const conf = this.sensitivityTable[this.settings.sensitivity] || this.sensitivityTable.normal;
    const range = Math.max(0.05, Math.sin(conf.rangeDeg * DEG));
    let x = clamp(raw.x / range, -1, 1) * conf.gain;
    let y = clamp(raw.y / range, -1, 1) * conf.gain;

    // Clamp again after gain so nothing can exceed the physics limits.
    x = clamp(x, -1, 1);
    y = clamp(y, -1, 1);

    // Dead zone around the calibrated neutral point.
    const dz = clamp(this.settings.deadZone / Math.max(6, conf.rangeDeg), 0, 0.7);
    const mag = Math.hypot(x, y);
    if (mag <= dz) {
      x = 0;
      y = 0;
    } else if (mag < 1) {
      const scale = (mag - dz) / (1 - dz) / mag;
      x *= scale;
      y *= scale;
    }

    // Frame-rate independent exponential smoothing.
    const k = 1 - Math.exp(-conf.smooth * Math.max(0, Math.min(dt, 0.1)));
    this.smoothed.x += (x - this.smoothed.x) * k;
    this.smoothed.y += (y - this.smoothed.y) * k;

    if (Math.abs(this.smoothed.x) < 0.002) this.smoothed.x = 0;
    if (Math.abs(this.smoothed.y) < 0.002) this.smoothed.y = 0;
    return { x: this.smoothed.x, y: this.smoothed.y };
  }

  _touchVector() {
    let x = (this.touch.right ? 1 : 0) - (this.touch.left ? 1 : 0);
    let y = (this.touch.down ? 1 : 0) - (this.touch.up ? 1 : 0);
    if (x && y) {
      const inv = 1 / Math.SQRT2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  setTouch(dir, down) {
    if (dir in this.touch) this.touch[dir] = !!down;
  }

  clearTouch() {
    this.touch = { up: false, down: false, left: false, right: false };
  }

  setTouchMode(on) {
    this.touchMode = !!on;
    if (on) {
      this.resetSmoothing();
      this.status = MOTION_STATUS.TOUCH;
    }
  }

  /**
   * Returns the current control vector, smoothed, in -1..1 range.
   * Call once per physics step with the frame delta in seconds.
   */
  sample(dt = 1 / 60) {
    if (this.touchMode) {
      const t = this._touchVector();
      const k = 1 - Math.exp(-14 * Math.max(0, Math.min(dt, 0.1)));
      this.smoothed.x += (t.x - this.smoothed.x) * k;
      this.smoothed.y += (t.y - this.smoothed.y) * k;
      return { x: this.smoothed.x, y: this.smoothed.y };
    }
    const raw = this._rawTilt();
    return this._normalize(raw, dt);
  }

  /** Live, unsmoothed-ish value for the calibration bubble. */
  liveTilt() {
    const raw = this._rawTilt();
    const conf = this.sensitivityTable[this.settings.sensitivity] || this.sensitivityTable.normal;
    const range = Math.max(0.05, Math.sin(conf.rangeDeg * DEG));
    return {
      x: clamp(raw.x / range, -1, 1),
      y: clamp(raw.y / range, -1, 1),
    };
  }

  /** True when a usable sensor stream has arrived recently. */
  hasData() {
    if (!this.lastEvent) return false;
    return performance.now() - this.lastEventTime < 4000;
  }

  isCalibrating() {
    return this.calibrating;
  }
}