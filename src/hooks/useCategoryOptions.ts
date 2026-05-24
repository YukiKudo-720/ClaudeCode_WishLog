import { useLiveQuery } from 'dexie-react-hooks';
import {
  DEFAULT_MID_CATEGORIES,
  DEFAULT_SMALL_CATEGORIES,
} from '@/data/categories';
import type { ItemType } from '@/data/types';
import { db } from '@/lib/db';

/** デフォルト + 既存アイテムから集約した中カテゴリの候補 (重複なし、デフォルト優先) */
export function useMidOptions(type: ItemType): string[] {
  const computed = useLiveQuery(async () => {
    const items = await db.items.where('type').equals(type).toArray();
    const used = new Set<string>();
    for (const it of items) {
      if (it.midCategory && !it.deletedAt) used.add(it.midCategory);
    }
    const out: string[] = [];
    const seen = new Set<string>();
    for (const v of DEFAULT_MID_CATEGORIES[type]) {
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
  }, [type]);
  return computed ?? [...DEFAULT_MID_CATEGORIES[type]];
}

/** 指定中カテゴリ配下の小カテゴリ候補 (デフォルト + アイテム集約) */
export function useSmallOptions(
  type: ItemType,
  mid: string | undefined,
): string[] {
  const computed = useLiveQuery(async () => {
    if (!mid) return [];
    const items = await db.items.where('type').equals(type).toArray();
    const used = new Set<string>();
    for (const it of items) {
      if (
        it.smallCategory &&
        it.midCategory === mid &&
        !it.deletedAt
      ) {
        used.add(it.smallCategory);
      }
    }
    const defaults = DEFAULT_SMALL_CATEGORIES[mid] ?? [];
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
  }, [type, mid]);
  return computed ?? [];
}
