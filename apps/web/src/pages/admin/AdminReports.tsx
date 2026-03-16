import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { Flag, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import type { Report } from '@/types'
import { formatRelativeTime } from '@/utils/format'
import { useState } from 'react'
import toast from 'react-hot-toast'

const REASON_COLORS: Record<string, string> = {
  copyright: 'text-red-400 bg-red-400/10 border-red-400/20',
  plagiarism: 'text-virens-warning bg-virens-warning/10 border-virens-warning/20',
  sensitive_content: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  harassment: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  spam: 'text-virens-white-muted bg-white/5 border-white/10',
  misinformation: 'text-virens-info bg-virens-info/10 border-virens-info/20',
}

export default function AdminReports() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'pending' | 'reviewing' | 'resolved'>('pending')

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-reports', filter],
    queryFn: () => apiGet<Report[]>('/admin/reports', { status: filter }),
  })

  const resolveMut = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'resolve' | 'dismiss' | 'remove_content' }) =>
      apiPost(`/admin/reports/${id}/${action}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] })
      toast.success('Report updated')
    },
  })

  return (
    <>
      <Helmet><title>Reports — Admin — Virens</title></Helmet>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl text-virens-white">Reports</h1>
            <p className="text-sm text-virens-white-muted mt-1">Prioritized by reporter credibility and report type</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 glass rounded-2xl w-fit mb-6">
          {(['pending', 'reviewing', 'resolved'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all
                ${filter === s ? 'bg-virens-green text-virens-black' : 'text-virens-white-muted hover:text-virens-white'}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Report list */}
        <div className="flex flex-col gap-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shimmer-loading rounded-2xl h-24" />
            ))
          ) : !reports?.length ? (
            <div className="glass-card p-12 text-center text-virens-white-muted">
              <CheckCircle size={32} className="mx-auto mb-3 text-virens-green opacity-60" />
              <p>No {filter} reports</p>
            </div>
          ) : reports.map((report) => (
            <div key={report.id} className="glass-card p-4 flex items-start gap-4">
              {/* Priority indicator */}
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${report.priority > 7 ? 'bg-red-400' : report.priority > 4 ? 'bg-virens-warning' : 'bg-virens-white-muted'}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`badge text-xs border ${REASON_COLORS[report.reason] || 'badge-gray'} capitalize`}>
                    {report.reason.replace('_', ' ')}
                  </span>
                  <span className="badge-gray text-xs capitalize">{report.targetType}</span>
                  {report.reporter.isVerified && (
                    <span className="badge-green text-xs">Verified Reporter</span>
                  )}
                </div>
                <p className="text-sm text-virens-white line-clamp-1">{report.description || 'No description provided'}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-virens-white-muted">
                  <span>By @{report.reporter.username}</span>
                  <span>{formatRelativeTime(report.createdAt)}</span>
                  <span>Priority: {report.priority}/10</span>
                </div>
              </div>

              {/* Actions */}
              {report.status === 'pending' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => resolveMut.mutate({ id: report.id, action: 'remove_content' })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-medium hover:bg-red-400/20 transition-colors"
                  >
                    <XCircle size={12} /> Remove
                  </button>
                  <button
                    onClick={() => resolveMut.mutate({ id: report.id, action: 'dismiss' })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl glass border border-white/10 text-virens-white-muted text-xs font-medium hover:border-white/20 transition-colors"
                  >
                    <CheckCircle size={12} /> Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
