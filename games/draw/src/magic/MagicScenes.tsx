export type MagicSceneId = 'butterfly' | 'fish' | 'rocket' | 'unicorn' | 'dinosaur' | 'flower'

export interface MagicSceneDefinition {
  id: MagicSceneId
  title: string
  subtitle: string
  className: string
}

export const MAGIC_SCENES: MagicSceneDefinition[] = [
  { id: 'butterfly', title: 'Butterfly Meadow', subtitle: 'Flutter and fly', className: 'scene-butterfly' },
  { id: 'fish', title: 'Ocean Friends', subtitle: 'Swim and blow bubbles', className: 'scene-fish' },
  { id: 'rocket', title: 'Rocket Launch', subtitle: 'Blast off to the stars', className: 'scene-rocket' },
  { id: 'unicorn', title: 'Unicorn Rainbow', subtitle: 'Trot through the sky', className: 'scene-unicorn' },
  { id: 'dinosaur', title: 'Dinosaur Stomp', subtitle: 'A friendly prehistoric pal', className: 'scene-dinosaur' },
  { id: 'flower', title: 'Blooming Garden', subtitle: 'Watch a flower grow', className: 'scene-flower' },
]

function Sparkles({ color = '#fff2a8' }: { color?: string }) {
  return (
    <g className="magic-sparkles" fill={color}>
      <circle cx="130" cy="110" r="5" />
      <circle cx="670" cy="150" r="4" />
      <circle cx="610" cy="90" r="6" />
      <circle cx="190" cy="220" r="4" />
      <circle cx="720" cy="340" r="5" />
      <circle cx="90" cy="390" r="4" />
      <circle cx="520" cy="260" r="3" />
    </g>
  )
}

export function MagicSceneArt({ scene }: { scene: MagicSceneId }) {
  switch (scene) {
    case 'butterfly':
      return (
        <svg viewBox="0 0 800 500" role="img" aria-label="A butterfly flying over a flower meadow">
          <defs>
            <linearGradient id="butterflySky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#dff4ff" />
              <stop offset="1" stopColor="#fff5fb" />
            </linearGradient>
          </defs>
          <rect width="800" height="500" fill="url(#butterflySky)" />
          <circle cx="670" cy="90" r="52" fill="#ffd93d" opacity=".9" />
          <path d="M0 400 Q160 340 320 400 Q480 460 640 390 Q730 360 800 400 L800 500 L0 500 Z" fill="#a9e4b5" />
          <path d="M0 440 Q200 390 400 440 Q600 490 800 430 L800 500 L0 500 Z" fill="#7ed69a" />
          <g className="magic-butterfly">
            <g transform="translate(390 230)">
              <g className="wing wing-left">
                <path d="M0 0 C-80 -80 -150 -20 -110 50 C-80 100 -20 80 0 30 Z" fill="#c6a7ff" stroke="#5b4a7a" strokeWidth="5" />
                <path d="M-10 40 C-70 70 -80 130 -30 140 C10 148 30 90 10 50 Z" fill="#ff8fc7" stroke="#5b4a7a" strokeWidth="5" />
              </g>
              <g className="wing wing-right">
                <path d="M0 0 C80 -80 150 -20 110 50 C80 100 20 80 0 30 Z" fill="#c6a7ff" stroke="#5b4a7a" strokeWidth="5" />
                <path d="M10 40 C70 70 80 130 30 140 C-10 148 -30 90 -10 50 Z" fill="#ff8fc7" stroke="#5b4a7a" strokeWidth="5" />
              </g>
              <ellipse cx="0" cy="30" rx="12" ry="70" fill="#5b4a7a" />
              <path d="M-8 -35 Q-40 -80 -60 -90 M8 -35 Q40 -80 60 -90" fill="none" stroke="#5b4a7a" strokeWidth="5" strokeLinecap="round" />
            </g>
          </g>
          <g transform="translate(120 400)">
            <path d="M0 0 L0 80" stroke="#4a9a63" strokeWidth="8" />
            <circle cx="0" cy="-10" r="28" fill="#ff8fc7" />
            <circle cx="0" cy="-10" r="12" fill="#ffd93d" />
          </g>
          <g transform="translate(680 420)">
            <path d="M0 0 L0 70" stroke="#4a9a63" strokeWidth="8" />
            <circle cx="0" cy="-8" r="22" fill="#ffd93d" />
            <circle cx="0" cy="-8" r="9" fill="#ff8a3d" />
          </g>
          <Sparkles />
        </svg>
      )
    case 'fish':
      return (
        <svg viewBox="0 0 800 500" role="img" aria-label="A friendly fish swimming underwater">
          <defs>
            <linearGradient id="oceanSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9fe0ff" />
              <stop offset="1" stopColor="#3d8fc4" />
            </linearGradient>
          </defs>
          <rect width="800" height="500" fill="url(#oceanSky)" />
          <g fill="#ffffff" opacity=".45" className="bubbles">
            <circle cx="150" cy="100" r="12" />
            <circle cx="190" cy="160" r="7" />
            <circle cx="650" cy="120" r="14" />
            <circle cx="700" cy="220" r="8" />
            <circle cx="600" cy="320" r="10" />
          </g>
          <path d="M0 440 Q120 400 240 440 Q360 480 480 430 Q600 390 800 450 L800 500 L0 500 Z" fill="#2d6f9e" opacity=".5" />
          <g className="magic-fish" transform="translate(400 250)">
            <path d="M-120 0 Q-180 -60 -220 -10 Q-190 20 -220 60 Q-170 70 -120 20 Z" fill="#ff8a3d" stroke="#8a4a2a" strokeWidth="4" />
            <ellipse cx="0" cy="0" rx="140" ry="85" fill="#ffd93d" stroke="#8a4a2a" strokeWidth="5" />
            <circle cx="65" cy="-20" r="10" fill="#303044" />
            <circle cx="68" cy="-23" r="3" fill="#fff" />
            <path d="M100 20 Q130 35 155 20" fill="none" stroke="#8a4a2a" strokeWidth="5" strokeLinecap="round" />
            <path d="M-30 -80 Q10 -130 55 -80" fill="#ef4b5f" stroke="#8a4a2a" strokeWidth="4" />
            <path d="M-60 70 Q-30 110 10 70" fill="#ef4b5f" stroke="#8a4a2a" strokeWidth="4" />
          </g>
          <g transform="translate(600 410)">
            <path d="M0 0 Q-20 -50 10 -90 Q30 -50 0 0" fill="#ff8fc7" />
            <path d="M0 0 Q30 -40 60 -50 Q45 -10 0 0" fill="#c6a7ff" />
            <path d="M0 0 Q-30 -30 -55 -30 Q-40 -5 0 0" fill="#a9e4d0" />
          </g>
          <Sparkles color="#e8ffff" />
        </svg>
      )
    case 'rocket':
      return (
        <svg viewBox="0 0 800 500" role="img" aria-label="A rocket launching into a starry sky">
          <defs>
            <linearGradient id="spaceSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1f1e42" />
              <stop offset="1" stopColor="#4a3a78" />
            </linearGradient>
          </defs>
          <rect width="800" height="500" fill="url(#spaceSky)" />
          <g fill="#fff2a8" className="magic-stars">
            <circle cx="100" cy="80" r="4" /><circle cx="220" cy="130" r="3" />
            <circle cx="650" cy="90" r="5" /><circle cx="720" cy="200" r="3" />
            <circle cx="560" cy="300" r="4" /><circle cx="150" cy="320" r="3" />
            <circle cx="400" cy="70" r="2" /><circle cx="300" cy="220" r="2" />
          </g>
          <circle cx="680" cy="120" r="45" fill="#c6a7ff" opacity=".8" />
          <ellipse cx="680" cy="120" rx="70" ry="13" fill="none" stroke="#ffd93d" strokeWidth="5" opacity=".8" transform="rotate(-18 680 120)" />
          <g className="magic-rocket">
            <g transform="translate(400 330)">
              <path d="M0 -170 Q70 -100 70 0 L-70 0 Q-70 -100 0 -170" fill="#f4fbff" stroke="#3b3553" strokeWidth="6" />
              <circle cx="0" cy="-80" r="28" fill="#4aa8ff" stroke="#3b3553" strokeWidth="5" />
              <path d="M-70 0 L-110 80 L-40 55" fill="#ef4b5f" stroke="#3b3553" strokeWidth="5" />
              <path d="M70 0 L110 80 L40 55" fill="#ef4b5f" stroke="#3b3553" strokeWidth="5" />
              <path d="M-40 0 L-40 90 Q0 120 40 90 L40 0" fill="#ffd93d" stroke="#3b3553" strokeWidth="5" />
              <path className="magic-flame" d="M-22 70 Q0 30 22 70 Q30 110 0 150 Q-30 110 -22 70" fill="#ff8a3d" />
            </g>
          </g>
          <path d="M80 460 Q400 520 720 460" fill="none" stroke="#fff" strokeWidth="3" opacity=".2" />
        </svg>
      )
    case 'unicorn':
      return (
        <svg viewBox="0 0 800 500" role="img" aria-label="A unicorn trotting under a rainbow">
          <rect width="800" height="500" fill="#eaf7ff" />
          <g fill="none" strokeWidth="18" opacity=".55">
            <path d="M80 380 Q80 100 400 100 Q720 100 720 380" stroke="#ff8fa3" />
            <path d="M130 380 Q130 160 400 160 Q670 160 670 380" stroke="#ffd93d" />
            <path d="M180 380 Q180 220 400 220 Q620 220 620 380" stroke="#8fd8a4" />
            <path d="M230 380 Q230 280 400 280 Q570 280 570 380" stroke="#8ec9ff" />
          </g>
          <path d="M0 430 Q200 380 400 430 Q600 480 800 420 L800 500 L0 500 Z" fill="#a9e4b5" />
          <g className="magic-unicorn" transform="translate(400 300)">
            <path d="M-100 80 Q-110 -20 -40 -40 Q30 -60 60 10 Q80 60 40 90 L-60 90 Q-90 90 -100 80" fill="#fff4ff" stroke="#5b4a7a" strokeWidth="5" />
            <path d="M-40 -40 L-50 -120 L10 -55" fill="#ffd93d" stroke="#5b4a7a" strokeWidth="4" />
            <circle cx="10" cy="-10" r="4" fill="#303044" />
            <path d="M20 10 Q35 18 45 8" fill="none" stroke="#5b4a7a" strokeWidth="4" strokeLinecap="round" />
            <path d="M-80 50 Q-110 70 -120 100" fill="none" stroke="#5b4a7a" strokeWidth="5" strokeLinecap="round" />
            <path d="M-30 90 L-30 130 M20 90 L20 130" stroke="#5b4a7a" strokeWidth="8" strokeLinecap="round" />
            <path d="M-80 80 Q-130 60 -150 80 Q-130 100 -80 90" fill="#ff8fc7" stroke="#5b4a7a" strokeWidth="4" />
          </g>
          <Sparkles />
        </svg>
      )
    case 'dinosaur':
      return (
        <svg viewBox="0 0 800 500" role="img" aria-label="A friendly dinosaur stomping in a prehistoric garden">
          <rect width="800" height="500" fill="#f7f2d8" />
          <circle cx="680" cy="90" r="48" fill="#ffd93d" />
          <path d="M0 360 Q160 300 320 360 Q480 420 640 350 Q730 320 800 360 L800 500 L0 500 Z" fill="#a9e4b5" />
          <g className="magic-dinosaur" transform="translate(400 330)">
            <path d="M-160 100 Q-180 -40 -80 -70 Q40 -100 120 10 Q180 80 100 130 L-100 130 Q-150 130 -160 100" fill="#8fd8a4" stroke="#3b6b4a" strokeWidth="6" />
            <path d="M-90 -70 L-110 -160 L-30 -100" fill="#b7e8a8" stroke="#3b6b4a" strokeWidth="5" />
            <path d="M-20 -80 L-20 -180 L60 -110" fill="#b7e8a8" stroke="#3b6b4a" strokeWidth="5" />
            <path d="M60 -60 L110 -140 L130 -50" fill="#b7e8a8" stroke="#3b6b4a" strokeWidth="5" />
            <path d="M-160 60 Q-230 20 -260 70 Q-230 120 -160 110" fill="#8fd8a4" stroke="#3b6b4a" strokeWidth="5" />
            <circle cx="80" cy="-20" r="7" fill="#303044" />
            <path d="M95 10 Q120 20 140 5" fill="none" stroke="#3b6b4a" strokeWidth="5" strokeLinecap="round" />
            <path d="M-90 130 L-100 190 M30 130 L40 190" stroke="#3b6b4a" strokeWidth="14" strokeLinecap="round" />
          </g>
          <g transform="translate(140 390)">
            <path d="M0 0 Q-30 -80 20 -120 Q60 -80 0 0" fill="#ff8fc7" />
            <path d="M0 0 Q40 -60 80 -50 Q50 -10 0 0" fill="#ffd93d" />
          </g>
          <Sparkles color="#fff6c8" />
        </svg>
      )
    case 'flower':
      return (
        <svg viewBox="0 0 800 500" role="img" aria-label="A flower blooming in a sunny garden">
          <rect width="800" height="500" fill="#fff7e8" />
          <circle cx="650" cy="100" r="55" fill="#ffd93d" opacity=".85" />
          <path d="M0 410 Q200 360 400 410 Q600 460 800 400 L800 500 L0 500 Z" fill="#a9e4b5" />
          <g className="magic-flower" transform="translate(400 360)">
            <path d="M0 40 L0 120" stroke="#4a9a63" strokeWidth="12" strokeLinecap="round" />
            <path d="M0 80 Q-70 40 -100 80 Q-50 120 0 100" fill="#7ed69a" />
            <path d="M0 95 Q70 55 100 95 Q50 135 0 115" fill="#7ed69a" />
            <g className="flower-petals">
              <ellipse cx="0" cy="-60" rx="35" ry="55" fill="#ff8fc7" />
              <ellipse cx="0" cy="40" rx="35" ry="55" fill="#ff8fc7" />
              <ellipse cx="-55" cy="-10" rx="55" ry="35" fill="#ff8fc7" />
              <ellipse cx="55" cy="-10" rx="55" ry="35" fill="#ff8fc7" />
              <ellipse cx="-40" cy="-45" rx="35" ry="45" fill="#ffb6d5" transform="rotate(-45 -40 -45)" />
              <ellipse cx="40" cy="-45" rx="35" ry="45" fill="#ffb6d5" transform="rotate(45 40 -45)" />
              <ellipse cx="-40" cy="25" rx="35" ry="45" fill="#ffb6d5" transform="rotate(45 -40 25)" />
              <ellipse cx="40" cy="25" rx="35" ry="45" fill="#ffb6d5" transform="rotate(-45 40 25)" />
              <circle cx="0" cy="-10" r="32" fill="#ffd93d" />
              <circle cx="-10" cy="-18" r="3" fill="#303044" />
              <circle cx="10" cy="-18" r="3" fill="#303044" />
              <path d="M-8 -4 Q0 4 8 -4" fill="none" stroke="#303044" strokeWidth="3" strokeLinecap="round" />
            </g>
          </g>
          <g transform="translate(150 400)">
            <path d="M0 0 Q-20 -50 10 -90 Q30 -50 0 0" fill="#ff8fc7" />
            <path d="M0 0 Q30 -40 60 -50 Q45 -10 0 0" fill="#c6a7ff" />
          </g>
          <g transform="translate(650 410)">
            <path d="M0 0 Q-20 -40 0 -70 Q20 -40 0 0" fill="#ffd93d" />
          </g>
          <Sparkles color="#fff2a8" />
        </svg>
      )
  }
}