# チームみらい 神奈川活動戦略

チームみらいの神奈川県内での活動戦略をデータに基づいてまとめたページです。

## 📊 公開ページ

👉 https://mirai-shonan.github.io/kanagawa-strategy/

## 概要

令和8年2月衆院選・令和7年7月参院選の神奈川県開票データをもとに、
市区町村別の得票率・票数を分析し、街頭活動・ポスティングの戦略をまとめています。

## 📁 内容

- **データ分析**：概況・全自治体一覧・衆参比較・当選議員
- **戦略**：コスパ優先エリア・伸びしろエリア・イベントカレンダー
- **ターゲット別**：学術・若者 / 子育て / 祖父母世代

## 📂 データ出典

- [神奈川県選挙管理委員会 衆院比例 R8.2.8執行](https://www.pref.kanagawa.jp/docs/em7/cnt/f5/syuugikekka.html)
- [神奈川県選挙管理委員会 参院比例・選挙区 R7.7.20執行](https://www.pref.kanagawa.jp/docs/em7/2025sangi_toukaihyousokuhou.html)

## 🔄 他の都道府県への展開

`prefectures/<県名>/` ディレクトリを作成することで、1リポジトリで複数都道府県を管理できます。

### 新規都道府県の追加手順

1. `prefectures/_template/` を `prefectures/xxx/` にコピー
2. 選管データを `prefectures/xxx/raw/` に配置（ファイル名にキーワードを含める）
   - `*sangi*senkyoku*.xlsx` — 参院選挙区（候補者別開票区別）→ candidate.csv
   - `*sangi*hirei*district*.xlsx` — 参院比例（党派別開票区別）→ senate.csv
   - `*shugi*hirei*.xlsx` — 衆院比例（開票調シート）→ house.csv
   - `*shugi*hirei*.pdf` — 衆院比例（PDF版・Excelがない場合のフォールバック）→ house.csv
3. 変換スクリプトでCSVを生成:
   ```bash
   python3 tools/convert_excel.py prefectures/xxx
   ```
4. `data/posting.csv` は手作業で作成（ポスティングデータは選管にないため）
5. `index.html` の戦略コンテンツセクションを各県の状況に合わせて記入
6. ルート `index.html` にリンクを追加

### 必要パッケージ

```bash
pip install openpyxl pdfplumber
```

`pdfplumber` はPDFパース用（衆院比例がPDFのみ公開の場合に必要）。

## 📝 更新・貢献

修正・改善の提案はIssuesまたはPull Requestsからお願いします。
