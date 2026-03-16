export type UserRole = 'superadmin' | 'admin' | 'staff' | 'creator' | 'user'
export type SubscriptionTier = 'none' | 'basic' | 'pro' | 'creator_support'
export type MediaType = 'image' | 'video' | 'gif'
export type DownloadPermission = 'free' | 'subscribers_only' | 'paid' | 'none'
export type ContentType = 'human' | 'ai_generated'
export type PinStatus = 'draft' | 'published' | 'flagged' | 'removed' | 'appealing'
export type ReportReason = 'copyright' | 'plagiarism' | 'sensitive_content' | 'harassment' | 'spam' | 'misinformation' | 'other'
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed'
export type AdStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'ended' | 'rejected'
export type AdTarget = 'pin' | 'product' | 'profile'

export interface User {
  id: string
  username: string
  email: string
  displayName: string
  avatar?: string
  bio?: string
  websiteUrl?: string
  role: UserRole
  subscriptionTier: SubscriptionTier
  isVerified: boolean
  isPrivate: boolean
  pinnedMediaUrl?: string
  pinnedMediaType?: MediaType
  followersCount: number
  followingCount: number
  pinsCount: number
  credibilityScore: number
  createdAt: string
  updatedAt: string
}

export interface Pin {
  id: string
  title: string
  description?: string
  tags: string[]
  mediaUrl: string
  mediaType: MediaType
  thumbnailUrl: string
  originalWidth: number
  originalHeight: number
  aspectRatio: number
  creator: Pick<User, 'id' | 'username' | 'displayName' | 'avatar' | 'isVerified'>
  status: PinStatus
  contentType: ContentType
  isSensitive: boolean
  downloadPermission: DownloadPermission
  downloadPrice?: number
  isForSale: boolean
  originalPrice?: number
  salePrice?: number
  currency: string
  isProtected: boolean
  hasVisibleWatermark: boolean
  hasInvisibleWatermark: boolean
  screenshotProtection: boolean
  likesCount: number
  savesCount: number
  sharesCount: number
  repostsCount: number
  downloadsCount: number
  viewsCount: number
  commentsCount: number
  isLiked?: boolean
  isSaved?: boolean
  isReposted?: boolean
  collectionId?: string
  licenseType?: string
  createdAt: string
  updatedAt: string
}

export interface Collection {
  id: string
  name: string
  description?: string
  coverImageUrl?: string
  owner: Pick<User, 'id' | 'username'>
  pinsCount: number
  isPrivate: boolean
  createdAt: string
}

export interface Comment {
  id: string
  pinId: string
  author: Pick<User, 'id' | 'username' | 'avatar' | 'isVerified'>
  content: string
  parentId?: string
  likesCount: number
  isLiked?: boolean
  isDeleted: boolean
  createdAt: string
}

export interface Report {
  id: string
  reporter: Pick<User, 'id' | 'username' | 'isVerified'>
  targetType: 'pin' | 'user' | 'comment'
  targetId: string
  reason: ReportReason
  description?: string
  status: ReportStatus
  priority: number
  createdAt: string
  resolvedAt?: string
}

export interface Ad {
  id: string
  advertiser: Pick<User, 'id' | 'username'>
  targetType: AdTarget
  targetId: string
  headline: string
  description?: string
  imageUrl?: string
  ctaText: string
  ctaUrl: string
  status: AdStatus
  budget: number
  spent: number
  reach: number
  clicks: number
  impressions: number
  startDate?: string
  endDate?: string
  createdAt: string
}

export interface Subscription {
  id: string
  userId: string
  tier: Exclude<SubscriptionTier, 'none'>
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  paymentGateway: 'paystack' | 'stripe'
  currentPeriodStart: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
  createdAt: string
}

export interface Payout {
  id: string
  creatorId: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  paymentMethod: 'bank_transfer' | 'stripe'
  reference: string
  createdAt: string
  completedAt?: string
}

export interface Notification {
  id: string
  type: string
  message: string
  actorUsername: string
  actorAvatar: string
  pinId: string
  isRead: boolean
  createdAt: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiError {
  detail: string
  code?: string
  field?: string
}
