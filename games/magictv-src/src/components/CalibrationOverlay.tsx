import { useEffect } from 'react';
import { useCamera } from '../camera/CameraProvider';
import { PointerOverlay } from './PointerOverlay';

interface Props {
  onDone: () => void;
}

export function CalibrationOverlay({ onDone }: Props) {
  const { calibration, cancelCalibration } = useCamera();

  useEffect(() => {
    if (calibration.phase === 'done') {
      const t = window.setTimeout(onDone, 1900);
      return () => window.clearTimeout(t);
    }
  }, [calibration.phase, onDone]);

  const title =
    calibration.phase === 'done'
      ? 'You are ready!'
      : calibration.phase === 'hands'
        ? 'Move your hands all around!'
        : 'Stand back and hold up your hands';

  return (
    <div className="screen calib-screen">
      <div className="calib-card">
        <div className="calib-badge">✋</div>
        <h2>{title}</h2>
        <p className="calib-sub">
          {calibration.phase === 'done'
            ? 'The magic is all set. Get ready to play!'
            : calibration.phase === 'hands'
              ? 'Reach up high, out wide, and down low. No rush!'
              : 'Stand where you can see the whole television.'}
        </p>

        <div className="calib-progress">
          <div
            className="calib-progress-fill"
            style={{ width: `${Math.round((calibration.phase === 'done' ? 1 : calibration.progress) * 100)}%` }}
          />
        </div>

        <div className="calib-hands">
          {[0, 1].map((i) => (
            <div key={i} className={`hand-card hand-${i}`}>
              <div className="hand-card-icon">{calibration.phase === 'done' ? '🌟' : '✋'}</div>
              <span>{calibration.phase === 'done' ? 'Magic!' : i === 0 ? 'Hand 1' : 'Hand 2'}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="soft-btn calib-skip" onClick={() => { cancelCalibration(); onDone(); }}>
        Grown-ups: skip
      </button>
      <PointerOverlay />
    </div>
  );
}