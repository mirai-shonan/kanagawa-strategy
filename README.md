# チームみらい 活動戦略ダッシュボード

選挙データに基づく地域別の活動戦略をまとめた、都道府県別の戦略ダッシュボードです。

## 📊 公開ページ

👉 https://mirai-shonan.github.io/kanagawa-strategy/

## 概要

衆院選・参院選の都道府県別開票データをもとに、市区町村別の得票率・票数を分析し、
街頭活動・ポスティングの戦略をまとめています。

## 📁 内容

- **データ分析**：概況・全自治体一覧・衆参比較・当選議員
- **戦略**：コスパ優先エリア・伸びしろエリア・イベントカレンダー
- **ターゲット別**：学術・若者 / 子育て / 祖父母世代

## 📂 ディレクトリ構成

```
kanagawa-strategy/
├── index.html                  # 都道府県選択ランディングページ
├── shared/
│   ├── style.css               # 共通CSS（全県共有）
│   └── app.js                  # 共通JSロジック（全県共有）
├── prefectures/
│   ├── kanagawa/               # 神奈川県
│   │   ├── index.html          # 神奈川の戦略コンテンツ
│   │   ├── data.js             # CONFIG + フォールバックデータ
│   │   ├── raw/                # 選管のExcel/PDF（git管理）
│   │   └── data/               # 変換後のCSV（自動生成）
│   └── _template/              # 新規都道府県テンプレート
├── tools/
│   └── convert_excel.py        # Excel/PDF → CSV変換スクリプト
└── README.md
```

## 🔧 セットアップ

### 必要パッケージ

```bash
pip install openpyxl pdfplumber
```

- `openpyxl` — Excelパース用
- `pdfplumber` — PDFパース用（衆院比例がPDFのみ公開の場合）

### ローカルプレビュー

CSV読み込みのため、ローカルファイル直接閲覧（`file://`）ではなく簡易サーバーが必要です:

```bash
# プロジェクトルートで実行
python3 -m http.server 8000
```

ブラウザで http://localhost:8000/prefectures/kanagawa/ を開きます。

---

## 🤖 運用手順（Claude/AI向け実行ガイド）

このセクションは Claude Code などのAIエージェントが正確に作業を実行できる粒度で書かれています。

### 操作1: 新しい都道府県を追加する

**目的:** 神奈川以外の都道府県のデータを追加し、ダッシュボードを公開する。

**前提:**
- 対象都道府県名（例: `tokyo`, `osaka`）が決まっている
- その県のチームみらいが衆院選または参院選に出馬している（候補者がいない場合はパース結果が空になる）

**手順:**

1. **テンプレートをコピー**
   ```bash
   cp -r prefectures/_template prefectures/<県名>
   ```

2. **選管サイトから生データをダウンロード**
   - 対象都道府県の選挙管理委員会サイトを WebFetch ツールで確認
   - 以下の3種類のファイルを探す:
     - 衆院比例（党派別開票区別）— ExcelまたはPDF
     - 参院比例（党派別開票区別）— Excel
     - 参院選挙区（候補者別開票区別）— Excel
   - 検索キーワード例: `"<県名> 選挙管理委員会 衆院 比例 開票"`, `"党派別開票区別得票数"`

3. **`raw/` に配置**（ファイル名に必須キーワードを含める）
   ```bash
   curl -sLo prefectures/<県名>/raw/R8.2_shugi_hirei.pdf "<URL>"
   curl -sLo prefectures/<県名>/raw/R7.7_sangi_hirei_district.xlsx "<URL>"
   curl -sLo prefectures/<県名>/raw/R7.7_sangi_senkyoku.xlsx "<URL>"
   ```

   **ファイル名の命名規則**（小文字に変換して判定されます）:
   | データ種別 | 必須キーワード | 出力先CSV |
   |---|---|---|
   | 参院選挙区候補者別 | `sangi` + `senkyoku` | `candidate.csv` |
   | 参院比例党派別開票区別 | `sangi` + `hirei` + `district` | `senate.csv` |
   | 衆院比例（Excel/PDF） | `shugi` + `hirei` | `house.csv` |

4. **変換スクリプトを実行**
   ```bash
   python3 tools/convert_excel.py prefectures/<県名>
   ```

   **期待される出力:**
   ```
   Processing: prefectures/<県名>
     raw/  → prefectures/<県名>/raw
     data/ → prefectures/<県名>/data
   参院選挙区: ...
     → prefectures/<県名>/data/candidate.csv (N rows)
   参院比例（党派別開票区別）: ...
     → prefectures/<県名>/data/senate.csv (N rows)
   衆院比例 ...
     → prefectures/<県名>/data/house.csv (N rows)
   ```

5. **`data/posting.csv` を作成**（選管にない手動データ）
   - ポスティング実績がない場合は空行のみのファイルでOK
   - フォーマット: `地域,配布枚数,エリア数,得票率,得票数`

6. **`prefectures/<県名>/data.js` を編集**
   - `CONFIG` オブジェクトを実際の値に書き換える
   - 変更必須のフィールド:
     - `prefectureName`, `bloc`
     - `houseElection`, `senateElection`
     - `teamVotesHouse`, `teamRateHouse` (選管総括表から)
     - `teamVotesSenate`, `teamRateSenate`
     - `totalVotes`, `topRateArea`, `topRate`
     - `electedCount`, `electedSummary`
     - `dataSourceLabel`, `dataSourceUrls`
     - `partyBars`（県全体の党派別得票率）
     - `overviewInsight`（分析コメント）
   - **重要:** `FALLBACK_DATA`/`FALLBACK_POSTING`/`FALLBACK_KAWAI` も初期値として設定する（CSV読み込み失敗時の保険）

7. **`prefectures/<県名>/index.html` を編集**
   - 神奈川版（`prefectures/kanagawa/index.html`）を参照しつつ、以下のセクションを書き換え:
     - 衆参比較セクションの insight テキスト
     - 当選議員セクション
     - イベントセクション
     - コスパ・伸びしろセクション
     - 学術・子育て・シニアの各ターゲットセクション
   - **触らない部分:** ヘッダー、概況、全自治体テーブル、ポスティング、演説（これらは `app.js` がCONFIG/データから自動レンダリング）

8. **ルートの `index.html` にリンク追加**
   - `<!-- 新しい都道府県が追加されたら、ここにリンクを追加 -->` の上に新しい`<a>`タグを追加
   - 既存の神奈川リンクを参考にする

9. **ローカルで動作確認**
   ```bash
   python3 -m http.server 8000
   ```
   http://localhost:8000/prefectures/<県名>/ を開き、全11タブが正常表示されることを確認

10. **コミット&PR**
    ```bash
    git checkout -b add-prefecture-<県名>
    git add prefectures/<県名> index.html
    git commit -m "feat: <県名>を追加"
    git push -u origin add-prefecture-<県名>
    gh pr create --title "<県名>を追加" --body "..."
    ```

---

### 操作2: 既存県の選挙データを最新化する

**目的:** 新しい選挙が終わった後、最新のExcel/PDFに差し替える。

**手順:**

1. **新しいデータをダウンロード**
   ```bash
   curl -sLo prefectures/<県名>/raw/R<新元号>_shugi_hirei.pdf "<新URL>"
   ```

2. **古いraw/ファイルは残すか削除**
   - 履歴を残したい場合は古いファイルもgit管理しておく
   - 不要なら `git rm prefectures/<県名>/raw/<古いファイル>`

3. **変換スクリプトを再実行**
   ```bash
   python3 tools/convert_excel.py prefectures/<県名>
   ```

4. **`data.js` の `CONFIG` の数値を更新**
   - `teamVotesHouse`, `teamRateHouse` 等を新しい総括表から更新
   - `houseElection`, `dataSourceUrls` のラベル・URLも更新

5. **動作確認 → コミット**

---

### 操作3: 共通CSS/JSロジックを修正する

**目的:** 全都道府県に共通するUIやロジックを修正する（バグ修正・機能追加）。

**手順:**

1. **`shared/style.css` または `shared/app.js` を編集**
   - 1箇所の変更が全都道府県のページに反映される
   - 変更が県固有の値を参照していないことを確認（`CONFIG.xxx` 経由で参照）

2. **既存県（神奈川）でローカル動作確認**
   ```bash
   python3 -m http.server 8000
   ```
   全タブが正常動作することを確認

3. **新しい関数を追加した場合は CONFIG/データの追加が必要か確認**
   - 必要なら `prefectures/_template/data.js` のテンプレートも更新する
   - 全既存県の `data.js` にもフィールドを追加する

---

### 操作4: 神奈川の戦略コンテンツを修正する

**目的:** 神奈川版の戦略文言・イベントカレンダー・優先エリアを更新する。

**手順:**

1. **`prefectures/kanagawa/index.html` を編集**
   - 編集対象セクション例:
     - `<!-- ===== コスパ ===== -->` 配下
     - `<!-- ===== イベント ===== -->` 配下
     - `<!-- ===== 学術・若者 ===== -->`, `<!-- ===== 子育て ===== -->`, `<!-- ===== 祖父母世代 ===== -->` 配下
   - **触ってはいけない要素ID:** `overview-stats`, `party-bars`, `top10-list`, `all-tbody`, `diff-up-list`, `diff-down-list`, `kawai-list`, `posting-*`, `speech-*`, `app-footer`, `header-title`, `header-sub`（これらは `app.js` が自動で値を入れる）

2. **動作確認 → コミット**

---

### 操作5: データの整合性を検証する

**目的:** 変換スクリプトが生成したCSVが既存のハードコードフォールバックと一致するか確認する。

**実行例:**

```bash
python3 -c "
import csv, json, re
with open('prefectures/kanagawa/data/house.csv') as f:
    new = {r['地域']: r for r in csv.DictReader(f)}
with open('prefectures/kanagawa/data.js') as f:
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

## 📂 データ出典

- [神奈川県選挙管理委員会 衆院比例 R8.2.8執行](https://www.pref.kanagawa.jp/docs/em7/cnt/f5/syuugikekka.html)
- [神奈川県選挙管理委員会 参院比例・選挙区 R7.7.20執行](https://www.pref.kanagawa.jp/docs/em7/2025sangi_toukaihyousokuhou.html)

## 📝 更新・貢献

修正・改善の提案は Issues または Pull Requests からお願いします。
