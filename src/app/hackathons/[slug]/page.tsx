'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  getHackathonDetail, getHackathons, getLeaderboard, getTeams,
  getBookmarks, toggleBookmark, addSubmission, getSubmissions, saveNote, getNotes,
  getMyVote, hasVoted, castVote, getCommunityVoteStats,
} from '@/lib/localStorage'
import type { HackathonDetail, Hackathon, LeaderboardEntry, Team, Submission, CommunityVoteStat } from '@/types'
import { StatusBadge, TagBadge } from '@/components/ui/Badge'
import Countdown from '@/components/ui/Countdown'
import Link from 'next/link'

const TABS = ['개요', '평가', '일정', '상금', '팀', '제출', '리더보드', '투표']

// ─── Tab panels ───────────────────────────────────────────────────────────────

function OverviewTab({ detail }: { detail: HackathonDetail }) {
  const { overview, info } = detail.sections
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-2xl p-6">
        <h3 className="font-semibold mb-2 text-blue-700">대회 소개</h3>
        <p className="text-gray-700 leading-relaxed">{overview.summary}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">개인 참가</p>
          <p className="font-semibold">{overview.teamPolicy.allowSolo ? '가능' : '불가'}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">최대 팀 인원</p>
          <p className="font-semibold">{overview.teamPolicy.maxTeamSize}명</p>
        </div>
      </div>
      {info.notice.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-blue-50 p-5">
          <h4 className="font-semibold text-amber-700 text-blue-400 mb-3">📢 공지사항</h4>
          <ul className="space-y-2">
            {info.notice.map((n, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>{n}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function EvalTab({ detail }: { detail: HackathonDetail }) {
  const { eval: evalSection } = detail.sections
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 p-5">
        <p className="text-xs text-gray-500 mb-1">평가 지표</p>
        <p className="text-xl font-bold text-blue-600">{evalSection.metricName}</p>
        <p className="text-sm text-gray-400 mt-2">{evalSection.description}</p>
      </div>
      {evalSection.scoreDisplay && (
        <div className="rounded-2xl border border-gray-200 p-5">
          <h4 className="font-semibold mb-4">{evalSection.scoreDisplay.label}</h4>
          <div className="space-y-3">
            {evalSection.scoreDisplay.breakdown.map((b) => (
              <div key={b.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{b.label}</span>
                  <span className="font-semibold">{b.weightPercent}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${b.weightPercent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {evalSection.limits && (
        <div className="grid grid-cols-2 gap-4">
          {evalSection.limits.maxRuntimeSec && (
            <div className="rounded-2xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">최대 실행 시간</p>
              <p className="font-semibold">{evalSection.limits.maxRuntimeSec}초</p>
            </div>
          )}
          {evalSection.limits.maxSubmissionsPerDay && (
            <div className="rounded-2xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">일일 제출 제한</p>
              <p className="font-semibold">{evalSection.limits.maxSubmissionsPerDay}회</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ScheduleTab({ detail }: { detail: HackathonDetail }) {
  const { milestones } = detail.sections.schedule
  const now = Date.now()
  const currentIdx = milestones.findLastIndex((m) => new Date(m.at).getTime() <= now)

  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      {milestones.map((m, i) => {
        const past = new Date(m.at).getTime() <= now
        const isCurrent = i === currentIdx + 1
        return (
          <div key={i} className="relative mb-8 last:mb-0">
            <div className={`absolute -left-5 w-4 h-4 rounded-full border-2 ${
              past ? 'bg-blue-600 border-blue-600' : isCurrent ? 'bg-white border-blue-500 animate-pulse' : 'bg-white border-gray-300 dark:border-gray-600'
            }`} />
            <div className={isCurrent ? 'bg-blue-50 rounded-xl p-3 -ml-2' : ''}>
              <p className={`font-semibold text-sm ${past ? 'text-gray-400' : isCurrent ? 'text-blue-600' : 'text-gray-700'}`}>
                {m.name}
                {isCurrent && <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">진행중</span>}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(m.at).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PrizeTab({ detail }: { detail: HackathonDetail }) {
  const prize = detail.sections.prize
  if (!prize) return <p className="text-gray-500">상금 정보가 없습니다.</p>
  const MEDALS = ['🥇', '🥈', '🥉']
  return (
    <div className="space-y-3">
      {prize.items.map((item, i) => (
        <div key={i} className={`flex items-center justify-between rounded-2xl p-5 ${i === 0 ? 'bg-blue-50 border border-amber-200 dark:border-amber-800' : 'border border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{MEDALS[i] ?? '🏆'}</span>
            <span className="font-semibold">{item.place}</span>
          </div>
          <span className={`text-xl font-bold ${i === 0 ? 'text-amber-600' : 'text-gray-700'}`}>
            {item.amountKRW.toLocaleString('ko-KR')}원
          </span>
        </div>
      ))}
      <div className="rounded-2xl border border-gray-200 p-4 text-center">
        <p className="text-sm text-gray-500">총 상금</p>
        <p className="text-2xl font-bold text-blue-600">
          {prize.items.reduce((s, i) => s + i.amountKRW, 0).toLocaleString('ko-KR')}원
        </p>
      </div>
    </div>
  )
}

function TeamsTab({ detail, slug }: { detail: HackathonDetail; slug: string }) {
  const [teams, setTeams] = useState<Team[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setTeams(getTeams().filter((t) => t.hackathonSlug === slug))
  }, [slug])

  const shown = expanded ? teams : teams.slice(0, 5)

  return (
    <div className="space-y-4">
      {shown.map((team) => (
        <div key={team.teamCode} className="rounded-2xl border border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{team.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${team.isOpen ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-500 bg-gray-100'}`}>
                  {team.isOpen ? '모집중' : '마감'}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-2">{team.intro}</p>
              <div className="flex flex-wrap gap-1">
                {team.lookingFor.map((r) => (
                  <TagBadge key={r} tag={r} />
                ))}
              </div>
            </div>
            <span className="text-sm text-gray-500 shrink-0">{team.memberCount}명</span>
          </div>
          {team.isOpen && (
            <a href={team.contact.url} target="_blank" rel="noopener noreferrer"
              className="mt-3 inline-block text-xs text-blue-600 hover:underline">
              연락하기 →
            </a>
          )}
        </div>
      ))}
      {teams.length > 5 && (
        <button onClick={() => setExpanded((v) => !v)}
          className="w-full py-2 text-sm text-blue-600 hover:underline">
          {expanded ? '접기 ↑' : `더 보기 (${teams.length - 5}개) ↓`}
        </button>
      )}
      <Link href={`/camp?hackathon=${slug}`}
        className="block w-full py-3 text-center rounded-xl border-2 border-dashed border-blue-400 dark:border-blue-700 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors">
        + 팀 만들기 / 전체 팀 보기
      </Link>
    </div>
  )
}

function SubmitTab({ detail, slug }: { detail: HackathonDetail; slug: string }) {
  const items = detail.sections.submit.submissionItems ?? []
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Record<string, string>>({})
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [showChecklist, setShowChecklist] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [note, setNote] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)

  const CHECKLIST_ITEMS = [
    '배포 URL이 외부에서 접속 가능한가요?',
    '심사자가 별도 키 없이 확인 가능한가요?',
    'PDF로 변환 완료했나요?',
    '제출물이 규정에 맞게 작성되었나요?',
  ]

  useEffect(() => {
    const notes = getNotes()
    const existing = notes.find((n) => n.hackathonSlug === slug)
    if (existing) setNote(existing.content)
  }, [slug])

  function handleSaveNote() {
    saveNote(slug, note)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
  }

  function handleSubmit() {
    const allChecked = CHECKLIST_ITEMS.every((_, i) => checklist[i])
    if (!allChecked) return
    const submission: Submission = {
      id: Date.now().toString(),
      hackathonSlug: slug,
      teamName: '내 팀',
      artifact: {
        plan: form.plan,
        webUrl: form.web,
        pdfUrl: form.pdf,
        notes: form.notes,
      },
      submittedAt: new Date().toISOString(),
      stepCompleted: items[step]?.key as 'plan' | 'web' | 'pdf' ?? 'plan',
    }
    addSubmission(submission)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-xl font-bold mb-2">제출 완료!</h3>
        <p className="text-gray-500 text-sm">리더보드에 반영까지 시간이 걸릴 수 있습니다.</p>
        <button onClick={() => setSubmitted(false)} className="mt-4 text-sm text-blue-600 hover:underline">
          다시 제출하기
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      {items.length > 0 && (
        <div className="flex gap-0">
          {items.map((item, i) => (
            <div key={item.key} className="flex-1">
              <div className={`flex items-center ${i < items.length - 1 ? 'after:flex-1 after:h-0.5 after:content-[""] after:mx-2' : ''}`}>
                <button
                  onClick={() => setStep(i)}
                  className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center shrink-0 transition-colors ${
                    i === step ? 'bg-blue-600 text-white' :
                    i < step ? 'bg-blue-100 dark:bg-indigo-800 text-blue-600' :
                    'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i < step ? '✓' : i + 1}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1 pr-2">{item.title}</p>
            </div>
          ))}
        </div>
      )}

      {/* Guide */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-sm mb-2">제출 가이드</h4>
        <ul className="space-y-1">
          {detail.sections.submit.guide.map((g, i) => (
            <li key={i} className="text-sm text-gray-400 flex gap-2">
              <span className="text-blue-500 shrink-0">{i + 1}.</span>{g}
            </li>
          ))}
        </ul>
      </div>

      {/* Form */}
      {items.length > 0 ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium">{items[step]?.title}</label>
          <input
            type="text"
            placeholder={items[step]?.format === 'url' ? 'https://' : '내용 입력...'}
            value={form[items[step]?.key] ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, [items[step].key]: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            {step > 0 && <button onClick={() => setStep((s) => s - 1)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">이전</button>}
            {step < items.length - 1
              ? <button onClick={() => setStep((s) => s + 1)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700">다음</button>
              : <button onClick={() => setShowChecklist(true)} className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold">제출하기</button>
            }
          </div>
        </div>
      ) : (
        <button onClick={() => setShowChecklist(true)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
          제출하기
        </button>
      )}

      {/* Checklist modal */}
      {showChecklist && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-lg mb-4">✅ 제출 전 체크리스트</h3>
            <div className="space-y-3 mb-6">
              {CHECKLIST_ITEMS.map((item, i) => (
                <label key={i} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!checklist[i]}
                    onChange={(e) => setChecklist((c) => ({ ...c, [i]: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowChecklist(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm">취소</button>
              <button
                onClick={handleSubmit}
                disabled={!CHECKLIST_ITEMS.every((_, i) => checklist[i])}
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                최종 제출
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky note */}
      <div className="rounded-2xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4">
        <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-2">📝 내 메모</h4>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="이 해커톤에 대한 메모를 남겨보세요..."
          rows={4}
          className="w-full bg-transparent text-sm text-gray-700 resize-none focus:outline-none placeholder-gray-400"
        />
        <div className="flex justify-end">
          <button onClick={handleSaveNote} className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline">
            {noteSaved ? '저장됨 ✓' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

function LeaderboardTab({ slug }: { slug: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])

  useEffect(() => {
    const lb = getLeaderboard(slug)
    setEntries(lb?.entries ?? [])
    setSubmissions(getSubmissions().filter((s) => s.hackathonSlug === slug))
  }, [slug])

  const allEntries: LeaderboardEntry[] = [
    ...entries,
    ...submissions
      .filter((s) => !entries.find((e) => e.teamName === s.teamName))
      .map((s, i) => ({
        rank: entries.length + i + 1,
        teamName: s.teamName,
        score: 0,
        submittedAt: s.submittedAt,
      })),
  ]

  const chartData = selected
    ? submissions
        .filter((s) => s.teamName === selected)
        .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
        .map((s, i) => ({ idx: `제출 ${i + 1}`, score: entries.find((e) => e.teamName === s.teamName)?.score ?? 0 }))
    : []

  if (allEntries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">📊</p>
        <p className="text-sm">아직 제출 내역이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">순위</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">팀명</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">점수</th>
              {allEntries[0]?.scoreBreakdown && (
                <>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">참가자(30%)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">심사위원(70%)</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allEntries.map((entry) => (
              <tr
                key={entry.teamName}
                className={`hover:bg-gray-100/50 cursor-pointer transition-colors ${selected === entry.teamName ? 'bg-blue-950/30' : ''}`}
                onClick={() => setSelected(selected === entry.teamName ? null : entry.teamName)}
              >
                <td className="px-4 py-3 font-semibold text-gray-500">
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                </td>
                <td className="px-4 py-3 font-medium">{entry.teamName}</td>
                <td className="px-4 py-3 text-right font-semibold text-blue-600">
                  {entry.score > 0 ? entry.score.toFixed(2) : '-'}
                </td>
                {entry.scoreBreakdown && (
                  <>
                    <td className="px-4 py-3 text-right text-gray-500">{entry.scoreBreakdown.participant}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{entry.scoreBreakdown.judge}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Score chart */}
      {selected && chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-200 p-5"
        >
          <h4 className="font-semibold mb-3 text-sm">{selected} 점수 변동</h4>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="idx" tick={{ fontSize: 11 }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  )
}

// ─── Star rating component ────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`text-xl transition-transform ${readonly ? 'cursor-default' : 'hover:scale-110 cursor-pointer'}`}
        >
          <span className={star <= (hovered || value) ? 'text-amber-400' : 'text-gray-200'}>★</span>
        </button>
      ))}
    </div>
  )
}

// ─── Vote Tab ────────────────────────────────────────────────────────────────

function VoteTab({ slug, hackathon }: { slug: string; hackathon: Hackathon }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [voted, setVoted] = useState(false)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [communityStats, setCommunityStats] = useState<CommunityVoteStat[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [changing, setChanging] = useState(false)

  useEffect(() => {
    const lb = getLeaderboard(slug)
    const lbEntries = lb?.entries ?? []
    setEntries(lbEntries)
    const prevVote = getMyVote(slug)
    const alreadyVoted = hasVoted(slug)
    setVoted(alreadyVoted)
    if (prevVote) setRatings(prevVote.ratings)
    setCommunityStats(getCommunityVoteStats(slug))
  }, [slug])

  const teams = entries
  const allRated = teams.length > 0 && teams.every((e) => (ratings[e.teamName] ?? 0) > 0)

  function handleSubmit() {
    castVote(slug, ratings)
    setVoted(true)
    setChanging(false)
    setSubmitted(true)
    setCommunityStats(getCommunityVoteStats(slug))
    setTimeout(() => setSubmitted(false), 3000)
  }

  const maxAvg = Math.max(...communityStats.map((s) => s.avgStars), 1)
  const isVotingPeriod = hackathon.status !== 'upcoming'

  if (!isVotingPeriod) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🗳️</div>
        <h3 className="font-bold text-lg text-gray-700 mb-2">투표가 아직 시작되지 않았습니다</h3>
        <p className="text-sm text-gray-400">투표는 해커톤이 진행 중일 때 참여할 수 있습니다.</p>
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-2">🗳️</p>
        <p className="text-sm">아직 투표할 팀이 없습니다.</p>
      </div>
    )
  }

  const showForm = !voted || changing

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex gap-3">
        <span className="text-2xl shrink-0">🗳️</span>
        <div>
          <p className="font-semibold text-blue-700 text-sm">참가자 투표 (30% 반영)</p>
          <p className="text-xs text-blue-600 mt-0.5">
            각 팀의 결과물을 확인하고 별점(1~5점)을 부여하세요. 투표 결과는 최종 점수의 30%에 반영됩니다.
          </p>
        </div>
      </div>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-2"
        >
          <span className="text-green-600 font-bold">✓</span>
          <p className="text-sm text-green-700 font-medium">투표가 완료되었습니다!</p>
        </motion.div>
      )}

      {/* Voting form */}
      {showForm ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">팀별 별점 평가</h3>
            <span className="text-xs text-gray-400">{Object.values(ratings).filter((v) => v > 0).length} / {teams.length} 완료</span>
          </div>

          {teams.map((entry) => (
            <motion.div
              key={entry.teamName}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-gray-200 p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{entry.teamName}</span>
                    <span className="text-xs text-gray-400">#{entry.rank}</span>
                  </div>
                  {entry.artifacts?.planTitle && (
                    <p className="text-xs text-gray-500">{entry.artifacts.planTitle}</p>
                  )}
                </div>
                <StarRating
                  value={ratings[entry.teamName] ?? 0}
                  onChange={(v) => setRatings((r) => ({ ...r, [entry.teamName]: v }))}
                />
              </div>

              {/* Artifact links */}
              <div className="flex flex-wrap gap-2">
                {entry.artifacts?.webUrl && (
                  <a
                    href={entry.artifacts.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    🌐 웹 데모 보기
                  </a>
                )}
                {entry.artifacts?.pdfUrl && entry.artifacts.pdfUrl !== '#' && (
                  <a
                    href={entry.artifacts.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 text-xs font-medium hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    📄 PDF 보기
                  </a>
                )}
              </div>

              {ratings[entry.teamName] > 0 && (
                <p className="text-xs text-amber-600 font-medium">
                  {'★'.repeat(ratings[entry.teamName])}{'☆'.repeat(5 - ratings[entry.teamName])} {ratings[entry.teamName]}점
                </p>
              )}
            </motion.div>
          ))}

          <div className="flex gap-2 pt-2">
            {changing && (
              <button
                onClick={() => setChanging(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!allRated}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {allRated ? '투표 제출하기 🗳️' : `${teams.length - Object.values(ratings).filter((v) => v > 0).length}팀 평가 필요`}
            </button>
          </div>
        </div>
      ) : (
        /* Results view */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">커뮤니티 투표 결과</h3>
            <button
              onClick={() => setChanging(true)}
              className="text-xs text-blue-600 hover:underline"
            >
              투표 변경
            </button>
          </div>

          {communityStats.map((stat, i) => {
            const myRating = ratings[stat.teamName] ?? 0
            const barWidth = (stat.avgStars / maxAvg) * 100
            return (
              <motion.div
                key={stat.teamName}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-gray-200 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {i === 0 && <span className="text-lg">🥇</span>}
                    {i === 1 && <span className="text-lg">🥈</span>}
                    {i === 2 && <span className="text-lg">🥉</span>}
                    <span className="font-semibold text-sm">{stat.teamName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-500">{stat.avgStars.toFixed(2)}</span>
                    <span className="text-xs text-gray-400 ml-1">/ 5.0</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                    className="h-full bg-amber-400 rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{stat.count.toLocaleString()}명 투표</span>
                  {myRating > 0 && (
                    <span className="text-blue-600 font-medium">
                      내 평가: {'★'.repeat(myRating)}{'☆'.repeat(5 - myRating)}
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}

          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500">
              참가자 투표는 최종 점수의 <span className="font-semibold text-blue-600">30%</span>에 반영됩니다.
              심사위원 점수(70%)와 합산하여 최종 순위가 결정됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HackathonDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [detail, setDetail] = useState<HackathonDetail | null>(null)
  const [hackathon, setHackathon] = useState<Hackathon | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    const d = getHackathonDetail(slug)
    const h = getHackathons().find((h) => h.slug === slug) ?? null
    const bm = getBookmarks().includes(slug)
    setDetail(d)
    setHackathon(h)
    setBookmarked(bm)
  }, [slug])

  function handleBookmark() {
    const next = toggleBookmark(slug)
    setBookmarked(next)
  }

  if (!detail || !hackathon) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-400">
        <p className="text-4xl mb-3">🔍</p>
        <p>해커톤을 찾을 수 없습니다.</p>
        <Link href="/hackathons" className="mt-4 inline-block text-blue-600 hover:underline text-sm">← 목록으로</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link href="/hackathons" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-700 mb-4 inline-block">
          ← 해커톤 목록
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatusBadge status={hackathon.status} />
              {hackathon.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">{hackathon.title}</h1>
            {hackathon.status !== 'ended' && (
              <div className="mt-2">
                <Countdown target={hackathon.period.submissionDeadlineAt} label="제출 마감" />
              </div>
            )}
          </div>
          <button
            onClick={handleBookmark}
            className="text-2xl hover:scale-110 transition-transform shrink-0"
            title={bookmarked ? '북마크 해제' : '북마크'}
          >
            {bookmarked ? '🔖' : '📄'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 overflow-x-auto border-b border-gray-200">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === i
                ? 'border-blue-600 text-blue-600 dark:border-blue-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 0 && <OverviewTab detail={detail} />}
          {activeTab === 1 && <EvalTab detail={detail} />}
          {activeTab === 2 && <ScheduleTab detail={detail} />}
          {activeTab === 3 && <PrizeTab detail={detail} />}
          {activeTab === 4 && <TeamsTab detail={detail} slug={slug} />}
          {activeTab === 5 && <SubmitTab detail={detail} slug={slug} />}
          {activeTab === 6 && <LeaderboardTab slug={slug} />}
          {activeTab === 7 && <VoteTab slug={slug} hackathon={hackathon} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
