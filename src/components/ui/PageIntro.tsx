'use client'

import { useEffect, useState, useCallback } from 'react'

interface PageIntroProps {
  pageKey: string
  filename: string
  lines: string[]
  children: React.ReactNode
}

export default function PageIntro({ pageKey, filename, lines, children }: PageIntroProps) {
  const [done, setDone] = useState(false)
  const [lineIdx, setLineIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [displayed, setDisplayed] = useState<string[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = sessionStorage.getItem(`dakon_intro_${pageKey}`)
      if (seen) setDone(true)
    }
  }, [pageKey])

  const finish = useCallback(() => {
    sessionStorage.setItem(`dakon_intro_${pageKey}`, '1')
    setDone(true)
  }, [pageKey])

  useEffect(() => {
    if (done) return
    if (lineIdx >= lines.length) {
      const t = setTimeout(finish, 600)
      return () => clearTimeout(t)
    }
    const line = lines[lineIdx]
    if (charIdx < line.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), 38)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setDisplayed((d) => [...d, line])
        setLineIdx((l) => l + 1)
        setCharIdx(0)
      }, 320)
      return () => clearTimeout(t)
    }
  }, [done, lineIdx, charIdx, lines, finish])

  if (done) return <>{children}</>

  const currentLine = lineIdx < lines.length ? lines[lineIdx].slice(0, charIdx) : ''
  const isLast = (i: number) => i === displayed.length - 1 && lineIdx >= lines.length

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="max-w-lg w-full mx-4">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl font-mono">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-xs text-gray-500">{filename}</span>
          </div>
          <div className="space-y-3 text-gray-300 text-lg leading-relaxed">
            {displayed.map((line, i) => (
              <p key={i} className={isLast(i) ? 'text-blue-400 font-semibold' : ''}>
                {line}
              </p>
            ))}
            {lineIdx < lines.length && (
              <p>
                {currentLine}
                <span className="animate-pulse">▌</span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={finish}
          className="mt-6 w-full text-center text-sm text-gray-600 hover:text-gray-400 transition-colors"
        >
          건너뛰기 →
        </button>
      </div>
    </div>
  )
}
