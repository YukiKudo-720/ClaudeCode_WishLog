import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ExternalLink,
  MapPin,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react';
import { useItem } from '@/hooks/useItems';
import { useAuth } from '@/hooks/useAuth';
import { softDeleteItem } from '@/lib/items';
import { TYPE_ICONS, TYPE_LABELS } from '@/data/categories';
import { StatusToggle } from '@/components/StatusToggle';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const item = useItem(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (item === undefined) {
    return <p className="text-sm text-text/60">読み込み中…</p>;
  }
  if (item === null || item.deletedAt) {
    return (
      <div className="rounded-lg border border-dashed border-accent/40 bg-white p-8 text-center text-sm text-text/70">
        Item が見つかりません。
        <div className="mt-3">
          <Link to="/items" className="text-primary underline">
            一覧へ戻る
          </Link>
        </div>
      </div>
    );
  }

  const Icon = TYPE_ICONS[item.type];

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm('削除しますか? (論理削除: deletedAt セット)')) return;
    await softDeleteItem(user.uid, item.id);
    navigate('/items');
  };

  return (
    <article className="space-y-5">
      <Link
        to={`/items?type=${item.type}`}
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ChevronLeft className="size-4" />
        {TYPE_LABELS[item.type]} 一覧へ戻る
      </Link>
      <header className="flex items-start gap-3">
        <span className="mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-6" />
        </span>
        <div className="flex-1">
          <div className="text-xs text-text/60">{TYPE_LABELS[item.type]}</div>
          <h2 className="text-2xl font-bold text-text">{item.title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <StatusToggle item={item} size="sm" />
            <span className="text-xs text-text/70">
              {item.status === 'done' ? 'やった' : 'やりたい'}
            </span>
            {item.rating != null && (
              <span className="inline-flex items-center gap-0.5 text-amber-600">
                <Star className="size-3 fill-current" />
                {item.rating}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            to={`/items/${item.id}/edit`}
            className="inline-flex items-center gap-1 rounded-md border border-accent/40 px-3 py-1.5 text-sm hover:bg-bg"
          >
            <Pencil className="size-4" />
            編集
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1 rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
          >
            <Trash2 className="size-4" />
            削除
          </button>
        </div>
      </header>

      {(item.midCategory || item.smallCategory) && (
        <Section label="中/小カテゴリ">
          <p>
            {[item.midCategory, item.smallCategory].filter(Boolean).join(' / ')}
          </p>
        </Section>
      )}

      {item.tags.length > 0 && (
        <Section label="タグ">
          <div className="flex flex-wrap gap-1">
            {item.tags.map((t) => (
              <Link
                key={t}
                to={`/items?tag=${encodeURIComponent(t)}`}
                className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-primary hover:bg-accent/25"
              >
                #{t}
              </Link>
            ))}
          </div>
        </Section>
      )}

      {item.memo && (
        <Section label="メモ">
          <p className="whitespace-pre-wrap">{item.memo}</p>
        </Section>
      )}

      {item.url && (
        <Section label="URL">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 break-all text-primary underline hover:opacity-80"
          >
            {item.url}
            <ExternalLink className="size-3" />
          </a>
        </Section>
      )}

      {item.location &&
        (item.location.prefecture ||
          item.location.city ||
          item.location.name ||
          item.location.gmapUrl ||
          item.location.address) && (
          <Section label="場所">
            {(item.location.prefecture || item.location.city) && (
              <p className="text-sm">
                {[item.location.prefecture, item.location.city]
                  .filter(Boolean)
                  .join(' / ')}
              </p>
            )}
            {item.location.name && (
              <p className="mt-0.5 font-medium">{item.location.name}</p>
            )}
            {item.location.address && (
              <p className="text-sm text-text/70">{item.location.address}</p>
            )}
            {item.location.gmapUrl && (
              <a
                href={item.location.gmapUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1 inline-flex items-center gap-1 text-sm text-primary underline hover:opacity-80"
              >
                <MapPin className="size-3" />
                マップで開く
              </a>
            )}
          </Section>
        )}

      <Section label="日時">
        <ul className="text-xs text-text/60">
          <li>作成: {fmt(item.createdAt)}</li>
          <li>更新: {fmt(item.updatedAt)}</li>
          {item.doneAt && <li>完了: {fmt(item.doneAt)}</li>}
        </ul>
      </Section>
    </article>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-medium uppercase tracking-wide text-text/60">
        {label}
      </h3>
      <div className="mt-1 text-sm text-text">{children}</div>
    </section>
  );
}

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ja-JP');
  } catch {
    return iso;
  }
}
