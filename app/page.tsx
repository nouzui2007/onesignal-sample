'use client'

import { useEffect, useState, useRef } from 'react'
import './globals.css'

interface ConnectionLog {
  step: string
  status: 'pending' | 'processing' | 'success' | 'error'
  message: string
  timestamp: Date
}

export default function Home() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('初期化中...')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [connectionLogs, setConnectionLogs] = useState<ConnectionLog[]>([])
  const isInitializedRef = useRef(false)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)

  const addLog = (step: string, status: ConnectionLog['status'], message: string) => {
    setConnectionLogs((prev) => [
      ...prev,
      { step, status, message, timestamp: new Date() },
    ])
  }

  useEffect(() => {
    // 既に初期化済みの場合は何もしない
    if (isInitializedRef.current) {
      return
    }

    const initOneSignal = async () => {
      try {
        // OneSignal SDKが読み込まれるまで待機
        if (typeof window !== 'undefined' && window.OneSignal) {
          // 既に初期化されているかチェック
          // OneSignal SDKが既に初期化されている場合、isPushNotificationsEnabledが利用可能
          try {
            // 既に初期化されているかどうかを確認
            const isAlreadyInitialized = 
              window.OneSignal.isPushNotificationsEnabled !== undefined
            
            if (isAlreadyInitialized) {
              // 既に初期化されている場合は、状態を確認するだけ
              addLog('SDK読み込み', 'success', 'OneSignal SDKが読み込まれました')
              addLog('初期化', 'success', 'OneSignalは既に初期化されています')
              addLog('接続状態確認', 'processing', 'プッシュ通知の状態を確認しています...')
              
              const isCurrentlySubscribed = await window.OneSignal.isPushNotificationsEnabled()
              setIsSubscribed(isCurrentlySubscribed)
              setSubscriptionStatus(
                isCurrentlySubscribed
                  ? '✓ プッシュ通知が有効です'
                  : 'プッシュ通知が無効です'
              )
              addLog(
                '接続状態確認',
                'success',
                isCurrentlySubscribed
                  ? 'プッシュ通知は有効です'
                  : 'プッシュ通知は無効です'
              )
              setIsLoading(false)
              isInitializedRef.current = true
              return
            }
          } catch (e) {
            // エラーが発生した場合は初期化が必要
          }

          addLog('SDK読み込み', 'success', 'OneSignal SDKが読み込まれました')
          
          // OneSignalの初期化
          const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || 'YOUR_ONESIGNAL_APP_ID'
          
          if (appId === 'YOUR_ONESIGNAL_APP_ID') {
            addLog('App ID確認', 'error', 'App IDが設定されていません')
            setSubscriptionStatus('エラー: App IDが設定されていません')
            setIsLoading(false)
            isInitializedRef.current = true
            return
          }

          addLog('App ID確認', 'success', `App ID: ${appId.substring(0, 8)}...`)
          addLog('初期化', 'processing', 'OneSignalを初期化しています...')
          
          await window.OneSignal.init({
            appId: appId,
            notifyButton: {
              enable: false, // カスタムボタンを使用するため無効化
            },
            allowLocalhostAsSecureOrigin: true, // ローカル開発用
          })

          addLog('初期化', 'success', 'OneSignalの初期化が完了しました')
          addLog('接続状態確認', 'processing', 'プッシュ通知の状態を確認しています...')

          // 現在の購読状態を確認
          const isCurrentlySubscribed = await window.OneSignal.isPushNotificationsEnabled()
          setIsSubscribed(isCurrentlySubscribed)
          setSubscriptionStatus(
            isCurrentlySubscribed
              ? '✓ プッシュ通知が有効です'
              : 'プッシュ通知が無効です'
          )
          addLog(
            '接続状態確認',
            'success',
            isCurrentlySubscribed
              ? 'プッシュ通知は有効です'
              : 'プッシュ通知は無効です'
          )
          setIsLoading(false)
          isInitializedRef.current = true
        } else {
          // OneSignal SDKがまだ読み込まれていない場合、少し待って再試行
          retryCountRef.current += 1
          const currentRetry = retryCountRef.current
          
          if (currentRetry === 1) {
            addLog('SDK読み込み', 'pending', 'OneSignal SDKの読み込みを待機中...')
          } else if (currentRetry < 50) {
            addLog(
              'SDK読み込み',
              'processing',
              `OneSignal SDKの読み込みを待機中... (${currentRetry}回目)`
            )
          } else {
            addLog(
              'SDK読み込み',
              'error',
              'OneSignal SDKの読み込みに失敗しました（タイムアウト）'
            )
            setSubscriptionStatus('エラー: OneSignal SDKが読み込まれませんでした')
            setIsLoading(false)
            isInitializedRef.current = true
            return
          }
          
          retryTimeoutRef.current = setTimeout(initOneSignal, 100)
        }
      } catch (error) {
        console.error('OneSignal初期化エラー:', error)
        const errorMessage =
          error instanceof Error ? error.message : '不明なエラーが発生しました'
        
        // "SDK already initialized"エラーの場合は、既に初期化済みとして扱う
        if (errorMessage.includes('already initialized')) {
          addLog('初期化', 'success', 'OneSignalは既に初期化されています')
          addLog('接続状態確認', 'processing', 'プッシュ通知の状態を確認しています...')
          
          try {
            const isCurrentlySubscribed = await window.OneSignal.isPushNotificationsEnabled()
            setIsSubscribed(isCurrentlySubscribed)
            setSubscriptionStatus(
              isCurrentlySubscribed
                ? '✓ プッシュ通知が有効です'
                : 'プッシュ通知が無効です'
            )
            addLog(
              '接続状態確認',
              'success',
              isCurrentlySubscribed
                ? 'プッシュ通知は有効です'
                : 'プッシュ通知は無効です'
            )
          } catch (e) {
            addLog('接続状態確認', 'error', '状態の確認に失敗しました')
          }
        } else {
          addLog('初期化', 'error', `エラー: ${errorMessage}`)
          setSubscriptionStatus('エラー: OneSignalの初期化に失敗しました')
        }
        setIsLoading(false)
        isInitializedRef.current = true
      }
    }

    initOneSignal()

    // クリーンアップ関数
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }
  }, [])

  const handleSubscribe = async () => {
    try {
      setIsLoading(true)
      addLog('購読処理', 'processing', 'プッシュ通知の購読を開始しています...')
      
      await window.OneSignal.Slidedown.promptPush()
      
      addLog('購読処理', 'processing', 'ブラウザの許可を待機中...')
      
      // 少し待ってから状態を確認（ユーザーが許可/拒否を選択する時間を確保）
      setTimeout(async () => {
        // 購読状態を再確認
        const isCurrentlySubscribed = await window.OneSignal.isPushNotificationsEnabled()
        setIsSubscribed(isCurrentlySubscribed)
        setSubscriptionStatus(
          isCurrentlySubscribed
            ? '✓ プッシュ通知が有効です'
            : 'プッシュ通知が無効です'
        )
        addLog(
          '購読処理',
          isCurrentlySubscribed ? 'success' : 'error',
          isCurrentlySubscribed
            ? 'プッシュ通知の購読が完了しました'
            : 'プッシュ通知の購読が拒否されました'
        )
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('購読エラー:', error)
      const errorMessage =
        error instanceof Error ? error.message : '不明なエラーが発生しました'
      addLog('購読処理', 'error', `エラー: ${errorMessage}`)
      setSubscriptionStatus('エラー: プッシュ通知の有効化に失敗しました')
      setIsLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    try {
      setIsLoading(true)
      addLog('購読解除', 'processing', 'プッシュ通知の購読を解除しています...')
      
      await window.OneSignal.setSubscription(false)
      setIsSubscribed(false)
      setSubscriptionStatus('プッシュ通知が無効です')
      addLog('購読解除', 'success', 'プッシュ通知の購読を解除しました')
      setIsLoading(false)
    } catch (error) {
      console.error('購読解除エラー:', error)
      const errorMessage =
        error instanceof Error ? error.message : '不明なエラーが発生しました'
      addLog('購読解除', 'error', `エラー: ${errorMessage}`)
      setSubscriptionStatus('エラー: プッシュ通知の無効化に失敗しました')
      setIsLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>OneSignal Push Notification</h1>
      <p className="subtitle">Webプッシュ通知のサンプルアプリケーション</p>

      <div
        className={`status ${
          subscriptionStatus.includes('✓')
            ? 'subscribed'
            : subscriptionStatus.includes('エラー')
            ? 'error'
            : 'not-subscribed'
        }`}
      >
        {subscriptionStatus}
      </div>

      {!isSubscribed ? (
        <button
          className="button"
          onClick={handleSubscribe}
          disabled={isLoading}
        >
          {isLoading ? '処理中...' : 'プッシュ通知を有効にする'}
        </button>
      ) : (
        <button
          className="button"
          onClick={handleUnsubscribe}
          disabled={isLoading}
        >
          {isLoading ? '処理中...' : 'プッシュ通知を無効にする'}
        </button>
      )}

      <div className="connection-logs">
        <h2>接続ログ</h2>
        <div className="logs-container">
          {connectionLogs.length === 0 ? (
            <p className="no-logs">接続処理を開始しています...</p>
          ) : (
            connectionLogs.map((log, index) => (
              <div key={index} className={`log-item ${log.status}`}>
                <div className="log-header">
                  <span className="log-step">{log.step}</span>
                  <span className="log-status">{getStatusIcon(log.status)}</span>
                </div>
                <div className="log-message">{log.message}</div>
                <div className="log-time">
                  {log.timestamp.toLocaleTimeString('ja-JP')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="info-section">
        <h2>セットアップ手順</h2>
        <p>
          1. OneSignalでアプリを作成し、<code>App ID</code>を取得してください
        </p>
        <p>
          2. 環境変数<code>NEXT_PUBLIC_ONESIGNAL_APP_ID</code>にApp IDを設定してください
        </p>
        <p>
          3. Vercelの環境変数設定で<code>NEXT_PUBLIC_ONESIGNAL_APP_ID</code>を追加してください
        </p>
        <p>
          4. HTTPSでアクセスしてください（プッシュ通知にはHTTPSが必要です）
        </p>
      </div>
    </div>
  )
}

function getStatusIcon(status: ConnectionLog['status']): string {
  switch (status) {
    case 'success':
      return '✓'
    case 'error':
      return '✗'
    case 'processing':
      return '⟳'
    case 'pending':
      return '○'
    default:
      return '○'
  }
}
