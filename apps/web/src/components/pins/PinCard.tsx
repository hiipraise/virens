import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Bookmark,
  Share2,
  Download,
  MoreHorizontal,
  Eye,
  Lock,
  ShieldCheck,
  Repeat2,
  Bot,
  Tag,
} from "lucide-react";
import type { Pin } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { usePinActions } from "@/hooks/usePinActions";
import { formatNumber, formatPrice } from "@/utils/format";
import MediaPlayer from "@/components/pins/MediaPlayer";
import ProtectedOverlay from "@/components/dam/ProtectedOverlay";
import DownloadModal from "@/components/dam/DownloadModal";

interface PinCardProps {
  pin: Pin;
  showCreator?: boolean;
}

export default function PinCard({ pin, showCreator = true }: PinCardProps) {
  const { user } = useAuthStore();
  const [hovered, setHovered] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toggleLike, toggleSave, repost } = usePinActions(pin.id);

  const isProtected = pin.isProtected || pin.screenshotProtection;
  const canDownload = pin.downloadPermission !== "none";
  const aspectStyle = {
    aspectRatio: `${pin.originalWidth} / ${pin.originalHeight}`,
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isProtected) {
      e.preventDefault();
      return false;
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (isProtected) e.preventDefault();
  };

  return (
    <>
      <motion.div
        ref={cardRef}
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="pin-card group mb-4 break-inside-avoid"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onContextMenu={handleContextMenu}
      >
        {/* Media container */}
        <Link
          to={`/pin/${pin.id}`}
          className="block relative overflow-hidden rounded-2xl bg-virens-gray"
          onDragStart={handleDragStart}
        >
          <div style={aspectStyle} className="relative">
            <MediaPlayer
              url={pin.mediaUrl}
              thumbnailUrl={pin.thumbnailUrl}
              type={pin.mediaType}
              alt={pin.title}
              isProtected={isProtected}
            />

            {/* Protected overlay */}
            {isProtected && (
              <ProtectedOverlay
                watermark={
                  pin.hasVisibleWatermark ? pin.creator.username : undefined
                }
              />
            )}

            {/* Hover overlay */}
            <AnimatePresence>
              {hovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                >
                  {/* Top badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {pin.isSensitive && (
                      <span className="badge-gray text-[10px]">
                        <Eye size={10} />
                        Sensitive
                      </span>
                    )}
                    {pin.contentType === "ai_generated" && (
                      <span className="badge bg-virens-info/20 text-virens-info border border-virens-info/20 text-[10px]">
                        <Bot size={10} />
                        AI
                      </span>
                    )}
                    {pin.isProtected && (
                      <span className="badge bg-virens-warning/20 text-virens-warning border border-virens-warning/20 text-[10px]">
                        <Lock size={10} />
                        Protected
                      </span>
                    )}
                  </div>

                  {/* Right action bar */}
                  <div className="absolute right-3 top-3 flex flex-col gap-2">
                    <ActionButton
                      icon={Heart}
                      count={pin.likesCount}
                      active={pin.isLiked}
                      activeClass="text-red-400"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleLike();
                      }}
                    />
                    <ActionButton
                      icon={Bookmark}
                      count={pin.savesCount}
                      active={pin.isSaved}
                      activeClass="text-virens-green"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSave();
                      }}
                    />
                    <ActionButton
                      icon={Repeat2}
                      count={pin.repostsCount}
                      active={pin.isReposted}
                      activeClass="text-virens-info"
                      onClick={(e) => {
                        e.preventDefault();
                        repost();
                      }}
                    />
                    {canDownload && (
                      <ActionButton
                        icon={Download}
                        onClick={(e) => {
                          e.preventDefault();
                          setShowDownloadModal(true);
                        }}
                      />
                    )}
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    {pin.title && (
                      <p className="text-white font-display font-semibold text-sm line-clamp-2 mb-1">
                        {pin.title}
                      </p>
                    )}

                    {/* Tags preview */}
                    {pin.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {pin.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] text-virens-white-muted bg-black/30 px-2 py-0.5 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price badge */}
                    {pin.isForSale && (
                      <div className="mt-2 flex items-center gap-2">
                        {pin.originalPrice &&
                        pin.salePrice &&
                        pin.originalPrice > pin.salePrice ? (
                          <>
                            <span className="price-original text-xs">
                              {formatPrice(pin.originalPrice, pin.currency)}
                            </span>
                            <span className="text-virens-green font-bold text-sm">
                              {formatPrice(pin.salePrice, pin.currency)}
                            </span>
                            <span className="badge-green text-[10px]">
                              Save{" "}
                              {Math.round(
                                ((pin.originalPrice - pin.salePrice) /
                                  pin.originalPrice) *
                                  100,
                              )}
                              %
                            </span>
                          </>
                        ) : (
                          <span className="price-sale text-sm">
                            {formatPrice(pin.originalPrice || 0, pin.currency)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Download permission indicator */}
            {pin.downloadPermission === "none" && (
              <div className="absolute bottom-2 left-2">
                <span className="badge bg-black/60 text-virens-white-muted border-0 text-[10px]">
                  <Lock size={9} />
                  No download
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* Creator row */}
        {showCreator && (
          <div className="flex items-center gap-2 px-1 pt-2 pb-1">
            <Link
              to={`/${pin.creator.username}`}
              className="flex items-center gap-2 flex-1 min-w-0 group/creator"
            >
              {pin.creator.avatar ? (
                <img
                  src={pin.creator.avatar}
                  alt={pin.creator.displayName}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0 group-hover/creator:ring-2 group-hover/creator:ring-virens-green/40 transition-all"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-virens-green/20 flex-shrink-0" />
              )}
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-xs font-medium text-virens-white-muted group-hover/creator:text-virens-white truncate transition-colors">
                  {pin.creator.displayName}
                </span>
                {pin.creator.isVerified && (
                  <span className="verified-badge flex-shrink-0">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path
                        d="M1.5 4l1.8 1.8L6.5 2.5"
                        stroke="#191414"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                )}
              </div>
            </Link>
            <div className="flex items-center gap-2 text-virens-white-muted">
              <span className="text-[10px]">
                {formatNumber(pin.viewsCount)} views
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Download modal */}
      <AnimatePresence>
        {showDownloadModal && (
          <DownloadModal
            pin={pin}
            onClose={() => setShowDownloadModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ActionButton({
  icon: Icon,
  count,
  active,
  activeClass = "text-virens-green",
  onClick,
}: {
  icon: React.ElementType;
  count?: number;
  active?: boolean;
  activeClass?: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-0.5 w-9 h-auto py-1.5 rounded-xl
        glass transition-all duration-150 active:scale-90
        ${active ? activeClass : "text-virens-white"}
        hover:scale-105
      `}
    >
      <Icon
        size={16}
        strokeWidth={active ? 2.2 : 1.8}
        fill={active ? "currentColor" : "none"}
      />
      {count !== undefined && (
        <span className="text-[9px] font-medium leading-none">
          {formatNumber(count)}
        </span>
      )}
    </button>
  );
}
