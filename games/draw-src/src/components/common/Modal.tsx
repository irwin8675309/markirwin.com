import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Icon } from './Icons'

interface ModalProps {
  open: boolean
  title: string
  children: ReactNode
  onClose?: () => void
  wide?: boolean
  hideClose?: boolean
}

export function Modal({ open, title, children, onClose, wide = false, hideClose = false }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onPointerDown={(event) => {
      if (event.target === event.currentTarget && onClose) onClose()
    }}>
      <section className={`modal-panel ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <h2>{title}</h2>
          {!hideClose && onClose && (
            <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
              <Icon name="close" size={26} />
            </button>
          )}
        </header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  )
}