# ワンピカ相場チャート

ONE PIECEカードゲームのカード・未開封BOXの相場を毎日記録する非公式ファンサイトです。

- 販売価格・在庫：カードラッシュ（状態A / A- / B / C / PSA10）
- 買取価格：メルカード秋葉原
- 参考価格：遊々亭（初期データ）

## 構成
- `index.html` … サイト本体（GitHub Pages で公開）
- `data/index.json` … 記録した日付の一覧
- `data/<日付>.json` … 1日分の相場（各項目はカードマスタ順のCSV、`bx` はBOX相場のJSON）
- `tools/fetcher.js` / `tools/box.js` … ブラウザ内で実行する価格取得スクリプト
- `tools/save_day.py` … 取得結果を `data/` に保存するスクリプト

当サイトは各ショップ・権利者とは関係ありません。
