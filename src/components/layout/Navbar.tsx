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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
        <div className="bg-red-500 text-white text-sm text-center py-2 px-4 font-semibold">
          ⚠️ 북마크한 &quot;{urgentHackathon}&quot; 마감이 24시간 이내입니다!
        </div>
      )}
      <nav className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-white border-b border-gray-100'}`}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">D</span>
            </div>
            <span className="font-black text-xl text-gray-900 tracking-tight">Dakon</span>
          </Link>

          <ul className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith(link.href)
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/hackathons"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              참가하기
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="메뉴"
          >
            {menuOpen ? (
              <span className="block text-xl leading-none">✕</span>
            ) : (
              <div className="space-y-1.5">
                <span className="block w-5 h-0.5 bg-current" />
                <span className="block w-5 h-0.5 bg-current" />
                <span className="block w-5 h-0.5 bg-current" />
              </div>
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center py-3 text-sm font-medium border-b border-gray-50 last:border-0 ${
                  pathname.startsWith(link.href) ? 'text-blue-700' : 'text-gray-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/hackathons"
              onClick={() => setMenuOpen(false)}
              className="mt-3 block w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg text-center"
            >
              참가하기
            </Link>
          </div>
        )}
      </nav>
    </>
  )
}
