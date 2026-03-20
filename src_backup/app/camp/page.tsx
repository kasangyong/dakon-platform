'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { getTeams, getHackathons, addTeam, getCheers, getMyCheers, toggleCheer, getMySkill, setMySkill, awardBadge } from '@/lib/localStorage'
import type { Team, Hackathon } from '@/types'
import { TagBadge } from '@/components/ui/Badge'
import { Suspense } from 'react'

const ROLE_OPTIONS = ['Frontend', 'Backend', 'ML Engineer', 'Designer', 'PM', 'DevOps', 'Data Analyst']

function CheerButton({ teamCode }: { teamCode: string }) {
  const [count, setCount] = useState(0)
  const [cheered, setCheered] = useState(false)

  useEffect(() => {
    const all = getCheers()
    const mine = getMyCheers()
    setCount(all[teamCode] ?? 0)
    setCheered(mine.includes(teamCode))
  }, [teamCode])

  function handleCheer() {
    const result = toggleCheer(teamCode)
    setCount(result.count)
    setCheered(result.cheered)
  }

  return (
    <button
      onClick={handleCheer}
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all ${cheered ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-pink-50 hover:text-pink-500 dark:hover:bg-pink-900/20'}`}
    >
      <span>{cheered ? '❤️' : '🤍'}</span>
      <span>{count}</span>
    </button>
  )
}

function TeamCard({ team, isMatched }: { team: Team; isMatched: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 transition-all ${isMatched ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'}`}
    >
      {isMatched && (
        <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
          <span>✨</span> 내 스킬과 매칭!
        </div>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{team.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${team.isOpen ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
              {team.isOpen ? '모집중' : '마감'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{team.memberCount}명 참여 중</p>
        </div>
        <CheerButton teamCode={team.teamCode} />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{team.intro}</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {team.lookingFor.map((r) => <TagBadge key={r} tag={r} />)}
      </div>
      {team.isOpen && (
        <a href={team.contact.url} target="_blank" rel="noopener noreferrer"
          className="inline-block text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
          연락하기 →
        </a>
      )}
    </motion.div>
  )
}

function CreateTeamModal({ hackathons, onClose, onCreated }: {
  hackathons: Hackathon[]
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    name: '', intro: '', hackathonSlug: hackathons[0]?.slug ?? '',
    lookingFor: [] as string[], contactUrl: '', memberCount: 1,
  })

  function toggleRole(role: string) {
    setForm((f) => ({
      ...f,
      lookingFor: f.lookingFor.includes(role)
        ? f.lookingFor.filter((r) => r !== role)
        : [...f.lookingFor, role],
    }))
  }

  function handleSubmit() {
    if (!form.name.trim()) return
    const team: Team = {
      teamCode: `T-MY-${Date.now()}`,
      hackathonSlug: form.hackathonSlug,
      name: form.name,
      isOpen: true,
      memberCount: form.memberCount,
      lookingFor: form.lookingFor,
      intro: form.intro,
      contact: { type: 'link', url: form.contactUrl || '#' },
      createdAt: new Date().toISOString(),
    }
    addTeam(team)
    awardBadge('team_leader')
    onCreated()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold mb-6">팀 만들기</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">해커톤 선택</label>
            <select
              value={form.hackathonSlug}
              onChange={(e) => setForm((f) => ({ ...f, hackathonSlug: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {hackathons.map((h) => (
                <option key={h.slug} value={h.slug}>{h.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">팀명 <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="팀명을 입력하세요"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">팀 소개</label>
            <textarea
              value={form.intro}
              onChange={(e) => setForm((f) => ({ ...f, intro: e.target.value }))}
              rows={3}
              placeholder="팀을 소개해주세요"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">모집 분야</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    form.lookingFor.includes(role)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">연락처 링크</label>
            <input
              type="text"
              value={form.contactUrl}
              onChange={(e) => setForm((f) => ({ ...f, contactUrl: e.target.value }))}
              placeholder="https://open.kakao.com/..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim()}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-indigo-700 transition-colors"
          >
            팀 만들기
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function CampContent() {
  const searchParams = useSearchParams()
  const hackathonFilter = searchParams.get('hackathon')

  const [teams, setTeams] = useState<Team[]>([])
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [mySkill, setMySkillState] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedHackathon, setSelectedHackathon] = useState<string>('all')
  const [showSkillPassport, setShowSkillPassport] = useState(false)

  useEffect(() => {
    setTeams(getTeams())
    setHackathons(getHackathons())
    setMySkillState(getMySkill())
    if (hackathonFilter) setSelectedHackathon(hackathonFilter)
  }, [hackathonFilter])

  function handleCreated() {
    setTeams(getTeams())
    setShowModal(false)
  }

  function toggleSkill(skill: string) {
    const next = mySkill.includes(skill) ? mySkill.filter((s) => s !== skill) : [...mySkill, skill]
    setMySkillState(next)
    setMySkill(next)
  }

  const filtered = useMemo(() => {
    if (selectedHackathon === 'all') return teams
    return teams.filter((t) => t.hackathonSlug === selectedHackathon)
  }, [teams, selectedHackathon])

  function isMatched(team: Team) {
    return mySkill.length > 0 && team.isOpen && team.lookingFor.some((r) => mySkill.includes(r))
  }

  const sorted = [...filtered].sort((a, b) => {
    if (isMatched(a) && !isMatched(b)) return -1
    if (!isMatched(a) && isMatched(b)) return 1
    return 0
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">팀원 모집</h1>
          <p className="text-gray-500 dark:text-gray-400">팀을 찾거나 직접 만들어보세요</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          + 팀 만들기
        </button>
      </div>

      {/* Skill Passport */}
      <div className="mb-6 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/20 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛂</span>
            <h3 className="font-semibold text-indigo-700 dark:text-indigo-300">스킬 여권</h3>
          </div>
          <button onClick={() => setShowSkillPassport((v) => !v)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
            {showSkillPassport ? '접기' : '내 스킬 설정'}
          </button>
        </div>
        {mySkill.length > 0 ? (
          <p className="text-sm text-indigo-600 dark:text-indigo-400">
            나를 찾는 팀이 자동으로 하이라이트됩니다: {mySkill.join(', ')}
          </p>
        ) : (
          <p className="text-sm text-gray-500">내 역할/스킬을 등록하면 나에게 맞는 팀이 하이라이트됩니다</p>
        )}
        {showSkillPassport && (
          <div className="mt-3 flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role}
                onClick={() => toggleSkill(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mySkill.includes(role)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hackathon filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setSelectedHackathon('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedHackathon === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
        >
          전체 ({teams.length})
        </button>
        {hackathons.map((h) => {
          const count = teams.filter((t) => t.hackathonSlug === h.slug).length
          return (
            <button
              key={h.slug}
              onClick={() => setSelectedHackathon(h.slug)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedHackathon === h.slug ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
            >
              {h.title.split(':')[0].trim()} ({count})
            </button>
          )
        })}
      </div>

      {/* Teams grid */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">🤝</p>
          <p>아직 팀이 없습니다. 첫 팀을 만들어보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sorted.map((team) => (
            <TeamCard key={team.teamCode} team={team} isMatched={isMatched(team)} />
          ))}
        </div>
      )}

      {showModal && (
        <CreateTeamModal
          hackathons={hackathons}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

export default function CampPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-10 text-gray-400">로딩 중...</div>}>
      <CampContent />
    </Suspense>
  )
}
