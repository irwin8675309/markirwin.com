import type { StampShape } from '../../types'

export function StampShapeIcon({ shape, size = 28 }: { shape: StampShape; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true,
  }
  switch (shape) {
    case 'heart':
      return (
        <svg {...common}>
          <path d="M12 21s-8-4.8-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 11c0 5.2-8 10-8 10Z" />
        </svg>
      )
    case 'star':
      return (
        <svg {...common}>
          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 10.6l6.2-.9L12 3Z" />
        </svg>
      )
    case 'flower':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="5" r="3" />
          <circle cx="12" cy="19" r="3" />
          <circle cx="5" cy="12" r="3" />
          <circle cx="19" cy="12" r="3" />
        </svg>
      )
    case 'butterfly':
      return (
        <svg {...common}>
          <ellipse cx="7" cy="9" rx="4.5" ry="5" transform="rotate(-25 7 9)" />
          <ellipse cx="17" cy="9" rx="4.5" ry="5" transform="rotate(25 17 9)" />
          <ellipse cx="8" cy="16" rx="3.2" ry="4" transform="rotate(20 8 16)" />
          <ellipse cx="16" cy="16" rx="3.2" ry="4" transform="rotate(-20 16 16)" />
          <rect x="11" y="5" width="2" height="15" rx="1" fill="#fff" />
        </svg>
      )
    case 'smile':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="9" cy="10" r="1.2" fill="#303044" />
          <circle cx="15" cy="10" r="1.2" fill="#303044" />
          <path d="M8 14c1.2 2 6.8 2 8 0" fill="none" stroke="#303044" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
  }
}