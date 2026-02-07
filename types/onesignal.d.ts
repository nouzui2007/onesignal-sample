// OneSignal SDKの型定義
interface OneSignalSDK {
  init(options: {
    appId: string
    notifyButton?: {
      enable: boolean
    }
    allowLocalhostAsSecureOrigin?: boolean
  }): Promise<void>
  isPushNotificationsEnabled(): Promise<boolean>
  setSubscription(enabled: boolean): Promise<void>
  Slidedown: {
    promptPush(): Promise<void>
  }
}

declare global {
  interface Window {
    OneSignal: OneSignalSDK
  }
}

export {}
