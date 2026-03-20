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
} from '@/lib/localStorage'
import type { HackathonDetail, Hackathon, LeaderboardEntry, Team, Submission } from '@/types'
import { StatusBadge, TagBadge } from '@/components/ui/Badge'
import Countdown from '@/components/ui/Countdown'
import Link from 'next/link'

const TABS = ['개요', '평가', '일정', '상금', '팀', '제출', '리더보드']

// ─── Tab panels ───────────────────────────────────────────────────────────────

function OverviewTab({ detail }: { detail: HackathonDetail }) {
  const { overview, info } = detail.sections
  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-6">
        <h3 className="font-semibold mb-2 text-indigo-700 dark:text-indigo-300">대회 소개</h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{overview.summary}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 mb-1">개인 참가</p>
          <p className="font-semibold">{overview.teamPolicy.allowSolo ? '가능' : '불가'}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 mb-1">최대 팀 인원</p>
          <p className="font-semibold">{overview.teamPolicy.maxTeamSize}명</p>
        </div>
      </div>
      {info.notice.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-5">
          <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-3">📢 공지사항</h4>
          <ul className="space-y-2">
            {info.notice.map((n, i) => (
              <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                <span className="text-amber-500 shrink-0">•</span>{n}
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
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
        <p className="text-xs text-gray-500 mb-1">평가 지표</p>
        <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{evalSection.metricName}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{evalSection.description}</p>
      </div>
      {evalSection.scoreDisplay && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h4 className="font-semibold mb-4">{evalSection.scoreDisplay.label}</h4>
          <div className="space-y-3">
            {evalSection.scoreDisplay.breakdown.map((b) => (
              <div key={b.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{b.label}</span>
                  <span className="font-semibold">{b.weightPercent}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${b.weightPercent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {evalSection.limits && (
        <div className="grid grid-cols-2 gap-4">
          {evalSection.limits.maxRuntimeSec && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 mb-1">최대 실행 시간</p>
              <p className="font-semibold">{evalSection.limits.maxRuntimeSec}초</p>
            </div>
          )}
          {evalSection.limits.maxSubmissionsPerDay && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
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
              past ? 'bg-indigo-600 border-indigo-600' : isCurrent ? 'bg-white border-indigo-500 animate-pulse' : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600'
            }`} />
            <div className={isCurrent ? 'bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-3 -ml-2' : ''}>
              <p className={`font-semibold text-sm ${past ? 'text-gray-400' : isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {m.name}
                {isCurrent && <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">진행중</span>}
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
        <div key={i} className={`flex items-center justify-between rounded-2xl p-5 ${i === 0 ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800' : 'border border-gray-200 dark:border-gray-700'}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{MEDALS[i] ?? '🏆'}</span>
            <span className="font-semibold">{item.place}</span>
          </div>
          <span className={`text-xl font-bold ${i === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>
            {item.amountKRW.toLocaleString('ko-KR')}원
          </span>
        </div>
      ))}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 text-center">
        <p className="text-sm text-gray-500">총 상금</p>
        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
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
        <div key={team.teamCode} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{team.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${team.isOpen ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  {team.isOpen ? '모집중' : '마감'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{team.intro}</p>
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
              className="mt-3 inline-block text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              연락하기 →
            </a>
          )}
        </div>
      ))}
      {teams.length > 5 && (
        <button onClick={() => setExpanded((v) => !v)}
          className="w-full py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          {expanded ? '접기 ↑' : `더 보기 (${teams.length - 5}개) ↓`}
        </button>
      )}
      <Link href={`/camp?hackathon=${slug}`}
        className="block w-full py-3 text-center rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors">
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
        <button onClick={() => setSubmitted(false)} className="mt-4 text-sm text-indigo-600 hover:underline">
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
                    i === step ? 'bg-indigo-600 text-white' :
                    i < step ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-400' :
                    'bg-gray-100 dark:bg-gray-800 text-gray-400'
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
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
        <h4 className="font-semibold text-sm mb-2">제출 가이드</h4>
        <ul className="space-y-1">
          {detail.sections.submit.guide.map((g, i) => (
            <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex gap-2">
              <span className="text-indigo-400 shrink-0">{i + 1}.</span>{g}
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
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex gap-2">
            {step > 0 && <button onClick={() => setStep((s) => s - 1)} className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">이전</button>}
            {step < items.length - 1
              ? <button onClick={() => setStep((s) => s + 1)} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">다음</button>
              : <button onClick={() => setShowChecklist(true)} className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold">제출하기</button>
            }
          </div>
        </div>
      ) : (
        <button onClick={() => setShowChecklist(true)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
          제출하기
        </button>
      )}

      {/* Checklist modal */}
      {showChecklist && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-lg mb-4">✅ 제출 전 체크리스트</h3>
            <div className="space-y-3 mb-6">
              {CHECKLIST_ITEMS.map((item, i) => (
                <label key={i} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!checklist[i]}
                    onChange={(e) => setChecklist((c) => ({ ...c, [i]: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-indigo-600"
                  />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowChecklist(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm">취소</button>
              <button
                onClick={handleSubmit}
                disabled={!CHECKLIST_ITEMS.every((_, i) => checklist[i])}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
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
          className="w-full bg-transparent text-sm text-gray-700 dark:text-gray-300 resize-none focus:outline-none placeholder-gray-400"
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
        .map((s, i) => ({ idx: `제출 ${i + 1}`, score: Math.random() * 20 + 70 }))
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
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
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
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {allEntries.map((entry) => (
              <tr
                key={entry.teamName}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${selected === entry.teamName ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''}`}
                onClick={() => setSelected(selected === entry.teamName ? null : entry.teamName)}
              >
                <td className="px-4 py-3 font-semibold text-gray-500">
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                </td>
                <td className="px-4 py-3 font-medium">{entry.teamName}</td>
                <td className="px-4 py-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">
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
          className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
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
        <Link href="/hackathons" className="mt-4 inline-block text-indigo-600 hover:underline text-sm">← 목록으로</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link href="/hackathons" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 inline-block">
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
      <div className="flex gap-1 mb-8 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === i
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
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
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
