const STORAGE_KEY = 'onesignal_read_notification_ids'

export function getReadNotificationIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const ids = stored ? (JSON.parse(stored) as string[]) : []
    return new Set(ids)
  } catch {
    return new Set()
  }
}

export function markNotificationAsRead(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const ids = Array.from(getReadNotificationIds())
    if (!ids.includes(id)) {
      ids.push(id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    }
  } catch {
    // ignore
  }
}

export function isNotificationRead(id: string): boolean {
  return getReadNotificationIds().has(id)
}

export function markNotificationFromUrl(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const notificationId = params.get('notification_id')
  if (notificationId) {
    markNotificationAsRead(notificationId)
    // URL をクリーンアップ（オプション）
    params.delete('notification_id')
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }
}
