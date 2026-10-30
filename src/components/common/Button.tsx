import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-amber-500 text-stone-950 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-400',
  secondary:
    'bg-stone-800 text-stone-100 hover:bg-stone-700 disabled:bg-stone-800/50 disabled:text-stone-500 border border-stone-700',
  ghost: 'text-stone-300 hover:bg-stone-800 disabled:text-stone-600',
  danger: 'bg-red-600/90 text-white hover:bg-red-500 disabled:bg-stone-700 disabled:text-stone-400',
}

const SIZES: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

export function Button({ variant = 'secondary', size = 'md', className = '', ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    />
  )
}
