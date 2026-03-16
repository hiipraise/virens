import { clsx } from 'clsx'
import { formatPrice } from '@/utils/format'

interface PriceTagProps {
  originalPrice?: number
  salePrice?: number
  currency?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showSavings?: boolean
}

const sizeStyles = {
  sm: { sale: 'text-sm font-bold', original: 'text-xs', badge: 'text-[10px]' },
  md: { sale: 'text-lg font-bold', original: 'text-sm', badge: 'text-xs' },
  lg: { sale: 'text-2xl font-bold', original: 'text-base', badge: 'text-sm' },
}

export function PriceTag({
  originalPrice,
  salePrice,
  currency = '₦',
  size = 'md',
  className,
  showSavings = true,
}: PriceTagProps) {
  if (!originalPrice && !salePrice) return null

  const displayPrice = salePrice || originalPrice!
  const hasDiscount = originalPrice && salePrice && salePrice < originalPrice
  const savings = hasDiscount
    ? Math.round(((originalPrice - salePrice!) / originalPrice) * 100)
    : 0

  const s = sizeStyles[size]

  return (
    <div className={clsx('flex items-end gap-2 flex-wrap', className)}>
      {hasDiscount && (
        <span className={clsx('line-through text-virens-white-muted font-body', s.original)}>
          {formatPrice(originalPrice, currency)}
        </span>
      )}
      <span className={clsx('text-virens-green font-display', s.sale)}>
        {formatPrice(displayPrice, currency)}
      </span>
      {showSavings && hasDiscount && savings > 0 && (
        <span
          className={clsx(
            'inline-flex items-center px-2 py-0.5 rounded-full font-semibold',
            'bg-virens-green/15 text-virens-green border border-virens-green/20',
            s.badge
          )}
        >
          Save {savings}%
        </span>
      )}
    </div>
  )
}
