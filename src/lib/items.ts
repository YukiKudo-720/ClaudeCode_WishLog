import { collection, doc, setDoc } from 'firebase/firestore';
import type { Item, ItemLocation, ItemType, Status } from '@/data/types';
import { db as localDb } from './db';
import { getFirebase } from './firebase';

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function itemDoc(uid: string, id: string) {
  const { db } = getFirebase();
  return doc(collection(db, 'users', uid, 'items'), id);
}

export interface CreateItemInput {
  type: ItemType;
  title: string;
  status?: Status;
  midCategory?: string;
  smallCategory?: string;
  tags?: string[];
  memo?: string;
  rating?: number;
  location?: ItemLocation;
  url?: string;
}

export type UpdateItemPatch = Partial<
  Omit<Item, 'id' | 'createdAt' | 'updatedAt'>
>;

export async function createItem(
  uid: string,
  input: CreateItemInput,
): Promise<Item> {
  const now = nowIso();
  const status = input.status ?? 'wish';
  const item: Item = {
    id: newId(),
    type: input.type,
    title: input.title.trim(),
    midCategory: input.midCategory,
    smallCategory: input.smallCategory,
    status,
    rating: input.rating,
    tags: input.tags ?? [],
    memo: input.memo ?? '',
    location: input.location,
    url: input.url,
    doneAt: status === 'done' ? now : undefined,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(itemDoc(uid, item.id), item);
  await localDb.items.put(item);
  return item;
}

export async function updateItem(
  uid: string,
  id: string,
  patch: UpdateItemPatch,
): Promise<Item> {
  const current = await localDb.items.get(id);
  if (!current) {
    throw new Error(`Item not found: ${id}`);
  }
  const next: Item = {
    ...current,
    ...patch,
    updatedAt: nowIso(),
  };
  await setDoc(itemDoc(uid, id), next);
  await localDb.items.put(next);
  return next;
}

export function setItemStatus(
  uid: string,
  id: string,
  status: Status,
): Promise<Item> {
  return updateItem(uid, id, {
    status,
    doneAt: status === 'done' ? nowIso() : undefined,
  });
}

export function softDeleteItem(uid: string, id: string): Promise<Item> {
  return updateItem(uid, id, { deletedAt: nowIso() });
}

export function restoreItem(uid: string, id: string): Promise<Item> {
  return updateItem(uid, id, { deletedAt: undefined });
}
