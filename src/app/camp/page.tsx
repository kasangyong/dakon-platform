'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getTeams, getHackathons, addTeam, updateTeam, deleteTeam, getCheers, getMyCheers, toggleCheer, getMySkill, setMySkill, awardBadge, updateTeamOpen } from '@/lib/localStorage'
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
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all ${cheered ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-gray-100 text-gray-500 hover:bg-pink-50 hover:text-pink-500 dark:hover:bg-pink-900/20'}`}
    >
      <span>{cheered ? '❤️' : '🤍'}</span>
      <span>{count}</span>
    </button>
  )
}

function TeamCard({
  team,
  isMatched,
  isMyTeam,
  onToggleOpen,
  onManage,
}: {
  team: Team
  isMatched: boolean
  isMyTeam: boolean
  onToggleOpen?: () => void
  onManage?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 transition-all ${isMatched ? 'border-blue-500 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-50 shadow-md' : 'border-gray-200 bg-white'}`}
    >
      {isMatched && (
        <div className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
          <span>✨</span> 내 스킬과 매칭!
        </div>
      )}
      {isMyTeam && (
        <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
          <span>👤</span> 내가 만든 팀
        </div>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{team.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${team.isOpen ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-500 bg-gray-100'}`}>
              {team.isOpen ? '모집중' : '마감'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{team.memberCount}명 참여 중</p>
        </div>
        <CheerButton teamCode={team.teamCode} />
      </div>
      <p className="text-sm text-gray-400 mb-3">{team.intro}</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {team.lookingFor.map((r) => <TagBadge key={r} tag={r} />)}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {team.isOpen && (
          <a href={team.contact.url} target="_blank" rel="noopener noreferrer"
            className="inline-block text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
            연락하기 →
          </a>
        )}
        {isMyTeam && (
          <button
            onClick={onManage}
            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors text-gray-600 bg-gray-100 hover:bg-gray-100 bg-gray-100 text-gray-400 hover:bg-gray-200"
          >
            ⚙️ 공고 관리
          </button>
        )}
      </div>
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
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold mb-6">팀 만들기</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">해커톤 선택</label>
            <select
              value={form.hackathonSlug}
              onChange={(e) => setForm((f) => ({ ...f, hackathonSlug: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">팀 소개</label>
            <textarea
              value={form.intro}
              onChange={(e) => setForm((f) => ({ ...f, intro: e.target.value }))}
              rows={3}
              placeholder="팀을 소개해주세요"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
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
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim()}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
          >
            팀 만들기
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function ManageTeamModal({
  team,
  onClose,
  onUpdated,
  onDeleted,
}: {
  team: Team
  onClose: () => void
  onUpdated: () => void
  onDeleted: () => void
}) {
  const [form, setForm] = useState({
    name: team.name,
    intro: team.intro,
    lookingFor: team.lookingFor,
    contactUrl: team.contact.url,
    memberCount: team.memberCount,
    isOpen: team.isOpen,
  })
  const [confirmDelete, setConfirmDelete] = useState(false)

  function toggleRole(role: string) {
    setForm((f) => ({
      ...f,
      lookingFor: f.lookingFor.includes(role)
        ? f.lookingFor.filter((r) => r !== role)
        : [...f.lookingFor, role],
    }))
  }

  function handleSave() {
    updateTeam(team.teamCode, {
      name: form.name,
      intro: form.intro,
      lookingFor: form.lookingFor,
      contact: { type: 'link', url: form.contactUrl || '#' },
      memberCount: form.memberCount,
      isOpen: form.isOpen,
    })
    onUpdated()
  }

  function handleDelete() {
    deleteTeam(team.teamCode)
    onDeleted()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">팀 공고 관리</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="space-y-4">
          {/* 모집 상태 토글 */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-medium">모집 상태</p>
              <p className="text-xs text-gray-500 mt-0.5">{form.isOpen ? '팀원을 모집 중입니다' : '모집이 마감되었습니다'}</p>
            </div>
            <button
              onClick={() => setForm((f) => ({ ...f, isOpen: !f.isOpen }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.isOpen ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isOpen ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">팀명</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">팀 소개</label>
            <textarea
              value={form.intro}
              onChange={(e) => setForm((f) => ({ ...f, intro: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">현재 인원</label>
            <input
              type="number"
              min={1}
              max={10}
              value={form.memberCount}
              onChange={(e) => setForm((f) => ({ ...f, memberCount: Number(e.target.value) }))}
              className="w-24 px-3 py-2 rounded-xl border border-gray-200 bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
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
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2.5 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
          >
            공고 삭제
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
          >
            저장
          </button>
        </div>

        {/* 삭제 확인 */}
        {confirmDelete && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm font-semibold text-red-700 mb-3">정말 공고를 삭제할까요?</p>
            <p className="text-xs text-red-500 mb-3">삭제된 공고는 복구할 수 없습니다.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm">취소</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold">삭제</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ─── 슬롯머신 랜덤 팀 매칭 ────────────────────────────────────────────────────

function SlotMachine({ teams, onClose }: { teams: Team[]; onClose: () => void }) {
  const openTeams = teams.filter((t) => t.isOpen)
  const [display, setDisplay] = useState('???')
  const [result, setResult] = useState<Team | null>(null)
  const [spinning, setSpinning] = useState(false)

  useEffect(() => {
    if (openTeams.length === 0) return
    spin()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function spin() {
    if (spinning || openTeams.length === 0) return
    setResult(null)
    setSpinning(true)

    const picked = openTeams[Math.floor(Math.random() * openTeams.length)]
    const names = openTeams.map((t) => t.name)

    let count = 0
    const totalTicks = 22
    function tick(delay: number) {
      setDisplay(names[Math.floor(Math.random() * names.length)])
      count++
      if (count < totalTicks) {
        // 점점 느려짐
        setTimeout(() => tick(delay + 40), delay)
      } else {
        setDisplay(picked.name)
        setResult(picked)
        setSpinning(false)
      }
    }
    tick(40)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center"
      >
        <p className="text-2xl mb-1">🎰</p>
        <h2 className="text-lg font-bold mb-4">운에 맡기기</h2>

        {openTeams.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">모집 중인 팀이 없습니다.</p>
        ) : (
          <>
            {/* 슬롯 화면 */}
            <div className="bg-gray-50 rounded-xl py-5 px-4 mb-4 border-2 border-gray-200">
              <p
                className={`text-xl font-black font-mono tracking-wide transition-colors ${
                  spinning ? 'text-amber-400' : result ? 'text-green-400' : 'text-gray-400'
                }`}
              >
                {display}
              </p>
              <div className="flex justify-center gap-1 mt-2">
                {[0,1,2].map((i) => (
                  <motion.div
                    key={i}
                    animate={spinning ? { opacity: [1, 0.2, 1] } : { opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.13 }}
                    className="w-1.5 h-1.5 rounded-full bg-amber-400"
                  />
                ))}
              </div>
            </div>

            {/* 결과 카드 */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 p-4 text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-green-600 font-bold text-sm">✓ 매칭된 팀</span>
                  </div>
                  <p className="font-bold text-gray-900 text-gray-900">{result.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 mb-2">{result.intro}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {result.lookingFor.map((r) => (
                      <span key={r} className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">{r}</span>
                    ))}
                  </div>
                  <a
                    href={result.contact.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    연락하기 →
                  </a>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2">
              <button
                onClick={spin}
                disabled={spinning}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors"
              >
                {spinning ? '돌리는 중...' : '다시 돌리기 🎰'}
              </button>
              <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
                닫기
              </button>
            </div>
          </>
        )}
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
  const [showSlot, setShowSlot] = useState(false)
  const [managingTeam, setManagingTeam] = useState<Team | null>(null)
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

  function handleToggleOpen(teamCode: string, current: boolean) {
    updateTeamOpen(teamCode, !current)
    setTeams(getTeams())
  }

  function handleManageSaved() {
    setTeams(getTeams())
    setManagingTeam(null)
  }

  function handleManageDeleted() {
    setTeams(getTeams())
    setManagingTeam(null)
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
          <p className="text-gray-500 text-gray-400">팀을 찾거나 직접 만들어보세요</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSlot(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            🎰 운에 맡기기
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            + 팀 만들기
          </button>
        </div>
      </div>

      {/* Skill Passport */}
      <div className="mb-6 rounded-2xl border border-blue-100 dark:border-indigo-800 bg-blue-50 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛂</span>
            <h3 className="font-semibold text-blue-700">스킬 여권</h3>
          </div>
          <button onClick={() => setShowSkillPassport((v) => !v)} className="text-xs text-blue-600 hover:underline">
            {showSkillPassport ? '접기' : '내 스킬 설정'}
          </button>
        </div>
        {mySkill.length > 0 ? (
          <p className="text-sm text-blue-600">
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
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
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedHackathon === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}
        >
          전체 ({teams.length})
        </button>
        {hackathons.map((h) => {
          const count = teams.filter((t) => t.hackathonSlug === h.slug).length
          return (
            <button
              key={h.slug}
              onClick={() => setSelectedHackathon(h.slug)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedHackathon === h.slug ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}
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
          {sorted.map((team) => {
            const mine = team.teamCode.startsWith('T-MY-')
            return (
              <TeamCard
                key={team.teamCode}
                team={team}
                isMatched={isMatched(team)}
                isMyTeam={mine}
                onToggleOpen={mine ? () => handleToggleOpen(team.teamCode, team.isOpen) : undefined}
                onManage={mine ? () => setManagingTeam(team) : undefined}
              />
            )
          })}
        </div>
      )}

      {showSlot && (
        <SlotMachine teams={filtered} onClose={() => setShowSlot(false)} />
      )}

      {showModal && (
        <CreateTeamModal
          hackathons={hackathons}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {managingTeam && (
        <ManageTeamModal
          team={managingTeam}
          onClose={() => setManagingTeam(null)}
          onUpdated={handleManageSaved}
          onDeleted={handleManageDeleted}
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
