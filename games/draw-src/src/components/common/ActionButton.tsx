import { Icon, type IconName } from './Icons'

interface ActionButtonProps {
  icon: IconName
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
  size?: 'normal' | 'large'
  className?: string
}

export function ActionButton({
  icon,
  label,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'normal',
  className = '',
}: ActionButtonProps) {
  return (
    <button
      type="button"
      className={`action-button action-${variant} action-${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <Icon name={icon} size={size === 'large' ? 30 : 24} />
      <span>{label}</span>
    </button>
  )
}