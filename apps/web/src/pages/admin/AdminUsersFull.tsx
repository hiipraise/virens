import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Search, ShieldCheck, Ban, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { apiGet, apiPost } from '@/lib/api'
import type { User } from '@/types'
import { formatDate, formatRelativeTime } from '@/utils/format'
import toast from 'react-hot-toast'

const ROLES = ['user', 'creator', 'staff', 'admin', 'superadmin'] as const

export default function AdminUsersFull() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () => apiGet<{ items: User[]; total: number }>('/admin/users', { search, role: roleFilter }),
  })

  const banMut = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'ban' | 'unban' | 'verify' }) =>
      apiPost(`/admin/users/${id}/${action}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User updated') },
  })

  return (
    <>
      <Helmet><title>Users — Admin — Virens</title></Helmet>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-2xl text-virens-white">Users</h1>
          <span className="text-sm text-virens-white-muted">{users?.total?.toLocaleString() ?? 0} total</span>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-virens-white-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="input-field pl-9 text-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field text-sm w-36"
          >
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/6">
                  {['User', 'Role', 'Subscription', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-virens-white-muted px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="shimmer-loading h-8 rounded-lg" /></td></tr>
                    ))
                  : users?.items?.map((user) => (
                      <tr key={user.id} className="border-b border-white/4 hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {user.avatar
                              ? <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                              : <div className="w-8 h-8 rounded-full bg-virens-green/20" />
                            }
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-virens-white">{user.displayName}</p>
                                {user.isVerified && <ShieldCheck size={12} className="text-virens-green" />}
                              </div>
                              <p className="text-xs text-virens-white-muted">@{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge text-xs capitalize ${user.role === 'superadmin' ? 'badge-green' : 'badge-gray'}`}>{user.role}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge text-xs capitalize ${user.subscriptionTier !== 'none' ? 'badge-green' : 'badge-gray'}`}>
                            {user.subscriptionTier}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-virens-white-muted">{formatDate(user.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {!user.isVerified && (
                              <button
                                onClick={() => banMut.mutate({ id: user.id, action: 'verify' })}
                                className="text-xs px-2 py-1 rounded-lg bg-virens-green/10 text-virens-green border border-virens-green/20 hover:bg-virens-green/20 transition-colors"
                              >
                                Verify
                              </button>
                            )}
                            <button
                              onClick={() => banMut.mutate({ id: user.id, action: 'ban' })}
                              className="text-xs px-2 py-1 rounded-lg bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-colors"
                            >
                              Ban
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
