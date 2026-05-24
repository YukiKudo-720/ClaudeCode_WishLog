import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ItemForm, type ItemFormSubmit } from '@/components/ItemForm';
import { useItem } from '@/hooks/useItems';
import { useAuth } from '@/hooks/useAuth';
import { createItem, updateItem } from '@/lib/items';
import { isItemType, type ItemType } from '@/data/types';

export default function ItemEdit() {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id;
  const [params] = useSearchParams();
  const typeParam = params.get('type');
  const defaultType: ItemType | undefined =
    typeParam && isItemType(typeParam) ? typeParam : undefined;

  const existing = useItem(isNew ? undefined : id);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!isNew && existing === undefined) {
    return <p className="text-sm text-text/60">読み込み中…</p>;
  }
  if (!isNew && existing === null) {
    return (
      <p className="text-sm text-text/70">
        Item が見つかりません。
      </p>
    );
  }

  const handleSubmit = async (values: ItemFormSubmit) => {
    if (!user) return;
    if (isNew) {
      const created = await createItem(user.uid, values);
      navigate(`/items/${created.id}`, { replace: true });
    } else if (existing) {
      await updateItem(user.uid, existing.id, values);
      navigate(`/items/${existing.id}`, { replace: true });
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-bold text-primary">
          {isNew ? '新規追加' : '編集'}
        </h2>
      </header>
      <ItemForm
        initial={existing ?? undefined}
        defaultType={defaultType}
        submitLabel={isNew ? '追加' : '保存'}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
}
