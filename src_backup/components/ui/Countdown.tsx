'use client'

import { useEffect, useState } from 'react'

function calcRemaining(target: string) {
  const diff = new Date(target).getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds }
}

export default function Countdown({ target, label = '마감' }: { target: string; label?: string }) {
  const [remaining, setRemaining] = useState(calcRemaining(target))

  useEffect(() => {
    const interval = setInterval(() => setRemaining(calcRemaining(target)), 1000)
    return () => clearInterval(interval)
  }, [target])

  if (!remaining) {
    return <span className="text-xs text-gray-400">마감됨</span>
  }

  const isUrgent = remaining.days === 0

  return (
    <span className={`text-xs font-mono font-medium ${isUrgent ? 'text-red-500 animate-pulse' : 'text-gray-500 dark:text-gray-400'}`}>
      {label}{' '}
      {remaining.days > 0
        ? `D-${remaining.days}`
        : `${String(remaining.hours).padStart(2, '0')}:${String(remaining.minutes).padStart(2, '0')}:${String(remaining.seconds).padStart(2, '0')}`}
    </span>
  )
}
