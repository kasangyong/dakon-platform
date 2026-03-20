'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getBookmarks, getHackathons } from '@/lib/localStorage'

const NAV_LINKS = [
  { href: '/hackathons', label: '해커톤' },
  { href: '/camp', label: '팀원 모집' },
  { href: '/rankings', label: '랭킹' },
  { href: '/my', label: '내 활동' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [urgentHackathon, setUrgentHackathon] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const bookmarks = getBookmarks()
    const hackathons = getHackathons()
    const now = Date.now()
    const urgent = hackathons.find((h) => {
      if (!bookmarks.includes(h.slug)) return false
      const deadline = new Date(h.period.submissionDeadlineAt).getTime()
      const diff = deadline - now
      return diff > 0 && diff < 24 * 60 * 60 * 1000
    })
    setUrgentHackathon(urgent?.title ?? null)
  }, [pathname])

  return (
    <>
      {urgentHackathon && (
        <div className="bg-red-500 text-white text-sm text-center py-2 px-4 font-medium">
          ⚠️ 북마크한 해커톤 &quot;{urgentHackathon}&quot; 마감이 24시간 이내입니다!
        </div>
      )}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-xl text-indigo-600 dark:text-indigo-400 tracking-tight">
            Dakon
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith(link.href)
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="메뉴"
          >
            <span className="block w-5 h-0.5 bg-current mb-1" />
            <span className="block w-5 h-0.5 bg-current mb-1" />
            <span className="block w-5 h-0.5 bg-current" />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 pb-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block py-3 text-sm font-medium border-b border-gray-100 dark:border-gray-800 ${
                  pathname.startsWith(link.href)
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </>
  )
}
