import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useItems } from '@/hooks/useItems';
import { ITEM_TYPES, type ItemType } from '@/data/types';
import { TYPE_ICONS, TYPE_LABELS } from '@/data/categories';

export default function Home() {
  const items = useItems();
  const total = items?.length ?? 0;

  const stats = (() => {
    const out: Record<ItemType, { wish: number; done: number }> = Object.fromEntries(
      ITEM_TYPES.map((t) => [t, { wish: 0, done: 0 }]),
    ) as Record<ItemType, { wish: number; done: number }>;
    for (const it of items ?? []) {
      out[it.type][it.status] += 1;
    }
    return out;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary">ダッシュボード</h2>
          <p className="text-sm text-text/60">合計 {total} 件</p>
        </div>
        <Link
          to="/items/new"
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          新規追加
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ITEM_TYPES.map((t) => {
          const Icon = TYPE_ICONS[t];
          const s = stats[t];
          return (
            <Link
              key={t}
              to={`/items?type=${t}`}
              className="rounded-lg border border-accent/30 bg-white p-3 transition hover:border-accent hover:shadow-sm"
            >
              <div className="flex items-center gap-2 text-primary">
                <Icon className="size-5" />
                <span className="font-medium">{TYPE_LABELS[t]}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-3 text-xs text-text/70">
                <span>
                  やりたい <b className="text-base text-text">{s.wish}</b>
                </span>
                <span>
                  やった <b className="text-base text-text">{s.done}</b>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
