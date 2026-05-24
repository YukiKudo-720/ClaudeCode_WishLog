import { useLiveQuery } from 'dexie-react-hooks';
import { DEFAULT_TAGS } from '@/data/categories';
import { db } from '@/lib/db';

export interface TagOptions {
  /** よく使うタグ (上位 5)。実利用ゼロの場合はプリセットで埋める */
  top: string[];
  /** カテゴリ横断の全候補 (利用回数 desc → 名前 asc)。プリセットも含む */
  all: string[];
  /** 各タグの利用回数 (生集計、参照用) */
  counts: Map<string, number>;
}

const FALLBACK: TagOptions = {
  top: DEFAULT_TAGS.slice(0, 5),
  all: [...DEFAULT_TAGS],
  counts: new Map(),
};

export function useTagOptions(): TagOptions {
  const computed = useLiveQuery(async () => {
    const items = await db.items.toArray();
    const counts = new Map<string, number>();
    for (const t of DEFAULT_TAGS) counts.set(t, 0);
    for (const it of items) {
      if (it.deletedAt) continue;
      for (const t of it.tags) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    const sorted = [...counts.entries()].sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0], 'ja');
    });
    const used = sorted.filter(([, c]) => c > 0).map(([t]) => t);
    const top: string[] = used.slice(0, 5);
    for (const t of DEFAULT_TAGS) {
      if (top.length >= 5) break;
      if (!top.includes(t)) top.push(t);
    }
    const all = sorted.map(([t]) => t);
    return { top, all, counts };
  }, []);
  return computed ?? FALLBACK;
}
