import type { SVGProps } from 'react'

type IconName =
  | 'home'
  | 'palette'
  | 'brush'
  | 'crayon'
  | 'marker'
  | 'paint'
  | 'rainbow'
  | 'glitter'
  | 'stamp'
  | 'eraser'
  | 'undo'
  | 'redo'
  | 'trash'
  | 'save'
  | 'gallery'
  | 'magic'
  | 'sticker'
  | 'lock'
  | 'sound'
  | 'mute'
  | 'back'
  | 'play'
  | 'pause'
  | 'download'
  | 'share'
  | 'plus'
  | 'close'
  | 'check'
  | 'chevron'
  | 'sparkle'
  | 'heart'
  | 'star'
  | 'pencil'

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 24, ...props }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  }

  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3.5 10.5 12 3l8.5 7.5" />
          <path d="M5.5 9.5V21h13V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
      )
    case 'palette':
      return (
        <svg {...common}>
          <path d="M12 3a9 9 0 1 0 0 18h1.5a2.5 2.5 0 0 0 0-5H13a2 2 0 0 1 0-4h3.5A4.5 4.5 0 0 0 21 7.5C19.8 4.9 16.2 3 12 3Z" />
          <circle cx="7.5" cy="10" r="1" fill="currentColor" stroke="none" />
          <circle cx="10" cy="6.8" r="1" fill="currentColor" stroke="none" />
          <circle cx="14" cy="6.6" r="1" fill="currentColor" stroke="none" />
          <circle cx="17" cy="8.6" r="1" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'brush':
    case 'crayon':
      return (
        <svg {...common}>
          <path d="M14.5 4.5 19.5 9.5 9 20H4v-5L14.5 4.5Z" />
          <path d="m12.5 6.5 5 5" />
          <path d="M4 20c2.5 0 3.5-1.5 3.5-3.5" />
        </svg>
      )
    case 'marker':
      return (
        <svg {...common}>
          <path d="m15 3 6 6-8.5 8.5-6-6L15 3Z" />
          <path d="m6.5 11.5-2 5.5 5.5-2" />
          <path d="m17 5 2 2" />
        </svg>
      )
    case 'paint':
      return (
        <svg {...common}>
          <path d="M18.5 3.5c-2 0-8 5.5-8 9 0 2 1.5 3.5 3.5 3.5 3.5 0 9-6 9-8 0-2.5-2-4.5-4.5-4.5Z" />
          <path d="M4 20c2.5 0 3.5-1.5 3.5-3.5" />
          <path d="M13 8c1.5 1.5 3 3 3 5" />
        </svg>
      )
    case 'rainbow':
      return (
        <svg {...common}>
          <path d="M3 18a9 9 0 0 1 18 0" />
          <path d="M6.5 18a5.5 5.5 0 0 1 11 0" />
          <path d="M10 18a2 2 0 0 1 4 0" />
        </svg>
      )
    case 'glitter':
    case 'sparkle':
      return (
        <svg {...common}>
          <path d="M12 2.5c.8 5 3.5 7.7 8.5 8.5-5 .8-7.7 3.5-8.5 8.5-.8-5-3.5-7.7-8.5-8.5 5-.8 7.7-3.5 8.5-8.5Z" />
          <path d="M19 16.5c.3 1.8 1.2 2.7 3 3-1.8.3-2.7 1.2-3 3-.3-1.8-1.2-2.7-3-3 1.8-.3 2.7-1.2 3-3Z" />
        </svg>
      )
    case 'stamp':
      return (
        <svg {...common}>
          <path d="M5 20h14" />
          <path d="M7 17h10v3H7z" />
          <path d="M9 17v-3.5c0-1.5-.8-2.5-2-3.2C5.7 9.5 5 8.4 5 7a4 4 0 0 1 8 0v1h2V7a4 4 0 0 1 8 0c0 1.4-.7 2.5-2 3.3-1.2.7-2 1.7-2 3.2V17" transform="translate(-1 0)" />
        </svg>
      )
    case 'eraser':
      return (
        <svg {...common}>
          <path d="m8 20-4-4a2 2 0 0 1 0-2.8l8.5-8.5a2 2 0 0 1 2.8 0l4 4a2 2 0 0 1 0 2.8L11.8 20H8Z" />
          <path d="m9 8 7 7" />
          <path d="M8 20h12" />
        </svg>
      )
    case 'undo':
      return (
        <svg {...common}>
          <path d="M8.5 7 4 11.5 8.5 16" />
          <path d="M4 11.5h9a6.5 6.5 0 1 1 0 13h-1" transform="translate(0 -4)" />
        </svg>
      )
    case 'redo':
      return (
        <svg {...common}>
          <path d="m15.5 7 4.5 4.5-4.5 4.5" />
          <path d="M20 11.5h-9a6.5 6.5 0 1 0 0 13h1" transform="translate(0 -4)" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M9 7V4h6v3" />
          <path d="M6.5 7 7.5 21h9l1-14" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      )
    case 'save':
      return (
        <svg {...common}>
          <path d="M5 3h11l3 3v15H5V3Z" />
          <path d="M8 3v6h8V3" />
          <path d="M8 21v-7h8v7" />
        </svg>
      )
    case 'gallery':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="m3 16 5-5 4 4 3-3 6 6" />
          <circle cx="15.5" cy="8.5" r="1.5" />
        </svg>
      )
    case 'magic':
      return (
        <svg {...common}>
          <path d="m5 19 9-9" />
          <path d="m14 4 .9 2.1L17 7l-2.1.9L14 10l-.9-2.1L11 7l2.1-.9L14 4Z" />
          <path d="m19 11 .7 1.6 1.6.7-1.6.7L19 16l-.7-1.6-1.6-.7 1.6-.7L19 11Z" />
          <path d="M6 3v3M4.5 4.5h3" />
        </svg>
      )
    case 'sticker':
      return (
        <svg {...common}>
          <path d="M20 12.5V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h5.5L20 12.5Z" />
          <path d="M20 12.5h-5a3 3 0 0 0-3 3v5" />
          <circle cx="8.5" cy="9" r="1" fill="currentColor" stroke="none" />
          <path d="M8.5 13c1 1 2.5 1 3.5 0" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...common}>
          <rect x="4.5" y="10" width="15" height="11" rx="3" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          <circle cx="12" cy="15.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'sound':
      return (
        <svg {...common}>
          <path d="M4 9v6h4l5 4V5L8 9H4Z" />
          <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />
        </svg>
      )
    case 'mute':
      return (
        <svg {...common}>
          <path d="M4 9v6h4l5 4V5L8 9H4Z" />
          <path d="m16 9 5 6M21 9l-5 6" />
        </svg>
      )
    case 'back':
      return (
        <svg {...common}>
          <path d="M19 12H5" />
          <path d="m11 6-6 6 6 6" />
        </svg>
      )
    case 'play':
      return (
        <svg {...common}>
          <path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'pause':
      return (
        <svg {...common}>
          <rect x="7" y="5" width="4" height="14" rx="1.5" fill="currentColor" stroke="none" />
          <rect x="13" y="5" width="4" height="14" rx="1.5" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M4 20h16" />
        </svg>
      )
    case 'share':
      return (
        <svg {...common}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'close':
      return (
        <svg {...common}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="m4 12 5 5L20 6" />
        </svg>
      )
    case 'chevron':
      return (
        <svg {...common}>
          <path d="m9 5 7 7-7 7" />
        </svg>
      )
    case 'heart':
      return (
        <svg {...common}>
          <path d="M12 20s-8-4.8-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.2-8 10-8 10Z" />
        </svg>
      )
    case 'star':
      return (
        <svg {...common}>
          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
        </svg>
      )
    case 'pencil':
      return (
        <svg {...common}>
          <path d="m4 20 1-5L16 4l4 4L9 19l-5 1Z" />
          <path d="m13.5 6.5 4 4" />
          <path d="M4 20c2 0 3-1 3-3" />
        </svg>
      )
  }
}

export type { IconName }