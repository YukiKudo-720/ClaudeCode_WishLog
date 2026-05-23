# 旅行管理 PWA「ClaudeApp_TravelSammary」実装記録

## 目的

日本国内の旅行を都道府県別に管理する個人用 PWA。トップ画面は日本地図で、訪問履歴に応じて経県値カテゴリ（居住・宿泊・訪問・接地・通過・未踏）の色で塗り分け。都道府県をタップすると過去の訪問歴と「行きたい場所」が **タブ切替** で確認・追加できる。タグ付けで横断検索も可能。

データはローカル（IndexedDB / Dexie.js）に保持し、端末間同期のため Google Spreadsheet「ClaudeApp_TravelSammary」（GAS Web App 経由）にもバックアップする。

リファレンス: `.claude/docs/plan_another_project.md` の Les Misérables Tour Gallery プロジェクトを技術スタック・GAS パターンの土台として踏襲。

---

## 技術スタック

| 層 | 採用 |
|---|---|
| フロント | React 18 + Vite 6 + TypeScript + Tailwind 4 (`@tailwindcss/vite`) |
| ルーティング | react-router-dom v6 |
| PWA | vite-plugin-pwa（autoUpdate, runtimeCaching に GAS） |
| 地図描画 | react-simple-maps + topojson-client + dataofjapan/land の TopoJSON |
| ピンチ拡大縮小 | react-zoom-pan-pinch |
| ローカル DB | Dexie.js (IndexedDB) + dexie-react-hooks の liveQuery |
| 同期バックエンド | Google Apps Script Web App + Spreadsheet (sheets: `trips`, `wishes`) |
| テスト | vitest + jsdom + @testing-library + fake-indexeddb |
| 書体 | Noto Sans JP + Noto Serif JP |

---

## ディレクトリ構成

```
public/                           # PWA placeholder アイコン、favicon
src/
 ├─ data/
 │   ├─ prefectures.ts            # 47 都道府県（JIS X 0401）
 │   ├─ japan-topo.json           # dataofjapan/land 由来 TopoJSON（手動配置）
 │   └─ types.ts                  # Trip / Wish / Prefecture / RankId
 ├─ lib/
 │   ├─ db.ts                     # Dexie schema v1→v2（wishes 追加）
 │   ├─ trips.ts                  # Trip CRUD
 │   ├─ wishes.ts                 # Wish CRUD
 │   ├─ ranks.ts                  # 経県値ランク 6 段階定義
 │   ├─ rankByPrefecture.ts       # trips → 都道府県ごとの最高ランク
 │   ├─ tags.ts                   # タグ収集・推奨タグ・絞り込み
 │   ├─ sync.ts                   # GAS pull/push、行バリデーション、debounce pull
 │   └─ cleanup.ts                # 起動時 phantom 行クリーンアップ
 ├─ hooks/
 │   ├─ useTrips.ts               # liveQuery で trips を購読
 │   ├─ useWishes.ts              # liveQuery で wishes を購読
 │   └─ useSync.ts                # 起動時 cleanup → flushPending → pullAll
 ├─ components/
 │   ├─ JapanMap.tsx              # react-simple-maps + zoom-pan-pinch + 琥珀色ホバー
 │   ├─ RankLegend.tsx            # 6 段階凡例
 │   ├─ TripList.tsx / TripForm.tsx
 │   ├─ WishList.tsx / WishForm.tsx
 │   ├─ TagPicker.tsx             # datalist + チップ追加
 │   └─ SyncIndicator.tsx         # 状態 + 最終同期時刻
 ├─ pages/
 │   ├─ Home.tsx                  # 日本地図 + 凡例 + 経県値合計
 │   ├─ PrefecturesList.tsx       # 47 都道府県を地方別グルーピング
 │   ├─ PrefectureDetail.tsx      # タブ（訪問歴 / 行きたい）
 │   ├─ TripEdit.tsx              # 訪問歴 新規/編集
 │   ├─ WishEdit.tsx              # 行きたい 新規/編集
 │   ├─ TagList.tsx               # タグ一覧（件数バッジ付き）
 │   └─ TagDetail.tsx             # タグ別 wish 一覧（都道府県別グルーピング）
 ├─ App.tsx                       # Router + ヘッダー（ナビ + SyncIndicator）
 ├─ main.tsx
 └─ index.css                     # Tailwind 4 + テーマトークン
scripts/
 ├─ gas/Code.gs (+README.md)      # kind=trips|wishes 対応の Web App
 └─ generate-pwa-icons.ts         # sharp で 192/512/maskable PNG 生成
.env / .env.example               # VITE_GAS_URL（任意）
vite.config.ts / vitest.config.ts / tsconfig.{json,app,node}.json
```

---

## データモデル

### IndexedDB（Dexie v2）

```ts
db.version(1).stores({
  trips: 'id, prefectureId, updatedAt, [prefectureId+visitOrder]',
  meta:  'key',
});
db.version(2).stores({
  trips:  'id, prefectureId, updatedAt, [prefectureId+visitOrder]',
  meta:   'key',
  wishes: 'id, prefectureId, updatedAt, *tags',  // *tags = multiEntry
});
```

```ts
// src/data/types.ts
type RankId = 'lived' | 'stayed' | 'visited' | 'touched' | 'passed' | 'none';

interface Trip {
  id: string;             // uuid v4
  prefectureId: number;   // 1..47
  visitOrder: number;     // 何回目（同一都道府県内）
  startDate: string; endDate: string;
  cities: string[];
  purpose: string; itinerary: string; memo: string; summary: string;
  rank: RankId;
  createdAt: string; updatedAt: string;
  deletedAt?: string;     // 論理削除
}

interface Wish {
  id: string;
  prefectureId: number;
  name: string;
  tags: string[];         // 例: ['観光地','ごはん']
  note: string;
  createdAt: string; updatedAt: string;
  deletedAt?: string;
}
```

### Spreadsheet「ClaudeApp_TravelSammary」

シート `trips` と `wishes` の 2 枚を Code.gs が自動生成。

`trips`:
```
id | prefectureId | visitOrder | startDate | endDate | cities | purpose | itinerary | memo | summary | rank | createdAt | updatedAt | deletedAt
```
`wishes`:
```
id | prefectureId | name | tags | note | createdAt | updatedAt | deletedAt
```

- `cities` / `tags` は `;` 区切り
- `id` 列と日付列は `setNumberFormat('@')` で text 強制

---

## 経県値ランク

| id | ラベル | 点数 | 色 |
|---|---|---|---|
| lived   | 居住 | 5 | `#7B1F2B` |
| stayed  | 宿泊 | 4 | `#D9534F` |
| visited | 訪問 | 3 | `#F0A33C` |
| touched | 接地 | 2 | `#F5D34A` |
| passed  | 通過 | 1 | `#A8C5D4` |
| none    | 未踏 | 0 | `#E5E7EB` |

色はトップ画面の塗り分け、`RankLegend`、TripList のバッジ、`PrefecturesList` のサイドカラーバーに共通使用。

---

## 同期戦略（最終版）

### 自動同期トリガー（最小限）

| 操作 | push | pull |
|---|---|---|
| 訪問歴/行きたい **追加** | ✅ | ✅（debounce 600ms） |
| 訪問歴/行きたい **編集** | ✅ | ❌ |
| 訪問歴/行きたい **削除** | ✅ | ✅（debounce 600ms） |
| アプリ起動 | ー | ✅（cleanup → flushPending → pull） |
| 同期ボタン手動 | ✅ | ✅ |

`pushTrip(trip, { sync: true })` で push 後の `schedulePull()` をオプトイン。**編集時は push のみで pull はスキップ** することで「ちょっと直すたびに同期がうるさい」問題を回避。

### Pull
- `GET ${VITE_GAS_URL}?action=list&kind=trips&since=${lastSyncAt}` と `kind=wishes` を順に実行
- 各行を `tripFromRow` / `wishFromRow` で**バリデーションして null は破棄**（後述 Lessons learned）
- `meta.lastSyncAt` を更新

### Push
- `POST` body: `{ action:'upsert', kind:'trips'|'wishes', row: {...} }`
- `mode:'no-cors'` で opaque response。失敗時は `meta.pendingPushTrips` / `pendingPushWishes` キューに id を積み、次回起動の `flushPending()` でリトライ
- in-flight push をカウントし、ゼロになったら debounce pull 起動

### 競合解決
- `updatedAt` last-write-wins
- 削除は `deletedAt` のセットを伝搬（物理削除しない）

### VITE_GAS_URL が空のとき
- 全同期処理が no-op、SyncIndicator は「同期未設定」

---

## 画面と動線

```
/                         # トップ：日本地図 + 凡例 + 経県値合計
/prefectures              # 都道府県一覧（地方別、訪問歴/行きたい件数）
/prefecture/:id           # 都道府県詳細（タブ：訪問歴 | 行きたい）
/prefecture/:id/new       # 訪問歴 新規
/prefecture/:id/trip/:id  # 訪問歴 編集
/prefecture/:id/wish/new  # 行きたい 新規
/prefecture/:id/wish/:id  # 行きたい 編集
/tags                     # タグ一覧（件数バッジ）
/tag/:name                # タグ別 wish 一覧（都道府県別グルーピング）
```

ヘッダー: `[地図] [都道府県] [タグ]` + SyncIndicator。タブ状態は `?tab=wish` で URL 保持。

---

## 遭遇した問題と解決（Lessons learned）

### 1. Vitest と Vite のバージョン重複
- 症状: `vitest.config.ts` で `@vitejs/plugin-react` を使うと `Plugin<any>` 型が `vitest/node_modules/vite` 由来と project の vite で衝突
- 解決: vitest.config から react プラグインを外す（純 TS テストのみのため不要）。コンポーネントテストを書く時は `mergeConfig` で再導入

### 2. Plan モードの保存先がプロジェクト外
- 症状: Plan モードはデフォルトで `~/.claude/plans/<name>.md` に書き出す。settings.json の `Write(**)` 緩い allow で外部書き込みがすり抜けた
- 解決: `Write(**)` を allow から外す（`Write(./**)` のみ残す）。プランファイルはこの `.claude/docs/plan.md` をプロジェクト内の正本として使う運用に

### 3. GAS Web App の no-cors POST + kind ルーティング
- POST は `mode:'no-cors'` が必須。レスポンス opaque
- スキーマ違いの 2 シート（trips/wishes）を 1 つの Web App で扱うため、URL `?kind=` と body `kind` で振り分け
- 古いバージョンの Code.gs（trips のみ）が残っていると、新しいクライアントが `kind:'wishes'` で POST しても **kind を無視して trips シートに wish データを書き込み** → 次の pull で「rank 空の壊れた trip」がローカルに流入

### 4. Phantom 行のローカル混入対策（二重防衛）
- **入口防衛**: `tripFromRow` / `wishFromRow` をバリデータ化。rank が空 or 不正、prefectureId 範囲外、name 空などは null を返してスキップ
- **既存データ清掃**: `lib/cleanup.ts` の `cleanupInvalidLocalData()` を起動時に実行し、既に IndexedDB に存在する不正行を物理削除
- これで GAS 側の不具合があってもローカル DB は汚染されない

### 5. 同期インジケータの「OK でも実は終わってない」問題
- 原因: no-cors POST はサーバ書き込み完了を確認できず、push 直後 `idle` に戻していたため、pull 完了前に「同期OK」と表示
- 解決:
  - in-flight push 数 (`pendingCount`) を state で持ち、SyncIndicator に「送信中 (N)」表示
  - **最終 pull 成功時刻を `lastSyncAt` として常時表示**（`HH:MM` / `M/D HH:MM`）。ユーザーが時刻を見て「いつ同期したか」を判断できる

### 6. 自動同期の頻度過多
- 症状: 編集のたびに push + pull が走り、UI が頻繁に「同期中…」点滅
- 解決: `pushTrip(trip, { sync?: boolean })` で pull を opt-in 化。**追加・削除のみ pull、編集は push のみ**

### 7. 地図のホバー/選択色が硬すぎる
- 当初: hover で stroke を深紅 `#7B1F2B` に変更 → 「白抜き感」と威圧感
- 解決: hover を**琥珀色 `#E89D3C`** + 軽いドロップシャドウに、pressed を朱赤 `#D9534F` に。「ふわっと浮く」感じを目指した

### 8. 表記の意味揺れ
- 「履歴」だと「閲覧履歴」のような意味にも取れて違和感 → **訪問歴** に統一（タブ、追加ボタン、フォームヘッダー、空メッセージ、削除ダイアログ全部）

### 9. TopoJSON 入手方法
- WebFetch / curl は settings.json の deny 対象 → エージェントが外部から取得不可
- 解決: ユーザーが `dataofjapan/land` の `japan.topojson` を `src/data/japan-topo.json` に手動配置。ファイル構造は `objects.japan.geometries[].properties.{id, nam, nam_ja}` で id が 1〜47 と一致

---

## ローカル動作確認

```bash
npm install            # settings.json 上 'ask' なので承認が要る
npm run icons          # 初回のみ：sharp で PWA アイコン3枚生成
npm run typecheck      # tsc -b --noEmit
npm test               # vitest（22 件、rankByPrefecture / tags / sync / cleanup）
npm run build          # vite build + PWA precache
npm run dev            # localhost:5173
```

GAS 連携は `scripts/gas/README.md` を参照。`.env` に `VITE_GAS_URL` を設定して `npm run dev` を再起動すると有効化。

---

## スコープ外（v2 候補）

- 写真添付（Cloudinary or IndexedDB Blob）
- 訪問歴/行きたいのインポート/エクスポート（JSON）
- タグ別カラーリング、タグの整理 UI（リネーム、マージ）
- 市区町村単位のピン地図
- 認証（複数ユーザー想定なら GAS にトークン検証追加）
