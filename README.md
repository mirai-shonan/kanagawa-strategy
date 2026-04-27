# チームみらい 神奈川活動戦略

チームみらいの神奈川県内での活動戦略をデータに基づいてまとめたページです。

## 公開ページ

https://mirai-shonan.github.io/kanagawa-strategy/

## 概要

令和8年2月衆院選・令和7年7月参院選の神奈川県開票データをもとに、
市区町村別の得票率・票数を分析し、街頭活動・ポスティングの戦略をまとめています。

## 内容

- **データ分析**：概況・全自治体一覧・衆参比較・当選議員
- **戦略**：コスパ優先エリア・伸びしろエリア・イベントカレンダー
- **ターゲット別**：学術・若者 / 子育て / 祖父母世代

## ファイル構成

```
index.html         # メインHTML（コンテンツ・タブ構造）
style.css          # CSS（デザイン・レイアウト）
app.js             # JSロジック（テーブル描画・グラフ・タブ切替等）
data.js            # CONFIG + フォールバックデータ + CSV読み込み
data-template.js   # 他県用データテンプレート（Fork時に使用）
data/              # 選挙データのCSV（自動生成）
├── house.csv      # 衆院比例
├── senate.csv     # 参院比例
├── candidate.csv  # 候補者別
└── posting.csv    # ポスティング（手動作成）
raw/               # 選管Excel/PDF（git管理）
├── R8.2_shugi_hirei.pdf
├── R7.7_sangi_hirei_district.xlsx
└── R7.7_sangi_senkyoku.xlsx
tools/
└── convert_excel.py  # 選管Excel/PDF → CSV変換スクリプト
README.md
```

## 🔗 タブとURL（Hash routing）

タブを切り替えると URL のハッシュが変わります。これにより:
- 特定タブのリンクを共有できる（例: `https://.../#growth`）
- ブラウザの戻る/進むでタブ遷移できる
- リロードしても同じタブが開いたままになる

| URL | タブ |
|---|---|
| `#overview` | 概況 |
| `#all` | 全自治体 |
| `#compare` | 衆参比較 |
| `#elected` | 当選議員 |
| `#cost` | コスパ |
| `#growth` | 伸びしろ |
| `#events` | イベント |
| `#posting` | ポスティング |
| `#speech` | 演説 |
| `#academic` | 学術・若者 |
| `#family` | 子育て |
| `#senior` | 祖父母世代 |

## セットアップ

### 必要パッケージ

```bash
pip install openpyxl pdfplumber
```

- `openpyxl` — Excelパース用
- `pdfplumber` — PDFパース用（衆院比例がPDFのみ公開の場合）

### ローカルプレビュー

CSV読み込みのため、`file://` で直接開くのではなく簡易サーバーが必要です:

```bash
python3 -m http.server 8000
```

ブラウザで http://localhost:8000/ を開きます。

---

## 🤖 運用手順（Claude/AI向け実行ガイド）

このセクションは Claude Code 等のAIエージェントが正確に作業を実行できる粒度で書かれています。

### 操作1: 他の都道府県版を作成する（Fork方式）

**目的:** このリポジトリをForkして、別の都道府県の戦略ダッシュボードを作成する。

**前提:**
- Forkした自分のリポジトリを clone してローカルで作業する
- 対象都道府県のチームみらい候補がいる選挙データがある

**手順:**

1. **このリポジトリをForkしてclone**
   ```bash
   gh repo fork mirai-shonan/kanagawa-strategy --clone
   cd kanagawa-strategy
   ```

2. **選管サイトから生データをダウンロード**
   - 対象都道府県の選挙管理委員会サイトを確認
   - 以下の3種類のファイルを探す:
     - 衆院比例（党派別開票区別）— ExcelまたはPDF
     - 参院比例（党派別開票区別）— Excel
     - 参院選挙区（候補者別開票区別）— Excel

3. **`raw/` を新しいデータに差し替え**
   ```bash
   # 既存の神奈川データを削除
   rm raw/*

   # 新しい県のデータをダウンロード（ファイル名にキーワードを含めること）
   curl -sLo raw/R8.2_shugi_hirei.pdf "<URL>"
   curl -sLo raw/R7.7_sangi_hirei_district.xlsx "<URL>"
   curl -sLo raw/R7.7_sangi_senkyoku.xlsx "<URL>"
   ```

   **ファイル名の命名規則**（小文字に変換して判定されます）:

   | データ種別 | 必須キーワード | 出力先CSV |
   |---|---|---|
   | 参院選挙区候補者別 | `sangi` + `senkyoku` | `data/candidate.csv` |
   | 参院比例党派別開票区別 | `sangi` + `hirei` + `district` | `data/senate.csv` |
   | 衆院比例（Excel/PDF） | `shugi` + `hirei` | `data/house.csv` |

4. **変換スクリプトを実行してCSVを生成**
   ```bash
   python3 tools/convert_excel.py
   ```

   **期待される出力:**
   ```
   Processing: .
     raw/  → ./raw
     data/ → ./data
   参院選挙区: ...
     → ./data/candidate.csv (N rows)
   参院比例（党派別開票区別）: ...
     → ./data/senate.csv (N rows)
   衆院比例 ...
     → ./data/house.csv (N rows)
   ```

5. **`data/posting.csv` を作成**（選管にない手動データ）
   - ポスティング実績を記録
   - 実績がなければヘッダー行のみのファイルでOK
   - フォーマット: `地域,配布枚数,エリア数,得票率,得票数`

6. **`data.js` の `CONFIG` を編集**
   - 変更必須のフィールド:
     - `prefectureName`, `bloc`
     - `houseElection`, `senateElection`
     - `teamVotesHouse`, `teamRateHouse` (選管総括表から)
     - `teamVotesSenate`, `teamRateSenate`
     - `totalVotes`, `topRateArea`, `topRate`
     - `electedCount`, `electedSummary`, `electedLabel`, `electedBlocLabel`
     - `dataSourceLabel`, `dataSourceUrls`
     - `partyBars`（県全体の党派別得票率）
     - `overviewInsight`（分析コメント）
   - **重要:** `FALLBACK_DATA`/`FALLBACK_POSTING`/`FALLBACK_KAWAI` も初期値として設定する（CSV読み込み失敗時の保険）

7. **`index.html` のコンテンツを編集**
   - `<title>` を変更
   - 以下のセクションを各県の状況に合わせて書き換え:
     - 衆参比較セクションの insight テキスト
     - 当選議員セクション
     - イベントセクション
     - コスパ・伸びしろセクション
     - 学術・子育て・シニアの各ターゲットセクション
   - **触らない部分:** ヘッダー、概況の統計カード、全自治体テーブル、ポスティング、演説（これらは `app.js` がCONFIG/データから自動レンダリング）
   - **触ってはいけない要素ID:** `overview-stats`, `party-bars`, `top10-list`, `all-tbody`, `diff-up-list`, `diff-down-list`, `kawai-list`, `posting-*`, `speech-*`, `app-footer`, `header-title`, `header-sub`
   - **タブのIDは英語**（`overview`, `all`, `compare`, `elected`, `cost`, `growth`, `events`, `posting`, `speech`, `academic`, `family`, `senior`）。Hash routing で使われるので変更しないでください

8. **ローカルで動作確認**
   ```bash
   python3 -m http.server 8000
   ```
   http://localhost:8000/ を開き、全11タブが正常表示されることを確認

9. **コミット&push**
   ```bash
   git add .
   git commit -m "feat: <県名>のデータに差し替え"
   git push
   ```

10. **GitHub Pagesを有効化** (Settings → Pages → Source: main branch)

---

### 操作2: 選挙データを最新化する

**目的:** 新しい選挙が終わった後、最新のExcel/PDFに差し替える。

**手順:**

1. **新しいデータをダウンロード**
   ```bash
   curl -sLo raw/R<新元号>_shugi_hirei.pdf "<新URL>"
   ```

2. **古いraw/ファイルは残すか削除**
   - 履歴を残したい場合は古いファイルもgit管理しておく
   - 不要なら `git rm raw/<古いファイル>`

3. **変換スクリプトを再実行**
   ```bash
   python3 tools/convert_excel.py
   ```

4. **`data.js` の `CONFIG` の数値を更新**
   - `teamVotesHouse`, `teamRateHouse` 等を新しい総括表から更新
   - `houseElection`, `dataSourceUrls` のラベル・URLも更新

5. **動作確認 → コミット**

---

### 操作3: 共通ロジック（CSS/JS）を修正する

**目的:** UIやロジックを修正する（バグ修正・機能追加）。

**注意:** Fork方式では各県のリポジトリが独立しているため、共通ロジックの修正は **手動で各Forkに反映する必要があります**。中央管理が必要な場合はディレクトリ方式（PR #1）を検討してください。

**手順:**

1. **`style.css` または `app.js` を編集**
2. **ローカル動作確認**
   ```bash
   python3 -m http.server 8000
   ```
3. **コミット**

---

### 操作4: 戦略コンテンツを修正する

**目的:** 戦略文言・イベントカレンダー・優先エリアを更新する。

**手順:**

1. **`index.html` を編集**
   - 編集対象セクション例:
     - `<!-- ===== コスパ ===== -->` 配下
     - `<!-- ===== イベント ===== -->` 配下
     - `<!-- ===== 学術・若者 ===== -->`, `<!-- ===== 子育て ===== -->`, `<!-- ===== 祖父母世代 ===== -->` 配下
   - **触ってはいけない要素ID:** `overview-stats`, `party-bars`, `top10-list`, `all-tbody`, `diff-up-list`, `diff-down-list`, `kawai-list`, `posting-*`, `speech-*`, `app-footer`, `header-title`, `header-sub`

2. **動作確認 → コミット**

---

### 操作5: データの整合性を検証する

**目的:** 変換スクリプトが生成したCSVが既存のハードコードフォールバックと一致するか確認する。

**実行例:**

```bash
python3 -c "
import csv, json, re
with open('data/house.csv') as f:
    new = {r['地域']: r for r in csv.DictReader(f)}
with open('data.js') as f:
    content = f.read()
match = re.search(r'FALLBACK_DATA\s*=\s*(\[.+?\]);', content, re.DOTALL)
old = {d['地域']: d for d in json.loads(match.group(1))}
diff = set(old) ^ set(new)
mis = sum(1 for a in old if a in new and (old[a]['チームみらい'] != int(new[a]['得票数']) or abs(old[a]['チームみらい率'] - float(new[a]['得票率'])) > 0.05))
print(f'差: {len(diff)}件, 値不一致: {mis}件')
"
```

期待値: `差: 0件, 値不一致: 0件`

---

### トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| ブラウザでデータが表示されない | `file://` で開いている | `python3 -m http.server 8000` でサーバー起動 |
| `Warning: チームみらい列が見つかりません` | その選挙にチームみらい候補がいない | 過去選挙のデータでは正常な動作。最新選挙のExcelを確認 |
| 自治体数が想定より少ない | 政令指定都市の親市行/合計行が混入 | `extract_area_name()` の判定ロジックを確認 |
| `pdfplumber が必要です` エラー | パッケージ未インストール | `pip install pdfplumber` |
| PDFパース後の自治体名が壊れている | 全角/半角空白の混在 | `_normalize_pdf_area()` の処理を確認 |

---

## データ出典

- [神奈川県選挙管理委員会 衆院比例 R8.2.8執行](https://www.pref.kanagawa.jp/docs/em7/cnt/f5/syuugikekka.html)
- [神奈川県選挙管理委員会 参院比例・選挙区 R7.7.20執行](https://www.pref.kanagawa.jp/docs/em7/2025sangi_toukaihyousokuhou.html)

## 更新・貢献

修正・改善の提案はIssuesまたはPull Requestsからお願いします。
