// OneSignal SDKの型定義
interface OneSignalSDK {
  init(options: {
    appId: string
    notifyButton?: {
      enable: boolean
    }
    allowLocalhostAsSecureOrigin?: boolean
  }): Promise<void>
  User: {
    PushSubscription: {
      optedIn: boolean
      id?: string
      optIn(): Promise<void>
      optOut(): Promise<void>
    }
    getSubscriptionDataList?(): Promise<Array<{ id: string }>>
  }
  Notifications: {
    permission: NotificationPermission
    requestPermission(): Promise<NotificationPermission>
    addEventListener(event: string, callback: (event: any) => void): void
    removeEventListener(event: string, callback: (event: any) => void): void
  }
  Slidedown: {
    promptPush(): Promise<void>
  }
  // 後方互換性のためのメソッド（存在しない場合もある）
  isPushNotificationsEnabled?(): Promise<boolean>
  setSubscription?(enabled: boolean): Promise<void>
}

declare global {
  interface Window {
    OneSignal: OneSignalSDK
  }
}

export {}
