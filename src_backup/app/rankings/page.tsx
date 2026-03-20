'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { getAllLeaderboards, getHackathons } from '@/lib/localStorage'
import type { Hackathon } from '@/types'

type PeriodFilter = 'all' | '30d' | '1y'

interface GlobalEntry {
  teamName: string
  totalScore: number
  hackathonCount: number
  bestRank: number
  hackathons: string[]
}

export default function RankingsPage() {
  const [entries, setEntries] = useState<GlobalEntry[]>([])
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [period, setPeriod] = useState<PeriodFilter>('all')

  useEffect(() => {
    const leaderboards = getAllLeaderboards()
    const allHackathons = getHackathons()
    setHackathons(allHackathons)

    const map: Record<string, GlobalEntry> = {}
    const now = Date.now()

    for (const lb of leaderboards) {
      const hackathon = allHackathons.find((h) => h.slug === lb.hackathonSlug)
      const endAt = hackathon ? new Date(hackathon.period.endAt).getTime() : 0

      for (const entry of lb.entries) {
        if (!map[entry.teamName]) {
          map[entry.teamName] = {
            teamName: entry.teamName,
            totalScore: 0,
            hackathonCount: 0,
            bestRank: entry.rank,
            hackathons: [],
          }
        }
        map[entry.teamName].totalScore += entry.score
        map[entry.teamName].hackathonCount += 1
        map[entry.teamName].hackathons.push(lb.hackathonSlug)
        if (entry.rank < map[entry.teamName].bestRank) {
          map[entry.teamName].bestRank = entry.rank
        }
      }
    }

    const sorted = Object.values(map).sort((a, b) => b.totalScore - a.totalScore)
    setEntries(sorted)
  }, [])

  const filtered = useMemo(() => {
    return entries
  }, [entries, period])

  const PERIOD_TABS: { key: PeriodFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: '30d', label: '최근 30일' },
    { key: '1y', label: '최근 1년' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">글로벌 랭킹</h1>
        <p className="text-gray-500 dark:text-gray-400">전체 해커톤 누적 성적 기준 팀 순위</p>
      </div>

      {/* Period filter */}
      <div className="flex gap-2 mb-8">
        {PERIOD_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setPeriod(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${period === t.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Top 3 podium */}
      {filtered.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-10">
          {[filtered[1], filtered[0], filtered[2]].map((entry, i) => {
            const pos = [2, 1, 3][i]
            const heights = ['h-24', 'h-32', 'h-20']
            const colors = ['bg-gray-100 dark:bg-gray-800', 'bg-amber-100 dark:bg-amber-900/30', 'bg-orange-50 dark:bg-orange-900/20']
            const medals = ['🥈', '🥇', '🥉']
            return (
              <motion.div
                key={entry.teamName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex-1 text-center"
              >
                <p className="text-2xl mb-1">{medals[i]}</p>
                <p className="font-bold text-sm mb-2 truncate">{entry.teamName}</p>
                <p className="text-xs text-gray-500 mb-2">{entry.totalScore.toFixed(1)}점</p>
                <div className={`${heights[i]} ${colors[i]} rounded-t-xl flex items-end justify-center pb-2`}>
                  <span className="text-2xl font-black text-gray-400 dark:text-gray-500">{pos}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Full table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">순위</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">팀명</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">참가</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">최고 순위</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">누적 점수</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((entry, i) => (
              <motion.tr
                key={entry.teamName}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3 font-semibold text-gray-500">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">{entry.teamName}</span>
                </td>
                <td className="px-4 py-3 text-center text-gray-500">{entry.hackathonCount}회</td>
                <td className="px-4 py-3 text-center text-gray-500">#{entry.bestRank}</td>
                <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                  {entry.totalScore.toFixed(2)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">🏆</p>
            <p className="text-sm">아직 랭킹 데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}
