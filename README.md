# アパート管理システム (Cloudflare Workers 版)

物件・部屋・入居者・家賃レシートを管理する Web アプリです。
以前は Electron + Next.js + tRPC + Prisma(SQLite) のデスクトップアプリでしたが、
**Cloudflare Workers / D1** 上で動作するよう移植しました。

## 構成

| レイヤー | 旧 | 新 |
| --- | --- | --- |
| UI | Next.js (静的エクスポート) + Electron | Next.js 静的エクスポート → Workers Static Assets |
| API | tRPC over IPC (`ipcMain` / `window.trpc`) | tRPC over HTTP (`/api/trpc`, fetch adapter) |
| DB | Prisma + SQLite (ローカルファイル) | Drizzle ORM + Cloudflare D1 |
| 認証 | なし (ローカルのみ) | Cloudflare Access (Zero Trust) |
| 印刷 | `window.print()` | `window.print()` (ブラウザ印刷 / PDF) |

```
renderer/          Next.js (pages router)。`next export` で完全な静的サイトになる
worker/            Cloudflare Worker: tRPC API + D1 + 静的アセット配信
  index.ts         fetch ハンドラ (/api/trpc 以外は静的アセットへ)
  auth.ts          Cloudflare Access の JWT 検証
  schema.ts        Drizzle スキーマ (D1)
  routers/         tRPC ルーター (apartment / room / tenant / invoice)
migrations/        D1 マイグレーション (drizzle-kit generate の出力)
wrangler.jsonc     Worker / 静的アセット / D1 のバインディング
```

## セットアップ

```bash
yarn install
```

### 1. D1 データベースを作成

```bash
npx wrangler login                       # Cloudflare アカウントで認証
npx wrangler d1 create apartment-manager # 出力された database_id を控える
```

`wrangler.jsonc` の `d1_databases[0].database_id` を、上で出力された ID に置き換えてください。

### 2. マイグレーション適用

```bash
yarn db:migrate:local    # ローカル (`.wrangler/` 以下に SQLite が作られる)
yarn db:migrate          # 本番 D1
```

スキーマを変更したときは:

```bash
yarn db:generate         # worker/schema.ts から migrations/*.sql を生成
yarn db:migrate:local
```

### 3. ローカル起動

```bash
yarn dev                 # renderer をビルドして wrangler dev (http://localhost:8787)
```

UI をホットリロードしたい場合:

```bash
yarn dev:worker                                                   # 別ターミナル
NEXT_PUBLIC_API_URL=http://localhost:8787/api/trpc yarn dev:renderer
# Worker 側は CORS 許可が必要: wrangler dev --var ALLOWED_ORIGIN:http://localhost:3000
```

### 4. デプロイ

```bash
yarn deploy              # ビルド + wrangler deploy
```

## Cloudflare Access で保護する

このアプリには元々認証がないため、公開する場合は必ず手前に認証を置いてください。
推奨は Cloudflare Zero Trust の **Access** です。

1. Zero Trust ダッシュボード → Access → Applications → **Self-hosted** を追加
2. 対象ホスト名に Worker のドメイン (`apartment-manager.<account>.workers.dev` など) を指定
3. ポリシーを「自分のメールアドレスだけ許可」などで作成
4. アプリケーションの **Audience (AUD) Tag** をコピーし、Worker の環境変数に設定

```bash
npx wrangler secret put ACCESS_TEAM_DOMAIN   # 例: your-team.cloudflareaccess.com
npx wrangler secret put ACCESS_AUD           # Audience Tag
```

両方を設定すると、Worker 自身も `Cf-Access-Jwt-Assertion` ヘッダを検証します。
これにより、Access を経由せず `*.workers.dev` に直接アクセスしても API は 401 を返します
(Access のアプリケーション設定で workers.dev を無効化するのが本来の運用ですが、二重の防御になります)。

## 既存 SQLite データの移行

旧アプリの `database.db` (Prisma/SQLite) からデータを移す場合:

```bash
# 旧 DB から SQL ダンプを作る (旧リポジトリ側で)
sqlite3 database.db .dump > dump.sql

# D1 (ローカル) に流し込む
npx wrangler d1 execute apartment-manager --local --file=dump.sql
# 本番へ
npx wrangler d1 execute apartment-manager --remote --file=dump.sql
```

日時は Prisma と同じ UNIX ミリ秒で保持しているため、変換は不要です。
