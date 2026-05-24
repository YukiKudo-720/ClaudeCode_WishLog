import { useLiveQuery } from 'dexie-react-hooks';
import type { Item, ItemType, Status } from '@/data/types';
import { db } from '@/lib/db';

export interface ItemsFilter {
  types?: readonly ItemType[];
  statuses?: readonly Status[];
  tags?: readonly string[];
  minRating?: number;
  /** 部分一致 (title / memo) */
  query?: string;
  includeDeleted?: boolean;
}

const norm = (s: string) => s.toLowerCase();

export function useItems(filter: ItemsFilter = {}): Item[] | undefined {
  return useLiveQuery(
    async () => {
      const all = await db.items.orderBy('updatedAt').reverse().toArray();
      const q = filter.query ? norm(filter.query) : null;
      const minRating = filter.minRating ?? 0;
      return all.filter((it) => {
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
    },
    [
      filter.types?.join(',') ?? '',
      filter.statuses?.join(',') ?? '',
      filter.tags?.join(',') ?? '',
      filter.minRating ?? 0,
      filter.query ?? '',
      filter.includeDeleted ?? false,
    ],
  );
}

export function useItem(id: string | undefined): Item | null | undefined {
  return useLiveQuery(async () => {
    if (!id) return null;
    return (await db.items.get(id)) ?? null;
  }, [id]);
}
