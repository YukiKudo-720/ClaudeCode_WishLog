import { AlertTriangle, Check, CloudOff, RefreshCw } from 'lucide-react';
import type { SyncStatus } from '@/lib/sync';

interface Props {
  status: SyncStatus;
}

export function SyncIndicator({ status }: Props) {
  if (status.error) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700"
        title={status.error.message}
      >
        <AlertTriangle className="size-3" />
        同期エラー
      </span>
    );
  }
  if (!status.ready) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-bg px-2 py-0.5 text-xs text-text/70">
        <RefreshCw className="size-3 animate-spin" />
        同期中
      </span>
    );
  }
  if (status.fromCache) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800"
        title={status.lastSyncedAt ?? ''}
      >
        <CloudOff className="size-3" />
        オフライン
      </span>
    );
  }
  if (status.pendingWrites > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-bg px-2 py-0.5 text-xs text-text/70">
        <RefreshCw className="size-3 animate-spin" />
        書込中
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
      title={status.lastSyncedAt ?? ''}
    >
      <Check className="size-3" />
      同期済
    </span>
  );
}
