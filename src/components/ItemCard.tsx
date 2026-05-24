import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Item } from '@/data/types';
import { STATUS_LABELS, TYPE_ICONS, TYPE_LABELS } from '@/data/categories';

interface Props {
  item: Item;
}

export function ItemCard({ item }: Props) {
  const Icon = TYPE_ICONS[item.type];
  return (
    <Link
      to={`/items/${item.id}`}
      className="block rounded-lg border border-accent/30 bg-white p-3 transition hover:border-accent hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
          aria-hidden
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium text-text">{item.title}</h3>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text/60">
            <span>{TYPE_LABELS[item.type]}</span>
            <span
              className={
                item.status === 'done'
                  ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700'
                  : 'rounded-full bg-bg px-2 py-0.5 text-text/70'
              }
            >
              {STATUS_LABELS[item.status]}
            </span>
            {item.rating != null && (
              <span className="inline-flex items-center gap-0.5 text-amber-600">
                <Star className="size-3 fill-current" />
                {item.rating}
              </span>
            )}
            {(item.midCategory || item.smallCategory) && (
              <span className="truncate">
                {[item.midCategory, item.smallCategory].filter(Boolean).join(' / ')}
              </span>
            )}
          </div>
          {item.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {item.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-primary"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
