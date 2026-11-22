import { useEffect, useRef } from 'react';
import { useCamera } from '../camera/CameraProvider';

interface Props {
  className?: string;
  rounded?: boolean;
  label?: string;
}

/** Live (mirrored) webcam preview. */
export function CameraPreview({ className = '', rounded = true, label }: Props) {
  const { stream, settings } = useCamera();
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (v.srcObject !== stream) v.srcObject = stream;
    if (stream) void v.play().catch(() => {});
  }, [stream]);

  return (
    <div className={`camera-preview ${rounded ? 'rounded' : ''} ${className}`.trim()}>
      <video
        ref={ref}
        muted
        playsInline
        autoPlay
        style={{ transform: settings.mirrored ? 'scaleX(-1)' : 'none' }}
      />
      {!stream && <div className="camera-preview-empty">No camera</div>}
      {label && <span className="camera-preview-label">{label}</span>}
    </div>
  );
}