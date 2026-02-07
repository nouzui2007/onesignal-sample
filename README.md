# OneSignal Web Push通知サンプル

OneSignalを使用したWebプッシュ通知のサンプルアプリケーションです。

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **デプロイ先**: Vercel
- **プッシュ通知**: OneSignal Web SDK

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. OneSignalの設定

1. [OneSignal](https://onesignal.com/)でアカウントを作成
2. 新しいWebアプリを作成
3. App IDを取得
4. 環境変数ファイル `.env.local` を作成：

```bash
NEXT_PUBLIC_ONESIGNAL_APP_ID=your-onesignal-app-id
```

### 3. ローカル開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## Vercelへのデプロイ

### 方法1: Vercel CLIを使用

1. Vercel CLIをインストール（未インストールの場合）：
```bash
npm i -g vercel
```

2. プロジェクトをデプロイ：
```bash
vercel
```

3. 本番環境にデプロイ：
```bash
vercel --prod
```

### 方法2: GitHub連携を使用

1. このリポジトリをGitHubにプッシュ
2. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
3. "New Project"をクリック
4. GitHubリポジトリを選択
5. プロジェクト設定：
   - **Framework Preset**: Next.js（自動検出されるはず）
   - **Root Directory**: `./`（デフォルト）
   - **Build Command**: `npm run build`（自動検出）
   - **Output Directory**: `.next`（自動検出）
   - **Install Command**: `npm install`（自動検出）

### 環境変数の設定

Vercelダッシュボードで環境変数を設定：

1. プロジェクトの "Settings" → "Environment Variables" に移動
2. 以下の環境変数を追加：
   - **Name**: `NEXT_PUBLIC_ONESIGNAL_APP_ID`
   - **Value**: あなたのOneSignal App ID
   - **Environment**: Production, Preview, Development すべてにチェック

### Vercelの自動検出設定

VercelはNext.jsプロジェクトを自動的に検出します。以下の情報が自動的に設定されます：

- **Framework**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install` または `yarn install`

`vercel.json`ファイルは明示的な設定が必要な場合にのみ使用します。通常は不要ですが、カスタム設定が必要な場合に備えて含めています。

## 重要な注意事項

1. **HTTPS必須**: プッシュ通知はHTTPS環境でのみ動作します。Vercelは自動的にHTTPSを提供します。

2. **OneSignal設定**: OneSignalダッシュボードで、サイトURLにVercelのドメインを追加してください。

3. **Service Worker**: OneSignal SDKが自動的にService Workerを登録します。

4. **ブラウザ対応**: プッシュ通知は以下のブラウザでサポートされています：
   - Chrome (デスクトップ & Android)
   - Firefox (デスクトップ & Android)
   - Edge
   - Safari (macOS & iOS 16.4+)

## プロジェクト構造

```
onesignal-sample/
├── app/
│   ├── layout.tsx      # ルートレイアウト（OneSignal SDK読み込み）
│   ├── page.tsx        # メインページ（プッシュ通知UI）
│   └── globals.css     # グローバルスタイル
├── next.config.js      # Next.js設定
├── package.json        # 依存関係
├── tsconfig.json     # TypeScript設定
├── vercel.json         # Vercel設定（オプション）
└── README.md          # このファイル
```

## トラブルシューティング

### プッシュ通知が動作しない場合

1. HTTPSでアクセスしているか確認
2. OneSignal App IDが正しく設定されているか確認
3. ブラウザのコンソールでエラーを確認
4. OneSignalダッシュボードでサイトURLが正しく設定されているか確認

### ビルドエラーが発生する場合

```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
```

## ライセンス

MIT
