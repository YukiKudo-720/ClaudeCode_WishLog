# 総合ウィッシュリスト/ログ管理 PWA 計画書

## 1. 目的

食・服・観光地など複数ジャンルの「行きたい / 欲しい / 体験したい」と「行った / 買った / 体験した」を **1 つの PWA で総合管理** する。スマホと PC で同期、画像なしでもまず軽快に動くスコープを v1 とする。

前 PJ `ClaudeApp_TravelSammary` で発生した **Spreadsheet 同期の遅さ・phantom 行・no-cors の書込確認不能** を解消するため、バックエンドは Firebase に置き換える。

参考: [.claude/docs/plan_another_project.md](.claude/docs/plan_another_project.md)

---

## 2. プロジェクト名・配置

**`ClaudeCode_WishLog`** (確定)

- ローカル: `c:\Users\guilt\Projects\ClaudeCode_WishLog\` (旧 `ClaudeCode_GlobalMemo` をリネーム)
- GitHub: `git@github.com:YukiKudo-720/ClaudeCode_WishLog.git` (旧 `ClaudeCode_GlobalMemo` をリネーム)
- 構成: **1 リポジトリ完結**。アプリコードはルート直下、計画/設定は `.claude/` 配下に共存

---

## 3. 技術スタック

| 層 | 採用 | 備考 |
|---|---|---|
| フロント | React 18 + Vite 6 + TypeScript + Tailwind 4 | 前 PJ 実績あり |
| ルーティング | react-router-dom v6 | 同上 |
| PWA | vite-plugin-pwa (autoUpdate) | 同上 |
| ローカル DB | Dexie.js (IndexedDB) + dexie-react-hooks liveQuery | オフラインキャッシュ |
| クラウド DB | **Firebase Firestore** | realtime 同期、複数端末 |
| 認証 | **Firebase Auth (Google プロバイダ)** | 単一ユーザー想定 |
| 画像 (v2) | **Firebase Storage** | v1 では未使用 |
| フォーム | react-hook-form + zod | 検証込み |
| アイコン | lucide-react | 軽量 |
| テスト | vitest + jsdom + @testing-library + fake-indexeddb | 前 PJ 実績 |
| 書体 | Noto Sans JP | |

### 同期戦略 (前 PJ の Lessons learned を反映)

- **書き込み**: Firestore に直接 set/update → 成功後に Dexie へも反映 (write-through)
- **読み取り**: Firestore `onSnapshot` で realtime → Dexie にミラー、UI は Dexie の liveQuery を購読 (オフラインでも即描画)
- **オフライン**: Firestore 組込みオフライン永続化を有効化。書込はキューされ、再接続時に自動 flush
- **競合**: `updatedAt` last-write-wins (前 PJ と同方針)
- **論理削除**: `deletedAt` セット (物理削除しない)
- **編集の頻度過多対策**: 編集中はローカル state のみ更新、保存ボタン押下で 1 回だけ Firestore に書く

---

## 4. データモデル

### 4.1 大カテゴリ (固定 8 種)

```ts
type ItemType =
  | 'food'        // 食 - レストラン・カフェ・食べたいもの・レシピ
  | 'place'       // 場所/観光 - 観光地・公園・街・施設
  | 'media'       // 作品 - 本・映画・アニメ・ゲーム・音楽
  | 'experience'  // 体験 - イベント・ライブ・アクティビティ
  | 'goods'       // モノ - 家電・雑貨・買いたい物
  | 'hobby'       // 趣味 - 趣味用品・コレクション
  | 'fashion'     // 服飾 - 服・靴・小物
  | 'other';      // その他

const TYPE_LABELS: Record<ItemType, string> = {
  food: '食', place: '場所/観光', media: '作品',
  experience: '体験', goods: 'モノ', hobby: '趣味',
  fashion: '服飾', other: 'その他',
};
```

### 4.2 ステータス

```ts
type Status = 'wish' | 'done';
// wish: やりたい/欲しい/行きたい
// done: やった/買った/行った
```

### 4.3 Item エンティティ

```ts
interface Item {
  id: string;                    // uuid v4
  type: ItemType;                // 大カテゴリ (固定 8 種)
  title: string;                 // 必須
  midCategory?: string;          // 中カテゴリ (大カテゴリごとのプリセット + ユーザー追加、任意)
  smallCategory?: string;        // 小カテゴリ (中カテゴリ配下、任意)
  status: Status;                // wish | done
  rating?: number;               // 1..5 (done 時に付ける想定)
  tags: string[];                // フラットタグ
  memo: string;                  // 自由記述
  location?: {                   // 場所が無い item (服など) は null
    name?: string;               // 表示名
    gmapUrl?: string;            // Google マップ URL (URL 貼り付け)
    address?: string;            // 住所文字列
  };
  url?: string;                  // 公式サイト/商品ページ等
  doneAt?: string;               // done に切り替えた日 (ISO date)
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;            // 論理削除
}
```

### 4.4 Dexie schema

```ts
// v1 (旧スキーマ — 既存データのマイグレーション用にだけ宣言)
db.version(1).stores({
  items: 'id, type, status, updatedAt, doneAt, *tags, *subcategory',
  meta:  'key',
});

// v2 (現行)
db.version(2)
  .stores({
    items: 'id, type, status, updatedAt, doneAt, *tags, midCategory, smallCategory',
    meta:  'key',
  })
  .upgrade(async (tx) => {
    // subcategory[0] → midCategory / subcategory[1] → smallCategory に分離
  });
```

- `*tags` は multiEntry index (タグ AND 絞り込み)
- `midCategory` / `smallCategory` はスカラー index (中/小ごとの絞り込み)
- 複合インデックス候補: `[type+status]`, `[type+updatedAt]` (実装時にプロファイル)
- Firestore レガシードキュメント (旧 `subcategory: string[]`) は `src/lib/sync.ts` の `normalizeLegacy()` で onSnapshot 受信時に同等の変換を行う

### 4.5 Firestore コレクション

```
users/{uid}/items/{itemId}
  ├ Item と同じスキーマ
  └ ルール: request.auth.uid == uid のみ read/write 許可
```

セキュリティルール (案):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/items/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### 4.6 カテゴリ/タグのプリセットと候補集約

- **中カテゴリ**: 大カテゴリごとに 5 つ程度のプリセット (`DEFAULT_MID_CATEGORIES`)。
  実行時に既存アイテムから集約して候補リストにマージ。プルダウン選択 + 新規追加可。
- **小カテゴリ**: 中カテゴリ配下のプリセット (`DEFAULT_SMALL_CATEGORIES`)。
  選択は任意。中カテゴリ未選択時は入力不可。
- **タグ**: カテゴリ横断、フラット。
  - プリセット 6 個 (乃木坂 / 櫻坂 / 日向坂 / バナナマン / 生田絵梨花 / 久保史織里)
  - 利用回数 desc + 名前 asc でランキング、上位 5 を「よく使うタグ」として quick-pick 表示
  - 残りは一覧プルダウン (利用回数つき) + 新規入力で追加 (1 件ずつ)
- 候補は `src/hooks/useCategoryOptions.ts` / `src/hooks/useTagOptions.ts` が Dexie liveQuery で算出 (アイテム更新で自動反映)

---

## 5. ディレクトリ構成

```
public/                           # PWA アイコン (後で sharp で生成)
src/
 ├─ data/
 │   ├─ types.ts                  # ItemType / Status / Item / type guards
 │   └─ categories.ts             # TYPE_LABELS / TYPE_ICONS / STATUS_LABELS / DEFAULT_MID / DEFAULT_SMALL / DEFAULT_TAGS
 ├─ lib/
 │   ├─ firebase.ts               # Firebase 初期化 (Auth + Firestore オフライン永続化)
 │   ├─ db.ts                     # Dexie schema v2 + v1→v2 マイグレーション
 │   ├─ items.ts                  # Item CRUD (write-through)
 │   ├─ sync.ts                   # onSnapshot 購読、Dexie ミラー、legacy 正規化
 │   ├─ auth.ts                   # Google ログイン/ログアウト
 │   ├─ itemSchema.ts             # zod schema (フォーム検証)
 │   ├─ search.ts                 # [未実装] フィルタ・ソート (現状 useItems 内に実装)
 │   └─ tags.ts                   # [廃止] useTagOptions に統合
 ├─ hooks/
 │   ├─ useAuth.ts                # 認証状態
 │   ├─ useItems.ts               # liveQuery で items を購読 + ItemsFilter
 │   ├─ useSync.ts                # uid 連動で startItemsSync を起動/停止
 │   ├─ useCategoryOptions.ts    # 中/小カテゴリ候補 (デフォルト ∪ アイテム集約)
 │   ├─ useTagOptions.ts          # タグ候補 (top 5 quick-pick + all ランキング)
 │   └─ useFilters.ts             # [未実装] FilterBar 用 URL state
 ├─ components/
 │   ├─ Layout.tsx                # ヘッダー + ナビ + SyncIndicator + Outlet
 │   ├─ AuthGate.tsx              # 未ログイン/未設定/loading 3 状態 UI
 │   ├─ ItemCard.tsx              # 一覧カード (アイコン + タイトル + バッジ + タグチップ)
 │   ├─ ItemForm.tsx              # 新規/編集フォーム (中/小カテゴリ + タグ picker 内蔵)
 │   ├─ SyncIndicator.tsx         # 同期状態 + 最終同期時刻
 │   ├─ StatusToggle.tsx          # [未実装] wish ↔ done ワンタップ (§10-7)
 │   ├─ FilterBar.tsx             # [未実装] type / status / タグ / 評価 / ソート (§10-6)
 │   ├─ RatingStars.tsx           # [未実装] 1..5 星 (§10-7)
 │   └─ GmapLink.tsx              # [未実装、ItemDetail 内に inline]
 ├─ pages/
 │   ├─ Home.tsx                  # 大カテゴリ別件数ダッシュボード
 │   ├─ ItemsList.tsx             # 一覧 (URL ?type=&status=&tag= 連動)
 │   ├─ ItemDetail.tsx            # 詳細表示 + 編集/論理削除
 │   ├─ ItemEdit.tsx              # 新規/編集兼用
 │   ├─ TagList.tsx               # [未実装]
 │   └─ Settings.tsx              # [未実装]
 ├─ router.tsx                    # createBrowserRouter 定義
 ├─ App.tsx                       # AuthGate > RouterProvider
 ├─ main.tsx
 └─ index.css                     # Tailwind 4 + レイクブルー @theme トークン
scripts/
 └─ generate-pwa-icons.ts         # [未実装] sharp で 192/512/maskable PNG
.env / .env.example               # VITE_FIREBASE_* 一式
vite.config.ts / vitest.config.ts / tsconfig.*.json
```

---

## 6. 画面と動線

```
/                       トップ：大カテゴリ別件数ダッシュボード (wish/done 内訳)
/items                  一覧 (フィルタバー: type/status/tag/rating/sort)
/items/new              新規追加 (?type=foodで初期値指定可)
/items/:id              詳細
/items/:id/edit         編集
/tags                   タグ一覧 (件数バッジ)
/tags/:name             タグ別一覧
/settings               アカウント・エクスポート
```

ヘッダー: `[トップ] [一覧] [タグ]` + `SyncIndicator` + ユーザーアイコン。
URL に状態を保持 (`/items?type=food&status=wish&sort=updatedDesc`)。

### wish ↔ done の操作

- 一覧カードにチェックボタン (タップで done 切替、`doneAt` 自動セット)
- 詳細/編集画面にもトグル

### 検索/フィルタ (v1 範囲)

- type (大カテゴリ): 複数選択
- status: wish / done / 両方
- tags: AND 絞り込み
- rating: 最低星数
- title 部分一致
- ソート: 作成日 / 更新日 / done 日 / 評価 / タイトル昇順

---

## 7. Firebase セットアップ (ユーザー作業)

実装着手前に下記をユーザーが Firebase Console で行う:

1. プロジェクト作成 (任意名)
2. Authentication → Sign-in method → **Google** を有効化
3. Firestore Database → 本番モードで作成 (リージョン: asia-northeast1 推奨)
4. (v2 で使用) Storage を有効化
5. プロジェクト設定 → ウェブアプリ追加 → config を取得
6. `.env` に下記を貼り付け:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

7. Firestore セキュリティルールを 4.5 のものに置き換え

`.env` が無い間は AuthGate で「Firebase 未設定」を表示し、ローカル Dexie のみで動作 (オフラインモード)。

---

## 8. MVP 範囲 (v1)

含む:
- 8 大カテゴリ固定 + 中/小自由
- Item CRUD
- wish ↔ done ステータス切替 + `doneAt` 自動記録
- Gmap URL 貼り付け + 「マップで開く」リンク
- タグ (フラット)
- 評価 1〜5
- 複数条件フィルタ + ソート + 部分一致検索
- Google ログイン
- 複数端末同期 (Firestore realtime)
- オフライン動作 + 再接続 flush
- PWA インストール

v2 以降:
- 写真アップロード (Firebase Storage)
- インポート/エクスポート (JSON)
- 通知/リマインダー
- 共有 (家族/友人)
- 地図ビュー (place 系を地図にピン表示)
- 統計/グラフ
- アーカイブ/復元 UI

---

## 9. 前 PJ Lessons learned の反映

| 前 PJ の教訓 | 本 PJ での対応 |
|---|---|
| `Write(**)` で外部書込がすり抜け | `Write(./**)` 維持。プランは本書に集約 |
| GAS no-cors POST の確認不能 | Firestore は ACK が返るので解消 |
| phantom 行 / kind ルーティング不具合 | Firestore + 型付きで構造的に発生しない |
| 編集時の同期ノイズ | 編集中は state のみ更新、保存時 1 回書き込み |
| 同期インジケータの嘘 | Firestore のオフライン状態 + pending writes 数で正直に表示 |
| WebFetch deny で外部資産取得不可 | 外部データ依存なし。アイコンは sharp で生成 |

---

## 10. 実装ステップ案

1. **scaffold**: Vite + React + TS テンプレートで雛形 + Tailwind 4 + 基本 lint/format
2. **Firebase 配線**: `lib/firebase.ts`, `lib/auth.ts`, AuthGate
3. **Dexie + 型**: `data/types.ts`, `lib/db.ts`
4. **items CRUD ロジック**: `lib/items.ts`, `lib/sync.ts` (write-through + onSnapshot)
5. **基本画面**: Home / ItemsList / ItemDetail / ItemEdit (フォームは zod + RHF)
6. **フィルタ・ソート**: FilterBar + URL 同期
7. **タグ / 評価 / wish↔done トグル**
8. **PWA 化**: vite-plugin-pwa + アイコン生成
9. **テスト**: items CRUD / search / sync ミラー / wish↔done
10. **手動 QA**: スマホ + PC でログイン同期確認

---

## 11. 確認事項 (実装開始前)

- [x] プロジェクト名確定 (§2) → `ClaudeCode_WishLog`
- [x] 大カテゴリ 8 種の表示名/順序の最終確認 (§4.1)
- [x] Firebase プロジェクト作成完了 (Step 1〜7 完了、`.env` 値受領済み)
- [x] アプリ配色/トーン → **レイクブルー** (primary `#2E5C8A` / accent `#6BA4D4` / bg `#F4F7FA` / text `#1B2A3B`)
- [x] ローカルフォルダ + GitHub repo を `ClaudeCode_WishLog` にリネーム完了

---

## 12. 次の作業

### 進捗

- [x] §10-1 scaffold: リポジトリ直下に Vite + React 18 + TS テンプレートを手動展開 (`package.json` / `tsconfig*.json` / `vite.config.ts` / `vitest.config.ts` / `index.html` / `src/main.tsx` / `src/App.tsx` / `src/index.css` / `src/vite-env.d.ts`)
- [x] §10-1 Tailwind 4 + 基本 lint/format: `@tailwindcss/vite` 配線、レイクブルー theme トークンを `src/index.css` の `@theme` ブロックに反映、ESLint 9 flat config + Prettier 設定
- [x] §12-2 install 用に `package.json` に Tailwind 4 / vite-plugin-pwa / dexie + dexie-react-hooks / firebase / react-router-dom / react-hook-form + @hookform/resolvers / zod / lucide-react / vitest + jsdom + Testing Library + fake-indexeddb / sharp を列挙
- [x] §12-3 `.env` 作成 (memo.txt の Firebase config を移植)、`.env.example` と `.gitignore` も整備
- [x] `npm install` 実行 (656 packages, 32s) → `npm run typecheck` クリーン
- [x] §10-2 Firebase 配線完了: [src/lib/firebase.ts](../../src/lib/firebase.ts) (Firestore オフライン永続化 + multi-tab manager) / [src/lib/auth.ts](../../src/lib/auth.ts) (Google sign-in / signOut) / [src/hooks/useAuth.ts](../../src/hooks/useAuth.ts) / [src/components/AuthGate.tsx](../../src/components/AuthGate.tsx) (未ログイン/未設定/loading 3 状態 UI) / [src/App.tsx](../../src/App.tsx) を AuthGate ラップ + ヘッダーにサインアウトボタン
- [x] `npm run typecheck` + `npm run build` クリーン (1.58s, PWA SW 生成済み)
- [x] §10-3 Dexie + 型完了: [src/data/types.ts](../../src/data/types.ts) (`ItemType` / `Status` / `Item` / `isItemType` / `isStatus`) / [src/data/categories.ts](../../src/data/categories.ts) (`TYPE_LABELS` / `TYPE_ICONS` lucide マップ / `STATUS_LABELS`) / [src/lib/db.ts](../../src/lib/db.ts) (Dexie v1 schema、`items` に multiEntry index `*tags` `*subcategory`)
- [x] §10-4 items CRUD + sync 完了: [src/lib/items.ts](../../src/lib/items.ts) (`createItem` / `updateItem` / `setItemStatus` / `softDeleteItem` / `restoreItem`、write-through: Firestore set → Dexie put) / [src/lib/sync.ts](../../src/lib/sync.ts) (`onSnapshot` + `includeMetadataChanges` で `fromCache` / `pendingWrites` を計測、Dexie へ bulkPut/bulkDelete でミラー) / [src/hooks/useItems.ts](../../src/hooks/useItems.ts) (Dexie liveQuery + `ItemsFilter`) / [src/hooks/useSync.ts](../../src/hooks/useSync.ts) / [src/components/SyncIndicator.tsx](../../src/components/SyncIndicator.tsx) (同期中/オフライン/書込中/同期済/エラー の 5 状態バッジ) / [src/App.tsx](../../src/App.tsx) で uid 連動の sync 起動 + 件数表示
- [x] `firebase.ts` に `ignoreUndefinedProperties: true` を追加 (status トグルや任意フィールド削除を安全に)
- [x] §10-5 基本画面完了: [src/router.tsx](../../src/router.tsx) (`createBrowserRouter`) / [src/components/Layout.tsx](../../src/components/Layout.tsx) (ヘッダー + ナビ + SyncIndicator + Outlet) / [src/pages/Home.tsx](../../src/pages/Home.tsx) (8 カテゴリ × wish/done 件数ダッシュボード) / [src/pages/ItemsList.tsx](../../src/pages/ItemsList.tsx) (URL `?type=` `?status=` `?tag=` 連動) / [src/pages/ItemDetail.tsx](../../src/pages/ItemDetail.tsx) (詳細 + 編集/論理削除ボタン) / [src/pages/ItemEdit.tsx](../../src/pages/ItemEdit.tsx) (新規/編集兼用) / [src/components/ItemCard.tsx](../../src/components/ItemCard.tsx) / [src/components/ItemForm.tsx](../../src/components/ItemForm.tsx) (RHF + `safeParse`) / [src/lib/itemSchema.ts](../../src/lib/itemSchema.ts) (zod schema + `splitCsv`/`joinCsv`)
- [x] §10-5 補足: 中/小カテゴリを独立フィールド (`midCategory?` / `smallCategory?`) に分離、Dexie v2 + Firestore legacy 正規化、`DEFAULT_MID_CATEGORIES` / `DEFAULT_SMALL_CATEGORIES` / `DEFAULT_TAGS` プリセット、候補集約 hook ([src/hooks/useCategoryOptions.ts](../../src/hooks/useCategoryOptions.ts) / [src/hooks/useTagOptions.ts](../../src/hooks/useTagOptions.ts))、ItemForm をプルダウン + 新規追加 + タグ quick-pick UI に置き換え
- [x] §10-8 PWA 資産整備完了: [scripts/generate-pwa-icons.mjs](../../scripts/generate-pwa-icons.mjs) で sharp を使い `pwa-192x192.png` / `pwa-512x512.png` / `pwa-maskable-512x512.png` (safe zone 96px パディング) / `apple-touch-icon.png` / `favicon.svg` を生成 (`npm run icons`)。[index.html](../../index.html) に apple-touch-icon + iOS PWA メタ + `robots:noindex` 追加。[vite.config.ts](../../vite.config.ts) の `manualChunks` で `vendor-firebase` (547KB) / `vendor-react` (209KB) / `vendor-form` (80KB) / app (140KB) に分割
- [x] **配信準備完了**: [firebase.json](../../firebase.json) (hosting + firestore、SPA rewrites、静的アセット immutable キャッシュ、`sw.js` / `index.html` / `manifest.webmanifest` は `no-cache`) / [.firebaserc](../../.firebaserc) / [firestore.rules](../../firestore.rules) (§4.5 のもの) / [firestore.indexes.json](../../firestore.indexes.json) / `package.json` に `deploy:rules` / `deploy:hosting` / `deploy` スクリプト追加
- [x] `firebase-tools` 15.18.0 を devDependencies に追加 (`npm run deploy:*` が直接動作)
- [x] **本番デプロイ完了**: `firebase deploy --only firestore:rules` でルール適用 + `firebase deploy --only hosting` で公開。**公開 URL: <https://claudecode-wishlog.web.app>**。スマホ Chrome/Safari の「ホーム画面に追加」でインストール確認済み
- [ ] §10-6 フィルタ・ソート (FilterBar + URL 同期)
- [ ] §10-7 タグ/評価/wish↔done ワンタップトグル UI
- [ ] §10-9 テスト (vitest で items CRUD / search / sync ミラー)
- [ ] §10-10 手動 QA (スマホ + PC でログイン同期確認)
- [ ] §10-3 Dexie + 型 (`src/data/types.ts` / `src/lib/db.ts`)
- [ ] §10-4 items CRUD + sync (`src/lib/items.ts` / `src/lib/sync.ts`)
- [ ] §10-5〜§10-10 画面 → フィルタ → タグ/評価/wish↔done → PWA → テスト → 手動 QA

### ファイル配置メモ

- リポジトリ構成: アプリコードは **ルート直下** (`src/`, `public/`, `vite.config.ts` 等)、計画/ハーネス設定は `.claude/` 配下に共存。
- secrets: `.env` は `.gitignore` 済み。Firestore セキュリティルールは Firebase Console 側で §4.5 のものに設定する。
