import type { InputHTMLAttributes } from 'react'

type LiquidInputProps = InputHTMLAttributes<HTMLInputElement>

export function LiquidInput({ className, ...rest }: LiquidInputProps) {
  const classes = ['glass-input', className].filter(Boolean).join(' ')
  return <input className={classes} {...rest} />
}
