import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-medium text-virens-white-muted">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-virens-white-muted pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'input-field',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-virens-error/60 focus:border-virens-error focus:ring-virens-error/20',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-virens-white-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-virens-error">{error}</p>}
        {hint && !error && <p className="text-xs text-virens-white-muted">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-medium text-virens-white-muted">{label}</label>
        )}
        <textarea
          ref={ref}
          className={clsx(
            'input-field resize-none',
            error && 'border-virens-error/60 focus:border-virens-error',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-virens-error">{error}</p>}
        {hint && !error && <p className="text-xs text-virens-white-muted">{hint}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
