# Dakon — 해커톤 플랫폼

> **긴급 인수인계 해커톤: 명세서만 보고 구현하라** 출품작
> "명세서만 남기고 사라진 개발자" 컨셉을 품은 해커톤 통합 플랫폼

---

## 기술 스택

| 분류 | 선택 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| 애니메이션 | Framer Motion |
| 차트 | Recharts |
| 상태/저장 | localStorage (외부 DB 없음) |
| 테스트 | Jest + ts-jest |
| 배포 | Vercel |

---

## 실행 방법

```bash
npm install
npm run dev       # 개발 서버 (http://localhost:3000)
npm run build     # 프로덕션 빌드
npm test          # 테스트 실행 (46개)
```

---

## 페이지 구성

```
/                     메인 — 인수인계 온보딩 스토리텔링
/hackathons           해커톤 목록 — 리스트 뷰 / Explorer 버블 차트
/hackathons/[slug]    해커톤 상세 — 8개 탭
/rankings             글로벌 랭킹 — 포디움 + 누적 점수 테이블
/camp                 팀원 모집 — 스킬 매칭 + 슬롯머신 랜덤 매칭
/my                   내 활동 — 히트맵 + RPG 배지 + 탐정 노트
```

---

## 핵심 기능

### 메인 페이지 (`/`)
- 터미널 타이핑 애니메이션 온보딩 — "이전 개발자의 메모" 연출
- 진행 중인 해커톤 카드 미리보기 + D-Day 실시간 카운트다운
- 북마크한 해커톤 마감 24시간 전 → 상단 긴급 배너 자동 등장

### 해커톤 목록 (`/hackathons`)
- 상태 필터 탭 (전체 / 진행중 / 예정 / 종료) + 키워드 검색
- 카드별 북마크 토글 (localStorage 저장)
- **Explorer 뷰** — ScatterChart 버블 차트 (X: 마감 D-Day, Y: 상금, 크기: 참가팀 수)
- 버블 클릭 → 해커톤 상세로 이동

### 해커톤 상세 (`/hackathons/[slug]`) — 8개 탭

| 탭 | 내용 |
|----|------|
| 개요 | 대회 요약, 팀 구성 정책, 공지사항 |
| 평가 | 평가 지표, 점수 비중 바 차트, 제출 제한 |
| 일정 | 마일스톤 타임라인 (현재 단계 펄스 하이라이트) |
| 상금 | 순위별 상금 + 총 상금 |
| 팀 | 해커톤 팀 목록 → `/camp` 연결 |
| 제출 | 단계별 스텝퍼 + 체크리스트 모달 + 포스트잇 메모 |
| 리더보드 | 순위 테이블 + 팀 점수 변동 라인 차트 |
| **투표** | 참가자 투표 (30% 반영) — 별점 + 커뮤니티 결과 시각화 |

### 글로벌 랭킹 (`/rankings`)
- 금/은/동 그라데이션 포디움 (높이 차이로 순위 시각화)
- 전체 해커톤 누적 점수 테이블
- 기간 필터 (전체 / 최근 30일 / 최근 1년)

### 팀원 모집 (`/camp`)
- **스킬 여권** — 내 역할 등록 시 나를 찾는 팀 자동 하이라이트
- **🎰 슬롯머신 랜덤 팀 매칭** — 팀 이름들이 돌다 멈추며 한 팀 추천
- 팀 카드: 하트 토글 (❤️ / 🤍), 스킬 매칭 배지
- **내 팀 공고 관리 모달** — 모집 상태 토글 / 팀 정보 수정 / 공고 삭제
- 해커톤별 필터 탭

### 내 활동 대시보드 (`/my`)
- 통계 카드 4종 (제출 횟수 / 생성한 팀 / 획득 배지 / 북마크)
- **GitHub 스타일 활동 히트맵** — 52주 × 7일 제출 이력 시각화
- **RPG 배지 시스템**
  - 전체 달성률 그라데이션 바
  - 미획득 배지마다 XP 진행바 (`3/5 XP`)
  - 배지 카드 클릭 → 앞/뒤 플립 (획득 날짜 표시)
- **🕵️ 탐정 노트** — 다크 테마 CASE FILE 패널
  - 해커톤별 케이스 번호 분류
  - 기획서 → 웹링크 → PDF 제출 타임라인
  - 터미널 스타일 아티팩트 로그
- 제출 내역 / 북마크 목록 / 내가 만든 팀

---

## 참가자 투표 시스템

- 해커톤 상세 → 투표 탭에서 팀별 별점(1~5) 평가
- 제출물(웹 데모 링크, PDF) 확인 후 투표
- localStorage로 중복 투표 방지 + 투표 변경 가능
- 커뮤니티 평균 집계 (시드 데이터 + 사용자 투표 합산)
- 투표 결과 → 애니메이션 프로그레스 바로 순위 표시
- 참가자 투표 30% + 심사위원 70% 가중 합산으로 최종 점수 결정

---

## 데이터 구조 (localStorage)

```
dakon_hackathons          해커톤 목록 (시드)
dakon_hackathon_details   해커톤 상세 (시드)
dakon_teams               팀 목록 (시드 + 사용자 생성)
dakon_leaderboards        리더보드 (시드)
dakon_submissions         제출 내역
dakon_bookmarks           북마크한 hackathonSlug 배열
dakon_my_skill            내 스킬 여권
dakon_cheers              팀별 응원 수 { teamCode: count }
dakon_my_cheers           내가 응원한 팀 목록 (토글용)
dakon_badges              획득한 배지 목록
dakon_notes               해커톤별 개인 메모
dakon_votes               내 투표 기록 { slug: { teamName: stars } }
dakon_community_votes     커뮤니티 투표 집계 (시드 + 누적)
```

초기 로드 시 `dakon_` 키가 없으면 시드 데이터로 자동 초기화.

---

## 배지 시스템

| 배지 | 조건 | XP 진행도 |
|------|------|-----------|
| 🥚 첫 제출 | 첫 번째 제출 완료 | 제출 0/1 |
| 🔥 연속 참가 | 3개 이상 해커톤 참가 | 참가 N/3 |
| 👑 팀 리더 | 팀 생성 1회 이상 | 팀 0/1 |
| 🏅 상위 10% | 리더보드 상위 10% 진입 | — |
| 🌟 5회 참가 | 누적 5개 해커톤 참가 | 제출 N/5 |

---

## 테스트

Jest 기반 단위 + 통합 테스트 46개 (0.8초 완료)

```
Seed 초기화          2개
Hackathons           4개
Teams                5개  (추가/수정/삭제/상태변경)
Leaderboards         4개
Submissions          4개
Bookmarks            4개
Skill Passport       3개
Cheers 하트 토글     4개
Badges               5개
Notes                4개
Votes 투표 시스템    5개
통합 시나리오        1개  (11단계 전체 플로우)
```

```bash
npm test
```

---

## 디렉토리 구조

```
src/
├── app/
│   ├── page.tsx                    # 메인 (온보딩)
│   ├── hackathons/
│   │   ├── page.tsx                # 해커톤 목록 + Explorer 뷰
│   │   └── [slug]/page.tsx         # 해커톤 상세 (8탭)
│   ├── rankings/page.tsx           # 글로벌 랭킹
│   ├── camp/page.tsx               # 팀원 모집 + 슬롯머신
│   └── my/page.tsx                 # 내 활동 대시보드
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx              # 스티키 네비 + 긴급 배너
│   │   └── Footer.tsx
│   └── ui/
│       ├── Badge.tsx               # StatusBadge, TagBadge
│       ├── Countdown.tsx           # 실시간 카운트다운
│       └── Skeleton.tsx            # 로딩 스켈레톤
├── data/
│   └── seed.ts                     # 시드 데이터 (해커톤 3개, 팀 5개, 리더보드 2개)
├── lib/
│   └── localStorage.ts             # 전체 CRUD 유틸
├── types/
│   └── index.ts                    # TypeScript 타입 정의
└── __tests__/
    ├── setup.ts                    # localStorage mock
    └── localStorage.test.ts        # 46개 테스트
```
