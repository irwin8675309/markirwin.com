import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraProvider, useCamera } from './camera/CameraProvider';
import { BootScreen } from './components/BootScreen';
import { MenuScreen } from './components/MenuScreen';
import { GameCanvas } from './components/GameCanvas';
import { SettingsScreen } from './components/SettingsScreen';
import { CalibrationOverlay } from './components/CalibrationOverlay';
import { TrackingTest } from './components/TrackingTest';
import { HoldZone } from './components/HoldZone';
import { CameraStatusOverlay } from './components/CameraStatusOverlay';
import type { GameDefinition } from './games/types';
import { GAMES } from './games/registry';
import { audio } from './audio/AudioEngine';
import { toggleFullscreen } from './utils/fullscreen';
import { DEBUG } from './utils/debug';

type Screen = 'boot' | 'menu' | 'game' | 'settings' | 'tracking';

function AppShell() {
  const { settings, status, startCalibration, cancelCalibration, frameRef } = useCamera();
  const [screen, setScreen] = useState<Screen>('boot');
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const [game, setGame] = useState<GameDefinition | null>(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const [calibrating, setCalibrating] = useState(false);
  const calibratingRef = useRef(calibrating);
  calibratingRef.current = calibrating;
  const trackingReturn = useRef<Screen>('menu');

  // Audio must be created from a user gesture.
  useEffect(() => {
    const unlock = () => audio.init();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const goMenu = useCallback(() => {
    setGame(null);
    setScreen('menu');
    audio.stopSpeech();
  }, []);

  const selectGame = useCallback((g: GameDefinition) => {
    audio.init();
    setGame(g);
    setScreen('game');
    audio.play('sparkle');
    window.setTimeout(() => audio.speak(g.voice, { force: true }), 650);
  }, []);

  const openSettings = useCallback(() => {
    setScreen('settings');
  }, []);

  const openTracking = useCallback((from: Screen) => {
    trackingReturn.current = from;
    setScreen('tracking');
  }, []);

  const beginCalibration = useCallback(() => {
    startCalibration();
    setCalibrating(true);
  }, [startCalibration]);

  const endCalibration = useCallback(() => {
    setCalibrating(false);
    // Return to whatever was underneath (usually settings).
  }, []);

  // Keyboard shortcuts for grown-ups.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (calibratingRef.current) {
          cancelCalibration();
          setCalibrating(false);
        } else if (screen === 'game' || screen === 'settings' || screen === 'tracking') {
          goMenu();
        }
      }
      if (e.key === 'f' || e.key === 'F') void toggleFullscreen();
      // Number keys jump straight into a game (handy for testing and grown-ups).
      if (screenRef.current === 'menu' && /^[1-6]$/.test(e.key)) {
        const g = GAMES[Number(e.key) - 1];
        if (g) selectGame(g);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, goMenu, cancelCalibration, selectGame]);

  // Small debug handle used by the automated smoke tests.
  useEffect(() => {
    if (!DEBUG) return;
    (window as unknown as { __magicTV?: unknown }).__magicTV = {
      getFrame: () => frameRef.current,
      getScreen: () => screenRef.current,
      getGame: () => gameRef.current?.id ?? null,
      games: GAMES.map((g) => g.id),
    };
  }, [frameRef]);

  // Keep the document title friendly.
  useEffect(() => {
    document.title = screen === 'game' && game ? `${game.title} · Grandkids' Magic TV` : "Grandkids' Magic TV";
  }, [screen, game]);

  return (
    <div className="app">
      {screen === 'boot' && (
        <BootScreen
          onPlay={() => setScreen('menu')}
          onSettings={openSettings}
          onTrackingTest={() => openTracking('boot')}
        />
      )}

      {screen === 'menu' && (
        <>
          <MenuScreen onSelect={selectGame} />
          <HoldZone corner="br" onTrigger={openSettings} label="Grown-ups" holdSeconds={2.6} />
        </>
      )}

      {screen === 'game' && game && (
        <>
          <GameCanvas game={game} />
          <HoldZone corner="tr" onTrigger={goMenu} label="Menu" holdSeconds={2.2} />
          <div className="game-exit-hint" aria-hidden="true">
            Hold here for the menu
          </div>
          <div
            className={`camera-badge ${settings.demoMode ? 'demo' : status === 'ready' ? '' : 'down'}`}
            title="Camera status"
          >
            <span className="status-dot" />
            {settings.demoMode ? 'Pretend hands' : status === 'ready' ? 'Magic camera on' : 'Camera waking up…'}
          </div>
        </>
      )}

      {screen === 'settings' && (
        <>
          <SettingsScreen
            onBack={goMenu}
            onCalibrate={beginCalibration}
            onTrackingTest={() => openTracking('settings')}
          />
          <HoldZone corner="tr" onTrigger={goMenu} label="Menu" holdSeconds={2.4} />
        </>
      )}

      {screen === 'tracking' && <TrackingTest onBack={() => setScreen(trackingReturn.current)} />}

      {(screen === 'menu' || screen === 'game') && !calibrating && <CameraStatusOverlay idlePrompt={screen === 'game'} />}

      {calibrating && <CalibrationOverlay onDone={endCalibration} />}
    </div>
  );
}

export default function App() {
  return (
    <CameraProvider>
      <AppShell />
    </CameraProvider>
  );
}