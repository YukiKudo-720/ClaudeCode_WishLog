import { useEffect, useState } from 'react';
import { startItemsSync, type SyncStatus } from '@/lib/sync';

const INITIAL: SyncStatus = {
  ready: false,
  fromCache: true,
  pendingWrites: 0,
  lastSyncedAt: null,
  error: null,
};

export function useSync(uid: string | null | undefined): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>(INITIAL);

  useEffect(() => {
    if (!uid) {
      setStatus(INITIAL);
      return;
    }
    setStatus(INITIAL);
    const unsub = startItemsSync(uid, setStatus);
    return unsub;
  }, [uid]);

  return status;
}
