# handy - 居酒屋注文管理アプリ

## セットアップ

```bash
cd D:\handy
npm install
npm start
```

ブラウザで http://localhost:3000 が開きます。

## 初期パスワード

`src/config.js` の `APP_PASSWORD` を変更してください。
デフォルト: `sakura2024`

## メニュー変更

`src/config.js` の `MENU_ITEMS` を編集してください。

## テーブル数変更

`src/config.js` の `TABLE_COUNT` を変更してください。

## 画面構成

- `/`        注文入力（テーブル選択 → メニュー選択 → 送信）
- `/ticket`  伝票管理（テーブル別注文一覧・会計処理）
- `/sales`   売上管理（本日集計・商品別ランキング・会計履歴）

## データ保存

localStorageに保存されます（同一ブラウザ・同一端末のみ）。
複数端末で共有する場合はGoogle Sheets連携が必要です（後続タスク）。
