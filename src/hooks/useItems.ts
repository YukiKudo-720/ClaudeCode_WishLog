import { useLiveQuery } from 'dexie-react-hooks';
import type { Item, ItemType, Status } from '@/data/types';
import { db } from '@/lib/db';

export type ItemSort =
  | 'updatedDesc'
  | 'updatedAsc'
  | 'createdDesc'
  | 'doneDesc'
  | 'ratingDesc'
  | 'titleAsc';

export interface ItemsFilter {
  types?: readonly ItemType[];
  statuses?: readonly Status[];
  tags?: readonly string[];
  minRating?: number;
  /** 部分一致 (title / memo) */
  query?: string;
  includeDeleted?: boolean;
  sort?: ItemSort;
}

const norm = (s: string) => s.toLowerCase();

function compare(a: Item, b: Item, sort: ItemSort): number {
  switch (sort) {
    case 'updatedAsc':
      return a.updatedAt.localeCompare(b.updatedAt);
    case 'createdDesc':
      return b.createdAt.localeCompare(a.createdAt);
    case 'doneDesc':
      return (b.doneAt ?? '').localeCompare(a.doneAt ?? '');
    case 'ratingDesc': {
      const r = (b.rating ?? 0) - (a.rating ?? 0);
      if (r !== 0) return r;
      return b.updatedAt.localeCompare(a.updatedAt);
    }
    case 'titleAsc':
      return a.title.localeCompare(b.title, 'ja');
    case 'updatedDesc':
    default:
      return b.updatedAt.localeCompare(a.updatedAt);
  }
}

export function useItems(filter: ItemsFilter = {}): Item[] | undefined {
  return useLiveQuery(
    async () => {
      const all = await db.items.toArray();
      const q = filter.query ? norm(filter.query) : null;
      const minRating = filter.minRating ?? 0;
      const sort = filter.sort ?? 'updatedDesc';
      const filtered = all.filter((it) => {
        if (!filter.includeDeleted && it.deletedAt) return false;
        if (filter.types && filter.types.length > 0 && !filter.types.includes(it.type))
          return false;
        if (
          filter.statuses &&
          filter.statuses.length > 0 &&
          !filter.statuses.includes(it.status)
        )
          return false;
        if (filter.tags && filter.tags.length > 0) {
          if (!filter.tags.every((t) => it.tags.includes(t))) return false;
        }
        if ((it.rating ?? 0) < minRating) return false;
        if (q) {
          const hay = `${norm(it.title)} ${norm(it.memo)}`;
          if (!hay.includes(q)) return false;
        }
        return true;
      });
      filtered.sort((a, b) => compare(a, b, sort));
      return filtered;
    },
    [
      filter.types?.join(',') ?? '',
      filter.statuses?.join(',') ?? '',
      filter.tags?.join(',') ?? '',
      filter.minRating ?? 0,
      filter.query ?? '',
      filter.includeDeleted ?? false,
      filter.sort ?? 'updatedDesc',
    ],
  );
}

export function useItem(id: string | undefined): Item | null | undefined {
  return useLiveQuery(async () => {
    if (!id) return null;
    return (await db.items.get(id)) ?? null;
  }, [id]);
}
