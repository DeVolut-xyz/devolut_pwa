import type { ButtonHTMLAttributes, ReactNode } from 'react'

type LiquidButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
  children: ReactNode
}

export function LiquidButton({
  variant = 'primary',
  children,
  className,
  ...rest
}: LiquidButtonProps) {
  const classes = [
    'glass-button',
    variant === 'secondary' ? 'secondary' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}
