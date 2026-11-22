import type { GameDefinition } from './types';
import { bubblePopGame } from './bubble-pop/BubblePopGame';
import { fingerPaintingGame } from './finger-painting/FingerPaintingGame';
import { magicCharacterGame } from './magic-character/MagicCharacterGame';
import { butterflyGardenGame } from './butterfly-garden/ButterflyGardenGame';
import { balloonPartyGame } from './balloon-party/BalloonPartyGame';
import { underwaterGame } from './underwater-adventure/UnderwaterGame';
import { highFiveGame } from './high-five/HighFiveGame';
import { buddyGame } from './buddies/BuddyGame';
import { stickerBookGame } from './sticker-book/StickerBookGame';
import { colorCountGame } from './color-count/ColorCountGame';
import { animalSoundsGame } from './animal-sounds/AnimalSoundsGame';
import { shapesLettersGame } from './shapes-letters/ShapesLettersGame';

export const GAMES: GameDefinition[] = [
  bubblePopGame,
  fingerPaintingGame,
  magicCharacterGame,
  butterflyGardenGame,
  balloonPartyGame,
  underwaterGame,
  highFiveGame,
  buddyGame,
  colorCountGame,
  animalSoundsGame,
  shapesLettersGame,
  stickerBookGame,
];

export function getGame(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.id === id);
}