import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, UserMinus } from 'lucide-react'
import { apiPost } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

interface FollowButtonProps {
  username: string
  initialFollowing?: boolean
  size?: 'sm' | 'md'
}

export default function FollowButton({ username, initialFollowing = false, size = 'md' }: FollowButtonProps) {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [following, setFollowing] = useState(initialFollowing)

  const mutation = useMutation({
    mutationFn: () => apiPost<{ following: boolean }>(`/users/${username}/follow`),
    onSuccess: (data) => {
      setFollowing(data.following)
      qc.invalidateQueries({ queryKey: ['profile', username] })
      if (data.following) toast.success(`Following @${username}`)
    },
    onError: () => toast.error('Could not update follow status'),
  })

  const handleClick = () => {
    if (!isAuthenticated) { navigate('/login'); return }
    mutation.mutate()
  }

  return (
    <button
      onClick={handleClick}
      disabled={mutation.isPending}
      className={clsx(
        'flex items-center gap-1.5 font-semibold font-display transition-all duration-200 rounded-full',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-5 py-2 text-sm',
        following
          ? 'glass border border-white/12 text-virens-white-muted hover:border-virens-error/40 hover:text-virens-error'
          : 'bg-virens-green text-virens-black hover:bg-[#22d962] hover:shadow-[0_0_16px_rgba(29,185,84,0.3)]',
        mutation.isPending && 'opacity-50 cursor-not-allowed'
      )}
    >
      {following ? (
        <>
          <UserMinus size={size === 'sm' ? 12 : 14} />
          Following
        </>
      ) : (
        <>
          <UserPlus size={size === 'sm' ? 12 : 14} />
          Follow
        </>
      )}
    </button>
  )
}
