import { useLiveQuery } from 'dexie-react-hooks';
import { DEFAULT_CITIES } from '@/data/regions';
import { db } from '@/lib/db';

/** 都道府県配下の市区町村候補 (プリセット + 既存アイテムの location.city 集約) */
export function useCityOptions(prefecture: string | undefined): string[] {
  const computed = useLiveQuery(async () => {
    if (!prefecture) return [];
    const items = await db.items.toArray();
    const used = new Set<string>();
    for (const it of items) {
      if (
        it.location?.city &&
        it.location.prefecture === prefecture &&
        !it.deletedAt
      ) {
        used.add(it.location.city);
      }
    }
    const defaults = DEFAULT_CITIES[prefecture] ?? [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const v of defaults) {
      if (!seen.has(v)) {
        seen.add(v);
        out.push(v);
      }
    }
    for (const v of used) {
      if (!seen.has(v)) {
        seen.add(v);
        out.push(v);
      }
    }
    return out;
  }, [prefecture]);
  return computed ?? [];
}
