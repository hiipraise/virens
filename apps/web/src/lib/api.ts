import type {
  Ad,
  Collection,
  Comment,
  ContentType,
  DownloadPermission,
  Notification,
  PaginatedResponse,
  Pin,
  Report,
  ReportReason,
  SubscriptionTier,
  User,
  UserRole,
} from '@/types'

const STORE_KEY = 'virens.frontend.state.v2'
const TOKEN_KEY = 'virens.frontend.session'
const LATENCY_MS = 180

type Params = Record<string, unknown>
type HttpResponse<T> = { data: T }

type DraftAd = {
  targetType?: Ad['targetType']
  target_id?: string
  targetId?: string
  headline?: string
  description?: string
  ctaText?: string
  cta_text?: string
  ctaUrl?: string
  cta_url?: string
  budget?: number
}

type LocalState = {
  users: User[]
  pins: Pin[]
  collections: Array<Collection & { pinIds: string[] }>
  comments: Comment[]
  notifications: Notification[]
  reports: Report[]
  ads: Ad[]
  follows: Record<string, string[]>
  payments: Record<string, { type: string; amount: number; status: 'success' }>
  currentUserId: string | null
}

const now = new Date('2026-05-30T12:00:00.000Z')
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString()
const delay = () => new Promise((resolve) => window.setTimeout(resolve, LATENCY_MS))
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`

function svgData(title: string, tags: string[], accent = '#1DB954') {
  const label = encodeURIComponent(title)
  const meta = encodeURIComponent(tags.map((tag) => `#${tag}`).join('  '))
  const gradientId = slug(title) || 'art'
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200">
      <defs>
        <linearGradient id="${gradientId}" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#191414"/>
          <stop offset="0.48" stop-color="#242020"/>
          <stop offset="1" stop-color="${accent}" stop-opacity="0.82"/>
        </linearGradient>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.18"/></feComponentTransfer></filter>
      </defs>
      <rect width="900" height="1200" fill="url(#${gradientId})"/>
      <rect width="900" height="1200" filter="url(#grain)" opacity="0.42"/>
      <circle cx="150" cy="160" r="180" fill="${accent}" opacity="0.18"/>
      <circle cx="760" cy="1010" r="260" fill="#ffffff" opacity="0.06"/>
      <text x="70" y="850" fill="#ffffff" font-family="Arial, sans-serif" font-size="72" font-weight="700">${label}</text>
      <text x="72" y="928" fill="#ffffff" opacity="0.72" font-family="Arial, sans-serif" font-size="32">${meta}</text>
      <text x="72" y="1040" fill="#1DB954" font-family="Arial, sans-serif" font-size="28" font-weight="700">VIRENS MOCK STUDIO</text>
    </svg>`)}`
}

const avatar = (name: string, accent = '#1DB954') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="48" fill="#191414"/><circle cx="150" cy="50" r="70" fill="${accent}" opacity=".35"/><text x="100" y="118" text-anchor="middle" fill="#fff" font-family="Arial" font-weight="700" font-size="64">${name.slice(0, 2).toUpperCase()}</text></svg>`)}`

function user(
  id: string,
  username: string,
  displayName: string,
  role: UserRole,
  accent: string,
  overrides: Partial<User> = {},
): User {
  return {
    id,
    username,
    email: `${username}@virens.local`,
    displayName,
    avatar: avatar(username, accent),
    bio: 'Frontend-only creator profile with local mock activity, uploads, collections, and simulated commerce.',
    websiteUrl: `https://${username}.example`,
    role,
    subscriptionTier: 'none',
    isVerified: role !== 'user',
    isPrivate: false,
    followersCount: 1200 + id.length * 137,
    followingCount: 128 + id.length * 11,
    pinsCount: 0,
    credibilityScore: role === 'creator' ? 8.7 : 6.8,
    createdAt: daysAgo(140),
    updatedAt: daysAgo(1),
    ...overrides,
  }
}

function makePin(
  id: string,
  creator: User,
  title: string,
  tags: string[],
  index: number,
  overrides: Partial<Pin> = {},
): Pin {
  const width = index % 3 === 0 ? 900 : 1080
  const height = index % 4 === 0 ? 1350 : index % 4 === 1 ? 1440 : 1200
  const mediaUrl = svgData(title, tags, ['#1DB954', '#37a2ff', '#f59e0b', '#f472b6', '#a78bfa'][index % 5])

  return {
    id,
    title,
    description: `A polished frontend-only mock pin exploring ${tags.slice(0, 3).join(', ')}. All data is generated and stored locally in your browser.`,
    tags,
    mediaUrl,
    mediaType: 'image',
    thumbnailUrl: mediaUrl,
    originalWidth: width,
    originalHeight: height,
    aspectRatio: width / height,
    creator,
    status: 'published',
    contentType: index % 5 === 0 ? 'ai_generated' : 'human',
    isSensitive: index % 13 === 0,
    downloadPermission: index % 6 === 0 ? 'subscribers_only' : 'free',
    isForSale: index % 4 === 0,
    originalPrice: index % 4 === 0 ? 40_000 + index * 500 : undefined,
    salePrice: index % 4 === 0 ? 12_000 + index * 300 : undefined,
    currency: '₦',
    isProtected: index % 3 === 0,
    hasVisibleWatermark: index % 3 === 0,
    hasInvisibleWatermark: true,
    screenshotProtection: index % 7 === 0,
    likesCount: 260 + index * 31,
    savesCount: 80 + index * 17,
    sharesCount: 24 + index * 5,
    repostsCount: 11 + index * 3,
    downloadsCount: 18 + index * 4,
    viewsCount: 3400 + index * 790,
    isLiked: false,
    isSaved: false,
    isReposted: false,
    licenseType: 'Creator Commons Mock License',
    createdAt: daysAgo(index + 1),
    updatedAt: daysAgo(Math.max(1, index - 1)),
    ...overrides,
  }
}

function seedState(): LocalState {
  const users = [
    user('u_admin', 'nova', 'Nova Admin', 'superadmin', '#1DB954', { subscriptionTier: 'pro' }),
    user('u_mira', 'miralens', 'Mira Lens', 'creator', '#37a2ff', { bio: 'Editorial photographer creating color-forward visual systems.' }),
    user('u_kai', 'kaiworks', 'Kai Works', 'creator', '#f59e0b', { bio: '3D, motion, and product storytelling experiments.' }),
    user('u_ama', 'amastudio', 'Ama Studio', 'creator', '#f472b6', { bio: 'Brand worlds, typography, and social launch kits.' }),
    user('u_guest', 'guest', 'Guest Explorer', 'user', '#a78bfa'),
  ]

  const tagSets = [
    ['editorial', 'portrait', 'green'],
    ['product', 'studio', 'minimal'],
    ['motion', 'abstract', 'ai'],
    ['fashion', 'campaign', 'color'],
    ['typography', 'branding', 'layout'],
    ['architecture', 'light', 'interior'],
    ['travel', 'film', 'street'],
    ['food', 'still-life', 'warm'],
    ['nature', 'macro', 'botanical'],
    ['music', 'poster', 'night'],
    ['wellness', 'soft', 'pastel'],
    ['technology', 'interface', 'neon'],
  ]

  const pins = Array.from({ length: 36 }, (_, i) => {
    const creator = users[1 + (i % 3)]
    return makePin(`pin_${i + 1}`, creator, `${['Emerald', 'Kinetic', 'Signal', 'Velvet', 'Solar', 'Nocturne'][i % 6]} Study ${i + 1}`, tagSets[i % tagSets.length], i)
  })
  users.forEach((u) => { u.pinsCount = pins.filter((pin) => pin.creator.id === u.id).length })

  const collections = [
    { id: 'col_editorial', name: 'Editorial sparks', description: 'Portraits and campaign references.', owner: users[1], pinIds: pins.slice(0, 9).map((p) => p.id), isPrivate: false, createdAt: daysAgo(18) },
    { id: 'col_products', name: 'Launch visuals', description: 'Product, interface, and paid creative ideas.', owner: users[2], pinIds: pins.slice(9, 18).map((p) => p.id), isPrivate: false, createdAt: daysAgo(12) },
    { id: 'col_branding', name: 'Brand systems', description: 'Type, color, and composition references.', owner: users[3], pinIds: pins.slice(18, 27).map((p) => p.id), isPrivate: false, createdAt: daysAgo(8) },
  ].map((collection) => ({
    ...collection,
    coverImageUrl: pins.find((pin) => pin.id === collection.pinIds[0])?.mediaUrl,
    pinsCount: collection.pinIds.length,
  })) as Array<Collection & { pinIds: string[] }>

  const comments: Comment[] = pins.slice(0, 8).map((pin, i) => ({
    id: `comment_${i + 1}`,
    content: 'This mock interaction is persisted locally and never leaves the browser.',
    author: users[(i % users.length)],
    pinId: pin.id,
    likesCount: i + 2,
    isLiked: false,
    createdAt: daysAgo(i + 1),
  }))

  const notifications: Notification[] = [
    { id: 'n1', type: 'welcome', title: 'Frontend-only mode enabled', message: 'Virens now runs entirely in your browser with local mock data.', isRead: false, targetType: 'system', createdAt: daysAgo(0.1) },
    { id: 'n2', type: 'save', title: 'Your collection is active', message: 'Saved pins and uploads are simulated with client-side state.', isRead: false, actor: users[1], actorAvatar: users[1].avatar, actorUsername: users[1].username, targetType: 'pin', targetId: pins[0].id, createdAt: daysAgo(1) },
  ]

  const reports: Report[] = [
    { id: 'report_1', reporter: users[1], targetType: 'pin', targetId: pins[4].id, reason: 'copyright', description: 'Possible duplicate asset in the mock moderation queue.', status: 'pending', priority: 9, createdAt: daysAgo(2) },
    { id: 'report_2', reporter: users[2], targetType: 'comment', targetId: 'comment_2', reason: 'spam', description: 'Looks promotional and repetitive.', status: 'reviewing', priority: 4, createdAt: daysAgo(5) },
  ]

  const ads: Ad[] = [
    { id: 'ad_1', advertiser: users[1], targetType: 'pin', targetId: pins[0].id, headline: 'Explore Mira Lens presets', description: 'A simulated promoted card powered by local data.', imageUrl: pins[0].mediaUrl, ctaText: 'View Pin', ctaUrl: `/pin/${pins[0].id}`, status: 'active', budget: 25000, spent: 7300, reach: 18200, clicks: 860, impressions: 24100, startDate: daysAgo(6), endDate: daysAgo(-8), createdAt: daysAgo(6) },
  ]

  return {
    users,
    pins,
    collections,
    comments,
    notifications,
    reports,
    ads,
    follows: { u_guest: ['u_mira', 'u_kai'], u_admin: ['u_mira', 'u_kai', 'u_ama'] },
    payments: {},
    currentUserId: 'u_guest',
  }
}

function loadState(): LocalState {
  try {
    const saved = window.localStorage.getItem(STORE_KEY)
    if (saved) return JSON.parse(saved) as LocalState
  } catch {
    // Ignore malformed localStorage and reseed below.
  }
  const seeded = seedState()
  saveState(seeded)
  return seeded
}

function saveState(state: LocalState) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(state))
}

let state = loadState()

function currentUser() {
  return state.users.find((u) => u.id === state.currentUserId) ?? null
}

function page<T>(items: T[], params: Params = {}): PaginatedResponse<T> {
  const pageNum = Number(params.page ?? 1)
  const pageSize = Number(params.page_size ?? params.pageSize ?? 24)
  const start = (pageNum - 1) * pageSize
  return {
    items: clone(items.slice(start, start + pageSize)),
    total: items.length,
    page: pageNum,
    pageSize,
    hasNext: start + pageSize < items.length,
    hasPrev: pageNum > 1,
  }
}

function withCreatorFlags(pin: Pin): Pin {
  const latestCreator = state.users.find((u) => u.id === pin.creator.id) ?? pin.creator
  return { ...pin, creator: latestCreator }
}

function filteredPins(params: Params = {}) {
  const tag = String(params.tag ?? '')
  const mode = String(params.mode ?? 'trending')
  const showSensitive = params.show_sensitive !== false
  const showAi = params.show_ai !== false
  let pins = state.pins.map(withCreatorFlags).filter((pin) => pin.status === 'published')
  if (tag) pins = pins.filter((pin) => pin.tags.includes(tag))
  if (!showSensitive) pins = pins.filter((pin) => !pin.isSensitive)
  if (!showAi) pins = pins.filter((pin) => pin.contentType !== 'ai_generated')
  if (mode === 'latest') pins.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  else pins.sort((a, b) => (b.viewsCount + b.likesCount * 12 + b.savesCount * 8) - (a.viewsCount + a.likesCount * 12 + a.savesCount * 8))
  return pins
}

function findPin(id: string) {
  const pin = state.pins.find((item) => item.id === id)
  if (!pin) throw new Error('Pin not found')
  return pin
}

function ensureUser() {
  const user = currentUser()
  if (!user) throw new Error('Sign in required')
  return user
}

function createSession(user: User) {
  state.currentUserId = user.id
  saveState(state)
  const token = `local_${user.id}_${Date.now()}`
  window.localStorage.setItem(TOKEN_KEY, token)
  return { access_token: token, user: clone(user) }
}

function updateUserCounts() {
  state.users = state.users.map((u) => ({
    ...u,
    pinsCount: state.pins.filter((pin) => pin.creator.id === u.id).length,
    followingCount: state.follows[u.id]?.length ?? 0,
    followersCount: Object.values(state.follows).filter((ids) => ids.includes(u.id)).length + u.followersCount,
  }))
}

async function route<T>(method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', url: string, body?: unknown, params: Params = {}): Promise<T> {
  await delay()
  const [pathOnly] = url.split('?')
  const path = pathOnly.replace(/^\/api\/v1/, '').replace(/^\/v1/, '')

  if (method === 'POST' && path === '/auth/login') {
    const payload = body as { email: string }
    const user = state.users.find((u) => u.email === payload.email || u.username === payload.email.split('@')[0]) ?? state.users[4]
    return createSession(user) as T
  }

  if (method === 'POST' && path === '/auth/register') {
    const payload = body as { username: string; email: string; displayName: string }
    const newUser = user(uid('u'), payload.username, payload.displayName || payload.username, 'creator', '#1DB954', { email: payload.email })
    state.users.push(newUser)
    saveState(state)
    return createSession(newUser) as T
  }

  if (method === 'POST' && path === '/auth/refresh') {
    const user = currentUser()
    if (!user) throw new Error('No local session')
    return createSession(user) as T
  }

  if (method === 'POST' && path === '/auth/logout') {
    state.currentUserId = null
    saveState(state)
    window.localStorage.removeItem(TOKEN_KEY)
    return { ok: true } as T
  }

  if (method === 'GET' && path === '/auth/me') return clone(ensureUser()) as T
  if (method === 'GET' && path === '/feed') return page(filteredPins(params), params) as T
  if (method === 'GET' && path === '/pins/explore') return page(filteredPins({ ...params, mode: 'trending' }), params) as T
  if (method === 'GET' && path === '/tags/trending') {
    const counts = new Map<string, number>()
    state.pins.forEach((pin) => pin.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)))
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16).map(([tag]) => tag) as T
  }

  if (method === 'GET' && path === '/search') {
    const q = String(params.q ?? '').toLowerCase()
    const pins = filteredPins(params).filter((pin) => [pin.title, pin.description, pin.creator.username, ...pin.tags].join(' ').toLowerCase().includes(q))
    return page(pins, params) as T
  }

  const pinMatch = path.match(/^\/pins\/([^/]+)$/)
  if (method === 'GET' && pinMatch) return clone(withCreatorFlags(findPin(pinMatch[1]))) as T

  const relatedMatch = path.match(/^\/pins\/([^/]+)\/related$/)
  if (method === 'GET' && relatedMatch) {
    const pin = findPin(relatedMatch[1])
    return filteredPins().filter((candidate) => candidate.id !== pin.id && candidate.tags.some((tag) => pin.tags.includes(tag))).slice(0, 8) as T
  }

  const actionMatch = path.match(/^\/pins\/([^/]+)\/(like|save|repost|share)$/)
  if (method === 'POST' && actionMatch) {
    ensureUser()
    const pin = findPin(actionMatch[1])
    const flag = actionMatch[2] === 'like' ? 'isLiked' : actionMatch[2] === 'save' ? 'isSaved' : 'isReposted'
    const count = actionMatch[2] === 'like' ? 'likesCount' : actionMatch[2] === 'save' ? 'savesCount' : actionMatch[2] === 'share' ? 'sharesCount' : 'repostsCount'
    if (actionMatch[2] !== 'share') {
      const active = Boolean(pin[flag as keyof Pin])
      ;(pin as any)[flag] = !active
      ;(pin as any)[count] = Math.max(0, Number((pin as any)[count]) + (active ? -1 : 1))
    } else {
      pin.sharesCount += 1
    }
    saveState(state)
    return { ok: true, shareUrl: `/pin/${pin.id}` } as T
  }

  const downloadMatch = path.match(/^\/pins\/([^/]+)\/download\/file$/)
  if (method === 'GET' && downloadMatch) {
    const pin = findPin(downloadMatch[1])
    pin.downloadsCount += 1
    saveState(state)
    return new Blob([`${pin.title}\n\nThis is a simulated Virens frontend-only download.`], { type: 'text/plain' }) as T
  }

  if (method === 'POST' && path === '/pins/upload') {
    const form = body as FormData
    const active = ensureUser()
    const title = String(form.get('title') || 'Untitled upload')
    const tags = JSON.parse(String(form.get('tags') || '[]')) as string[]
    const mediaUrl = form.get('file') instanceof File ? URL.createObjectURL(form.get('file') as File) : svgData(title, tags)
    const pin = makePin(uid('pin'), active, title, tags.length ? tags : ['upload', 'local'], state.pins.length + 1, {
      description: String(form.get('description') || ''),
      mediaUrl,
      thumbnailUrl: mediaUrl,
      downloadPermission: String(form.get('download_permission') || 'free') as DownloadPermission,
      isForSale: String(form.get('is_for_sale')) === 'true',
      originalPrice: Number(form.get('original_price')) || undefined,
      salePrice: Number(form.get('sale_price')) || undefined,
      isProtected: String(form.get('is_protected')) === 'true',
      hasVisibleWatermark: String(form.get('has_visible_watermark')) === 'true',
      hasInvisibleWatermark: String(form.get('has_invisible_watermark')) === 'true',
      screenshotProtection: String(form.get('screenshot_protection')) === 'true',
      isSensitive: String(form.get('is_sensitive')) === 'true',
      contentType: String(form.get('content_type') || 'human') as ContentType,
      likesCount: 0,
      savesCount: 0,
      viewsCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    state.pins.unshift(pin)
    updateUserCounts()
    saveState(state)
    return { pin_id: pin.id } as T
  }

  const userMatch = path.match(/^\/users\/([^/]+)$/)
  if (method === 'GET' && userMatch) {
    const found = state.users.find((u) => u.username === userMatch[1] || u.id === userMatch[1])
    if (!found) throw new Error('User not found')
    return clone(found) as T
  }

  const userPinsMatch = path.match(/^\/users\/([^/]+)\/pins$/)
  if (method === 'GET' && userPinsMatch) {
    const found = state.users.find((u) => u.username === userPinsMatch[1])
    const tab = String(params.tab ?? 'pins')
    let pins = state.pins.map(withCreatorFlags)
    if (tab === 'liked') pins = pins.filter((pin) => pin.isLiked)
    else if (tab === 'reposts') pins = pins.filter((pin) => pin.isReposted)
    else pins = pins.filter((pin) => pin.creator.id === found?.id)
    return page(pins, params) as T
  }

  const collectionsMatch = path.match(/^\/users\/([^/]+)\/collections$/)
  if (method === 'GET' && collectionsMatch) {
    const found = state.users.find((u) => u.username === collectionsMatch[1])
    return clone(state.collections.filter((c) => c.owner.id === found?.id)) as T
  }

  const followMatch = path.match(/^\/users\/([^/]+)\/follow$/)
  if (method === 'POST' && followMatch) {
    const active = ensureUser()
    const target = state.users.find((u) => u.username === followMatch[1])
    if (!target) throw new Error('User not found')
    const ids = new Set(state.follows[active.id] ?? [])
    ids.has(target.id) ? ids.delete(target.id) : ids.add(target.id)
    state.follows[active.id] = [...ids]
    saveState(state)
    return { following: ids.has(target.id) } as T
  }

  if (method === 'PATCH' && path === '/users/me') {
    const active = ensureUser()
    const payload = body as Partial<User>
    state.users = state.users.map((u) => u.id === active.id ? { ...u, ...payload, updatedAt: new Date().toISOString() } : u)
    saveState(state)
    return clone(currentUser()) as T
  }

  if (method === 'POST' && path === '/users/me/avatar') {
    const active = ensureUser()
    const form = body as FormData
    const file = form.get('file')
    const url = file instanceof File ? URL.createObjectURL(file) : active.avatar
    state.users = state.users.map((u) => u.id === active.id ? { ...u, avatar: url, updatedAt: new Date().toISOString() } : u)
    saveState(state)
    return clone(currentUser()) as T
  }

  if (method === 'POST' && path === '/collections') {
    const active = ensureUser()
    const payload = body as { name: string; description?: string; isPrivate?: boolean }
    const collection: Collection & { pinIds: string[] } = { id: uid('col'), name: payload.name, description: payload.description, owner: active, pinsCount: 0, isPrivate: Boolean(payload.isPrivate), createdAt: new Date().toISOString(), pinIds: [] }
    state.collections.unshift(collection)
    saveState(state)
    return clone(collection) as T
  }

  const collectionMatch = path.match(/^\/collections\/([^/]+)$/)
  if (method === 'GET' && collectionMatch) {
    const collection = state.collections.find((c) => c.id === collectionMatch[1])
    if (!collection) throw new Error('Collection not found')
    return clone(collection) as T
  }

  const collectionPinsMatch = path.match(/^\/collections\/([^/]+)\/pins(?:\/([^/]+))?$/)
  if (collectionPinsMatch) {
    const collection = state.collections.find((c) => c.id === collectionPinsMatch[1])
    if (!collection) throw new Error('Collection not found')
    if (method === 'GET') return page(state.pins.filter((pin) => collection.pinIds.includes(pin.id)).map(withCreatorFlags), params) as T
    if (method === 'POST' && collectionPinsMatch[2]) {
      if (!collection.pinIds.includes(collectionPinsMatch[2])) collection.pinIds.unshift(collectionPinsMatch[2])
      collection.pinsCount = collection.pinIds.length
      collection.coverImageUrl = state.pins.find((pin) => pin.id === collection.pinIds[0])?.mediaUrl
      saveState(state)
      return { ok: true } as T
    }
  }

  const commentsMatch = path.match(/^\/comments\/pin\/([^/]+)$/)
  if (commentsMatch) {
    if (method === 'GET') return page(state.comments.filter((c) => c.pinId === commentsMatch[1] && !c.parentId).map((comment) => ({ ...comment, replies: state.comments.filter((reply) => reply.parentId === comment.id) })), params) as T
    if (method === 'POST') {
      const active = ensureUser()
      const payload = body as { content: string; parent_id?: string }
      const comment: Comment = { id: uid('comment'), content: payload.content, author: active, pinId: commentsMatch[1], parentId: payload.parent_id, likesCount: 0, isLiked: false, createdAt: new Date().toISOString() }
      state.comments.unshift(comment)
      saveState(state)
      return clone(comment) as T
    }
  }

  const commentLikeMatch = path.match(/^\/comments\/([^/]+)\/like$/)
  if (method === 'POST' && commentLikeMatch) {
    const comment = state.comments.find((c) => c.id === commentLikeMatch[1])
    if (!comment) throw new Error('Comment not found')
    comment.isLiked = !comment.isLiked
    comment.likesCount += comment.isLiked ? 1 : -1
    saveState(state)
    return { ok: true } as T
  }

  if (method === 'GET' && path === '/notifications') {
    const unread = state.notifications.filter((n) => !n.isRead).length
    return { ...page(state.notifications, params), unread } as T
  }
  if (method === 'POST' && path === '/notifications/read-all') {
    state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }))
    saveState(state)
    return { ok: true } as T
  }

  if (method === 'POST' && path === '/reports') {
    const active = ensureUser()
    const payload = body as { target_type: Report['targetType']; target_id: string; reason: ReportReason; description?: string }
    state.reports.unshift({ id: uid('report'), reporter: active, targetType: payload.target_type, targetId: payload.target_id, reason: payload.reason, description: payload.description, status: 'pending', priority: payload.reason === 'copyright' ? 9 : 5, createdAt: new Date().toISOString() })
    saveState(state)
    return { ok: true } as T
  }

  if (method === 'GET' && path === '/ads/my') return clone(state.ads.filter((ad) => ad.advertiser.id === currentUser()?.id || currentUser()?.role === 'superadmin')) as T
  if (method === 'POST' && path === '/ads') {
    const active = ensureUser()
    const payload = body as DraftAd
    const ad: Ad = { id: uid('ad'), advertiser: active, targetType: payload.targetType ?? 'pin', targetId: payload.targetId ?? payload.target_id ?? '', headline: payload.headline ?? 'Untitled campaign', description: payload.description, imageUrl: state.pins[0]?.mediaUrl, ctaText: payload.ctaText ?? payload.cta_text ?? 'Learn More', ctaUrl: payload.ctaUrl ?? payload.cta_url ?? '/', status: 'pending_review', budget: payload.budget ?? 200, spent: 0, reach: 0, clicks: 0, impressions: 0, startDate: new Date().toISOString(), endDate: daysAgo(-14), createdAt: new Date().toISOString() }
    state.ads.unshift(ad)
    saveState(state)
    return clone(ad) as T
  }

  if (method === 'POST' && path === '/payments/initiate') {
    const payload = body as { type: string; amount?: number; tier?: SubscriptionTier }
    const amount = payload.amount ?? (payload.tier === 'pro' ? 4500 : payload.tier === 'creator_support' ? 9000 : 700)
    const reference = uid('localpay')
    state.payments[reference] = { type: payload.type, amount, status: 'success' }
    if (payload.type === 'subscription') {
      const active = currentUser()
      if (active) state.users = state.users.map((u) => u.id === active.id ? { ...u, subscriptionTier: (payload.tier ?? 'basic') as SubscriptionTier } : u)
    }
    saveState(state)
    const url = `/payment/callback?reference=${reference}&status=success&type=${encodeURIComponent(payload.type)}`
    return { authorization_url: url, url } as T
  }

  const verifyMatch = path.match(/^\/payments\/verify\/([^/]+)$/)
  if (method === 'GET' && verifyMatch) {
    const payment = state.payments[verifyMatch[1]]
    if (!payment) throw new Error('Payment not found')
    return clone(payment) as T
  }

  if (method === 'POST' && path === '/payments/bank-details') {
    const active = ensureUser()
    const payload = body as { bankCode: string; accountNumber: string; accountName: string }
    state.users = state.users.map((u) => u.id === active.id ? { ...u, payoutBankCode: payload.bankCode, payoutAccountNumber: payload.accountNumber, payoutAccountName: payload.accountName } : u)
    saveState(state)
    return { ok: true } as T
  }

  if (method === 'GET' && path === '/admin/stats') {
    const totalRevenue = state.ads.reduce((sum, ad) => sum + ad.spent, 0) + Object.values(state.payments).reduce((sum, p) => sum + p.amount, 0)
    return {
      totalUsers: state.users.length,
      totalPins: state.pins.length,
      pendingReports: state.reports.filter((r) => r.status === 'pending').length,
      totalRevenue,
      activeAds: state.ads.filter((ad) => ad.status === 'active').length,
      removedContent: state.pins.filter((pin) => pin.status === 'removed').length,
      appealSuccessRate: 82,
      revenueChart: Array.from({ length: 7 }, (_, index) => ({
        date: `May ${24 + index}`,
        revenue: Math.round((totalRevenue / 7) * (0.7 + index * 0.11)) + 1200 * index,
        subscriptions: 700 * (index + 2),
      })),
    } as T
  }
  if (method === 'GET' && path === '/admin/reports') {
    const status = String(params.status ?? '')
    return { items: clone(state.reports.filter((r) => !status || r.status === status)) } as T
  }
  const adminReportMatch = path.match(/^\/admin\/reports\/([^/]+)\/(resolve|dismiss|remove_content)$/)
  if (method === 'POST' && adminReportMatch) {
    state.reports = state.reports.map((r) => r.id === adminReportMatch[1] ? { ...r, status: adminReportMatch[2] === 'dismiss' ? 'dismissed' : 'resolved', resolvedAt: new Date().toISOString(), resolvedBy: currentUser() ?? undefined } : r)
    saveState(state)
    return { ok: true } as T
  }
  if (method === 'GET' && path === '/admin/users') {
    const search = String(params.search ?? '').toLowerCase()
    const role = String(params.role ?? '')
    const users = state.users.filter((u) => (!search || `${u.username} ${u.displayName} ${u.email}`.toLowerCase().includes(search)) && (!role || u.role === role))
    return { items: clone(users), total: users.length } as T
  }
  const adminUserMatch = path.match(/^\/admin\/users\/([^/]+)\/(ban|unban|verify)$/)
  if (method === 'POST' && adminUserMatch) {
    state.users = state.users.map((u) => u.id === adminUserMatch[1] ? { ...u, isVerified: adminUserMatch[2] === 'verify' ? true : u.isVerified, isPrivate: adminUserMatch[2] === 'ban' ? true : adminUserMatch[2] === 'unban' ? false : u.isPrivate } : u)
    saveState(state)
    return { ok: true } as T
  }

  throw new Error(`Unhandled mock API route: ${method} ${path}`)
}

export const api = {
  defaults: { headers: { common: {} as Record<string, string> } },
  get: <T = any>(url: string, config?: { params?: Params; responseType?: string }) => route<T>('GET', url, undefined, config?.params).then((data) => ({ data }) as HttpResponse<T>),
  post: <T = any>(url: string, data?: unknown) => route<T>('POST', url, data).then((response) => ({ data: response }) as HttpResponse<T>),
  put: <T = any>(url: string, data?: unknown) => route<T>('PUT', url, data).then((response) => ({ data: response }) as HttpResponse<T>),
  patch: <T = any>(url: string, data?: unknown) => route<T>('PATCH', url, data).then((response) => ({ data: response }) as HttpResponse<T>),
  delete: <T = any>(url: string) => route<T>('DELETE', url).then((response) => ({ data: response }) as HttpResponse<T>),
}

export const apiGet = <T>(url: string, params?: Params) => route<T>('GET', url, undefined, params)
export const apiPost = <T>(url: string, data?: unknown) => route<T>('POST', url, data)
export const apiPut = <T>(url: string, data?: unknown) => route<T>('PUT', url, data)
export const apiPatch = <T>(url: string, data?: unknown) => route<T>('PATCH', url, data)
export const apiDelete = <T>(url: string) => route<T>('DELETE', url)
export const apiUpload = async <T>(url: string, formData: FormData, onProgress?: (pct: number) => void) => {
  for (const pct of [18, 42, 68, 88, 100]) {
    onProgress?.(pct)
    await delay()
  }
  return route<T>('POST', url, formData)
}
