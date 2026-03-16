import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface ToggleProps {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function Toggle({ checked, onChange, label, description, disabled, size = 'md' }: ToggleProps) {
  const width = size === 'sm' ? 32 : 40
  const height = size === 'sm' ? 18 : 22
  const knob = size === 'sm' ? 12 : 16
  const travel = size === 'sm' ? 14 : 18

  return (
    <div className={clsx('flex items-center gap-3', disabled && 'opacity-50 cursor-not-allowed')}>
      {(label || description) && (
        <div className="flex-1">
          {label && <p className="text-sm text-virens-white font-medium">{label}</p>}
          {description && <p className="text-xs text-virens-white-muted mt-0.5">{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className="flex-shrink-0 relative rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-virens-green/40"
        style={{
          width,
          height,
          backgroundColor: checked ? 'var(--virens-green)' : '#3d3535',
        }}
      >
        <motion.span
          layout
          className="absolute top-[3px] left-[3px] rounded-full bg-white shadow-sm"
          style={{ width: knob, height: knob }}
          animate={{ x: checked ? travel : 0 }}
          transition={{ type: 'spring', stiffness: 700, damping: 35 }}
        />
      </button>
    </div>
  )
}
