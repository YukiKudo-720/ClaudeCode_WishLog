import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { itemFormSchema } from '@/lib/itemSchema';
import { ITEM_TYPES, STATUSES, type Item, type ItemType } from '@/data/types';
import { STATUS_LABELS, TYPE_LABELS } from '@/data/categories';
import { PREFECTURES } from '@/data/regions';
import { useMidOptions, useSmallOptions } from '@/hooks/useCategoryOptions';
import { useCityOptions } from '@/hooks/useCityOptions';
import { useTagOptions } from '@/hooks/useTagOptions';

interface BasicFields {
  title: string;
  memo: string;
  rating: string;
  url: string;
  locationName: string;
  locationGmapUrl: string;
  locationAddress: string;
}

export interface ItemFormSubmit {
  type: ItemType;
  title: string;
  status: 'wish' | 'done';
  midCategory?: string;
  smallCategory?: string;
  tags: string[];
  memo: string;
  rating?: number;
  url?: string;
  location?: {
    prefecture?: string;
    city?: string;
    name?: string;
    gmapUrl?: string;
    address?: string;
  };
}

interface Props {
  initial?: Item;
  defaultType?: ItemType;
  submitLabel: string;
  onSubmit: (values: ItemFormSubmit) => Promise<void> | void;
  onCancel?: () => void;
}

const ADD_SENTINEL = '__add__';

export function ItemForm({
  initial,
  defaultType,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const defaultBasic = useMemo<BasicFields>(
    () => ({
      title: initial?.title ?? '',
      memo: initial?.memo ?? '',
      rating: initial?.rating != null ? String(initial.rating) : '',
      url: initial?.url ?? '',
      locationName: initial?.location?.name ?? '',
      locationGmapUrl: initial?.location?.gmapUrl ?? '',
      locationAddress: initial?.location?.address ?? '',
    }),
    [initial],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BasicFields>({ defaultValues: defaultBasic });

  const [type, setType] = useState<ItemType>(
    initial?.type ?? defaultType ?? 'food',
  );
  const [status, setStatus] = useState<'wish' | 'done'>(
    initial?.status ?? 'wish',
  );

  const midOptions = useMidOptions(type);
  const [midSelect, setMidSelect] = useState<string>(initial?.midCategory ?? '');
  const [midAdding, setMidAdding] = useState(false);
  const [midNew, setMidNew] = useState('');
  const midValue = midAdding ? midNew.trim() : midSelect;

  const smallOptions = useSmallOptions(type, midValue || undefined);
  const [smallSelect, setSmallSelect] = useState<string>(
    initial?.smallCategory ?? '',
  );
  const [smallAdding, setSmallAdding] = useState(false);
  const [smallNew, setSmallNew] = useState('');
  const smallValue = smallAdding ? smallNew.trim() : smallSelect;

  const resetSmall = () => {
    setSmallSelect('');
    setSmallAdding(false);
    setSmallNew('');
  };

  const handleTypeChange = (next: ItemType) => {
    setType(next);
    setMidSelect('');
    setMidAdding(false);
    setMidNew('');
    resetSmall();
  };

  const handleMidChange = (val: string) => {
    if (val === ADD_SENTINEL) {
      setMidAdding(true);
      setMidSelect('');
    } else {
      setMidAdding(false);
      setMidSelect(val);
    }
    resetSmall();
  };

  const handleSmallChange = (val: string) => {
    if (val === ADD_SENTINEL) {
      setSmallAdding(true);
      setSmallSelect('');
    } else {
      setSmallAdding(false);
      setSmallSelect(val);
    }
  };

  // 場所: 都道府県 / 市区町村 (任意)
  const [prefecture, setPrefecture] = useState<string>(
    initial?.location?.prefecture ?? '',
  );
  const cityOptions = useCityOptions(prefecture || undefined);
  const [citySelect, setCitySelect] = useState<string>(
    initial?.location?.city ?? '',
  );
  const [cityAdding, setCityAdding] = useState(false);
  const [cityNew, setCityNew] = useState('');
  const cityValue = cityAdding ? cityNew.trim() : citySelect;

  const handlePrefectureChange = (val: string) => {
    setPrefecture(val);
    setCitySelect('');
    setCityAdding(false);
    setCityNew('');
  };

  const handleCityChange = (val: string) => {
    if (val === ADD_SENTINEL) {
      setCityAdding(true);
      setCitySelect('');
    } else {
      setCityAdding(false);
      setCitySelect(val);
    }
  };

  const tagOpts = useTagOptions();
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagSelect, setTagSelect] = useState<string>('');
  const [tagNew, setTagNew] = useState('');

  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (tags.includes(t)) return;
    setTags((cur) => [...cur, t]);
  };
  const removeTag = (t: string) => setTags((cur) => cur.filter((x) => x !== t));
  const commitNewTag = () => {
    if (tagNew.trim()) {
      addTag(tagNew);
      setTagNew('');
    }
  };

  const topTagSuggestions = tagOpts.top.filter((t) => !tags.includes(t));
  const dropdownTagOptions = tagOpts.all.filter((t) => !tags.includes(t));

  const submit = handleSubmit(async (basic) => {
    const parsed = itemFormSchema.safeParse({
      type,
      title: basic.title,
      status,
      midCategory: midValue,
      smallCategory: smallValue,
      tags,
      memo: basic.memo,
      rating: basic.rating,
      url: basic.url,
      location: {
        prefecture,
        city: cityValue,
        name: basic.locationName,
        gmapUrl: basic.locationGmapUrl,
        address: basic.locationAddress,
      },
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      alert(`${first.path.join('.')}: ${first.message}`);
      return;
    }
    const v = parsed.data;
    const location =
      v.location &&
      (v.location.prefecture ||
        v.location.city ||
        v.location.name ||
        v.location.gmapUrl ||
        v.location.address)
        ? v.location
        : undefined;
    await onSubmit({
      type: v.type as ItemType,
      title: v.title,
      status: v.status as 'wish' | 'done',
      midCategory: v.midCategory,
      smallCategory: v.smallCategory,
      tags: v.tags,
      memo: v.memo,
      rating: v.rating,
      url: v.url,
      location,
    });
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="タイトル" error={errors.title?.message} required>
        <input
          type="text"
          {...register('title', { required: 'タイトルは必須' })}
          className={inputCls}
          placeholder="例: 〇〇カフェ、△△ジャケット"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="大カテゴリ">
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as ItemType)}
            className={inputCls}
          >
            {ITEM_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="ステータス">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'wish' | 'done')}
            className={inputCls}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="中カテゴリ">
        <select
          value={midAdding ? ADD_SENTINEL : midSelect}
          onChange={(e) => handleMidChange(e.target.value)}
          className={inputCls}
        >
          <option value="">(未選択)</option>
          {midOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
          <option value={ADD_SENTINEL}>＋ 新規追加…</option>
        </select>
        {midAdding && (
          <input
            type="text"
            value={midNew}
            onChange={(e) => setMidNew(e.target.value)}
            placeholder="新しい中カテゴリ名"
            className={`${inputCls} mt-2`}
          />
        )}
      </Field>

      <Field label="小カテゴリ (任意)">
        <select
          value={smallAdding ? ADD_SENTINEL : smallSelect}
          disabled={!midValue}
          onChange={(e) => handleSmallChange(e.target.value)}
          className={`${inputCls} disabled:bg-bg disabled:text-text/40`}
        >
          <option value="">(なし)</option>
          {smallOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          <option value={ADD_SENTINEL}>＋ 新規追加…</option>
        </select>
        {smallAdding && (
          <input
            type="text"
            value={smallNew}
            onChange={(e) => setSmallNew(e.target.value)}
            placeholder="新しい小カテゴリ名"
            className={`${inputCls} mt-2`}
          />
        )}
        {!midValue && (
          <p className="mt-1 text-xs text-text/50">
            ※ 中カテゴリを先に選んでください
          </p>
        )}
      </Field>

      <Field label="タグ">
        {tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-primary"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="rounded-full p-0.5 hover:bg-red-100 hover:text-red-600"
                  aria-label={`${t} を削除`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {topTagSuggestions.length > 0 && (
          <>
            <div className="mb-1 text-xs text-text/60">よく使うタグ</div>
            <div className="mb-2 flex flex-wrap gap-1">
              {topTagSuggestions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTag(t)}
                  className="inline-flex items-center gap-1 rounded-full border border-accent/40 px-2 py-0.5 text-xs text-text/80 transition hover:border-primary hover:bg-primary/10 hover:text-primary"
                >
                  <Plus className="size-3" />
                  {t}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select
            value={tagSelect}
            onChange={(e) => {
              const v = e.target.value;
              if (v) {
                addTag(v);
                setTagSelect('');
              }
            }}
            className={inputCls}
          >
            <option value="">(一覧から選択)</option>
            {dropdownTagOptions.map((t) => (
              <option key={t} value={t}>
                {t}
                {(tagOpts.counts.get(t) ?? 0) > 0
                  ? ` (${tagOpts.counts.get(t)})`
                  : ''}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            <input
              type="text"
              value={tagNew}
              onChange={(e) => setTagNew(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitNewTag();
                }
              }}
              placeholder="新しいタグを入力"
              className={inputCls}
            />
            <button
              type="button"
              onClick={commitNewTag}
              className="whitespace-nowrap rounded-md bg-primary px-3 py-2 text-xs font-medium text-white transition hover:opacity-90"
            >
              追加
            </button>
          </div>
        </div>
      </Field>

      <Field label="評価 (1〜5)">
        <input
          type="number"
          min={1}
          max={5}
          step={1}
          {...register('rating')}
          className={inputCls}
          placeholder="未評価なら空欄"
        />
      </Field>

      <Field label="メモ">
        <textarea
          {...register('memo')}
          rows={4}
          className={`${inputCls} resize-y`}
        />
      </Field>

      <Field label="URL">
        <input
          type="url"
          {...register('url')}
          className={inputCls}
          placeholder="https://..."
        />
      </Field>

      <fieldset className="rounded-md border border-accent/30 p-3">
        <legend className="px-1 text-xs text-text/70">場所 (任意)</legend>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="都道府県">
              <select
                value={prefecture}
                onChange={(e) => handlePrefectureChange(e.target.value)}
                className={inputCls}
              >
                <option value="">(未選択)</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="市区町村">
              <select
                value={cityAdding ? ADD_SENTINEL : citySelect}
                disabled={!prefecture}
                onChange={(e) => handleCityChange(e.target.value)}
                className={`${inputCls} disabled:bg-bg disabled:text-text/40`}
              >
                <option value="">(未選択)</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value={ADD_SENTINEL}>＋ 新規追加…</option>
              </select>
              {cityAdding && (
                <input
                  type="text"
                  value={cityNew}
                  onChange={(e) => setCityNew(e.target.value)}
                  placeholder="新しい市区町村名"
                  className={`${inputCls} mt-2`}
                />
              )}
            </Field>
          </div>
          <Field label="表示名 (店名・場所名など)">
            <input
              type="text"
              {...register('locationName')}
              className={inputCls}
            />
          </Field>
          <Field label="Google マップ URL">
            <input
              type="url"
              {...register('locationGmapUrl')}
              className={inputCls}
              placeholder="https://maps.google.com/..."
            />
          </Field>
          <Field label="住所 (詳細)">
            <input
              type="text"
              {...register('locationAddress')}
              className={inputCls}
            />
          </Field>
        </div>
      </fieldset>

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-accent/40 px-4 py-2 text-sm text-text/80 hover:bg-bg"
          >
            キャンセル
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? '保存中…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  'w-full rounded-md border border-accent/30 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30';

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-text/80">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
