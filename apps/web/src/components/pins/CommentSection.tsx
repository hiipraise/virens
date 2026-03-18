import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Heart } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import type { Comment, PaginatedResponse } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime } from '@/utils/format'
import toast from 'react-hot-toast'

interface CommentSectionProps {
  pinId: string
}

export default function CommentSection({ pinId }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuthStore()
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['comments', pinId],
    queryFn: () => apiGet<PaginatedResponse<Comment>>(`/comments/pin/${pinId}`),
  })

  const submitMutation = useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
      apiPost(`/comments/pin/${pinId}`, { content, parent_id: parentId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', pinId] })
      qc.invalidateQueries({ queryKey: ['pin', pinId] })
      setText('')
      setReplyText('')
      setReplyingTo(null)
    },
    onError: () => toast.error('Could not post comment'),
  })

  const likeMutation = useMutation({
    mutationFn: (commentId: string) => apiPost(`/comments/${commentId}/like`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', pinId] }),
    onError: () => toast.error('Could not update comment like'),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    await submitMutation.mutateAsync({ content: text })
  }

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return
    await submitMutation.mutateAsync({ content: replyText, parentId: commentId })
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <motion.div
      key={comment.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isReply ? 'ml-10 mt-3' : ''}`}
    >
      <Avatar
        src={comment.author.avatar}
        alt={comment.author.username}
        size="sm"
        isVerified={comment.author.isVerified}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-virens-white">@{comment.author.username}</span>
          <span className="text-[10px] text-virens-white-muted">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <div className="glass rounded-xl px-3 py-2">
          <p className="text-sm text-virens-white leading-relaxed whitespace-pre-wrap">
            {comment.isDeleted ? (
              <em className="text-virens-white-muted">[deleted]</em>
            ) : (
              comment.content
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1.5 px-1">
          <button
            onClick={() => likeMutation.mutate(comment.id)}
            className={`flex items-center gap-1 text-[11px] transition-colors ${
              comment.isLiked ? 'text-red-400' : 'text-virens-white-muted hover:text-red-400'
            }`}
          >
            <Heart size={11} fill={comment.isLiked ? 'currentColor' : 'none'} />
            {comment.likesCount > 0 && comment.likesCount}
          </button>
          {!isReply && isAuthenticated && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-[11px] text-virens-white-muted hover:text-virens-white transition-colors"
            >
              Reply
            </button>
          )}
        </div>

        {!isReply && replyingTo === comment.id && (
          <div className="mt-3 ml-1 flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="input-field flex-1 text-sm"
              maxLength={2000}
            />
            <button
              onClick={() => handleReply(comment.id)}
              disabled={!replyText.trim() || submitMutation.isPending}
              className="btn-primary px-3 py-2 rounded-xl"
            >
              <Send size={15} />
            </button>
          </div>
        )}

        {!!comment.replies?.length && (
          <div>
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    </motion.div>
  )

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-5">
        <MessageCircle size={18} className="text-virens-white-muted" />
        <h3 className="font-display font-semibold text-virens-white">
          Comments {data?.total ? `(${data.total})` : ''}
        </h3>
      </div>

      {isAuthenticated && user ? (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <Avatar src={user.avatar} alt={user.displayName} size="sm" isVerified={user.isVerified} />
          <div className="flex-1 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              maxLength={2000}
              className="input-field flex-1 text-sm"
            />
            <button
              type="submit"
              disabled={!text.trim() || submitMutation.isPending}
              className="btn-primary px-3 py-2 rounded-xl"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-virens-white-muted mb-6">
          <a href="/login" className="text-virens-green hover:text-virens-green/80">Sign in</a> to comment.
        </p>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-virens-gray flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3 w-24 bg-virens-gray rounded mb-2" />
                <div className="h-10 bg-virens-gray rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : !data?.items.length ? (
        <div className="text-center py-10 text-virens-white-muted">
          <MessageCircle size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No comments yet. Be the first.</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="flex flex-col gap-4">
            {data.items.map((comment) => renderComment(comment))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
