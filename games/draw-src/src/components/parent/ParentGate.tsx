import { useEffect, useRef, useState } from 'react'
import { Icon } from '../common/Icons'
import { soundManager } from '../../audio/SoundManager'

interface ParentGateProps {
  onUnlock: () => void
}

const HOLD_MS = 1800

export function ParentGate({ onUnlock }: ParentGateProps) {
  const [progress, setProgress] = useState(0)
  const [question, setQuestion] = useState(false)
  const [wrong, setWrong] = useState(false)
  const timerRef = useRef<number | null>(null)
  const startRef = useRef(0)

  const stopHold = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (progress < 1) setProgress(0)
  }

  const startHold = () => {
    if (question) return
    startRef.current = performance.now()
    if (timerRef.current !== null) window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      const next = Math.min(1, (performance.now() - startRef.current) / HOLD_MS)
      setProgress(next)
      if (next >= 1) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current)
        timerRef.current = null
        setProgress(0)
        setQuestion(true)
        soundManager.play('sparkle')
      }
    }, 30)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
    }
  }, [])

  const answer = (value: number) => {
    if (value === 9) {
      soundManager.play('success')
      onUnlock()
    } else {
      setWrong(true)
      soundManager.play('pop')
      window.setTimeout(() => setWrong(false), 650)
    }
  }

  return (
    <div className="parent-gate">
      <div className="gate-card">
        <span className="gate-icon"><Icon name="lock" size={44} /></span>
        <h1>Grown-ups only</h1>
        <p className="gate-copy">This area has settings for parents and carers.</p>
        {!question ? (
          <>
            <button
              type="button"
              className="hold-button"
              onPointerDown={(event) => {
                try {
                  event.currentTarget.setPointerCapture(event.pointerId)
                } catch {
                  // Hold-to-confirm also works without pointer capture.
                }
                startHold()
              }}
              onPointerUp={stopHold}
              onPointerCancel={stopHold}
              onPointerLeave={stopHold}
              aria-label="Hold for two seconds to continue"
            >
              <span className="hold-fill" style={{ width: `${progress * 100}%` }} />
              <span className="hold-label">
                <Icon name="lock" size={24} />
                Hold for 2 seconds
              </span>
            </button>
            <p className="gate-small">Then answer a quick grown-up question</p>
          </>
        ) : (
          <div className="gate-question">
            <h2>What is 6 + 3?</h2>
            <p>Choose the right answer</p>
            <div className="gate-answers">
              {[7, 9, 11].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`gate-answer ${wrong ? 'is-wrong' : ''}`}
                  onClick={() => answer(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            {wrong && <p className="gate-error">Not quite. Ask a grown-up to try.</p>}
          </div>
        )}
      </div>
    </div>
  )
}