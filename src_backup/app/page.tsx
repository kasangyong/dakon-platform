'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { initSeed, getHackathons } from '@/lib/localStorage'
import type { Hackathon } from '@/types'
import { StatusBadge, TagBadge } from '@/components/ui/Badge'
import Countdown from '@/components/ui/Countdown'

const TYPING_LINES = [
  '나는 갑자기 팀을 떠나게 됐어.',
  '이 플랫폼의 명세서만 남겨둘게.',
  '나머지는 네가 완성해줘.',
  '— prev dev',
]

function TypingOnboarding({ onDone }: { onDone: () => void }) {
  const [lineIdx, setLineIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [displayed, setDisplayed] = useState<string[]>([])

  useEffect(() => {
    if (lineIdx >= TYPING_LINES.length) {
      setTimeout(onDone, 800)
      return
    }
    const line = TYPING_LINES[lineIdx]
    if (charIdx < line.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), 45)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setDisplayed((d) => [...d, line])
        setLineIdx((l) => l + 1)
        setCharIdx(0)
      }, 400)
      return () => clearTimeout(t)
    }
  }, [lineIdx, charIdx, onDone])

  const currentLine = lineIdx < TYPING_LINES.length ? TYPING_LINES[lineIdx].slice(0, charIdx) : ''

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="max-w-lg w-full mx-4">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl font-mono">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-xs text-gray-500">prev_dev_memo.txt</span>
          </div>
          <div className="space-y-3 text-gray-300 text-lg leading-relaxed">
            {displayed.map((line, i) => (
              <p key={i} className={i === displayed.length - 1 && lineIdx >= TYPING_LINES.length ? 'text-indigo-400 font-semibold' : ''}>
                {line}
              </p>
            ))}
            {lineIdx < TYPING_LINES.length && (
              <p>
                {currentLine}
                <span className="animate-pulse">▌</span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onDone}
          className="mt-6 w-full text-center text-sm text-gray-600 hover:text-gray-400 transition-colors"
        >
          건너뛰기 →
        </button>
      </div>
    </div>
  )
}

function HackathonCard({ h }: { h: Hackathon }) {
  return (
    <Link href={`/hackathons/${h.slug}`} className="group block">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-indigo-400 dark:hover:border-indigo-500 transition-all hover:shadow-lg hover:-translate-y-0.5">
        <div className="h-36 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
          <span className="text-4xl">🏆</span>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={h.status} />
            <Countdown target={h.period.submissionDeadlineAt} label="마감" />
          </div>
          <h3 className="font-semibold text-sm leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2">
            {h.title}
          </h3>
          <div className="flex flex-wrap gap-1">
            {h.tags.slice(0, 3).map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function HomePage() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [ready, setReady] = useState(false)
  const [hackathons, setHackathons] = useState<Hackathon[]>([])

  useEffect(() => {
    initSeed()
    const seen = sessionStorage.getItem('dakon_onboarding_seen')
    if (!seen) {
      setShowOnboarding(true)
    } else {
      setReady(true)
    }
    setHackathons(getHackathons())
  }, [])

  function handleOnboardingDone() {
    sessionStorage.setItem('dakon_onboarding_seen', '1')
    setShowOnboarding(false)
    setReady(true)
  }

  const ongoing = hackathons.filter((h) => h.status === 'ongoing')
  const upcoming = hackathons.filter((h) => h.status === 'upcoming')
  const featured = [...ongoing, ...upcoming].slice(0, 3)

  if (showOnboarding) {
    return <TypingOnboarding onDone={handleOnboardingDone} />
  }

  return (
    <AnimatePresence>
      {ready && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero */}
          <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/30 dark:via-gray-950 dark:to-purple-950/20 pt-24 pb-20 px-4">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <span className="inline-block bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  🚀 해커톤 플랫폼
                </span>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                  아이디어를{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    현실로
                  </span>
                </h1>
                <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                  해커톤 참가, 팀원 모집, 리더보드까지. 당신의 개발 여정을 Dakon에서 시작하세요.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap justify-center gap-3"
              >
                <Link href="/hackathons" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
                  해커톤 보기 →
                </Link>
                <Link href="/camp" className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 font-semibold rounded-xl transition-colors">
                  팀 찾기
                </Link>
                <Link href="/rankings" className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 font-semibold rounded-xl transition-colors">
                  랭킹 보기
                </Link>
              </motion.div>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-2xl mx-auto mt-14 grid grid-cols-3 gap-4"
            >
              {[
                { label: '진행중 해커톤', value: ongoing.length },
                { label: '예정 해커톤', value: upcoming.length },
                { label: '전체 해커톤', value: hackathons.length },
              ].map((stat) => (
                <div key={stat.label} className="text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 py-4 px-2">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </section>

          {/* Featured hackathons */}
          {featured.length > 0 && (
            <section className="max-w-6xl mx-auto px-4 py-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">지금 참가하세요</h2>
                <Link href="/hackathons" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                  전체 보기 →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featured.map((h, i) => (
                  <motion.div key={h.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
                    <HackathonCard h={h} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* CTA cards */}
          <section className="max-w-6xl mx-auto px-4 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Link href="/camp" className="group block rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 p-8 hover:shadow-lg transition-all">
                <div className="text-3xl mb-3">🤝</div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">팀원 모집</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">내 스킬에 맞는 팀을 찾거나 직접 팀을 만들어보세요.</p>
              </Link>
              <Link href="/rankings" className="group block rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 p-8 hover:shadow-lg transition-all">
                <div className="text-3xl mb-3">🏅</div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400">글로벌 랭킹</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">전체 해커톤 누적 성적으로 상위 팀을 확인하세요.</p>
              </Link>
            </div>
          </section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
