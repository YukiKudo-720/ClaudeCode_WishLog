export type ItemType =
  | 'food'
  | 'place'
  | 'media'
  | 'experience'
  | 'goods'
  | 'hobby'
  | 'fashion'
  | 'other';

export const ITEM_TYPES: readonly ItemType[] = [
  'food',
  'place',
  'media',
  'experience',
  'goods',
  'hobby',
  'fashion',
  'other',
] as const;

export type Status = 'wish' | 'done';

export const STATUSES: readonly Status[] = ['wish', 'done'] as const;

export interface ItemLocation {
  name?: string;
  gmapUrl?: string;
  address?: string;
}

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  midCategory?: string;
  smallCategory?: string;
  status: Status;
  rating?: number;
  tags: string[];
  memo: string;
  location?: ItemLocation;
  url?: string;
  doneAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export function isItemType(v: unknown): v is ItemType {
  return typeof v === 'string' && (ITEM_TYPES as readonly string[]).includes(v);
}

export function isStatus(v: unknown): v is Status {
  return v === 'wish' || v === 'done';
}
