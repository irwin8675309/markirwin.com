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
import { helloGame, HELLO_DONE_EVENT } from './games/hello/HelloGame';
import { audio } from './audio/AudioEngine';
import { toggleFullscreen } from './utils/fullscreen';
import { DEBUG } from './utils/debug';

type Screen = 'boot' | 'menu' | 'game' | 'settings' | 'tracking' | 'rest';

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
  const playSeconds = useRef(0);
  const breakMinutesRef = useRef(settings.breakMinutes);
  breakMinutesRef.current = settings.breakMinutes;

  // Optional rest reminder: after N minutes inside games, pause for a grown-up.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (screenRef.current !== 'game' || document.hidden) return;
      playSeconds.current += 1;
      const limit = breakMinutesRef.current * 60;
      if (limit > 0 && playSeconds.current >= limit) {
        playSeconds.current = 0;
        setGame(null);
        setScreen('rest');
        audio.stopSpeech();
        audio.speak('Time for a little rest!', { force: true });
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

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

  // Start-up "Wave hello!" (once per visit): children wave, meet their buddies, then the menu opens.
  const helloDone = useRef(false);
  const startPlaying = useCallback(() => {
    if (helloDone.current || settings.demoMode) {
      goMenu();
      return;
    }
    helloDone.current = true;
    audio.init();
    setGame(helloGame);
    setScreen('game');
    window.setTimeout(() => audio.speak(helloGame.voice, { force: true }), 500);
  }, [settings.demoMode, goMenu]);

  useEffect(() => {
    const onDone = () => {
      if (gameRef.current?.id === 'hello') goMenu();
    };
    window.addEventListener(HELLO_DONE_EVENT, onDone);
    return () => window.removeEventListener(HELLO_DONE_EVENT, onDone);
  }, [goMenu]);

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
        } else if (screen === 'game' || screen === 'settings' || screen === 'tracking' || screen === 'rest') {
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
          onPlay={startPlaying}
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

      {screen === 'rest' && (
        <>
          <div className="screen rest-screen">
            <div className="rest-emoji" aria-hidden="true">
              😴
            </div>
            <h1>Time for a little rest!</h1>
            <p>Great playing! Ask a grown-up when you want to play again.</p>
          </div>
          <HoldZone corner="br" onTrigger={goMenu} label="Grown-ups" holdSeconds={2.4} />
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

      {(screen === 'menu' || screen === 'game') && !calibrating && <CameraStatusOverlay idlePrompt />}

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