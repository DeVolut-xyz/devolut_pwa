import { useEffect, useRef } from 'react'

type PullToRefreshOptions = {
  onRefresh: () => void
  enabled?: boolean
  thresholdPx?: number
  cooldownMs?: number
}

export function usePullToRefresh({
  onRefresh,
  enabled = true,
  thresholdPx = 60,
  cooldownMs = 1500,
}: PullToRefreshOptions) {
  const lastTriggerAt = useRef(0)
  const touchStartY = useRef<number | null>(null)
  const triggeredInGesture = useRef(false)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return
    }

    const trigger = () => {
      const now = Date.now()
      if (now - lastTriggerAt.current < cooldownMs) {
        return
      }
      lastTriggerAt.current = now
      onRefresh()
    }

    const onTouchStart = (event: TouchEvent) => {
      if (window.scrollY > 0) {
        return
      }
      touchStartY.current = event.touches[0]?.clientY ?? null
      triggeredInGesture.current = false
    }

    const onTouchMove = (event: TouchEvent) => {
      if (touchStartY.current === null || triggeredInGesture.current) {
        return
      }
      if (window.scrollY > 0) {
        return
      }
      const currentY = event.touches[0]?.clientY ?? 0
      if (currentY - touchStartY.current > thresholdPx) {
        triggeredInGesture.current = true
        trigger()
      }
    }

    const onTouchEnd = () => {
      touchStartY.current = null
      triggeredInGesture.current = false
    }

    const onWheel = (event: WheelEvent) => {
      if (window.scrollY > 0) {
        return
      }
      if (event.deltaY < -thresholdPx / 2) {
        trigger()
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('wheel', onWheel, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('wheel', onWheel)
    }
  }, [cooldownMs, enabled, onRefresh, thresholdPx])
}
