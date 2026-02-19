export default function SetupGuide() {
  return (
    <div className="info-section">
      <h2>セットアップ手順</h2>
      <p>
        1. OneSignalでアプリを作成し、<code>App ID</code>を取得してください
      </p>
      <p>
        2. 環境変数<code>NEXT_PUBLIC_ONESIGNAL_APP_ID</code>にApp IDを設定してください
      </p>
      <p>
        3. Vercelの環境変数設定で<code>NEXT_PUBLIC_ONESIGNAL_APP_ID</code>と
        <code>ONESIGNAL_REST_API_KEY</code>を追加してください
      </p>
      <p>
        4. HTTPSでアクセスしてください（プッシュ通知にはHTTPSが必要です）
      </p>
      <p>
        5. 通知一覧取得には<code>ONESIGNAL_REST_API_KEY</code>（REST API
        Key）が必要です
      </p>
    </div>
  )
}
