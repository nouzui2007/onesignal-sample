'use client'

import { useEffect, useState } from 'react'
import './globals.css'

export default function Home() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('初期化中...')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    const initOneSignal = async () => {
      try {
        // OneSignal SDKが読み込まれるまで待機
        if (typeof window !== 'undefined' && window.OneSignal) {
          // OneSignalの初期化
          // 注意: 実際のアプリIDは環境変数から取得してください
          const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || 'YOUR_ONESIGNAL_APP_ID'
          
          await window.OneSignal.init({
            appId: appId,
            notifyButton: {
              enable: false, // カスタムボタンを使用するため無効化
            },
            allowLocalhostAsSecureOrigin: true, // ローカル開発用
          })

          // 現在の購読状態を確認
          const isCurrentlySubscribed = await window.OneSignal.isPushNotificationsEnabled()
          setIsSubscribed(isCurrentlySubscribed)
          setSubscriptionStatus(
            isCurrentlySubscribed
              ? '✓ プッシュ通知が有効です'
              : 'プッシュ通知が無効です'
          )
          setIsLoading(false)
        } else {
          // OneSignal SDKがまだ読み込まれていない場合、少し待って再試行
          setTimeout(initOneSignal, 100)
        }
      } catch (error) {
        console.error('OneSignal初期化エラー:', error)
        setSubscriptionStatus('エラー: OneSignalの初期化に失敗しました')
        setIsLoading(false)
      }
    }

    initOneSignal()
  }, [])

  const handleSubscribe = async () => {
    try {
      setIsLoading(true)
      await window.OneSignal.Slidedown.promptPush()
      
      // 購読状態を再確認
      const isCurrentlySubscribed = await window.OneSignal.isPushNotificationsEnabled()
      setIsSubscribed(isCurrentlySubscribed)
      setSubscriptionStatus(
        isCurrentlySubscribed
          ? '✓ プッシュ通知が有効です'
          : 'プッシュ通知が無効です'
      )
      setIsLoading(false)
    } catch (error) {
      console.error('購読エラー:', error)
      setSubscriptionStatus('エラー: プッシュ通知の有効化に失敗しました')
      setIsLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    try {
      setIsLoading(true)
      await window.OneSignal.setSubscription(false)
      setIsSubscribed(false)
      setSubscriptionStatus('プッシュ通知が無効です')
      setIsLoading(false)
    } catch (error) {
      console.error('購読解除エラー:', error)
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
