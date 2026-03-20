import {
  seedHackathons,
  seedHackathonDetails,
  seedLeaderboards,
  seedTeams,
} from '@/data/seed'
import type {
  Hackathon,
  HackathonDetail,
  Leaderboard,
  Team,
  Submission,
  Badge,
  BadgeKey,
  MyNote,
} from '@/types'

const KEYS = {
  hackathons: 'dakon_hackathons',
  hackathonDetails: 'dakon_hackathon_details',
  teams: 'dakon_teams',
  leaderboards: 'dakon_leaderboards',
  submissions: 'dakon_submissions',
  bookmarks: 'dakon_bookmarks',
  mySkill: 'dakon_my_skill',
  cheers: 'dakon_cheers',
  badges: 'dakon_badges',
  notes: 'dakon_notes',
} as const

function get<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

export function initSeed() {
  if (typeof window === 'undefined') return
  if (!localStorage.getItem(KEYS.hackathons)) {
    set(KEYS.hackathons, seedHackathons)
  }
  if (!localStorage.getItem(KEYS.hackathonDetails)) {
    set(KEYS.hackathonDetails, seedHackathonDetails)
  }
  if (!localStorage.getItem(KEYS.leaderboards)) {
    set(KEYS.leaderboards, seedLeaderboards)
  }
  if (!localStorage.getItem(KEYS.teams)) {
    set(KEYS.teams, seedTeams)
  }
  if (!localStorage.getItem(KEYS.submissions)) {
    set(KEYS.submissions, [] as Submission[])
  }
  if (!localStorage.getItem(KEYS.bookmarks)) {
    set(KEYS.bookmarks, [] as string[])
  }
  if (!localStorage.getItem(KEYS.cheers)) {
    set(KEYS.cheers, {} as Record<string, number>)
  }
  if (!localStorage.getItem(KEYS.badges)) {
    set(KEYS.badges, [] as Badge[])
  }
  if (!localStorage.getItem(KEYS.notes)) {
    set(KEYS.notes, [] as MyNote[])
  }
}

// ─── Hackathons ───────────────────────────────────────────────────────────────

export function getHackathons(): Hackathon[] {
  return get(KEYS.hackathons, seedHackathons)
}

export function getHackathonDetail(slug: string): HackathonDetail | null {
  const all = get<HackathonDetail[]>(KEYS.hackathonDetails, seedHackathonDetails)
  return all.find((d) => d.slug === slug) ?? null
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export function getTeams(): Team[] {
  return get(KEYS.teams, seedTeams)
}

export function addTeam(team: Team): void {
  const teams = getTeams()
  set(KEYS.teams, [...teams, team])
}

// ─── Leaderboards ─────────────────────────────────────────────────────────────

export function getLeaderboard(slug: string): Leaderboard | null {
  const all = get<Leaderboard[]>(KEYS.leaderboards, seedLeaderboards)
  return all.find((l) => l.hackathonSlug === slug) ?? null
}

export function getAllLeaderboards(): Leaderboard[] {
  return get(KEYS.leaderboards, seedLeaderboards)
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export function getSubmissions(): Submission[] {
  return get(KEYS.submissions, [])
}

export function addSubmission(submission: Submission): void {
  const submissions = getSubmissions()
  set(KEYS.submissions, [...submissions, submission])
  awardBadge('first_submit')
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export function getBookmarks(): string[] {
  return get(KEYS.bookmarks, [])
}

export function toggleBookmark(slug: string): boolean {
  const bookmarks = getBookmarks()
  const exists = bookmarks.includes(slug)
  set(KEYS.bookmarks, exists ? bookmarks.filter((b) => b !== slug) : [...bookmarks, slug])
  return !exists
}

// ─── Skill Passport ───────────────────────────────────────────────────────────

export function getMySkill(): string[] {
  return get(KEYS.mySkill, [])
}

export function setMySkill(skills: string[]): void {
  set(KEYS.mySkill, skills)
}

// ─── Cheers ───────────────────────────────────────────────────────────────────

export function getCheers(): Record<string, number> {
  return get(KEYS.cheers, {})
}

export function cheer(teamCode: string): number {
  const cheers = getCheers()
  const next = (cheers[teamCode] ?? 0) + 1
  set(KEYS.cheers, { ...cheers, [teamCode]: next })
  return next
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const BADGE_DEFS: Record<BadgeKey, Omit<Badge, 'earnedAt'>> = {
  first_submit: { key: 'first_submit', label: '첫 제출', emoji: '🥚', description: '첫 번째 제출 완료' },
  streak_3: { key: 'streak_3', label: '연속 참가', emoji: '🔥', description: '3회 연속 해커톤 참가' },
  team_leader: { key: 'team_leader', label: '팀 리더', emoji: '👑', description: '팀 생성 1회 이상' },
  top_10pct: { key: 'top_10pct', label: '상위 10%', emoji: '🏅', description: '리더보드 상위 10% 진입' },
  joined_5: { key: 'joined_5', label: '5회 참가', emoji: '🌟', description: '누적 5개 해커톤 참가' },
}

export function getBadges(): Badge[] {
  return get(KEYS.badges, [])
}

export function awardBadge(key: BadgeKey): Badge | null {
  const badges = getBadges()
  if (badges.find((b) => b.key === key)) return null
  const badge: Badge = { ...BADGE_DEFS[key], earnedAt: new Date().toISOString() }
  set(KEYS.badges, [...badges, badge])
  return badge
}

export function checkAndAwardBadges(): void {
  const submissions = getSubmissions()
  const teams = getTeams()
  const myTeams = teams.filter((t) => t.teamCode.startsWith('T-MY-'))

  if (submissions.length >= 1) awardBadge('first_submit')
  if (myTeams.length >= 1) awardBadge('team_leader')
  if (submissions.length >= 5) awardBadge('joined_5')
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export function getNotes(): MyNote[] {
  return get(KEYS.notes, [])
}

export function saveNote(hackathonSlug: string, content: string): void {
  const notes = getNotes()
  const existing = notes.findIndex((n) => n.hackathonSlug === hackathonSlug)
  const updated: MyNote = { hackathonSlug, content, updatedAt: new Date().toISOString() }
  if (existing >= 0) {
    notes[existing] = updated
    set(KEYS.notes, notes)
  } else {
    set(KEYS.notes, [...notes, updated])
  }
}
