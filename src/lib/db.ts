import Dexie, { type EntityTable, type Table, type Transaction } from 'dexie';
import type { Item } from '@/data/types';

export interface MetaRow {
  key: string;
  value: string;
}

export type WishLogDB = Dexie & {
  items: EntityTable<Item, 'id'>;
  meta: EntityTable<MetaRow, 'key'>;
};

export const db = new Dexie('wishlog') as WishLogDB;

db.version(1).stores({
  items: 'id, type, status, updatedAt, doneAt, *tags, *subcategory',
  meta: 'key',
});

db.version(2)
  .stores({
    items: 'id, type, status, updatedAt, doneAt, *tags, midCategory, smallCategory',
    meta: 'key',
  })
  .upgrade(async (tx: Transaction) => {
    const items = tx.table('items') as Table<Item & { subcategory?: unknown }, string>;
    await items.toCollection().modify((it) => {
      if (Array.isArray(it.subcategory)) {
        if (!it.midCategory && typeof it.subcategory[0] === 'string') {
          it.midCategory = it.subcategory[0];
        }
        if (!it.smallCategory && typeof it.subcategory[1] === 'string') {
          it.smallCategory = it.subcategory[1];
        }
      }
      delete it.subcategory;
    });
  });
