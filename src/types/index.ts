// ─── Hackathon ───────────────────────────────────────────────────────────────

export type HackathonStatus = 'ongoing' | 'upcoming' | 'ended'

export interface HackathonPeriod {
  timezone: string
  submissionDeadlineAt: string
  endAt: string
}

export interface HackathonLinks {
  detail: string
  rules: string
  faq: string
}

export interface Hackathon {
  slug: string
  title: string
  status: HackathonStatus
  tags: string[]
  thumbnailUrl: string
  period: HackathonPeriod
  links: HackathonLinks
}

// ─── Hackathon Detail ─────────────────────────────────────────────────────────

export interface TeamPolicy {
  allowSolo: boolean
  maxTeamSize: number
}

export interface ScoreBreakdownItem {
  key: string
  label: string
  weightPercent: number
}

export interface ScoreDisplay {
  label: string
  breakdown: ScoreBreakdownItem[]
}

export interface EvalSection {
  metricName: string
  description: string
  limits?: { maxRuntimeSec?: number; maxSubmissionsPerDay?: number }
  scoreSource?: string
  scoreDisplay?: ScoreDisplay
}

export interface Milestone {
  name: string
  at: string
}

export interface PrizeItem {
  place: string
  amountKRW: number
}

export interface SubmissionItem {
  key: string
  title: string
  format: string
}

export interface HackathonDetailSections {
  overview: { summary: string; teamPolicy: TeamPolicy }
  info: { notice: string[]; links: { rules: string; faq: string } }
  eval: EvalSection
  schedule: { timezone: string; milestones: Milestone[] }
  prize?: { items: PrizeItem[] }
  teams?: { campEnabled: boolean; listUrl: string }
  submit: {
    allowedArtifactTypes: string[]
    submissionUrl: string
    guide: string[]
    submissionItems?: SubmissionItem[]
  }
  leaderboard: { publicLeaderboardUrl: string; note: string }
}

export interface HackathonDetail {
  slug: string
  title: string
  sections: HackathonDetailSections
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number
  teamName: string
  score: number
  submittedAt: string
  scoreBreakdown?: { participant: number; judge: number }
  artifacts?: { webUrl?: string; pdfUrl?: string; planTitle?: string }
}

export interface Leaderboard {
  hackathonSlug: string
  updatedAt: string
  entries: LeaderboardEntry[]
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export interface Team {
  teamCode: string
  hackathonSlug: string
  name: string
  isOpen: boolean
  memberCount: number
  lookingFor: string[]
  intro: string
  contact: { type: string; url: string }
  createdAt: string
}

// ─── Submission ───────────────────────────────────────────────────────────────

export interface Submission {
  id: string
  hackathonSlug: string
  teamName: string
  artifact: {
    plan?: string
    webUrl?: string
    pdfUrl?: string
    notes?: string
  }
  submittedAt: string
  stepCompleted: 'plan' | 'web' | 'pdf'
}

// ─── My ───────────────────────────────────────────────────────────────────────

export type BadgeKey = 'first_submit' | 'streak_3' | 'team_leader' | 'top_10pct' | 'joined_5'

export interface Badge {
  key: BadgeKey
  label: string
  emoji: string
  description: string
  earnedAt?: string
}

export interface MyNote {
  hackathonSlug: string
  content: string
  updatedAt: string
}

// ─── Votes ────────────────────────────────────────────────────────────────────

export interface MyVote {
  hackathonSlug: string
  ratings: Record<string, number> // teamName → star 1–5
  votedAt: string
}

export interface CommunityVoteStat {
  teamName: string
  avgStars: number
  count: number
}
