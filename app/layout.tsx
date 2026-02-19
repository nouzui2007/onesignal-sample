import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OneSignal Push Notification Sample',
  description: 'OneSignal Web Push通知のサンプルアプリケーション',
}

const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
if (!appId) {
  throw new Error(
    'NEXT_PUBLIC_ONESIGNAL_APP_ID が設定されていません。.env.local または環境変数に App ID を設定してください。'
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          defer
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.OneSignalDeferred = window.OneSignalDeferred || [];
              OneSignalDeferred.push(async function(OneSignal) {
                await OneSignal.init({
                  appId: "${appId}",
                });
              });
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
