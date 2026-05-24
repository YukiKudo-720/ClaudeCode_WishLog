import { useState, type ReactNode } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signInWithGoogle } from '@/lib/auth';
import { getMissingFirebaseKeys } from '@/lib/firebase';

interface Props {
  children: ReactNode;
}

export function AuthGate({ children }: Props) {
  const { configured, loading, user } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!configured) {
    const missing = getMissingFirebaseKeys();
    return (
      <CenterCard title="Firebase 未設定">
        <p className="text-sm text-text/70">
          下記の環境変数が読めませんでした。プロジェクト直下の{' '}
          <code className="rounded bg-bg px-1.5 py-0.5">.env</code> を確認してください。
        </p>
        <ul className="mt-3 list-disc pl-5 text-sm">
          {missing.map((k) => (
            <li key={k}>
              <code>{k}</code>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-text/60">
          ※ 未設定の間はクラウド同期なしのオフラインモードで起動します (今後の Dexie 連携時に有効化)。
        </p>
      </CenterCard>
    );
  }

  if (loading) {
    return (
      <CenterCard title="">
        <p className="text-sm text-text/70">認証状態を確認中…</p>
      </CenterCard>
    );
  }

  if (!user) {
    return (
      <CenterCard title="WishLog にサインイン">
        <p className="text-sm text-text/70">
          複数端末で同期するには Google アカウントでサインインしてください。
        </p>
        {error && (
          <p className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={signingIn}
          onClick={async () => {
            setError(null);
            setSigningIn(true);
            try {
              await signInWithGoogle();
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            } finally {
              setSigningIn(false);
            }
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
        >
          <LogIn className="size-4" />
          {signingIn ? 'サインイン中…' : 'Google でサインイン'}
        </button>
      </CenterCard>
    );
  }

  return <>{children}</>;
}

function CenterCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4">
      <div className="w-full max-w-md rounded-lg border border-accent/30 bg-white p-6 shadow-sm">
        {title && (
          <h2 className="mb-3 text-lg font-semibold text-primary">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
