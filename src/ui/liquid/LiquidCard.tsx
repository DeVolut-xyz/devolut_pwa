import type { HTMLAttributes, ReactNode } from 'react'

type LiquidCardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'dark'
  children: ReactNode
}

export function LiquidCard({
  variant = 'default',
  children,
  className,
  ...rest
}: LiquidCardProps) {
  const classes = ['glass-panel', variant === 'dark' ? 'dark' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}
