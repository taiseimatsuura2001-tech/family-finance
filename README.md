# FamilyFinance - 家計管理アプリケーション

家族（2名）の収支を効率的に管理し、家計の見える化を実現する家計管理アプリケーションです。

## 主な機能

- 🔐 **安全な認証**: マジックリンク認証とGoogle OAuth認証
- 📊 **収支管理**: 収入・支出の登録、編集、削除
- 📈 **データ分析**: グラフやレポートによる可視化
- 💰 **予算管理**: カテゴリー別の予算設定とアラート
- 🎯 **目標設定**: 貯金目標の設定と進捗管理
- 🔒 **セキュリティ**: ホワイトリスト方式による2名限定アクセス

## 技術スタック

- **フロントエンド**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **認証**: NextAuth.js
- **データベース**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **デプロイ**: Vercel

## セットアップ

### 1. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
# Database Configuration
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Email Configuration (for Magic Link)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="..."
EMAIL_SERVER_PASSWORD="..."
EMAIL_FROM="..."

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Whitelisted Users
USER1_EMAIL="user1@example.com"
USER2_EMAIL="user2@example.com"

# Cron Secret
CRON_SECRET="..."
```

詳細は`.env.example`を参照してください。

### 2. 依存関係のインストール

```bash
npm install
```

### 3. データベースのセットアップ

```bash
# Prisma Clientの生成
npm run db:generate

# データベースにスキーマをプッシュ
npm run db:push

# または、マイグレーションを実行
npm run db:migrate
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## データベーススキーマ

詳細は`prisma/schema.prisma`を参照してください。

主なテーブル：
- `User`: ユーザー情報
- `Transaction`: 収支トランザクション
- `Category`: カテゴリー
- `Budget`: 予算
- `Goal`: 目標
- `AuditLog`: 監査ログ

## スクリプト

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# コードチェック
npm run lint

# コードフォーマット
npm run format

# Prisma関連
npm run db:generate    # Prisma Clientの生成
npm run db:push        # スキーマをプッシュ
npm run db:studio      # Prisma Studioを開く
npm run db:migrate     # マイグレーション実行
```

## プロジェクト構造

```
family-finance/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証関連ページ
│   ├── (dashboard)/       # ダッシュボード
│   └── api/               # API Routes
├── components/            # Reactコンポーネント
│   ├── ui/               # UIコンポーネント
│   ├── forms/            # フォームコンポーネント
│   └── charts/           # グラフコンポーネント
├── lib/                   # ライブラリ
│   ├── auth/             # 認証設定
│   ├── db/               # データベース
│   ├── api/              # APIクライアント
│   └── utils/            # ユーティリティ
├── types/                 # TypeScript型定義
└── prisma/               # Prisma設定
```

## セキュリティ

- OAuth 2.0 / OpenID Connect準拠の認証
- ホワイトリスト方式による2名限定アクセス
- HTTPS通信の強制
- データベース暗号化（AES-256）
- 監査ログによる操作記録

## 今後の実装予定

- [ ] データベース接続の完了
- [ ] トランザクションAPI実装
- [ ] カテゴリー管理機能
- [ ] レポート機能
- [ ] 予算管理機能
- [ ] グラフ表示機能

## ライセンス

Private Use Only

## 作成者

システム設計チーム
