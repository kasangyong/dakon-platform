import { HackathonStatus } from '@/types'

const STATUS_MAP: Record<HackathonStatus, { label: string; className: string }> = {
  ongoing: {
    label: '진행중',
    className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  },
  upcoming: {
    label: '예정',
    className: 'bg-blue-100 text-blue-700 border border-blue-200',
  },
  ended: {
    label: '종료',
    className: 'bg-gray-100 text-gray-500 border border-gray-200',
  },
}

export function StatusBadge({ status }: { status: HackathonStatus }) {
  const { label, className } = STATUS_MAP[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}>
      {status === 'ongoing' && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      )}
      {label}
    </span>
  )
}

export function TagBadge({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
      {tag}
    </span>
  )
}
