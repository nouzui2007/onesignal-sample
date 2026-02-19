'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getReadNotificationIds,
  markNotificationAsRead,
  markNotificationFromUrl,
} from '@/lib/notificationReadState'

export interface NotificationItem {
  id: string
  title?: string
  body?: string
  name?: string
  queuedAt: number
  successful?: number
  converted?: number
  failed?: number
  canceled?: boolean
}

export default function NotificationList() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadNotificationIds())

  useEffect(() => {
    markNotificationFromUrl()
    setReadIds(getReadNotificationIds())
  }, [])

  const handleMarkAsRead = useCallback((id: string) => {
    markNotificationAsRead(id)
    setReadIds(getReadNotificationIds())
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notifications?limit=20')
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '取得に失敗しました')
      }
      const items: NotificationItem[] = (data.notifications || []).map((n: any) => ({
        id: n.id,
        title: n.headings?.en ?? n.headings?.ja ?? n.name,
        body: n.contents?.en ?? n.contents?.ja,
        name: n.name,
        queuedAt: n.queued_at,
        successful: n.successful,
        converted: n.converted,
        failed: n.failed,
        canceled: n.canceled,
      }))
      setNotifications(items)
    } catch (e) {
      setError(e instanceof Error ? e.message : '取得に失敗しました')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="notifications-section">
      <h2>過去のプッシュ通知</h2>
      <button
        className="button secondary"
        onClick={fetchNotifications}
        disabled={loading}
      >
        {loading ? '取得中...' : '通知一覧を取得'}
      </button>
      {error && <p className="notifications-error">{error}</p>}
      {notifications.length > 0 && (
        <div className="notifications-list">
          {notifications.map((n) => {
            const isRead = readIds.has(n.id)
            return (
              <div
                key={n.id}
                className={`notification-item ${isRead ? 'notification-read' : 'notification-unread'}`}
                onClick={() => handleMarkAsRead(n.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleMarkAsRead(n.id)}
              >
                <div className="notification-header">
                  <span className="notification-badge" aria-label={isRead ? '既読' : '未読'}>
                    {isRead ? '既読' : '未読'}
                  </span>
                  <div className="notification-title">
                    {n.title || n.name || '(タイトルなし)'}
                  </div>
                </div>
                {n.body && <div className="notification-body">{n.body}</div>}
                <div className="notification-meta">
                  {new Date(n.queuedAt * 1000).toLocaleString('ja-JP')}
                  {n.successful != null && ` ・ 送信成功: ${n.successful}`}
                  {n.converted != null && n.converted > 0 && ` ・ クリック: ${n.converted}`}
                  {n.canceled && ' ・ キャンセル済み'}
                </div>
                {!isRead && <p className="notification-hint">クリックで既読にします</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
