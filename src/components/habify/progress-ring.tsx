'use client'

import { cn } from '@/lib/utils'

interface ProgressRingProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  className?: string
  trackClassName?: string
  label?: string
  sublabel?: string
  color?: string
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  className,
  trackClassName,
  label,
  sublabel,
  color,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn('progress-ring-track', trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={color || 'var(--primary)'}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <span className="text-xl font-semibold text-foreground">{label}</span>
        )}
        {sublabel && (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}
