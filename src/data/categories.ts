import {
  Film,
  type LucideIcon,
  MapPin,
  MoreHorizontal,
  Package,
  Palette,
  Shirt,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import type { ItemType, Status } from './types';

export const TYPE_LABELS: Record<ItemType, string> = {
  food: '食',
  place: '場所/観光',
  media: '作品',
  experience: '体験',
  goods: 'モノ',
  hobby: '趣味',
  fashion: '服飾',
  other: 'その他',
};

export const TYPE_ICONS: Record<ItemType, LucideIcon> = {
  food: UtensilsCrossed,
  place: MapPin,
  media: Film,
  experience: Sparkles,
  goods: Package,
  hobby: Palette,
  fashion: Shirt,
  other: MoreHorizontal,
};

export const STATUS_LABELS: Record<Status, string> = {
  wish: 'やりたい',
  done: 'やった',
};

/** 大カテゴリごとの「中カテゴリ」プリセット (5 つ程度) */
export const DEFAULT_MID_CATEGORIES: Record<ItemType, readonly string[]> = {
  food: ['和食', '洋食', '中華', 'カフェ', 'スイーツ'],
  place: ['観光地', '公園', '街', '施設', 'リゾート'],
  media: ['本', '映画', 'アニメ', 'ゲーム', '音楽'],
  experience: ['イベント', 'ライブ', 'スポーツ観戦', 'アクティビティ', 'ワークショップ'],
  goods: ['家電', '雑貨', 'インテリア', '食器', '日用品'],
  hobby: ['コレクション', '楽器', '工芸', '園芸', '撮影'],
  fashion: ['トップス', 'ボトムス', 'アウター', '靴', 'アクセサリー'],
  other: ['その他'],
};

/**
 * 「中カテゴリ → 小カテゴリ」のプリセット。
 * 未掲載の中カテゴリは空配列扱い。ユーザーが追加した値はアイテムから自動集約されるので、
 * ここはあくまで初期表示用のヒント。
 */
export const DEFAULT_SMALL_CATEGORIES: Record<string, readonly string[]> = {
  // food
  和食: ['寿司', 'ラーメン', '蕎麦', 'うどん', '居酒屋', '焼肉'],
  洋食: ['イタリアン', 'フレンチ', 'スペイン', 'ハンバーガー', 'ステーキ'],
  中華: ['ラーメン', '点心', '四川', '台湾'],
  カフェ: ['コーヒー', '紅茶', 'ベーカリー', 'ブランチ'],
  スイーツ: ['ケーキ', '和菓子', 'アイス', 'チョコ', 'パフェ'],
  // place
  観光地: ['寺社', '城', '景勝地', '展望台', '博物館'],
  公園: ['国立公園', '都市公園', '庭園'],
  街: ['商店街', '繁華街', '横丁'],
  // media
  本: ['小説', 'マンガ', 'エッセイ', '実用書', '写真集'],
  映画: ['邦画', '洋画', 'アニメ映画', 'ドキュメンタリー'],
  アニメ: ['TV', '劇場版', 'OVA'],
  ゲーム: ['RPG', 'アクション', 'パズル', 'シミュレーション', 'ノベル'],
  音楽: ['J-POP', 'アイドル', 'ロック', 'ジャズ', 'クラシック', 'EDM'],
  // experience
  ライブ: ['アイドル', 'バンド', 'クラシック', 'お笑い'],
  スポーツ観戦: ['野球', 'サッカー', 'バスケ', 'マラソン', 'F1'],
  // fashion
  トップス: ['Tシャツ', 'シャツ', 'ニット', 'パーカー'],
  ボトムス: ['パンツ', 'スカート', 'デニム'],
  アウター: ['コート', 'ジャケット', 'ダウン'],
  靴: ['スニーカー', 'ブーツ', 'パンプス', 'サンダル'],
};

/**
 * カテゴリ横断のタグプリセット。
 * 初期 (利用件数 0) のときに「よく使うタグ」スロットを埋めるためにも使われる。
 */
export const DEFAULT_TAGS: readonly string[] = [
  '乃木坂',
  '櫻坂',
  '日向坂',
  'バナナマン',
  '生田絵梨花',
  '久保史織里',
];
