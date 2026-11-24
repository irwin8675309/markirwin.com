import { resetDemos } from '../games/shared/demo';
import { resetBuddies } from '../games/shared/buddies';
import { resetStickers } from '../games/shared/stickers';
import { resetFriends } from '../games/shared/friends';
import { useRef, useState } from 'react';
import { GAMES } from '../games/registry';
import { getBuddy } from '../games/shared/buddies';
import { STICKERS, ownedStickers } from '../games/shared/stickers';
import { FRIENDS, friendsMet } from '../games/shared/friends';
import { summarize, resetStats } from '../games/shared/stats';
import { useCamera } from '../camera/CameraProvider';
import { CameraPreview } from './CameraPreview';
import { PointerOverlay } from './PointerOverlay';
import { DEFAULT_SETTINGS } from '../settings';
import { toggleFullscreen, isFullscreen } from '../utils/fullscreen';

interface Props {
  onBack: () => void;
  onCalibrate: () => void;
  onTrackingTest: () => void;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      className={`toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <span className="toggle-knob" />
    </button>
  );
}

function Slider({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <label className="slider-row">
      <span className="slider-label">
        {label}
        {hint && <em>{hint}</em>}
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="slider-value">{Math.round(value * 100)}%</span>
    </label>
  );
}

function minutes(sec: number): string {
  const m = Math.round(sec / 60);
  return m < 1 ? (sec > 0 ? 'under a minute' : '0 min') : `${m} min`;
}

function CameraInfo({ stream }: { stream: MediaStream | null }) {
  const t = stream?.getVideoTracks()[0];
  const st = t?.getSettings();
  if (!st?.width) return null;
  const fps = st.frameRate ? Math.round(st.frameRate) : 0;
  const slow = fps > 0 && fps < 20;
  return (
    <p className={slow ? 'settings-notice' : 'summary-small'}>
      Camera sends {st.width}×{st.height}
      {fps ? ` at ${fps} pictures a second` : ''}.
      {slow ? ' That is slow, which blurs moving hands. Brighter light in the room usually fixes it.' : ''}
    </p>
  );
}

export function PlaySummary() {
  const [tick, setTick] = useState(0);
  void tick;
  const sum = summarize();
  const maxDay = Math.max(60, ...sum.week.map((d) => d.seconds));
  const names = new Map(GAMES.map((g) => [g.id, g.title]));
  const dayLetter = (k: string) => 'SMTWTFS'[new Date(`${k}T12:00:00`).getDay()];
  return (
    <section className="panel panel-wide">
      <h2>📊 How they are playing</h2>
      <div className="summary-grid">
        <div>
          <p className="summary-big">{minutes(sum.todaySeconds)}</p>
          <p className="summary-small">played today (time with a hand in view)</p>
          <div className="week-bars" aria-label="Minutes played, last 7 days">
            {sum.week.map((d) => (
              <div key={d.day} className="week-col" title={`${d.day}: ${minutes(d.seconds)}`}>
                <div className="week-bar" style={{ height: `${Math.max(4, (d.seconds / maxDay) * 100)}%` }} />
                <span>{dayLetter(d.day)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3>Favourite games this week</h3>
          {sum.topGames.length === 0 ? (
            <p className="summary-small">Nothing played yet.</p>
          ) : (
            <ol className="summary-list">
              {sum.topGames.slice(0, 4).map((g) => (
                <li key={g.id}>
                  {names.get(g.id) ?? g.id} <em>{minutes(g.seconds)}</em>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div>
          <h3>Collections</h3>
          <p className="summary-line">
            Stickers: <strong>{ownedStickers().length}</strong> of {STICKERS.length}
          </p>
          <p className="summary-line">
            Teddy's friends met: <strong>{friendsMet().length}</strong> of {FRIENDS.length}
          </p>
          <p className="summary-line">
            Animals: first child <strong>{getBuddy(0).name}</strong>, second child <strong>{getBuddy(1).name}</strong>
          </p>
          <div className="button-row">
            <button
              className="soft-btn"
              onClick={() => {
                resetStats();
                setTick((t) => t + 1);
              }}
            >
              Clear play history
            </button>
          </div>
        </div>
      </div>
      <p className="summary-small">Kept only in this browser. The rest reminder is set under Screen &amp; grown-ups below.</p>
    </section>
  );
}

export function SettingsScreen({ onBack, onCalibrate, onTrackingTest }: Props) {
  const { settings, updateSettings, stream, devices, status, error, notice, fps, handCount, startCamera, demo, setDemoMode } =
    useCamera();
  const [exitNote, setExitNote] = useState(false);
  const initialGpu = useRef(settings.useGpu);

  const videoDevices = devices.filter((d) => d.kind === 'videoinput');

  return (
    <div className="screen settings-screen">
      <header className="settings-header">
        <button className="soft-btn" onClick={onBack}>
          ← Back to games
        </button>
        <h1>Grown-up settings</h1>
        <div className="settings-status">
          <span className={`status-pill ${status === 'ready' ? 'ok' : 'bad'}`}>
            <span className="status-dot" /> {demo ? 'Pretend hands' : status === 'ready' ? 'Camera ready' : status}
          </span>
          <span className="stat-chip">{handCount} hands</span>
          <span className="stat-chip">{fps} fps</span>
        </div>
      </header>

      <div className="settings-grid">
        <PlaySummary />

        <section className="panel">
          <h2>📷 Camera</h2>
          <CameraPreview className="settings-preview" label="Preview" />
          <CameraInfo stream={stream} />
          {error && <p className="settings-error">{error}</p>}
          {notice && <p className="settings-notice">{notice}</p>}

          <label className="field">
            <span>Camera</span>
            <select
              value={settings.cameraId}
              onChange={(e) => {
                const dev = videoDevices.find((d) => d.deviceId === e.target.value);
                updateSettings({ cameraId: e.target.value, cameraLabel: dev?.label ?? '' });
              }}
            >
              <option value="">Default camera</option>
              {videoDevices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Video quality</span>
            <select
              value={settings.cameraWidth}
              onChange={(e) => updateSettings({ cameraWidth: Number(e.target.value) as 640 | 1280 | 1920 })}
            >
              <option value={640}>Small (fastest)</option>
              <option value={1280}>Medium (recommended)</option>
              <option value={1920}>Large (sharpest)</option>
            </select>
          </label>

          <div className="button-row">
            <button
              className="soft-btn"
              onClick={() => {
                resetDemos();
                resetBuddies();
                resetStickers();
                resetFriends();
              }}
            >
              Show tutorials again &amp; reset buddies and stickers
            </button>
          </div>

          <div className="button-row">
            <button className="soft-btn" onClick={() => void startCamera()}>
              Restart camera
            </button>
            <button className="soft-btn" onClick={onTrackingTest}>
              Check my magic
            </button>
          </div>

          <div className="toggle-row">
            <div>
              <strong>Pretend hands</strong>
              <p>Try every game without a camera (great for testing).</p>
            </div>
            <Toggle checked={settings.demoMode} onChange={(v) => setDemoMode(v)} label="Pretend hands" />
          </div>
        </section>

        <section className="panel">
          <h2>✋ Hand tracking</h2>
          <Slider
            label="Sensitivity"
            hint="Higher = easier to detect"
            value={settings.sensitivity}
            onChange={(v) => updateSettings({ sensitivity: v })}
          />
          <Slider
            label="Smoothing"
            hint="Higher = steadier"
            value={settings.smoothing}
            onChange={(v) => updateSettings({ smoothing: v })}
          />

          <div className="toggle-row">
            <div>
              <strong>Faster hand finding (graphics chip)</strong>
              <p>
                Can double the speed on slower computers. Reload the page after changing it. If hands act strangely,
                switch it off again.
              </p>
            </div>
            <Toggle checked={settings.useGpu} onChange={(v) => updateSettings({ useGpu: v })} label="Graphics chip" />
          </div>
          {settings.useGpu !== initialGpu.current && (
            <div className="button-row">
              <button className="soft-btn" onClick={() => window.location.reload()}>
                Reload now to apply
              </button>
            </div>
          )}

          <div className="toggle-row">
            <div>
              <strong>Mirror the camera</strong>
              <p>Move right, the magic moves right.</p>
            </div>
            <Toggle checked={settings.mirrored} onChange={(v) => updateSettings({ mirrored: v })} label="Mirror camera" />
          </div>

          <div className="toggle-row">
            <div>
              <strong>Show hand skeleton</strong>
              <p>See the tracking lines on screen.</p>
            </div>
            <Toggle checked={settings.showSkeleton} onChange={(v) => updateSettings({ showSkeleton: v })} label="Show skeleton" />
          </div>

          <div className="toggle-row">
            <div>
              <strong>Help far-away hands</strong>
              <p>Zooms in when nobody is seen, so children standing back are found.</p>
            </div>
            <Toggle checked={settings.farMode} onChange={(v) => updateSettings({ farMode: v })} label="Far-away hands" />
          </div>

          <div className="two-col">
            <label className="field">
              <span>Hands to track</span>
              <select value={settings.numHands} onChange={(e) => updateSettings({ numHands: Number(e.target.value) as 2 | 4 })}>
                <option value={2}>2 hands (one child)</option>
                <option value={4}>4 hands (two children)</option>
              </select>
            </label>
            <label className="field">
              <span>Tracking speed</span>
              <select
                value={settings.trackingFps}
                onChange={(e) => updateSettings({ trackingFps: Number(e.target.value) as 30 | 60 })}
              >
                <option value={30}>30 fps (gentle)</option>
                <option value={60}>60 fps (smooth)</option>
              </select>
            </label>
          </div>

          <div className="button-row">
            <button className="soft-btn primary-soft" onClick={onCalibrate}>
              Calibrate tracking area
            </button>
            <button className="soft-btn" onClick={() => updateSettings({ trackingArea: null })}>
              Reset area
            </button>
          </div>
          <p className="panel-note">
            Calibration simply learns where the children can reach. You can also let it learn automatically while
            playing.
          </p>
        </section>

        <section className="panel">
          <h2>🔊 Sound</h2>
          <Slider label="Master volume" value={settings.masterVolume} onChange={(v) => updateSettings({ masterVolume: v })} />
          <Slider label="Music" value={settings.musicVolume} onChange={(v) => updateSettings({ musicVolume: v })} />
          <Slider label="Sound effects" value={settings.sfxVolume} onChange={(v) => updateSettings({ sfxVolume: v })} />

          <div className="toggle-row">
            <div>
              <strong>Background music</strong>
              <p>Soft and optional.</p>
            </div>
            <Toggle checked={settings.musicEnabled} onChange={(v) => updateSettings({ musicEnabled: v })} label="Music" />
          </div>
          <div className="toggle-row">
            <div>
              <strong>Friendly voice</strong>
              <p>Occasional encouragement, never constant.</p>
            </div>
            <Toggle checked={settings.voiceEnabled} onChange={(v) => updateSettings({ voiceEnabled: v })} label="Voice" />
          </div>
          <div className="toggle-row">
            <div>
              <strong>Mute everything</strong>
              <p>Instant quiet.</p>
            </div>
            <Toggle checked={settings.muted} onChange={(v) => updateSettings({ muted: v })} label="Mute" />
          </div>
        </section>

        <section className="panel">
          <h2>🖥️ Screen &amp; grown-ups</h2>
          <div className="toggle-row">
            <div>
              <strong>Fullscreen</strong>
              <p>Fill the television.</p>
            </div>
            <Toggle checked={settings.fullscreen} onChange={async () => {
              await toggleFullscreen();
              updateSettings({ fullscreen: isFullscreen() });
            }} label="Fullscreen" />
          </div>

          <label className="field">
            <span>Rest reminder</span>
            <select
              value={settings.breakMinutes}
              onChange={(e) => updateSettings({ breakMinutes: Number(e.target.value) as 0 | 10 | 20 | 30 })}
            >
              <option value={0}>Never</option>
              <option value={10}>After 10 minutes of play</option>
              <option value={20}>After 20 minutes of play</option>
              <option value={30}>After 30 minutes of play</option>
            </select>
          </label>

          <div className="button-row">
            <button className="soft-btn" onClick={onCalibrate}>
              Calibrate
            </button>
            <button className="soft-btn" onClick={onTrackingTest}>
              Tracking test
            </button>
          </div>
          <div className="button-row">
            <button
              className="soft-btn"
              onClick={() => {
                updateSettings({ ...DEFAULT_SETTINGS, demoMode: settings.demoMode });
              }}
            >
              Reset settings
            </button>
            <button
              className="soft-btn danger"
              onClick={() => {
                window.close();
                setExitNote(true);
              }}
            >
              Exit application
            </button>
          </div>
          {exitNote && (
            <p className="panel-note">
              If the window did not close, press <strong>Alt + F4</strong> (or close the browser tab). This is a
              safety limit of web browsers.
            </p>
          )}

          <div className="privacy-note">
            <strong>Privacy</strong>
            <p>
              The camera is processed entirely on this computer. Nothing is recorded, uploaded, or saved. No
              accounts, ads, or analytics.
            </p>
          </div>
        </section>
      </div>

      <PointerOverlay />
    </div>
  );
}