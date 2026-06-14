import { Search, X } from 'lucide-react';
import type { ItemSort } from '@/hooks/useItems';

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  sort: ItemSort;
  onSortChange: (v: ItemSort) => void;
  minRating: number;
  onMinRatingChange: (v: number) => void;
}

const SORT_LABELS: Record<ItemSort, string> = {
  updatedDesc: '更新日 (新しい順)',
  updatedAsc: '更新日 (古い順)',
  createdDesc: '作成日 (新しい順)',
  doneDesc: '完了日 (新しい順)',
  ratingDesc: '評価 (高い順)',
  titleAsc: 'タイトル (昇順)',
};

const SORT_ORDER: ItemSort[] = [
  'updatedDesc',
  'updatedAsc',
  'createdDesc',
  'doneDesc',
  'ratingDesc',
  'titleAsc',
];

export function FilterBar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  minRating,
  onMinRatingChange,
}: Props) {
  return (
    <div className="space-y-2 rounded-md border border-accent/30 bg-white p-3">
      <label className="relative block">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text/40" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="タイトル・メモから検索"
          className="w-full rounded-md border border-accent/30 bg-white pl-8 pr-8 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-text/40 hover:text-text"
            aria-label="検索クリア"
          >
            <X className="size-4" />
          </button>
        )}
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs text-text/60">並び替え</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as ItemSort)}
            className="w-full rounded-md border border-accent/30 bg-white px-2 py-1.5 text-sm"
          >
            {SORT_ORDER.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-text/60">評価 (最低)</span>
          <select
            value={minRating}
            onChange={(e) => onMinRatingChange(Number(e.target.value))}
            className="w-full rounded-md border border-accent/30 bg-white px-2 py-1.5 text-sm"
          >
            <option value={0}>指定なし</option>
            {[1, 2, 3, 4, 5].map((r) => (
              <option key={r} value={r}>
                ★ {r} 以上
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
