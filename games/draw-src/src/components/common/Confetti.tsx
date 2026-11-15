interface ConfettiProps {
  show: boolean
}

const pieces = Array.from({ length: 18 }, (_, index) => index)

export function Confetti({ show }: ConfettiProps) {
  if (!show) return null
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((index) => (
        <span
          key={index}
          style={{
            left: `${(index * 53) % 100}%`,
            animationDelay: `${(index % 7) * 0.08}s`,
            background: ['#ef4b5f', '#ffd93d', '#5ec96d', '#4aa8ff', '#a879f2', '#ff8fc7'][index % 6],
            transform: `rotate(${index * 37}deg)`,
          }}
        />
      ))}
    </div>
  )
}