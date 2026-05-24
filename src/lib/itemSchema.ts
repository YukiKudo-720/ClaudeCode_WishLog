import { z } from 'zod';
import { ITEM_TYPES, STATUSES } from '@/data/types';

const optionalUrl = z
  .union([z.literal(''), z.string().url('URL の形式が不正です')])
  .optional()
  .transform((v) => (v ? v : undefined));

const optionalTrimmed = z
  .string()
  .optional()
  .transform((v) => {
    if (v == null) return undefined;
    const t = v.trim();
    return t.length > 0 ? t : undefined;
  });

export const itemFormSchema = z.object({
  type: z.enum(ITEM_TYPES as readonly [string, ...string[]]),
  title: z
    .string()
    .trim()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルが長すぎます'),
  status: z.enum(STATUSES as readonly [string, ...string[]]),
  midCategory: optionalTrimmed,
  smallCategory: optionalTrimmed,
  tags: z.array(z.string().trim().min(1)).default([]),
  memo: z.string().default(''),
  rating: z
    .union([z.literal(''), z.coerce.number().int().min(1).max(5)])
    .optional()
    .transform((v) => (typeof v === 'number' ? v : undefined)),
  url: optionalUrl,
  location: z
    .object({
      name: optionalTrimmed,
      gmapUrl: optionalUrl,
      address: optionalTrimmed,
    })
    .optional(),
});

export type ItemFormValues = z.input<typeof itemFormSchema>;
export type ItemFormParsed = z.output<typeof itemFormSchema>;
