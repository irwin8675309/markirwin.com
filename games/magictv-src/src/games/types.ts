import type { FrameState, GestureEvent } from '../types';
import type { Settings } from '../settings';
import type { AudioEngine } from '../audio/AudioEngine';

export interface GameContext {
  width: number;
  height: number;
  /** Latest tracking frame (world coordinates). */
  frame: FrameState;
  /** Seconds since the game started (monotonic, for animation). */
  time: number;
  /** Real frame delta in seconds (clamped). */
  dt: number;
  settings: Settings;
  audio: AudioEngine;
}

export interface GameInstance {
  /** Called once when the game starts. */
  enter?(ctx: GameContext): void;
  /** Called every animation frame. */
  update(ctx: GameContext): void;
  /** Called every animation frame after update. */
  draw(ctx: CanvasRenderingContext2D, g: GameContext): void;
  /** Called for each new gesture event (once per tracking frame). */
  onGesture?(event: GestureEvent, ctx: GameContext): void;
  /** Called when leaving the game. */
  exit?(): void;
}

export interface GameDefinition {
  id: string;
  title: string;
  /** Phrase spoken when the game opens. */
  voice: string;
  /** Short label for adults in settings. */
  adultLabel: string;
  colors: [string, string];
  create(): GameInstance;
}

export interface GameHandle {
  definition: GameDefinition;
  instance: GameInstance;
}