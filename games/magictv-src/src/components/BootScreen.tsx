import { useCamera } from '../camera/CameraProvider';
import { CameraPreview } from './CameraPreview';
import { audio } from '../audio/AudioEngine';

interface Props {
  onPlay: () => void;
  onSettings: () => void;
  onTrackingTest: () => void;
}

export function BootScreen({ onPlay, onSettings, onTrackingTest }: Props) {
  const { status, error, notice, settings, setDemoMode, startCamera, fps, demo } = useCamera();

  const play = () => {
    audio.init();
    audio.play('magic');
    onPlay();
  };

  const playDemo = () => {
    audio.init();
    setDemoMode(true);
    audio.play('magic');
    onPlay();
  };

  const busy = status === 'idle' || status === 'requesting' || status === 'loading';
  const failed = status === 'error' || status === 'disconnected';

  return (
    <div className="screen boot-screen">
      <div className="boot-bg" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="bg-bubble"
            style={{
              left: `${(i * 37) % 100}%`,
              width: `${30 + ((i * 53) % 90)}px`,
              height: `${30 + ((i * 53) % 90)}px`,
              animationDelay: `${(i % 7) * -1.7}s`,
              animationDuration: `${14 + (i % 5) * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="boot-inner">
        <div className="boot-copy">
          <h1 className="magic-title">Grandkids&apos; Magic TV</h1>
          <p className="boot-sub">Wave your hands. Make magic.</p>

          <div className="boot-actions">
            {busy && (
              <div className="boot-status">
                <div className="spinner" />
                <span>Waking up the magic camera…</span>
                {fps > 0 && <span className="boot-fps">{fps} fps</span>}
              </div>
            )}

            {busy && (
              <button className="soft-btn" onClick={playDemo}>
                Use pretend hands instead
              </button>
            )}

            {failed && (
              <div className="boot-error" role="alert">
                <strong>Oh no, the camera needs a hand.</strong>
                <p>{error}</p>
              </div>
            )}

            {notice && <p className="boot-notice">{notice}</p>}

            {status === 'ready' && !settings.demoMode && (
              <button className="big-btn primary" onClick={play}>
                <span className="big-btn-emoji">✨</span> Let&apos;s Play
              </button>
            )}

            {failed && (
              <button className="big-btn primary" onClick={() => void startCamera()}>
                Try again
              </button>
            )}

            <div className="boot-row">
              {!settings.demoMode && status === 'ready' && (
                <button className="soft-btn" onClick={playDemo}>
                  Try pretend hands
                </button>
              )}
              {!settings.demoMode && failed && (
                <button className="soft-btn" onClick={playDemo}>
                  Play without a camera
                </button>
              )}
              {settings.demoMode && (
                <button className="soft-btn" onClick={play}>
                  Play with pretend hands
                </button>
              )}
              <button className="soft-btn" onClick={onSettings}>
                Settings
              </button>
            </div>
          </div>

          <p className="boot-note">Grown-ups: hold the bottom-right corner for settings.</p>
        </div>

        <div className="boot-preview-wrap">
          <CameraPreview className="boot-preview" label={demo ? 'Pretend hands' : 'Camera preview'} />
          <div className={`status-pill ${status === 'ready' ? 'ok' : failed ? 'bad' : ''}`}>
            <span className="status-dot" />
            {demo
              ? 'Demo mode'
              : status === 'ready'
                ? 'Magic camera ready'
                : failed
                  ? 'Camera needs help'
                  : 'Starting camera…'}
          </div>
          <div className="boot-preview-actions">
            <button className="mini-btn" onClick={onTrackingTest}>
              Check my magic
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}