import { Link, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ItemCard } from '@/components/ItemCard';
import { useItems } from '@/hooks/useItems';
import { isItemType, isStatus, type ItemType, type Status } from '@/data/types';
import { TYPE_LABELS } from '@/data/categories';

export default function ItemsList() {
  const [params] = useSearchParams();
  const typeParam = params.get('type');
  const statusParam = params.get('status');
  const tagParam = params.get('tag');

  const types: ItemType[] | undefined =
    typeParam && isItemType(typeParam) ? [typeParam] : undefined;
  const statuses: Status[] | undefined =
    statusParam && isStatus(statusParam) ? [statusParam] : undefined;
  const tags = tagParam ? [tagParam] : undefined;

  const items = useItems({ types, statuses, tags });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary">一覧</h2>
          <p className="text-sm text-text/60">
            {types ? `${TYPE_LABELS[types[0]]} / ` : ''}
            {statuses ? `${statuses[0]} / ` : ''}
            {tags ? `#${tags[0]} / ` : ''}
            {items ? `${items.length} 件` : '読み込み中'}
          </p>
        </div>
        <Link
          to="/items/new"
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          新規
        </Link>
      </div>

      {items === undefined ? (
        <p className="text-sm text-text/60">読み込み中…</p>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id}>
              <ItemCard item={it} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-accent/40 bg-white p-8 text-center">
      <p className="text-sm text-text/70">まだ登録がありません。</p>
      <Link
        to="/items/new"
        className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus className="size-4" />
        最初の 1 件を追加
      </Link>
    </div>
  );
}
