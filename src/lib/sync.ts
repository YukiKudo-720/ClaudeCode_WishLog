import {
  collection,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import type { Item } from '@/data/types';
import { db as localDb } from './db';
import { getFirebase } from './firebase';

export interface SyncStatus {
  /** スナップショットからの初回ロードが終わったか */
  ready: boolean;
  /** 直近のスナップショットがローカルキャッシュ由来か */
  fromCache: boolean;
  /** 未送信の保留書込数 */
  pendingWrites: number;
  /** 最後にスナップショットを受け取った時刻 (ISO) */
  lastSyncedAt: string | null;
  /** 直近のエラー */
  error: Error | null;
}

export type SyncListener = (status: SyncStatus) => void;

const INITIAL_STATUS: SyncStatus = {
  ready: false,
  fromCache: true,
  pendingWrites: 0,
  lastSyncedAt: null,
  error: null,
};

export function startItemsSync(
  uid: string,
  onStatus?: SyncListener,
): Unsubscribe {
  const { db } = getFirebase();
  const col = collection(db, 'users', uid, 'items');
  let status: SyncStatus = { ...INITIAL_STATUS };

  const emit = (patch: Partial<SyncStatus>) => {
    status = { ...status, ...patch };
    onStatus?.(status);
  };

  return onSnapshot(
    col,
    { includeMetadataChanges: true },
    async (snapshot) => {
      const upserts: Item[] = [];
      const removals: string[] = [];
      for (const change of snapshot.docChanges()) {
        if (change.type === 'removed') {
          removals.push(change.doc.id);
        } else {
          upserts.push(normalizeLegacy(change.doc.data()));
        }
      }
      if (upserts.length > 0 || removals.length > 0) {
        await localDb.transaction('rw', localDb.items, async () => {
          if (upserts.length > 0) await localDb.items.bulkPut(upserts);
          if (removals.length > 0) await localDb.items.bulkDelete(removals);
        });
      }
      emit({
        ready: true,
        fromCache: snapshot.metadata.fromCache,
        pendingWrites: snapshot.metadata.hasPendingWrites ? 1 : 0,
        lastSyncedAt: new Date().toISOString(),
        error: null,
      });
    },
    (err) => {
      console.error('[sync] items snapshot error:', err);
      emit({ error: err });
    },
  );
}

/** v2 移行前の `subcategory: string[]` を mid/small へ変換 */
function normalizeLegacy(raw: unknown): Item {
  const it = { ...(raw as Item & { subcategory?: unknown }) };
  if (Array.isArray(it.subcategory)) {
    if (!it.midCategory && typeof it.subcategory[0] === 'string') {
      it.midCategory = it.subcategory[0];
    }
    if (!it.smallCategory && typeof it.subcategory[1] === 'string') {
      it.smallCategory = it.subcategory[1];
    }
    delete it.subcategory;
  }
  return it;
}
