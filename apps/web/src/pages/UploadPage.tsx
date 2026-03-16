import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import {
  Upload, X, Tag, Lock, DollarSign, Eye, EyeOff,
  Shield, Bot, ImageIcon, Video, FileImage, Info
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiUpload } from '@/lib/api'
import { useNavigate } from 'react-router-dom'

type DownloadPermission = 'free' | 'subscribers_only' | 'paid' | 'none'
type ContentType = 'human' | 'ai_generated'

interface UploadForm {
  title: string
  description: string
  tags: string[]
  tagInput: string
  downloadPermission: DownloadPermission
  isForSale: boolean
  originalPrice: string
  salePrice: string
  isProtected: boolean
  hasVisibleWatermark: boolean
  hasInvisibleWatermark: boolean
  screenshotProtection: boolean
  isSensitive: boolean
  contentType: ContentType
}

const ACCEPTED = {
  'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.avif'],
  'video/*': ['.mp4', '.webm', '.mov'],
  'image/gif': ['.gif'],
}

export default function UploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const [form, setForm] = useState<UploadForm>({
    title: '',
    description: '',
    tags: [],
    tagInput: '',
    downloadPermission: 'free',
    isForSale: false,
    originalPrice: '',
    salePrice: '',
    isProtected: false,
    hasVisibleWatermark: false,
    hasInvisibleWatermark: true,
    screenshotProtection: false,
    isSensitive: false,
    contentType: 'human',
  })

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  })

  const set = (key: keyof UploadForm, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }))

  const addTag = () => {
    const tag = form.tagInput.trim().toLowerCase().replace(/^#/, '')
    if (tag && !form.tags.includes(tag) && form.tags.length < 20) {
      set('tags', [...form.tags, tag])
      set('tagInput', '')
    }
  }

  const removeTag = (tag: string) =>
    set('tags', form.tags.filter((t) => t !== tag))

  const handleSubmit = async () => {
    if (!file || !form.title.trim()) {
      toast.error('Add a file and title')
      return
    }
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('tags', JSON.stringify(form.tags))
      fd.append('download_permission', form.downloadPermission)
      fd.append('is_for_sale', String(form.isForSale))
      fd.append('original_price', form.originalPrice)
      fd.append('sale_price', form.salePrice)
      fd.append('is_protected', String(form.isProtected))
      fd.append('has_visible_watermark', String(form.hasVisibleWatermark))
      fd.append('has_invisible_watermark', String(form.hasInvisibleWatermark))
      fd.append('screenshot_protection', String(form.screenshotProtection))
      fd.append('is_sensitive', String(form.isSensitive))
      fd.append('content_type', form.contentType)

      const res = await apiUpload<{ pin_id: string }>('/pins/upload', fd, setUploadProgress)
      toast.success('Pin uploaded!')
      navigate(`/pin/${res.pin_id}`)
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const savings =
    form.originalPrice && form.salePrice
      ? Math.round(
          ((Number(form.originalPrice) - Number(form.salePrice)) / Number(form.originalPrice)) * 100
        )
      : 0

  return (
    <>
      <Helmet>
        <title>Upload — Virens</title>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8 pb-24 lg:pb-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl text-virens-white">Upload a Pin</h1>
          <p className="text-virens-white-muted text-sm mt-1">
            Share your work with the world. You control the permissions.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
          {/* Left: dropzone + preview */}
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
              {!preview ? (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  {...getRootProps()}
                  className={`
                    min-h-80 flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed cursor-pointer transition-all
                    ${isDragActive
                      ? 'border-virens-green bg-virens-green/8'
                      : 'border-white/12 hover:border-white/25 bg-virens-black-card'
                    }
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Upload size={28} className={isDragActive ? 'text-virens-green' : 'text-virens-white-muted'} />
                  </div>
                  <div className="text-center">
                    <p className="font-display font-semibold text-virens-white">
                      {isDragActive ? 'Drop it here' : 'Drop your file here'}
                    </p>
                    <p className="text-xs text-virens-white-muted mt-1">
                      Images, Videos, GIFs up to 100MB
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-virens-white-muted">
                    <ImageIcon size={18} /><Video size={18} /><FileImage size={18} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative rounded-3xl overflow-hidden bg-virens-black-card"
                >
                  <img src={preview} alt="Preview" className="w-full object-contain max-h-96" />
                  <button
                    onClick={() => { setFile(null); setPreview(null) }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <X size={16} />
                  </button>
                  <div className="absolute bottom-3 left-3 badge-gray text-[11px]">
                    {file?.name}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload progress */}
            {isUploading && (
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-virens-white-muted">Uploading...</span>
                  <span className="text-sm font-medium text-virens-green">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-virens-green rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: form */}
          <div className="flex flex-col gap-4">
            {/* Basic info */}
            <div className="glass-card p-4 flex flex-col gap-4">
              <h3 className="font-display font-semibold text-virens-white text-sm">Details</h3>

              <div>
                <label className="block text-xs text-virens-white-muted mb-1.5">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Give your pin a title"
                  className="input-field text-sm"
                  maxLength={120}
                />
              </div>

              <div>
                <label className="block text-xs text-virens-white-muted mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Describe your work..."
                  rows={3}
                  className="input-field text-sm resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs text-virens-white-muted mb-1.5">Tags</label>
                <div className="flex gap-2">
                  <input
                    value={form.tagInput}
                    onChange={(e) => set('tagInput', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    className="input-field text-sm flex-1"
                  />
                  <button onClick={addTag} className="btn-secondary text-sm px-4">Add</button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.map((tag) => (
                      <span key={tag} className="badge-green text-xs flex items-center gap-1">
                        #{tag}
                        <button onClick={() => removeTag(tag)}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Content type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={15} className="text-virens-white-muted" />
                  <span className="text-sm text-virens-white-muted">AI Generated</span>
                </div>
                <ToggleSwitch
                  checked={form.contentType === 'ai_generated'}
                  onChange={(v) => set('contentType', v ? 'ai_generated' : 'human')}
                />
              </div>

              {/* Sensitive */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={15} className="text-virens-white-muted" />
                  <span className="text-sm text-virens-white-muted">Sensitive Content</span>
                </div>
                <ToggleSwitch
                  checked={form.isSensitive}
                  onChange={(v) => set('isSensitive', v)}
                />
              </div>
            </div>

            {/* Download permissions */}
            <div className="glass-card p-4 flex flex-col gap-3">
              <h3 className="font-display font-semibold text-virens-white text-sm flex items-center gap-2">
                <Lock size={14} className="text-virens-green" />
                Download Permissions
              </h3>

              {(['free', 'subscribers_only', 'paid', 'none'] as DownloadPermission[]).map((perm) => {
                const labels: Record<DownloadPermission, string> = {
                  free: 'Free for everyone',
                  subscribers_only: 'Subscribers only',
                  paid: 'Paid download',
                  none: 'No downloads',
                }
                return (
                  <label key={perm} className={`
                    flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                    ${form.downloadPermission === perm
                      ? 'border-virens-green/40 bg-virens-green/8'
                      : 'border-white/8 hover:border-white/15'
                    }
                  `}>
                    <input
                      type="radio"
                      name="download"
                      value={perm}
                      checked={form.downloadPermission === perm}
                      onChange={() => set('downloadPermission', perm)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                      ${form.downloadPermission === perm ? 'border-virens-green' : 'border-white/25'}`}>
                      {form.downloadPermission === perm && (
                        <div className="w-2 h-2 rounded-full bg-virens-green" />
                      )}
                    </div>
                    <span className="text-sm text-virens-white">{labels[perm]}</span>
                  </label>
                )
              })}
            </div>

            {/* Pricing */}
            <div className="glass-card p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-virens-white text-sm flex items-center gap-2">
                  <DollarSign size={14} className="text-virens-green" />
                  Sell This Asset
                </h3>
                <ToggleSwitch checked={form.isForSale} onChange={(v) => set('isForSale', v)} />
              </div>

              {form.isForSale && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex flex-col gap-3"
                >
                  <div>
                    <label className="block text-xs text-virens-white-muted mb-1.5">Original Price (₦)</label>
                    <input
                      type="number"
                      value={form.originalPrice}
                      onChange={(e) => set('originalPrice', e.target.value)}
                      placeholder="e.g. 40000"
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-virens-white-muted mb-1.5">Sale Price (₦) — optional</label>
                    <input
                      type="number"
                      value={form.salePrice}
                      onChange={(e) => set('salePrice', e.target.value)}
                      placeholder="e.g. 12000"
                      className="input-field text-sm"
                    />
                  </div>

                  {/* Price preview */}
                  {form.originalPrice && (
                    <div className="p-3 glass rounded-xl flex items-center gap-3">
                      {form.salePrice && savings > 0 ? (
                        <>
                          <span className="price-original">₦{Number(form.originalPrice).toLocaleString()}</span>
                          <span className="price-sale">₦{Number(form.salePrice).toLocaleString()}</span>
                          <span className="badge-green text-xs ml-auto">Save {savings}%</span>
                        </>
                      ) : (
                        <span className="price-sale">₦{Number(form.originalPrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Protection */}
            <div className="glass-card p-4 flex flex-col gap-3">
              <h3 className="font-display font-semibold text-virens-white text-sm flex items-center gap-2">
                <Shield size={14} className="text-virens-green" />
                Content Protection
              </h3>

              {[
                { key: 'isProtected', label: 'Protected View Mode', desc: 'Disable right-click and drag' },
                { key: 'hasVisibleWatermark', label: 'Visible Watermark', desc: 'Show your username on the image' },
                { key: 'hasInvisibleWatermark', label: 'Invisible Watermark', desc: 'Embed your ID in pixel data' },
                { key: 'screenshotProtection', label: 'Screenshot Deterrence', desc: 'Add CSS overlay layer' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-virens-white">{label}</p>
                    <p className="text-xs text-virens-white-muted mt-0.5">{desc}</p>
                  </div>
                  <ToggleSwitch
                    checked={form[key as keyof UploadForm] as boolean}
                    onChange={(v) => set(key as keyof UploadForm, v)}
                  />
                </div>
              ))}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isUploading || !file}
              className="btn-primary w-full text-base py-3 flex items-center justify-center gap-2"
            >
              <Upload size={18} />
              {isUploading ? `Uploading ${uploadProgress}%...` : 'Publish Pin'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 flex-shrink-0 ${checked ? 'bg-virens-green' : 'bg-virens-gray-light'}`}
      style={{ height: '22px' }}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`}
        style={{ width: '18px', height: '18px' }}
      />
    </button>
  )
}
