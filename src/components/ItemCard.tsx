import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import type { Item } from '@/data/types';
import { TYPE_ICONS, TYPE_LABELS } from '@/data/categories';
import { StatusToggle } from './StatusToggle';

interface Props {
  item: Item;
}

export function ItemCard({ item }: Props) {
  const Icon = TYPE_ICONS[item.type];
  const locLabel = [item.location?.prefecture, item.location?.city]
    .filter(Boolean)
    .join(' / ');
  return (
    <article className="flex items-stretch overflow-hidden rounded-lg border border-accent/30 bg-white transition hover:border-accent hover:shadow-sm">
      <Link
        to={`/items/${item.id}`}
        className="flex flex-1 items-start gap-3 p-3"
      >
        <span
          className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
          aria-hidden
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-text">{item.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text/60">
            <span>{TYPE_LABELS[item.type]}</span>
            {item.rating != null && (
              <span className="inline-flex items-center gap-0.5 text-amber-600">
                <Star className="size-3 fill-current" />
                {item.rating}
              </span>
            )}
            {(item.midCategory || item.smallCategory) && (
              <span className="truncate">
                {[item.midCategory, item.smallCategory]
                  .filter(Boolean)
                  .join(' / ')}
              </span>
            )}
            {locLabel && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="size-3" />
                {locLabel}
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
      </Link>
      <div className="flex items-center border-l border-accent/20 px-2">
        <StatusToggle item={item} />
      </div>
    </article>
  );
}
