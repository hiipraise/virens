export const SUBSCRIPTION_TIERS = {
  basic: { name: 'Subscription', price: 700, currency: '₦', interval: 'month' },
  pro: { name: 'Pro', price: 4500, currency: '₦', interval: 'month' },
  creator_support: { name: 'Creator Support', price: 9000, currency: '₦', interval: 'month' },
} as const

export const ROLE_PERMISSIONS = {
  superadmin: ['all'],
  admin: ['moderate', 'manage_users', 'manage_ads', 'view_reports'],
  staff: ['moderate', 'view_reports'],
  creator: ['upload', 'sell', 'run_ads'],
  user: ['browse', 'engage', 'subscribe'],
} as const

export const AD_PRICING = {
  promoted_pin: { min: 200, max: 200, currency: '₦' },
  promoted_profile: { min: 200, max: 200, currency: '₦' },
} as const

export const MINIMUM_PAYOUT_NGN = 10000

export const SUPPORTED_MEDIA_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  gif: ['image/gif'],
} as const

export const MAX_FILE_SIZE_MB = 100

export const REPORT_REASONS = [
  { id: 'copyright', label: 'Copyright Violation', priority: 9 },
  { id: 'plagiarism', label: 'Plagiarism', priority: 8 },
  { id: 'harassment', label: 'Harassment', priority: 7 },
  { id: 'sensitive_content', label: 'Sensitive Content', priority: 6 },
  { id: 'misinformation', label: 'Misinformation', priority: 5 },
  { id: 'spam', label: 'Spam', priority: 3 },
  { id: 'other', label: 'Other', priority: 2 },
] as const
