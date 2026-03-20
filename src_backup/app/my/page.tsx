'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getSubmissions, getTeams, getBookmarks, getBadges, checkAndAwardBadges, getHackathons } from '@/lib/localStorage'
import type { Submission, Team, Badge, Hackathon } from '@/types'
import Link from 'next/link'

// ─── Activity Heatmap ─────────────────────────────────────────────────────────

function ActivityHeatmap({ submissions }: { submissions: Submission[] }) {
  const weeks = 52
  const days = 7
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Build date → count map
  const dateMap: Record<string, number> = {}
  for (const s of submissions) {
    const d = new Date(s.submittedAt)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString().slice(0, 10)
    dateMap[key] = (dateMap[key] ?? 0) + 1
  }

  // Build grid: weeks × days
  const grid: { date: Date; count: number }[][] = []
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - weeks * 7 + 1)

  for (let w = 0; w < weeks; w++) {
    const week: { date: Date; count: number }[] = []
    for (let d = 0; d < days; d++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + w * 7 + d)
      const key = date.toISOString().slice(0, 10)
      week.push({ date, count: dateMap[key] ?? 0 })
    }
    grid.push(week)
  }

  function cellColor(count: number) {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800'
    if (count === 1) return 'bg-indigo-200 dark:bg-indigo-900'
    if (count === 2) return 'bg-indigo-400 dark:bg-indigo-700'
    return 'bg-indigo-600 dark:bg-indigo-500'
  }

  const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
  const DAYS = ['일','월','화','수','목','금','토']

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
      <h3 className="font-semibold mb-4">활동 히트맵</h3>
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1">
            <div className="h-4" />
            {DAYS.map((d) => (
              <div key={d} className="w-3 h-3 text-[9px] text-gray-400 flex items-center">{d}</div>
            ))}
          </div>
          {/* Weeks */}
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {/* Month label */}
              <div className="h-4 text-[10px] text-gray-400">
                {week[0].date.getDate() <= 7 ? MONTHS[week[0].date.getMonth()] : ''}
              </div>
              {week.map(({ date, count }, di) => (
                <div
                  key={di}
                  className={`w-3 h-3 rounded-sm ${cellColor(count)} cursor-default`}
                  title={`${date.toLocaleDateString('ko-KR')}: ${count}건`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 mt-3 justify-end text-xs text-gray-400">
        <span>적음</span>
        {['bg-gray-100 dark:bg-gray-800','bg-indigo-200 dark:bg-indigo-900','bg-indigo-400 dark:bg-indigo-700','bg-indigo-600 dark:bg-indigo-500'].map((c,i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span>많음</span>
      </div>
    </div>
  )
}

// ─── Badge display ────────────────────────────────────────────────────────────

const ALL_BADGES = [
  { key: 'first_submit', emoji: '🥚', label: '첫 제출', description: '첫 번째 제출 완료' },
  { key: 'streak_3', emoji: '🔥', label: '연속 참가', description: '3회 연속 해커톤 참가' },
  { key: 'team_leader', emoji: '👑', label: '팀 리더', description: '팀 생성 1회 이상' },
  { key: 'top_10pct', emoji: '🏅', label: '상위 10%', description: '리더보드 상위 10% 진입' },
  { key: 'joined_5', emoji: '🌟', label: '5회 참가', description: '누적 5개 해커톤 참가' },
]

function BadgeGrid({ earned }: { earned: Badge[] }) {
  const earnedKeys = new Set<string>(earned.map((b) => b.key))
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
      <h3 className="font-semibold mb-4">배지</h3>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {ALL_BADGES.map((b) => {
          const isEarned = earnedKeys.has(b.key)
          return (
            <div
              key={b.key}
              className={`text-center p-3 rounded-xl border transition-all ${isEarned ? 'border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/30' : 'border-gray-100 dark:border-gray-800 opacity-40'}`}
              title={b.description}
            >
              <div className={`text-3xl mb-1 ${!isEarned ? 'grayscale' : ''}`}>{b.emoji}</div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{b.label}</p>
              {isEarned && (
                <p className="text-[10px] text-indigo-500 mt-0.5">획득!</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MyPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [hackathons, setHackathons] = useState<Hackathon[]>([])

  useEffect(() => {
    checkAndAwardBadges()
    setSubmissions(getSubmissions())
    setTeams(getTeams().filter((t) => t.teamCode.startsWith('T-MY-')))
    setBookmarks(getBookmarks())
    setBadges(getBadges())
    setHackathons(getHackathons())
  }, [])

  function getHackathonTitle(slug: string) {
    return hackathons.find((h) => h.slug === slug)?.title ?? slug
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold mb-1">내 활동</h1>
        <p className="text-gray-500 dark:text-gray-400">나의 해커톤 참가 이력과 배지</p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '제출 횟수', value: submissions.length, icon: '📤' },
          { label: '생성한 팀', value: teams.length, icon: '👥' },
          { label: '획득 배지', value: badges.length, icon: '🏅' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center"
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Heatmap */}
      <ActivityHeatmap submissions={submissions} />

      {/* Badges */}
      <BadgeGrid earned={badges} />

      {/* Submissions */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
        <h3 className="font-semibold mb-4">제출 내역</h3>
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📤</p>
            <p className="text-sm">아직 제출 내역이 없습니다.</p>
            <Link href="/hackathons" className="mt-2 inline-block text-sm text-indigo-600 dark:text-indigo-400 hover:underline">해커톤 참가하기 →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div>
                  <p className="font-medium text-sm">{getHackathonTitle(s.hackathonSlug)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(s.submittedAt).toLocaleString('ko-KR')} · {s.stepCompleted} 단계
                  </p>
                </div>
                <Link href={`/hackathons/${s.hackathonSlug}`} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                  보기 →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bookmarks */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
        <h3 className="font-semibold mb-4">북마크한 해커톤</h3>
        {bookmarks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">북마크한 해커톤이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((slug) => (
              <Link key={slug} href={`/hackathons/${slug}`}
                className="flex items-center justify-between py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg px-2 transition-colors">
                <span className="text-sm font-medium">{getHackathonTitle(slug)}</span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400">보기 →</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* My teams */}
      {teams.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
          <h3 className="font-semibold mb-4">내가 만든 팀</h3>
          <div className="space-y-3">
            {teams.map((team) => (
              <div key={team.teamCode} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div>
                  <p className="font-medium text-sm">{team.name}</p>
                  <p className="text-xs text-gray-500">{getHackathonTitle(team.hackathonSlug)} · {team.memberCount}명</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${team.isOpen ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                  {team.isOpen ? '모집중' : '마감'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
