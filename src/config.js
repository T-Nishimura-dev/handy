// Google Sheets の設定
// 後でご自身のシートIDとAPIキーに書き換えてください
export const SHEET_CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',
  API_KEY: 'YOUR_API_KEY',
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwrInt26LWZVVmLN_gEtZz1tNHpYfj5UPLwVp-mtlJZFnnaXlx1bvoBUndhjmEp590L/exec',
};

// パスワード認証
export const APP_PASSWORD = 'narichan'; // ← 好きなパスワードに変更してください

// テーブル設定
export const TABLE_COUNT = 9;

// メニューデータ（後で自由に編集してください）
export const MENU_ITEMS = [
  // ビール
  { id: 1,  category: 'ビール',        name: 'アサヒビール',          price: 600, tag: '' },
  { id: 2,  category: 'ビール',        name: 'シャンディガフ',        price: 600, tag: '' },
  { id: 3,  category: 'ビール',        name: 'レモンビア',            price: 600, tag: '' },
  { id: 4,  category: 'ビール',        name: 'カシスビア',            price: 600, tag: '' },
  { id: 5,  category: 'ビール',        name: 'チェリービア',          price: 600, tag: '' },
  // ウィスキー・ハイボール
  { id: 6,  category: 'ウィスキー',    name: 'ウィスキーロック',      price: 500, tag: '' },
  { id: 7,  category: 'ウィスキー',    name: 'ウィスキー水割り',      price: 500, tag: '' },
  { id: 8,  category: 'ウィスキー',    name: 'ニッカハイボール',      price: 500, tag: '' },
  { id: 9,  category: 'ウィスキー',    name: 'レモンハイボール',      price: 500, tag: '' },
  { id: 10, category: 'ウィスキー',    name: 'コークハイボール',      price: 500, tag: '' },
  { id: 11, category: 'ウィスキー',    name: 'ジンジャーハイボール',  price: 500, tag: '' },
  // サワー・チューハイ
  { id: 12, category: 'サワー',        name: '焼酎ロック',            price: 500, tag: '' },
  { id: 13, category: 'サワー',        name: '焼酎水割り',            price: 500, tag: '' },
  { id: 14, category: 'サワー',        name: 'ウーロンハイ',          price: 500, tag: '' },
  { id: 15, category: 'サワー',        name: '緑茶ハイ',              price: 500, tag: '' },
  { id: 16, category: 'サワー',        name: 'ほうじ茶ハイ',          price: 500, tag: '' },
  { id: 17, category: 'サワー',        name: 'レモン割り',            price: 500, tag: '' },
  { id: 18, category: 'サワー',        name: 'レモンサワー',          price: 500, tag: '' },
  { id: 19, category: 'サワー',        name: '濃いめレモンサワー',    price: 500, tag: '' },
  { id: 20, category: 'サワー',        name: 'グレフルサワー',        price: 500, tag: '' },
  { id: 21, category: 'サワー',        name: '黒梅サワー',            price: 500, tag: '' },
  { id: 22, category: 'サワー',        name: 'コーラサワー',          price: 500, tag: '' },
  { id: 23, category: 'サワー',        name: 'カルピスサワー',        price: 500, tag: '' },
  { id: 24, category: 'サワー',        name: 'ジンジャーサワー',      price: 500, tag: '' },
  // カクテル
  { id: 25, category: 'カクテル',      name: 'カシスオレンジ',        price: 500, tag: '' },
  { id: 26, category: 'カクテル',      name: 'カシスソーダ',          price: 500, tag: '' },
  { id: 27, category: 'カクテル',      name: 'カシスウーロン',        price: 500, tag: '' },
  { id: 28, category: 'カクテル',      name: 'クーニャン',            price: 500, tag: '' },
  { id: 29, category: 'カクテル',      name: 'ファジーネーブル',      price: 500, tag: '' },
  // その他お酒
  { id: 30, category: 'その他お酒',    name: '梅酒ロック',            price: 500, tag: '' },
  { id: 31, category: 'その他お酒',    name: '梅酒水割り',            price: 500, tag: '' },
  { id: 32, category: 'その他お酒',    name: '梅酒ソーダ',            price: 500, tag: '' },
  { id: 33, category: 'その他お酒',    name: '日本酒（冷）',          price: 500, tag: '' },
  { id: 34, category: 'その他お酒',    name: '日本酒（熱燗）',        price: 500, tag: '' },
  { id: 35, category: 'その他お酒',    name: '赤ワイン',              price: 500, tag: '' },
  { id: 36, category: 'その他お酒',    name: '白ワイン',              price: 500, tag: '' },
  // ソフトドリンク
  { id: 37, category: 'ソフトドリンク', name: 'コーラ',               price: 300, tag: '' },
  { id: 38, category: 'ソフトドリンク', name: 'オレンジジュース',     price: 300, tag: '' },
  { id: 39, category: 'ソフトドリンク', name: 'ジンジャーエール',     price: 300, tag: '' },
  { id: 40, category: 'ソフトドリンク', name: 'オレンジ100%',        price: 300, tag: '' },
  { id: 41, category: 'ソフトドリンク', name: 'カルピス',             price: 300, tag: '' },
  { id: 42, category: 'ソフトドリンク', name: 'ウーロン茶',           price: 300, tag: '' },
  { id: 43, category: 'ソフトドリンク', name: '緑茶',                 price: 300, tag: '' },
  { id: 44, category: 'ソフトドリンク', name: 'ほうじ茶',             price: 300, tag: '' },
  // 一品料理
  { id: 45, category: '一品料理',      name: '枝豆',                  price: 400, tag: '' },
  { id: 46, category: '一品料理',      name: '本格豚バーグ',          price: 700, tag: '' },
  { id: 47, category: '一品料理',      name: '野菜炒め',              price: 600, tag: '' },
  { id: 48, category: '一品料理',      name: 'だし巻き卵',            price: 500, tag: '' },
  { id: 49, category: '一品料理',      name: 'とうとうチーズ卵',      price: 500, tag: '' },
  { id: 50, category: '一品料理',      name: 'コーンバター',          price: 400, tag: '' },
  { id: 51, category: '一品料理',      name: '冷やし豆腐',            price: 380, tag: '' },
  { id: 52, category: '一品料理',      name: '冷やしトマト',          price: 400, tag: '' },
  { id: 53, category: '一品料理',      name: 'きんぴらごぼう',        price: 350, tag: '' },
  { id: 54, category: '一品料理',      name: '中華はるさめ',          price: 350, tag: '' },
  { id: 55, category: '一品料理',      name: 'ワカメもやしナムル',    price: 350, tag: '' },
  { id: 56, category: '一品料理',      name: '焼き魚',                price: 750, tag: '' },
  // 揚げ物
  { id: 57, category: '揚げ物',        name: '北海道ザンギ',          price: 700, tag: '' },
  { id: 58, category: '揚げ物',        name: 'フライドポテト',        price: 460, tag: '' },
  { id: 59, category: '揚げ物',        name: '揚げ出し豆腐',         price: 430, tag: '' },
  { id: 60, category: '揚げ物',        name: 'チーズ春巻き',         price: 580, tag: '' },
  { id: 61, category: '揚げ物',        name: 'チーズいももち',        price: 580, tag: '' },
  { id: 62, category: '揚げ物',        name: '揚げたこ焼き',         price: 560, tag: '' },
  { id: 63, category: '揚げ物',        name: 'タルタルエビフライ',   price: 780, tag: '' },
  // ご飯物
  { id: 64, category: 'ご飯物',        name: '本格チャーハン',        price: 770, tag: '' },
  { id: 65, category: 'ご飯物',        name: 'ザンギ丼',              price: 830, tag: '' },
  { id: 66, category: 'ご飯物',        name: 'カレーライス',          price: 700, tag: '' },
  { id: 67, category: 'ご飯物',        name: 'お茶漬け',              price: 500, tag: '' },
  { id: 68, category: 'ご飯物',        name: 'ライス',                price: 280, tag: '' },
  { id: 69, category: 'ご飯物',        name: 'ライス大盛',            price: 380, tag: '' },
  { id: 70, category: 'ご飯物',        name: '漬物盛り合わせ',        price: 500, tag: '' },
  { id: 71, category: 'ご飯物',        name: 'ミックスサラダ',        price: 500, tag: '' },
  { id: 72, category: 'ご飯物',        name: 'シーザーサラダ',        price: 500, tag: '' },
  // 麺類
  { id: 73, category: '麺類',          name: '味噌ラーメン',          price: 880, tag: '' },
  { id: 74, category: '麺類',          name: '醤油ラーメン',          price: 880, tag: '' },
  { id: 75, category: '麺類',          name: '本格焼きそば',          price: 760, tag: '' },
  { id: 76, category: '麺類',          name: '関西風うどん',          price: 680, tag: '' },
  // 甘味
  { id: 77, category: '甘味',          name: 'バニラアイス',          price: 300, tag: '' },
  { id: 78, category: '甘味',          name: 'シャーベット',          price: 300, tag: '' },
  // その他
  { id: 98, category: 'その他', name: 'チャージ料金', price: 1000, tag: '' },
  // その他（金額自由入力）
  { id: 99, category: 'その他', name: 'その他', price: 0, tag: '', custom: true },
];

export const CATEGORIES = ['すべて', 'ビール', 'ウィスキー', 'サワー', 'カクテル', 'その他お酒', 'ソフトドリンク', '一品料理', '揚げ物', 'ご飯物', '麺類', '甘味', 'その他'];
