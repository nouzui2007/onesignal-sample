import { NextRequest, NextResponse } from 'next/server'

interface OneSignalNotification {
  id: string
  name?: string
  contents?: { en?: string; [key: string]: string | undefined }
  headings?: { en?: string; [key: string]: string | undefined }
  queued_at: number
  send_after?: number
  completed_at?: number
  successful?: number
  converted?: number
  failed?: number
  errored?: number
  canceled?: boolean
}

interface OneSignalResponse {
  total_count: number
  offset: number
  limit: number
  notifications: OneSignalNotification[]
}

export async function GET(request: NextRequest) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY

  if (!appId || !restApiKey) {
    return NextResponse.json(
      {
        error: 'ONESIGNAL_REST_API_KEY が設定されていません。Keys & IDs から REST API Key を取得して環境変数に設定してください。',
      },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 50)
  const offset = Number(searchParams.get('offset')) || 0

  try {
    const url = new URL('https://api.onesignal.com/notifications')
    url.searchParams.set('app_id', appId)
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('offset', String(offset))

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Key ${restApiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('OneSignal API error:', res.status, errorText)
      return NextResponse.json(
        { error: `OneSignal API エラー: ${res.status}`, details: errorText },
        { status: res.status }
      )
    }

    const data: OneSignalResponse = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      {
        error: '通知の取得に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー',
      },
      { status: 500 }
    )
  }
}
