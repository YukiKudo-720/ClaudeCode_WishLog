import { Check, Circle } from 'lucide-react';
import type { Item } from '@/data/types';
import { useAuth } from '@/hooks/useAuth';
import { setItemStatus } from '@/lib/items';

interface Props {
  item: Item;
  size?: 'sm' | 'md';
  className?: string;
}

/** wish ↔ done をワンタップで切り替えるボタン */
export function StatusToggle({ item, size = 'md', className = '' }: Props) {
  const { user } = useAuth();
  const isDone = item.status === 'done';
  const dim = size === 'sm' ? 'size-7' : 'size-9';
  const icon = size === 'sm' ? 'size-4' : 'size-5';

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    await setItemStatus(user.uid, item.id, isDone ? 'wish' : 'done');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isDone}
      aria-label={isDone ? 'やりたいに戻す' : 'やったに変更'}
      title={isDone ? 'やりたいに戻す' : 'やったに変更'}
      className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full border transition ${
        isDone
          ? 'border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600'
          : 'border-accent/40 bg-white text-text/40 hover:border-primary hover:text-primary'
      } ${className}`}
    >
      {isDone ? <Check className={icon} /> : <Circle className={icon} />}
    </button>
  );
}
