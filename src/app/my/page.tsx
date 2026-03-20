'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSubmissions, getTeams, getBookmarks, getBadges, checkAndAwardBadges, getHackathons } from '@/lib/localStorage'
import type { Submission, Team, Badge, Hackathon } from '@/types'
import Link from 'next/link'


// ─── Activity Heatmap ─────────────────────────────────────────────────────────

function ActivityHeatmap({ submissions }: { submissions: Submission[] }) {
  const weeks = 52
  const days = 7
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dateMap: Record<string, number> = {}
  for (const s of submissions) {
    const d = new Date(s.submittedAt)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString().slice(0, 10)
    dateMap[key] = (dateMap[key] ?? 0) + 1
  }

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
    if (count === 0) return 'bg-gray-100'
    if (count === 1) return 'bg-blue-100 dark:bg-indigo-900'
    if (count === 2) return 'bg-blue-500 dark:bg-blue-700'
    return 'bg-blue-600 dark:bg-blue-500'
  }

  const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
  const DAYS = ['일','월','화','수','목','금','토']

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <h3 className="font-semibold mb-4">활동 히트맵</h3>
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          <div className="flex flex-col gap-1 mr-1">
            <div className="h-4" />
            {DAYS.map((d) => (
              <div key={d} className="w-3 h-3 text-[9px] text-gray-400 flex items-center">{d}</div>
            ))}
          </div>
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
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
        {['bg-gray-100','bg-blue-100 dark:bg-indigo-900','bg-blue-500 dark:bg-blue-700','bg-blue-600 dark:bg-blue-500'].map((c,i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span>많음</span>
      </div>
    </div>
  )
}

// ─── RPG Badge Grid ───────────────────────────────────────────────────────────

const ALL_BADGES = [
  { key: 'first_submit', emoji: '🥚', label: '첫 제출',  description: '첫 번째 제출 완료' },
  { key: 'streak_3',    emoji: '🔥', label: '연속 참가', description: '3회 연속 해커톤 참가' },
  { key: 'team_leader', emoji: '👑', label: '팀 리더',   description: '팀 생성 1회 이상' },
  { key: 'top_10pct',   emoji: '🏅', label: '상위 10%', description: '리더보드 상위 10% 진입' },
  { key: 'joined_5',    emoji: '🌟', label: '5회 참가',  description: '누적 5개 해커톤 참가' },
]

function XpBar({ current, max, color = 'bg-blue-500' }: { current: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.round((current / max) * 100))
  return (
    <div className="mt-1.5">
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-0.5 text-center">{current}/{max} XP</p>
    </div>
  )
}

function BadgeGrid({
  earned,
  xp,
}: {
  earned: Badge[]
  xp: Record<string, { current: number; max: number }>
}) {
  const earnedKeys = new Set<string>(earned.map((b) => b.key))
  const [flipped, setFlipped] = useState<string | null>(null)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold">배지</h3>
        <span className="text-sm text-gray-400">{earned.length}/{ALL_BADGES.length}</span>
        <span className="text-xs text-gray-700 text-gray-600">— 클릭하면 상세 확인</span>
      </div>

      {/* Overall XP bar */}
      <div className="mb-4">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(earned.length / ALL_BADGES.length) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          전체 달성률 {Math.round((earned.length / ALL_BADGES.length) * 100)}%
          {earned.length === ALL_BADGES.length && <span className="ml-1 text-amber-500 font-bold">🎉 완전 달성!</span>}
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {ALL_BADGES.map((b) => {
          const isEarned = earnedKeys.has(b.key)
          const prog = xp[b.key]
          const isFlipped = flipped === b.key

          return (
            <div
              key={b.key}
              onClick={() => setFlipped(isFlipped ? null : b.key)}
              className={`cursor-pointer text-center p-3 rounded-xl border transition-all select-none ${
                isEarned
                  ? 'border-blue-200 dark:border-blue-700 bg-blue-50 hover:shadow-md hover:-translate-y-0.5'
                  : 'border-gray-200 border-gray-200 bg-gray-50 hover:border-gray-200'
              }`}
            >
              <AnimatePresence mode="wait">
                {isFlipped ? (
                  <motion.div
                    key="back"
                    initial={{ opacity: 0, rotateY: 90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-[10px] text-gray-500 text-gray-400 leading-tight">{b.description}</p>
                    {isEarned && earned.find((e) => e.key === b.key)?.earnedAt && (
                      <p className="text-[9px] text-blue-400 mt-1">
                        {new Date(earned.find((e) => e.key === b.key)!.earnedAt!).toLocaleDateString('ko-KR')} 획득
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="front" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className={`text-3xl mb-1 ${!isEarned ? 'grayscale opacity-40' : ''}`}>{b.emoji}</div>
                    <p className={`text-xs font-medium ${isEarned ? 'text-gray-700' : 'text-gray-400'}`}>
                      {b.label}
                    </p>
                    {isEarned ? (
                      <p className="text-[10px] text-blue-500 mt-0.5 font-semibold">획득 ✓</p>
                    ) : prog ? (
                      <XpBar current={prog.current} max={prog.max} />
                    ) : (
                      <p className="text-[10px] text-gray-700 mt-0.5">잠김</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── 탐정 노트 ────────────────────────────────────────────────────────────────

const STEP_LABELS: Record<string, string> = { plan: '기획서', web: '웹링크', pdf: 'PDF' }
const STEP_ICON:  Record<string, string> = { plan: '📋', web: '🌐', pdf: '📄' }
const STEP_ORDER: Record<string, number> = { plan: 0, web: 1, pdf: 2 }

function DetectiveNotes({
  submissions,
  getHackathonTitle,
}: {
  submissions: Submission[]
  getHackathonTitle: (slug: string) => string
}) {
  const [open, setOpen] = useState(false)

  // Group by hackathon
  const grouped = submissions.reduce<Record<string, Submission[]>>((acc, s) => {
    if (!acc[s.hackathonSlug]) acc[s.hackathonSlug] = []
    acc[s.hackathonSlug].push(s)
    return acc
  }, {})

  const cases = Object.entries(grouped).map(([slug, subs]) => ({
    slug,
    title: getHackathonTitle(slug),
    subs: [...subs].sort((a, b) => STEP_ORDER[a.stepCompleted] - STEP_ORDER[b.stepCompleted]),
  }))

  if (submissions.length === 0) return null

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🕵️</span>
          <div className="text-left">
            <p className="text-sm font-bold text-amber-400 font-mono tracking-wider">CASE FILE</p>
            <p className="text-xs text-gray-400">제출 수사 기록 — {cases.length}건의 케이스</p>
          </div>
        </div>
        <span className="text-gray-500 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 space-y-6 bg-gray-50">
              {cases.map((c, ci) => (
                <div key={c.slug}>
                  {/* Case header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono text-gray-500">CASE #{String(ci + 1).padStart(3, '0')}</span>
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-amber-400 font-mono font-bold truncate max-w-[60%]">{c.title}</span>
                  </div>

                  {/* Timeline */}
                  <div className="relative pl-6 space-y-4">
                    <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-700" />

                    {c.subs.map((s, si) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: si * 0.08 }}
                        className="relative"
                      >
                        {/* dot */}
                        <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-amber-400 border-2 border-gray-950" />

                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-amber-300 font-bold">
                              {STEP_ICON[s.stepCompleted]} {STEP_LABELS[s.stepCompleted]} 제출
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {new Date(s.submittedAt).toLocaleString('ko-KR', {
                                month: '2-digit', day: '2-digit',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {/* Artifact detail */}
                          <div className="space-y-1 mt-1">
                            {s.artifact.plan && (
                              <p className="text-[11px] text-gray-400 font-mono">
                                <span className="text-gray-600">{'>'}</span> 기획서: <span className="text-green-400">{s.artifact.plan.slice(0, 40)}{s.artifact.plan.length > 40 ? '…' : ''}</span>
                              </p>
                            )}
                            {s.artifact.webUrl && (
                              <p className="text-[11px] text-gray-400 font-mono">
                                <span className="text-gray-600">{'>'}</span> URL: <span className="text-blue-400">{s.artifact.webUrl}</span>
                              </p>
                            )}
                            {s.artifact.pdfUrl && (
                              <p className="text-[11px] text-gray-400 font-mono">
                                <span className="text-gray-600">{'>'}</span> PDF: <span className="text-orange-400">{s.artifact.pdfUrl}</span>
                              </p>
                            )}
                            {s.artifact.notes && (
                              <p className="text-[11px] text-gray-400 font-mono">
                                <span className="text-gray-600">{'>'}</span> 메모: <span className="text-gray-700">{s.artifact.notes}</span>
                              </p>
                            )}
                          </div>

                          {/* Step badge */}
                          <div className="mt-2 flex items-center gap-1">
                            {['plan', 'web', 'pdf'].map((step) => (
                              <span
                                key={step}
                                className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                                  STEP_ORDER[step] <= STEP_ORDER[s.stepCompleted]
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {STEP_LABELS[step]}
                              </span>
                            ))}
                            {STEP_ORDER[s.stepCompleted] === 2 && (
                              <span className="ml-1 text-[9px] text-green-400 font-mono">✓ COMPLETE</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}

              <p className="text-center text-[10px] text-gray-700 font-mono pt-2 border-t border-gray-200">
                — END OF FILE —
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
    const subs = getSubmissions()
    const myTeams = getTeams().filter((t) => t.teamCode.startsWith('T-MY-'))
    setSubmissions(subs)
    setTeams(myTeams)
    setBookmarks(getBookmarks())
    setBadges(getBadges())
    setHackathons(getHackathons())
  }, [])

  function getHackathonTitle(slug: string) {
    return hackathons.find((h) => h.slug === slug)?.title ?? slug
  }

  // RPG XP 계산
  const xp: Record<string, { current: number; max: number }> = {
    first_submit: { current: Math.min(submissions.length, 1), max: 1 },
    team_leader:  { current: Math.min(teams.length, 1), max: 1 },
    joined_5:     { current: Math.min(submissions.length, 5), max: 5 },
    streak_3:     { current: Math.min(new Set(submissions.map((s) => s.hackathonSlug)).size, 3), max: 3 },
    top_10pct:    { current: 0, max: 1 },
  }

  return (
    
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold mb-1">내 활동</h1>
        <p className="text-gray-500 text-gray-400">나의 해커톤 참가 이력과 배지</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '제출 횟수', value: submissions.length, icon: '📤' },
          { label: '생성한 팀', value: teams.length, icon: '👥' },
          { label: '획득 배지', value: badges.length, icon: '🏅' },
          { label: '북마크', value: bookmarks.length, icon: '🔖' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-gray-200 bg-white p-4 text-center"
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Heatmap */}
      {submissions.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="font-semibold mb-4">활동 히트맵</h3>
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm">아직 활동 내역이 없습니다.</p>
            <Link href="/hackathons" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
              해커톤 참가하기 →
            </Link>
          </div>
        </div>
      ) : (
        <ActivityHeatmap submissions={submissions} />
      )}

      {/* RPG Badge Grid */}
      <BadgeGrid earned={badges} xp={xp} />

      {/* 탐정 노트 */}
      <DetectiveNotes submissions={submissions} getHackathonTitle={getHackathonTitle} />

      {/* Submissions */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="font-semibold mb-4">제출 내역</h3>
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📤</p>
            <p className="text-sm">아직 제출 내역이 없습니다.</p>
            <Link href="/hackathons" className="mt-2 inline-block text-sm text-blue-600 hover:underline">해커톤 참가하기 →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3 border-b border-gray-200 border-gray-200 last:border-0">
                <div>
                  <p className="font-medium text-sm">{getHackathonTitle(s.hackathonSlug)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(s.submittedAt).toLocaleString('ko-KR')} · {{ plan: '기획서', web: '웹링크', pdf: 'PDF' }[s.stepCompleted]} 단계
                  </p>
                </div>
                <Link href={`/hackathons/${s.hackathonSlug}`} className="text-xs text-blue-600 hover:underline">
                  보기 →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bookmarks */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="font-semibold mb-4">북마크한 해커톤</h3>
        {bookmarks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">북마크한 해커톤이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((slug) => (
              <Link key={slug} href={`/hackathons/${slug}`}
                className="flex items-center justify-between py-2 hover:bg-gray-50/50 rounded-lg px-2 transition-colors">
                <span className="text-sm font-medium">{getHackathonTitle(slug)}</span>
                <span className="text-xs text-blue-600">보기 →</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* My teams */}
      {teams.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">내가 만든 팀</h3>
            <Link href="/camp" className="text-xs text-blue-600 hover:underline">공고 관리 →</Link>
          </div>
          <div className="space-y-3">
            {teams.map((team) => (
              <div key={team.teamCode} className="flex items-center justify-between py-2 border-b border-gray-200 border-gray-200 last:border-0">
                <div>
                  <p className="font-medium text-sm">{team.name}</p>
                  <p className="text-xs text-gray-500">{getHackathonTitle(team.hackathonSlug)} · {team.memberCount}명</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${team.isOpen ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-500 bg-gray-100'}`}>
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
