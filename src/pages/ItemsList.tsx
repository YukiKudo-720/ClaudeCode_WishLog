import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { FilterBar } from '@/components/FilterBar';
import { ItemCard } from '@/components/ItemCard';
import { useItems, type ItemSort } from '@/hooks/useItems';
import {
  isItemType,
  isStatus,
  type Item,
  type ItemType,
  type Status,
} from '@/data/types';
import { TYPE_LABELS } from '@/data/categories';
import { PREFECTURES } from '@/data/regions';

const SORT_VALUES: ItemSort[] = [
  'updatedDesc',
  'updatedAsc',
  'createdDesc',
  'doneDesc',
  'ratingDesc',
  'titleAsc',
];

function readSort(raw: string | null): ItemSort {
  return SORT_VALUES.includes(raw as ItemSort) ? (raw as ItemSort) : 'updatedDesc';
}

export default function ItemsList() {
  const [params, setParams] = useSearchParams();
  const typeParam = params.get('type');
  const statusParam = params.get('status');
  const tagParam = params.get('tag');
  const q = params.get('q') ?? '';
  const sort = readSort(params.get('sort'));
  const minRating = Number(params.get('rating') ?? '0') || 0;

  const type: ItemType | undefined =
    typeParam && isItemType(typeParam) ? typeParam : undefined;
  const status: Status | undefined =
    statusParam && isStatus(statusParam) ? statusParam : undefined;
  const tag = tagParam ?? undefined;

  const items = useItems({
    types: type ? [type] : undefined,
    statuses: status ? [status] : undefined,
    tags: tag ? [tag] : undefined,
    query: q || undefined,
    minRating: minRating || undefined,
    sort,
  });

  const groups = useMemo(() => (items ? groupByPrefecture(items) : []), [items]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value == null || value === '') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const setStatusTab = (next: Status | undefined) => {
    const p = new URLSearchParams(params);
    if (next) p.set('status', next);
    else p.delete('status');
    setParams(p, { replace: true });
  };

  // 新規ボタンの遷移先: 現在の type を引き継ぐ
  const newItemHref = (() => {
    const p = new URLSearchParams();
    if (type) p.set('type', type);
    const qs = p.toString();
    return qs ? `/items/new?${qs}` : '/items/new';
  })();

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary">
            {type ? `一覧 - ${TYPE_LABELS[type]}` : tag ? `タグ #${tag}` : '一覧'}
          </h2>
          <p className="text-sm text-text/60">
            {items ? `${items.length} 件` : '読み込み中'}
          </p>
        </div>
        <Link
          to={newItemHref}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          新規
        </Link>
      </header>

      {/* status タブ */}
      <div className="inline-flex rounded-md border border-accent/30 bg-white p-0.5 text-sm">
        <TabButton active={status === 'wish'} onClick={() => setStatusTab('wish')}>
          やりたい
        </TabButton>
        <TabButton active={status === 'done'} onClick={() => setStatusTab('done')}>
          やった
        </TabButton>
        <TabButton active={!status} onClick={() => setStatusTab(undefined)}>
          すべて
        </TabButton>
      </div>

      {/* 現在のフィルタチップ */}
      {(type || tag) && (
        <div className="flex flex-wrap gap-2">
          {type && (
            <FilterChip
              label={`カテゴリ: ${TYPE_LABELS[type]}`}
              onClear={() => updateParam('type', null)}
            />
          )}
          {tag && (
            <FilterChip
              label={`タグ: #${tag}`}
              onClear={() => updateParam('tag', null)}
            />
          )}
        </div>
      )}

      <FilterBar
        query={q}
        onQueryChange={(v) => updateParam('q', v)}
        sort={sort}
        onSortChange={(v) => updateParam('sort', v === 'updatedDesc' ? null : v)}
        minRating={minRating}
        onMinRatingChange={(v) => updateParam('rating', v > 0 ? String(v) : null)}
      />

      {items === undefined ? (
        <p className="text-sm text-text/60">読み込み中…</p>
      ) : items.length === 0 ? (
        <EmptyState newHref={newItemHref} />
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.key}>
              <h3 className="mb-2 flex items-baseline gap-2 text-sm font-medium text-text/70">
                <span className="text-primary">{g.label}</span>
                <span className="text-xs text-text/50">{g.items.length} 件</span>
              </h3>
              <ul className="space-y-2">
                {g.items.map((it) => (
                  <li key={it.id}>
                    <ItemCard item={it} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 transition ${
        active ? 'bg-primary text-white' : 'text-text/70 hover:bg-bg'
      }`}
    >
      {children}
    </button>
  );
}

function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs text-primary">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="rounded-full p-0.5 hover:bg-white/40"
        aria-label="フィルタ解除"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

function EmptyState({ newHref }: { newHref: string }) {
  return (
    <div className="rounded-lg border border-dashed border-accent/40 bg-white p-8 text-center">
      <p className="text-sm text-text/70">条件に合うアイテムはありません。</p>
      <Link
        to={newHref}
        className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus className="size-4" />
        新規追加
      </Link>
    </div>
  );
}

interface ItemGroup {
  key: string;
  label: string;
  items: Item[];
}

const NONE_KEY = '__none__';

function groupByPrefecture(items: Item[]): ItemGroup[] {
  const byPref = new Map<string, Item[]>();
  for (const it of items) {
    const pref = it.location?.prefecture?.trim() || NONE_KEY;
    if (!byPref.has(pref)) byPref.set(pref, []);
    byPref.get(pref)!.push(it);
  }
  const out: ItemGroup[] = [];
  // 都道府県を北→南の標準順で並べる
  for (const pref of PREFECTURES) {
    if (byPref.has(pref)) {
      out.push({ key: pref, label: pref, items: byPref.get(pref)! });
      byPref.delete(pref);
    }
  }
  // 想定外の prefecture (例: 旧表記) は末尾アルファベット順
  const extras = [...byPref.entries()]
    .filter(([k]) => k !== NONE_KEY)
    .sort((a, b) => a[0].localeCompare(b[0], 'ja'));
  for (const [k, list] of extras) {
    out.push({ key: k, label: k, items: list });
  }
  // 場所未設定は最後
  if (byPref.has(NONE_KEY)) {
    out.push({ key: NONE_KEY, label: '場所未設定', items: byPref.get(NONE_KEY)! });
  }
  return out;
}
