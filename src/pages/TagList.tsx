import { Link } from 'react-router-dom';
import { Hash } from 'lucide-react';
import { useTagOptions } from '@/hooks/useTagOptions';

export default function TagList() {
  const { all, counts } = useTagOptions();

  // 利用回数 > 0 と = 0 で分けて表示する
  const used = all.filter((t) => (counts.get(t) ?? 0) > 0);
  const unused = all.filter((t) => (counts.get(t) ?? 0) === 0);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-primary">タグ</h2>
        <p className="text-sm text-text/60">
          タグをタップして絞り込み一覧を開きます。
        </p>
      </header>

      <section>
        <h3 className="mb-2 text-sm font-medium text-text/70">
          利用中 ({used.length})
        </h3>
        {used.length === 0 ? (
          <p className="text-sm text-text/50">
            まだタグ付きのアイテムがありません。
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {used.map((t) => (
              <li key={t}>
                <Link
                  to={`/items?tag=${encodeURIComponent(t)}`}
                  className="flex items-center justify-between rounded-lg border border-accent/30 bg-white px-3 py-2 transition hover:border-accent hover:shadow-sm"
                >
                  <span className="inline-flex items-center gap-1 text-sm text-primary">
                    <Hash className="size-3" />
                    {t}
                  </span>
                  <span className="rounded-full bg-bg px-2 py-0.5 text-xs text-text/60">
                    {counts.get(t)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {unused.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-medium text-text/70">
            プリセット (未使用)
          </h3>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {unused.map((t) => (
              <li key={t}>
                <Link
                  to={`/items?tag=${encodeURIComponent(t)}`}
                  className="flex items-center gap-1 rounded-lg border border-dashed border-accent/40 bg-white px-3 py-2 text-sm text-text/60 transition hover:border-accent hover:text-primary"
                >
                  <Hash className="size-3" />
                  {t}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
