/** Shared types for camera, tracking, gestures and games. */

export interface Vec2 {
  x: number;
  y: number;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export type Handedness = 'Left' | 'Right';

/** A tracked hand, in world coordinates (1920x1080, origin top-left, y down). */
export interface HandState {
  /** Stable-ish id so games can follow a hand across frames. */
  id: number;
  handedness: Handedness;
  /** 21 landmarks, mirrored if the camera is mirrored. */
  landmarks: Landmark[];
  wrist: Vec2;
  palm: Vec2;
  thumb: Vec2;
  index: Vec2;
  middle: Vec2;
  ring: Vec2;
  pinky: Vec2;
  /** Primary touch point used by games. */
  tip: Vec2;
  /** Touch radius in world pixels: how forgiving the hand is. */
  radius: number;
  /** 0 = open, 1 = fully pinched. */
  pinch: number;
  pinchActive: boolean;
  /** 0 = closed fist, 1 = wide open hand. */
  openness: number;
  pointing: boolean;
  fist: boolean;
  open: boolean;
  velocity: Vec2;
  speed: number;
  palmSize: number;
  confidence: number;
  /**
   * False while the hand is being "coasted" through a short detection dropout:
   * it keeps its last position and pinch state so games do not react to a
   * single missed camera frame.
   */
  tracked: boolean;
  /**
   * Which child the hand probably belongs to: hands of the same child share the
   * number, different children differ. A best guess (see tracking/players.ts).
   */
  player: number;
  /** Time (seconds, performance.now based) the pinch began. */
  pinchStartedAt: number;
  /** World position the hand was at one second ago (for swipes). */
  history: Vec2[];
}

export type GestureType =
  | 'wave'
  | 'clap'
  | 'handsTogether'
  | 'handsApart'
  | 'bothHandsUp'
  | 'bothHandsDown'
  | 'pinch'
  | 'release'
  | 'openPalm'
  | 'fist'
  | 'point'
  | 'fastSwipe'
  /** Hands of two DIFFERENT children meet. handIds = the two hands. */
  | 'highFive';

export interface GestureEvent {
  type: GestureType;
  handId?: number;
  handIds?: number[];
  x?: number;
  y?: number;
  strength?: number;
}

export interface FrameState {
  /** Increments once per processed tracking frame, so games can consume events once. */
  frameId: number;
  /** Seconds since the app started (monotonic). */
  time: number;
  /** Seconds since the previous processed frame. */
  dt: number;
  hands: HandState[];
  /** Distance between the two leading hands, 0 (together) .. 1 (far apart). */
  handsApart: number;
  events: GestureEvent[];
  fps: number;
  /** True when tracking came from the built-in demo generator. */
  demo: boolean;
}

export interface TrackingArea {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const WORLD_WIDTH = 1920;
export const WORLD_HEIGHT = 1080;

export const emptyFrame = (): FrameState => ({
  frameId: 0,
  time: 0,
  dt: 0,
  hands: [],
  handsApart: 1,
  events: [],
  fps: 0,
  demo: false,
});