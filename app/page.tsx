'use client'

import { useEffect, useState, useRef } from 'react'
import './globals.css'
import NotificationList from './components/NotificationList'
import SetupGuide from './components/SetupGuide'

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

  // 同じステップの既存ログを success/error で置き換える
  const updateStepLog = (step: string, status: 'success' | 'error', message: string) => {
    setConnectionLogs((prev) => {
      const filtered = prev.filter((log) => log.step !== step)
      return [...filtered, { step, status, message, timestamp: new Date() }]
    })
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
          // OneSignal SDKが既に初期化されている場合、User.PushSubscriptionが利用可能
          try {
            // 既に初期化されているかどうかを確認
            const isAlreadyInitialized = 
              window.OneSignal.User?.PushSubscription !== undefined
            
            if (isAlreadyInitialized) {
              // 既に初期化されている場合は、Service Worker復元を待ってから状態を確認
              addLog('SDK読み込み', 'success', 'OneSignal SDKが読み込まれました')
              addLog('初期化', 'success', 'OneSignalは既に初期化されています')
              addLog('接続状態確認', 'processing', 'プッシュ通知の状態を確認しています...')
              
              await new Promise(resolve => setTimeout(resolve, 1500))

              const updateUI = (isSub: boolean) => {
                setIsSubscribed(isSub)
                setSubscriptionStatus(isSub ? '✓ プッシュ通知が有効です' : 'プッシュ通知が無効です')
                updateStepLog('接続状態確認', 'success', isSub ? 'プッシュ通知は有効です' : 'プッシュ通知は無効です')
              }

              const changeListener = () => {
                updateUI(window.OneSignal.User?.PushSubscription?.optedIn ?? false)
              }
              window.OneSignal.User?.PushSubscription?.addEventListener?.('change', changeListener)

              let isSub = window.OneSignal.User.PushSubscription.optedIn
              updateUI(isSub)

              setTimeout(() => {
                const refreshed = window.OneSignal.User?.PushSubscription?.optedIn ?? false
                if (refreshed !== isSub) updateUI(refreshed)
              }, 3000)

              setIsLoading(false)
              isInitializedRef.current = true
              return
            }
          } catch (e) {
            // エラーが発生した場合は待機を継続
          }

          addLog('SDK読み込み', 'success', 'OneSignal SDKが読み込まれました')
          addLog('初期化', 'success', 'layoutでOneSignalDeferredにより初期化済み')
          addLog('接続状態確認', 'processing', 'プッシュ通知の状態を確認しています...')

          // layoutのOneSignalDeferredで初期化されるまで待機（Service Worker復元に時間がかかるため長めに）
          await new Promise(resolve => setTimeout(resolve, 1500))

          const updateSubscriptionUI = (isSubscribed: boolean) => {
            setIsSubscribed(isSubscribed)
            setSubscriptionStatus(
              isSubscribed ? '✓ プッシュ通知が有効です' : 'プッシュ通知が無効です'
            )
            updateStepLog(
              '接続状態確認',
              'success',
              isSubscribed ? 'プッシュ通知は有効です' : 'プッシュ通知は無効です'
            )
          }

          // 購読変更を監視（ページ再読み込み時のService Worker復元で状態が遅れて反映されるため）
          const changeListener = () => {
            const isSub = window.OneSignal.User?.PushSubscription?.optedIn ?? false
            updateSubscriptionUI(isSub)
          }
          window.OneSignal.User?.PushSubscription?.addEventListener?.('change', changeListener)

          // 現在の購読状態を確認
          let isCurrentlySubscribed = false
          try {
            if (window.OneSignal.User?.PushSubscription) {
              isCurrentlySubscribed = window.OneSignal.User.PushSubscription.optedIn
            } else if (window.OneSignal.isPushNotificationsEnabled) {
              isCurrentlySubscribed = await window.OneSignal.isPushNotificationsEnabled()
            }
          } catch (e) {
            console.warn('購読状態の確認でエラー:', e)
            isCurrentlySubscribed = window.OneSignal.Notifications?.permission === 'granted'
          }

          updateSubscriptionUI(isCurrentlySubscribed)

          // 復元がさらに遅れる場合のフォールバック（3秒後にもう一度確認）
          setTimeout(() => {
            try {
              const isSub = window.OneSignal.User?.PushSubscription?.optedIn ?? false
              updateSubscriptionUI(isSub)
            } catch {
              updateSubscriptionUI(false)
            }
          }, 3000)

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
            await new Promise(resolve => setTimeout(resolve, 1500))
            
            const updateUI = (isSub: boolean) => {
              setIsSubscribed(isSub)
              setSubscriptionStatus(isSub ? '✓ プッシュ通知が有効です' : 'プッシュ通知が無効です')
              updateStepLog('接続状態確認', 'success', isSub ? 'プッシュ通知は有効です' : 'プッシュ通知は無効です')
            }
            window.OneSignal.User?.PushSubscription?.addEventListener?.('change', () => {
              updateUI(window.OneSignal.User?.PushSubscription?.optedIn ?? false)
            })
            
            let isCurrentlySubscribed = window.OneSignal.User?.PushSubscription?.optedIn ?? false
            if (!window.OneSignal.User?.PushSubscription && window.OneSignal.Notifications) {
              isCurrentlySubscribed = window.OneSignal.Notifications.permission === 'granted'
            }
            updateUI(isCurrentlySubscribed)
            
            setTimeout(() => {
              const refreshed = window.OneSignal.User?.PushSubscription?.optedIn ?? false
              if (refreshed !== isCurrentlySubscribed) updateUI(refreshed)
            }, 3000)
          } catch (e) {
            addLog('接続状態確認', 'error', `状態の確認に失敗しました: ${e instanceof Error ? e.message : '不明なエラー'}`)
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
      
      // optIn(): トークンがない場合は許可プロンプトを表示、ある場合は購読状態に設定
      await window.OneSignal.User.PushSubscription.optIn()
      
      addLog('購読処理', 'processing', 'ブラウザの許可を待機中...')
      
      // 購読変更を監視（ユーザーが許可/拒否したら即座に反映）
      let fallbackTimer: ReturnType<typeof setTimeout> | null = null
      const changeListener = () => {
        const isCurrentlySubscribed =
          window.OneSignal.User?.PushSubscription?.optedIn ?? false
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
        if (fallbackTimer) clearTimeout(fallbackTimer)
        window.OneSignal.User.PushSubscription.removeEventListener?.('change', changeListener)
      }

      window.OneSignal.User?.PushSubscription?.addEventListener?.('change', changeListener)

      // イベントが来ない場合のフォールバック（2秒後に状態を確認）
      fallbackTimer = setTimeout(changeListener, 2000)
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
      
      // 新しいAPIを使用
      if (window.OneSignal.User?.PushSubscription?.optOut) {
        await window.OneSignal.User.PushSubscription.optOut()
      } else if (window.OneSignal.setSubscription) {
        // 後方互換性のため、古いAPIも試す
        await window.OneSignal.setSubscription(false)
      }
      
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

      <NotificationList />

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

      <SetupGuide />
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
