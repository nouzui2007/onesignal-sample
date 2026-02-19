import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OneSignal Push Notification Sample',
  description: 'OneSignal Web Push通知のサンプルアプリケーション',
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
                  appId: "5de708c8-1532-4889-a647-6b7659c93dff",
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
