'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ZAxis, Cell,
} from 'recharts'
import { getHackathons, getBookmarks, toggleBookmark } from '@/lib/localStorage'
import type { Hackathon, HackathonStatus } from '@/types'
import { StatusBadge, TagBadge } from '@/components/ui/Badge'
import Countdown from '@/components/ui/Countdown'

const STATUS_TABS: { key: HackathonStatus | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'ongoing', label: '진행중' },
  { key: 'upcoming', label: '예정' },
  { key: 'ended', label: '종료' },
]

const BUBBLE_COLORS: Record<HackathonStatus, string> = {
  ongoing: '#22c55e',
  upcoming: '#6366f1',
  ended: '#9ca3af',
}

function daysUntil(dateStr: string) {
  return Math.max(0, Math.floor((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
}

function HackathonCard({ h, bookmarked, onToggleBookmark }: {
  h: Hackathon
  bookmarked: boolean
  onToggleBookmark: (slug: string) => void
}) {
  return (
    <div className="group rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-indigo-400 dark:hover:border-indigo-500 transition-all hover:shadow-lg bg-white dark:bg-gray-900">
      <Link href={`/hackathons/${h.slug}`} className="block">
        <div className="h-40 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center relative">
          <span className="text-5xl">🏆</span>
          <div className="absolute top-3 left-3">
            <StatusBadge status={h.status} />
          </div>
        </div>
      </Link>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/hackathons/${h.slug}`}>
            <h3 className="font-semibold text-sm leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2">
              {h.title}
            </h3>
          </Link>
          <button
            onClick={() => onToggleBookmark(h.slug)}
            className="shrink-0 text-lg hover:scale-110 transition-transform"
            title={bookmarked ? '북마크 해제' : '북마크'}
          >
            {bookmarked ? '🔖' : '📄'}
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {h.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
          <span>마감 {new Date(h.period.submissionDeadlineAt).toLocaleDateString('ko-KR')}</span>
          {h.status !== 'ended' && <Countdown target={h.period.submissionDeadlineAt} label="" />}
        </div>
      </div>
    </div>
  )
}

// Custom tooltip for bubble chart
function BubbleTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Hackathon & { daysLeft: number; prize: number } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-sm max-w-[200px]">
      <p className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">{d.title}</p>
      <p className="text-gray-500">D-{d.daysLeft}</p>
      <StatusBadge status={d.status} />
    </div>
  )
}

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [tab, setTab] = useState<HackathonStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'explorer'>('list')

  useEffect(() => {
    setHackathons(getHackathons())
    setBookmarks(getBookmarks())
  }, [])

  function handleToggleBookmark(slug: string) {
    toggleBookmark(slug)
    setBookmarks(getBookmarks())
  }

  const filtered = useMemo(() => {
    return hackathons.filter((h) => {
      if (tab !== 'all' && h.status !== tab) return false
      if (search && !h.title.toLowerCase().includes(search.toLowerCase()) &&
          !h.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) return false
      return true
    })
  }, [hackathons, tab, search])

  const bubbleData = hackathons.map((h) => ({
    ...h,
    daysLeft: daysUntil(h.period.submissionDeadlineAt),
    prize: h.status === 'ended' ? 10 : h.status === 'ongoing' ? 30 : 20,
  }))

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">해커톤</h1>
        <p className="text-gray-500 dark:text-gray-400">참가하고 싶은 해커톤을 찾아보세요</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <input
          type="text"
          placeholder="제목, 태그로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {/* View toggle */}
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            목록
          </button>
          <button
            onClick={() => setView('explorer')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'explorer' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            Explorer
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs opacity-70">
              {t.key === 'all' ? hackathons.length : hackathons.filter((h) => h.status === t.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Explorer view */}
      {view === 'explorer' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700 dark:text-gray-300">Explorer 뷰</h2>
            <div className="flex gap-4 text-xs text-gray-500">
              {Object.entries(BUBBLE_COLORS).map(([status, color]) => (
                <span key={status} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                  {status === 'ongoing' ? '진행중' : status === 'upcoming' ? '예정' : '종료'}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-4">X축: 마감까지 남은 일수 · Y축: 참가 난이도 · 버블 클릭 시 상세 이동</p>
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis dataKey="daysLeft" name="남은 일수" unit="일" tick={{ fontSize: 11 }} label={{ value: '마감까지 (일)', position: 'insideBottom', offset: -10, fontSize: 11 }} />
              <YAxis dataKey="prize" name="난이도" tick={{ fontSize: 11 }} label={{ value: '규모', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <ZAxis range={[600, 1200]} />
              <Tooltip content={<BubbleTooltip />} />
              <Scatter
                data={bubbleData}
                onClick={(data) => { const d = data as unknown as { slug?: string }; if (d.slug) window.location.href = `/hackathons/${d.slug}` }}
                cursor="pointer"
              >
                {bubbleData.map((entry, i) => (
                  <Cell key={i} fill={BUBBLE_COLORS[entry.status]} fillOpacity={0.7} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* List view */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p>검색 결과가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((h, i) => (
            <motion.div
              key={h.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <HackathonCard
                h={h}
                bookmarked={bookmarks.includes(h.slug)}
                onToggleBookmark={handleToggleBookmark}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
