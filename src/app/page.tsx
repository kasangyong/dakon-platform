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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-lg w-full mx-4">
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-2xl font-mono">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-xs text-gray-500">prev_dev_memo.txt</span>
          </div>
          <div className="space-y-3 text-gray-700 text-lg leading-relaxed">
            {displayed.map((line, i) => (
              <p key={i} className={i === displayed.length - 1 && lineIdx >= TYPING_LINES.length ? 'text-blue-500 font-semibold' : ''}>
                {line}
              </p>
            ))}
            {lineIdx < TYPING_LINES.length && (
              <p>{currentLine}<span className="animate-pulse">▌</span></p>
            )}
          </div>
        </div>
        <button onClick={onDone} className="mt-6 w-full text-center text-sm text-gray-600 hover:text-gray-400 transition-colors">
          건너뛰기 →
        </button>
      </div>
    </div>
  )
}

const CARD_GRADIENTS = [
  'from-blue-500 to-blue-700',
  'from-sky-400 to-blue-600',
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-blue-500',
]

function HackathonCard({ h, index }: { h: Hackathon; index: number }) {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length]
  return (
    <Link href={`/hackathons/${h.slug}`} className="group block">
      <div className="rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 bg-white">
        <div className={`h-36 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
          <span className="text-5xl drop-shadow-lg">🏆</span>
          <div className="absolute top-3 left-3">
            <StatusBadge status={h.status} />
          </div>
          {h.status !== 'ended' && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
              <Countdown target={h.period.submissionDeadlineAt} />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-blue-700 transition-colors line-clamp-2 mb-2">
            {h.title}
          </h3>
          <div className="flex flex-wrap gap-1">
            {h.tags.slice(0, 3).map((tag) => <TagBadge key={tag} tag={tag} />)}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            마감 {new Date(h.period.submissionDeadlineAt).toLocaleDateString('ko-KR')}
          </p>
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
    if (!seen) setShowOnboarding(true)
    else setReady(true)
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

  if (showOnboarding) return <TypingOnboarding onDone={handleOnboardingDone} />

  return (
    <AnimatePresence>
      {ready && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

          {/* Hero */}
          <section className="relative bg-white overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-60" />
              <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-50" />
            </div>

            <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-24">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center max-w-3xl mx-auto"
              >
                <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  해커톤 플랫폼
                </span>

                <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.05] tracking-tight mb-6">
                  아이디어를<br />
                  <span className="text-blue-600">현실로.</span>
                </h1>

                <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
                  해커톤 참가부터 팀원 모집, 리더보드까지.<br />
                  당신의 개발 여정을 Dakon에서 시작하세요.
                </p>

                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/hackathons" className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-200 text-sm">
                    해커톤 보기 →
                  </Link>
                  <Link href="/camp" className="px-6 py-3.5 bg-white border-2 border-gray-200 hover:border-blue-400 text-gray-700 font-bold rounded-xl transition-colors text-sm">
                    팀 찾기
                  </Link>
                  <Link href="/rankings" className="px-6 py-3.5 bg-white border-2 border-gray-200 hover:border-blue-400 text-gray-700 font-bold rounded-xl transition-colors text-sm">
                    랭킹 보기
                  </Link>
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto"
              >
                {[
                  { label: '진행중', value: ongoing.length, color: 'text-emerald-600' },
                  { label: '전체 해커톤', value: hackathons.length, color: 'text-blue-700' },
                  { label: '예정', value: upcoming.length, color: 'text-sky-600' },
                ].map((s) => (
                  <div key={s.label} className="text-center bg-white border border-gray-200 rounded-2xl py-5 shadow-sm">
                    <div className={`text-4xl font-black ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-400 mt-1 font-medium">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Featured hackathons */}
          {featured.length > 0 && (
            <section className="bg-gray-50 py-16 px-4">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">지금 참가하세요</h2>
                    <p className="text-sm text-gray-400 mt-1">진행중이거나 곧 시작하는 해커톤</p>
                  </div>
                  <Link href="/hackathons" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    전체 보기 →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featured.map((h, i) => (
                    <motion.div
                      key={h.slug}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * i }}
                    >
                      <HackathonCard h={h} index={i} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* CTA sections */}
          <section className="py-16 px-4 bg-white">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
              <Link href="/camp" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full" />
                <div className="absolute -right-2 -top-2 w-20 h-20 bg-white/5 rounded-full" />
                <div className="relative">
                  <div className="text-4xl mb-4">🤝</div>
                  <h3 className="text-xl font-black mb-2">팀원 모집</h3>
                  <p className="text-sm text-white/80 leading-relaxed">내 스킬에 맞는 팀을 찾거나<br />직접 팀을 만들어보세요.</p>
                  <span className="mt-4 inline-block text-sm font-bold group-hover:translate-x-1 transition-transform">팀 찾기 →</span>
                </div>
              </Link>

              <Link href="/rankings" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-rose-500 p-8 text-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full" />
                <div className="absolute -right-2 -top-2 w-20 h-20 bg-white/5 rounded-full" />
                <div className="relative">
                  <div className="text-4xl mb-4">🏅</div>
                  <h3 className="text-xl font-black mb-2">글로벌 랭킹</h3>
                  <p className="text-sm text-white/80 leading-relaxed">전체 해커톤 누적 성적으로<br />상위 팀을 확인하세요.</p>
                  <span className="mt-4 inline-block text-sm font-bold group-hover:translate-x-1 transition-transform">랭킹 보기 →</span>
                </div>
              </Link>
            </div>
          </section>

        </motion.div>
      )}
    </AnimatePresence>
  )
}
