interface ProtectedOverlayProps {
  watermark?: string
}

export default function ProtectedOverlay({ watermark }: ProtectedOverlayProps) {
  return (
    <>
      {/* Invisible interaction blocker */}
      <div
        className="protected-overlay"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />

      {/* Canvas fingerprint layer — rendered on top */}
      {watermark && (
        <div
          className="absolute inset-0 pointer-events-none select-none z-10 flex items-center justify-center overflow-hidden"
          aria-hidden="true"
        >
          {/* Diagonal repeating watermark */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='80'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' font-family='DM Sans,sans-serif' font-size='11' fill='rgba(255,255,255,0.07)' transform='rotate(-30 100 40)'%3E%40${encodeURIComponent(watermark)}%3C/text%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
            }}
          />
        </div>
      )}
    </>
  )
}
