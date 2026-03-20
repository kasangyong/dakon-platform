import { HackathonStatus } from '@/types'

const STATUS_MAP: Record<HackathonStatus, { label: string; className: string }> = {
  ongoing: { label: '진행중', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  upcoming: { label: '예정', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  ended: { label: '종료', className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
}

export function StatusBadge({ status }: { status: HackathonStatus }) {
  const { label, className } = STATUS_MAP[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {status === 'ongoing' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />}
      {label}
    </span>
  )
}

export function TagBadge({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
      {tag}
    </span>
  )
}
