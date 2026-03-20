/**
 * 전체 localStorage 비즈니스 로직 테스트
 * 커버 범위: Seed / Hackathons / Teams / Leaderboard / Submissions /
 *            Bookmarks / Skill / Cheers / Badges / Notes / Votes
 */

import {
  initSeed,
  getHackathons,
  getHackathonDetail,
  getTeams,
  addTeam,
  updateTeam,
  deleteTeam,
  updateTeamOpen,
  getLeaderboard,
  getAllLeaderboards,
  getSubmissions,
  addSubmission,
  getBookmarks,
  toggleBookmark,
  getMySkill,
  setMySkill,
  getCheers,
  getMyCheers,
  toggleCheer,
  getBadges,
  awardBadge,
  checkAndAwardBadges,
  getNotes,
  saveNote,
  getMyVote,
  hasVoted,
  castVote,
  getCommunityVoteStats,
} from '@/lib/localStorage'
import type { Team, Submission } from '@/types'

// 각 테스트 전 localStorage 초기화
beforeEach(() => {
  localStorage.clear()
})

// ─── Seed ─────────────────────────────────────────────────────────────────────

describe('initSeed', () => {
  test('빈 localStorage에 시드 데이터를 채운다', () => {
    initSeed()
    expect(getHackathons().length).toBeGreaterThan(0)
    expect(getTeams().length).toBeGreaterThan(0)
    expect(getAllLeaderboards().length).toBeGreaterThan(0)
  })

  test('이미 데이터가 있으면 덮어쓰지 않는다', () => {
    initSeed()
    const before = getHackathons()
    initSeed() // 두 번 호출
    const after = getHackathons()
    expect(after).toEqual(before)
  })
})

// ─── Hackathons ───────────────────────────────────────────────────────────────

describe('Hackathons', () => {
  beforeEach(() => initSeed())

  test('getHackathons는 배열을 반환한다', () => {
    const list = getHackathons()
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBeGreaterThan(0)
  })

  test('각 해커톤은 slug, title, status를 가진다', () => {
    getHackathons().forEach((h) => {
      expect(h.slug).toBeTruthy()
      expect(h.title).toBeTruthy()
      expect(['ongoing', 'upcoming', 'ended']).toContain(h.status)
    })
  })

  test('getHackathonDetail은 slug로 상세 정보를 반환한다', () => {
    const slug = 'daker-handover-2026-03'
    const detail = getHackathonDetail(slug)
    expect(detail).not.toBeNull()
    expect(detail?.slug).toBe(slug)
    expect(detail?.sections.overview).toBeDefined()
  })

  test('존재하지 않는 slug는 null을 반환한다', () => {
    expect(getHackathonDetail('no-such-slug')).toBeNull()
  })
})

// ─── Teams ────────────────────────────────────────────────────────────────────

describe('Teams', () => {
  beforeEach(() => initSeed())

  const makeTeam = (overrides: Partial<Team> = {}): Team => ({
    teamCode: `T-MY-${Date.now()}`,
    hackathonSlug: 'daker-handover-2026-03',
    name: '테스트팀',
    isOpen: true,
    memberCount: 2,
    lookingFor: ['Frontend'],
    intro: '테스트 소개',
    contact: { type: 'link', url: 'https://example.com' },
    createdAt: new Date().toISOString(),
    ...overrides,
  })

  test('addTeam으로 팀을 추가할 수 있다', () => {
    const before = getTeams().length
    addTeam(makeTeam())
    expect(getTeams().length).toBe(before + 1)
  })

  test('updateTeam으로 팀 정보를 수정할 수 있다', () => {
    const team = makeTeam()
    addTeam(team)
    updateTeam(team.teamCode, { name: '수정된팀', memberCount: 5 })
    const found = getTeams().find((t) => t.teamCode === team.teamCode)
    expect(found?.name).toBe('수정된팀')
    expect(found?.memberCount).toBe(5)
  })

  test('deleteTeam으로 팀을 삭제할 수 있다', () => {
    const team = makeTeam()
    addTeam(team)
    deleteTeam(team.teamCode)
    expect(getTeams().find((t) => t.teamCode === team.teamCode)).toBeUndefined()
  })

  test('updateTeamOpen으로 모집 상태를 변경할 수 있다', () => {
    const team = makeTeam({ isOpen: true })
    addTeam(team)
    updateTeamOpen(team.teamCode, false)
    expect(getTeams().find((t) => t.teamCode === team.teamCode)?.isOpen).toBe(false)
    updateTeamOpen(team.teamCode, true)
    expect(getTeams().find((t) => t.teamCode === team.teamCode)?.isOpen).toBe(true)
  })

  test('존재하지 않는 teamCode는 무시된다', () => {
    const before = getTeams().length
    updateTeam('GHOST', { name: '유령' })
    deleteTeam('GHOST')
    expect(getTeams().length).toBe(before)
  })
})

// ─── Leaderboards ─────────────────────────────────────────────────────────────

describe('Leaderboards', () => {
  beforeEach(() => initSeed())

  test('getLeaderboard는 slug에 맞는 리더보드를 반환한다', () => {
    const lb = getLeaderboard('aimers-8-model-lite')
    expect(lb).not.toBeNull()
    expect(lb?.entries.length).toBeGreaterThan(0)
  })

  test('리더보드 항목은 rank 순으로 정렬되어 있다', () => {
    const lb = getLeaderboard('aimers-8-model-lite')!
    for (let i = 1; i < lb.entries.length; i++) {
      expect(lb.entries[i].rank).toBeGreaterThan(lb.entries[i - 1].rank)
    }
  })

  test('없는 slug는 null을 반환한다', () => {
    expect(getLeaderboard('no-such')).toBeNull()
  })

  test('getAllLeaderboards는 전체 배열을 반환한다', () => {
    expect(getAllLeaderboards().length).toBeGreaterThan(0)
  })
})

// ─── Submissions ──────────────────────────────────────────────────────────────

describe('Submissions', () => {
  beforeEach(() => initSeed())

  const makeSubmission = (): Submission => ({
    id: Date.now().toString(),
    hackathonSlug: 'daker-handover-2026-03',
    teamName: '내 팀',
    artifact: { plan: '기획서 내용', webUrl: 'https://example.vercel.app' },
    submittedAt: new Date().toISOString(),
    stepCompleted: 'web',
  })

  test('초기 제출 내역은 빈 배열이다', () => {
    expect(getSubmissions()).toEqual([])
  })

  test('addSubmission으로 제출을 추가할 수 있다', () => {
    addSubmission(makeSubmission())
    expect(getSubmissions().length).toBe(1)
  })

  test('여러 번 제출할 수 있다', () => {
    addSubmission(makeSubmission())
    addSubmission(makeSubmission())
    expect(getSubmissions().length).toBe(2)
  })

  test('제출 시 first_submit 배지가 부여된다', () => {
    addSubmission(makeSubmission())
    expect(getBadges().find((b) => b.key === 'first_submit')).toBeDefined()
  })
})

// ─── Bookmarks ────────────────────────────────────────────────────────────────

describe('Bookmarks', () => {
  beforeEach(() => initSeed())

  test('초기 북마크는 빈 배열이다', () => {
    expect(getBookmarks()).toEqual([])
  })

  test('toggleBookmark로 북마크를 추가한다', () => {
    const added = toggleBookmark('aimers-8-model-lite')
    expect(added).toBe(true)
    expect(getBookmarks()).toContain('aimers-8-model-lite')
  })

  test('같은 slug를 다시 토글하면 제거된다', () => {
    toggleBookmark('aimers-8-model-lite')
    const removed = toggleBookmark('aimers-8-model-lite')
    expect(removed).toBe(false)
    expect(getBookmarks()).not.toContain('aimers-8-model-lite')
  })

  test('여러 해커톤을 북마크할 수 있다', () => {
    toggleBookmark('aimers-8-model-lite')
    toggleBookmark('daker-handover-2026-03')
    expect(getBookmarks().length).toBe(2)
  })
})

// ─── Skill Passport ───────────────────────────────────────────────────────────

describe('Skill Passport', () => {
  beforeEach(() => initSeed())

  test('초기 스킬은 빈 배열이다', () => {
    expect(getMySkill()).toEqual([])
  })

  test('setMySkill로 스킬을 저장하고 getMySkill로 불러온다', () => {
    setMySkill(['Frontend', 'Designer'])
    expect(getMySkill()).toEqual(['Frontend', 'Designer'])
  })

  test('빈 배열로 초기화할 수 있다', () => {
    setMySkill(['ML Engineer'])
    setMySkill([])
    expect(getMySkill()).toEqual([])
  })
})

// ─── Cheers ───────────────────────────────────────────────────────────────────

describe('Cheers (하트 토글)', () => {
  beforeEach(() => initSeed())

  test('처음 하트를 누르면 카운트 1이 되고 cheered=true', () => {
    const result = toggleCheer('T-ALPHA')
    expect(result.count).toBe(1)
    expect(result.cheered).toBe(true)
    expect(getMyCheers()).toContain('T-ALPHA')
  })

  test('같은 팀에 다시 누르면 취소되고 카운트가 줄어든다', () => {
    toggleCheer('T-ALPHA')
    const result = toggleCheer('T-ALPHA')
    expect(result.cheered).toBe(false)
    expect(result.count).toBe(0)
    expect(getMyCheers()).not.toContain('T-ALPHA')
  })

  test('여러 팀에 독립적으로 하트를 누를 수 있다', () => {
    toggleCheer('T-ALPHA')
    toggleCheer('T-BETA')
    expect(getMyCheers().length).toBe(2)
    expect(getCheers()['T-ALPHA']).toBe(1)
    expect(getCheers()['T-BETA']).toBe(1)
  })

  test('카운트는 0 미만으로 내려가지 않는다', () => {
    toggleCheer('T-ALPHA') // 1
    toggleCheer('T-ALPHA') // 0
    const result = toggleCheer('T-ALPHA') // 다시 1 (re-cheer)
    expect(result.count).toBeGreaterThanOrEqual(0)
  })
})

// ─── Badges ───────────────────────────────────────────────────────────────────

describe('Badges', () => {
  beforeEach(() => initSeed())

  test('초기 배지는 빈 배열이다', () => {
    expect(getBadges()).toEqual([])
  })

  test('awardBadge로 배지를 부여할 수 있다', () => {
    const badge = awardBadge('team_leader')
    expect(badge).not.toBeNull()
    expect(getBadges().find((b) => b.key === 'team_leader')).toBeDefined()
  })

  test('같은 배지를 중복 부여하면 null을 반환한다', () => {
    awardBadge('first_submit')
    const dup = awardBadge('first_submit')
    expect(dup).toBeNull()
    expect(getBadges().filter((b) => b.key === 'first_submit').length).toBe(1)
  })

  test('checkAndAwardBadges: 제출 내역 있으면 first_submit 부여', () => {
    addSubmission({
      id: '1',
      hackathonSlug: 'daker-handover-2026-03',
      teamName: '내 팀',
      artifact: {},
      submittedAt: new Date().toISOString(),
      stepCompleted: 'plan',
    })
    checkAndAwardBadges()
    expect(getBadges().find((b) => b.key === 'first_submit')).toBeDefined()
  })

  test('checkAndAwardBadges: 내 팀 생성 시 team_leader 부여', () => {
    addTeam({
      teamCode: 'T-MY-001',
      hackathonSlug: 'daker-handover-2026-03',
      name: '내 팀',
      isOpen: true,
      memberCount: 1,
      lookingFor: [],
      intro: '',
      contact: { type: 'link', url: '#' },
      createdAt: new Date().toISOString(),
    })
    checkAndAwardBadges()
    expect(getBadges().find((b) => b.key === 'team_leader')).toBeDefined()
  })
})

// ─── Notes ────────────────────────────────────────────────────────────────────

describe('Notes', () => {
  beforeEach(() => initSeed())

  test('초기 메모는 빈 배열이다', () => {
    expect(getNotes()).toEqual([])
  })

  test('saveNote로 메모를 저장한다', () => {
    saveNote('daker-handover-2026-03', '내 메모')
    const notes = getNotes()
    expect(notes.length).toBe(1)
    expect(notes[0].content).toBe('내 메모')
  })

  test('같은 slug에 다시 저장하면 업데이트된다', () => {
    saveNote('daker-handover-2026-03', '처음')
    saveNote('daker-handover-2026-03', '수정됨')
    const notes = getNotes()
    expect(notes.length).toBe(1)
    expect(notes[0].content).toBe('수정됨')
  })

  test('다른 slug에 메모를 추가하면 독립적으로 저장된다', () => {
    saveNote('aimers-8-model-lite', '메모A')
    saveNote('daker-handover-2026-03', '메모B')
    expect(getNotes().length).toBe(2)
  })
})

// ─── Votes ────────────────────────────────────────────────────────────────────

describe('Votes (투표 시스템)', () => {
  const SLUG = 'daker-handover-2026-03'

  beforeEach(() => {
    localStorage.clear()
    initSeed()
  })

  test('초기 상태: 투표하지 않음', () => {
    expect(hasVoted(SLUG)).toBe(false)
    expect(getMyVote(SLUG)).toBeNull()
  })

  test('castVote로 투표할 수 있다', () => {
    castVote(SLUG, { '404found': 5, LGTM: 4 })
    expect(hasVoted(SLUG)).toBe(true)
    const vote = getMyVote(SLUG)
    expect(vote?.ratings['404found']).toBe(5)
    expect(vote?.ratings['LGTM']).toBe(4)
  })

  test('투표 후 커뮤니티 통계에 내 투표가 반영된다', () => {
    const before = getCommunityVoteStats(SLUG).find((s) => s.teamName === '404found')
    const beforeCount = before?.count ?? 0
    castVote(SLUG, { '404found': 5, LGTM: 3, VibeDevs: 4 })
    const after = getCommunityVoteStats(SLUG).find((s) => s.teamName === '404found')
    expect(after?.count).toBe(beforeCount + 1)
  })

  test('재투표 시 카운트는 늘지 않고 점수만 업데이트된다', () => {
    castVote(SLUG, { '404found': 5, LGTM: 3, VibeDevs: 4 })
    const count1 = getCommunityVoteStats(SLUG).find((s) => s.teamName === '404found')?.count ?? 0
    castVote(SLUG, { '404found': 3, LGTM: 5, VibeDevs: 2 })
    const count2 = getCommunityVoteStats(SLUG).find((s) => s.teamName === '404found')?.count ?? 0
    expect(count2).toBe(count1) // 카운트 불변
  })

  test('getCommunityVoteStats는 avgStars 내림차순으로 반환한다', () => {
    const stats = getCommunityVoteStats(SLUG)
    for (let i = 1; i < stats.length; i++) {
      expect(stats[i].avgStars).toBeLessThanOrEqual(stats[i - 1].avgStars)
    }
  })

  test('votedAt 타임스탬프가 기록된다', () => {
    castVote(SLUG, { '404found': 4 })
    const vote = getMyVote(SLUG)
    expect(vote?.votedAt).toBeTruthy()
    expect(new Date(vote!.votedAt).getTime()).toBeLessThanOrEqual(Date.now())
  })
})

// ─── 통합 시나리오 ─────────────────────────────────────────────────────────────

describe('통합 시나리오: 해커톤 참가 전체 플로우', () => {
  beforeEach(() => {
    localStorage.clear()
    initSeed()
  })

  test('시드 초기화 → 북마크 → 팀 생성 → 제출 → 배지 획득 → 투표 순서로 동작한다', () => {
    // 1. 해커톤 목록 확인
    const hackathons = getHackathons()
    expect(hackathons.length).toBeGreaterThan(0)
    const slug = hackathons[0].slug

    // 2. 북마크
    toggleBookmark(slug)
    expect(getBookmarks()).toContain(slug)

    // 3. 스킬 등록
    setMySkill(['Frontend', 'Backend'])
    expect(getMySkill()).toContain('Frontend')

    // 4. 팀 생성
    const team: Team = {
      teamCode: 'T-MY-FLOW-001',
      hackathonSlug: slug,
      name: '통합테스트팀',
      isOpen: true,
      memberCount: 1,
      lookingFor: ['Designer'],
      intro: '테스트',
      contact: { type: 'link', url: '#' },
      createdAt: new Date().toISOString(),
    }
    addTeam(team)
    expect(getTeams().find((t) => t.teamCode === team.teamCode)).toBeDefined()

    // 5. 제출
    const submission: Submission = {
      id: 'flow-001',
      hackathonSlug: slug,
      teamName: '통합테스트팀',
      artifact: { plan: '기획서', webUrl: 'https://test.vercel.app' },
      submittedAt: new Date().toISOString(),
      stepCompleted: 'web',
    }
    addSubmission(submission)
    expect(getSubmissions().length).toBe(1)

    // 6. 배지 확인
    checkAndAwardBadges()
    const badges = getBadges()
    expect(badges.find((b) => b.key === 'first_submit')).toBeDefined()
    expect(badges.find((b) => b.key === 'team_leader')).toBeDefined()

    // 7. 메모 작성
    saveNote(slug, '이 해커톤은 어렵다')
    expect(getNotes()[0].content).toBe('이 해커톤은 어렵다')

    // 8. 팀 모집 마감
    updateTeamOpen(team.teamCode, false)
    expect(getTeams().find((t) => t.teamCode === team.teamCode)?.isOpen).toBe(false)

    // 9. 팀 정보 수정
    updateTeam(team.teamCode, { name: '수정된 통합테스트팀', memberCount: 3 })
    expect(getTeams().find((t) => t.teamCode === team.teamCode)?.name).toBe('수정된 통합테스트팀')

    // 10. 투표
    const voteSlug = 'daker-handover-2026-03'
    castVote(voteSlug, { '404found': 5, LGTM: 3 })
    expect(hasVoted(voteSlug)).toBe(true)

    // 11. 리더보드 확인
    const lb = getLeaderboard('aimers-8-model-lite')
    expect(lb?.entries[0].rank).toBe(1)
  })
})
