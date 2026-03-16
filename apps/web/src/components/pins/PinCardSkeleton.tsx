export default function PinCardSkeleton() {
  const heights = [200, 260, 180, 300, 220, 240]
  const h = heights[Math.floor(Math.random() * heights.length)]

  return (
    <div className="mb-4 rounded-2xl overflow-hidden">
      <div
        className="shimmer-loading rounded-2xl"
        style={{ height: `${h}px` }}
      />
      <div className="flex items-center gap-2 px-1 pt-2 pb-1">
        <div className="w-6 h-6 rounded-full shimmer-loading" />
        <div className="h-3 w-24 rounded-full shimmer-loading" />
      </div>
    </div>
  )
}
