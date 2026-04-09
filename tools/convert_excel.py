#!/usr/bin/env python3
"""
選挙管理委員会 Excel → CSV 変換ツール

prefectures/<県名>/raw/ にあるExcelファイルを読み込み、
prefectures/<県名>/data/ にCSVを出力します。

使い方:
  python3 tools/convert_excel.py prefectures/kanagawa

raw/ ディレクトリの命名規則:
  - *sangi*senkyoku*.xlsx → 参院選挙区（候補者別開票区別得票数）
                            → senate.csv を生成
  - *sangi*hirei*.xlsx    → 参院比例（党派別名簿登載者別得票数）※未対応
  - *shugi*hirei*.xlsx    → 衆院比例 ※未対応

必要パッケージ:
  pip install openpyxl
"""

import argparse
import csv
import glob
import os
import sys

try:
    import openpyxl
except ImportError:
    print("Error: openpyxl が必要です。 pip install openpyxl でインストールしてください。", file=sys.stderr)
    sys.exit(1)


def find_team_mirai_col(ws):
    """党名行・候補者名行から「チームみらい」の列インデックスを探す"""
    for check_row in [5, 7]:
        for col in range(1, ws.max_column + 1):
            val = ws.cell(row=check_row, column=col).value
            if val and 'チームみらい' in str(val):
                return col
    return None


def parse_senate_district(filepath):
    """
    参院選挙区の候補者別開票区別Excel (g.xlsx形式) をパースする。

    想定フォーマット:
    - Row 5: 候補者名
    - Row 7: 党名
    - Row 9+: データ行
      - Col A (1): 親市区名（政令指定都市名など。区がある場合のみ）
      - Col B (2): 市区町村名
      - 各列: 候補者別得票数
      - Col S (19) あたり: 合計
    """
    wb = openpyxl.load_workbook(filepath, data_only=True)
    ws = wb.active

    team_col = find_team_mirai_col(ws)
    if team_col is None:
        print(f"  Warning: 「チームみらい」列が見つかりませんでした: {filepath}", file=sys.stderr)
        return []

    # 合計列を探す（「合計」「計」「得票数計」などのヘッダー）
    total_col = None
    for col in range(1, ws.max_column + 1):
        for check_row in [5, 7, 8]:
            val = ws.cell(row=check_row, column=col).value
            if val and ('合計' in str(val) or '得票数計' in str(val) or str(val).strip() == '計'):
                total_col = col
                break
        if total_col:
            break

    print(f"  チームみらい列: {team_col}, 合計列: {total_col or '未検出'}", file=sys.stderr)

    results = []
    parent_city = None
    data_start_row = 9

    for row in range(data_start_row, ws.max_row + 1):
        col_a = ws.cell(row=row, column=1).value
        col_b = ws.cell(row=row, column=2).value

        # 親市区名の更新（政令指定都市名）
        # col_a に値がある行は政令指定都市の合計行 → スキップしつつ親市名を記録
        if col_a and str(col_a).strip():
            val = str(col_a).strip()
            if val.endswith('計') or val == '合計':
                parent_city = None
                continue
            parent_city = val
            continue  # 親市の合計行はデータとしては使わない

        # 地域名の取得
        area = None
        if col_b and str(col_b).strip():
            val = str(col_b).strip()
            if val.endswith('計') or val == '合計':
                continue
            # 既に親市名が含まれていればそのまま、なければ親市名を前置
            if parent_city and not val.startswith(parent_city):
                area = parent_city + val
            else:
                area = val

        if not area:
            continue

        # 得票数を取得
        team_votes = ws.cell(row=row, column=team_col).value
        if team_votes is None:
            continue
        # 文字列の場合は数値変換
        if isinstance(team_votes, str):
            try:
                team_votes = int(team_votes.strip().replace(',', '').replace(' ', ''))
            except ValueError:
                continue
        if not isinstance(team_votes, (int, float)):
            continue
        team_votes = int(team_votes)

        total_votes = None
        if total_col:
            tv = ws.cell(row=row, column=total_col).value
            if isinstance(tv, str):
                try:
                    tv = int(tv.strip().replace(',', '').replace(' ', ''))
                except ValueError:
                    tv = None
            if tv and isinstance(tv, (int, float)):
                total_votes = int(tv)

        rate = round(team_votes / total_votes * 100, 1) if total_votes and total_votes > 0 else 0

        results.append({
            '地域': area,
            '得票数': team_votes,
            '得票率': rate,
            '合計': total_votes,
        })

    return results


def write_csv(rows, filepath, fieldnames):
    os.makedirs(os.path.dirname(filepath) or '.', exist_ok=True)
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({k: row.get(k, '') for k in fieldnames})
    print(f"  → {filepath} ({len(rows)} rows)", file=sys.stderr)


def find_excel_files(raw_dir, *keywords):
    """raw_dir 内で全てのキーワードを含むExcelファイルを探す"""
    matches = []
    for path in glob.glob(os.path.join(raw_dir, '*.xlsx')) + glob.glob(os.path.join(raw_dir, '*.xls')):
        name = os.path.basename(path).lower()
        if all(kw.lower() in name for kw in keywords):
            matches.append(path)
    return matches


def convert_prefecture(prefecture_dir):
    """prefectures/<県名>/ ディレクトリを処理する"""
    raw_dir = os.path.join(prefecture_dir, 'raw')
    data_dir = os.path.join(prefecture_dir, 'data')

    if not os.path.isdir(raw_dir):
        print(f"Error: raw/ ディレクトリが見つかりません: {raw_dir}", file=sys.stderr)
        print(f"選管Excelを {raw_dir}/ に配置してください。", file=sys.stderr)
        sys.exit(1)

    print(f"Processing: {prefecture_dir}", file=sys.stderr)
    print(f"  raw/  → {raw_dir}", file=sys.stderr)
    print(f"  data/ → {data_dir}", file=sys.stderr)
    print()

    converted = 0

    # 参院選挙区
    senate_files = find_excel_files(raw_dir, 'sangi', 'senkyoku')
    if senate_files:
        for f in senate_files:
            print(f"参院選挙区: {os.path.basename(f)}", file=sys.stderr)
            results = parse_senate_district(f)
            if results:
                write_csv(results, os.path.join(data_dir, 'senate.csv'),
                          ['地域', '得票数', '得票率'])
                converted += 1

    # 参院比例（未対応）
    sangi_hirei = find_excel_files(raw_dir, 'sangi', 'hirei')
    if sangi_hirei:
        print(f"参院比例: {len(sangi_hirei)}件検出（パーサー未対応のためスキップ）", file=sys.stderr)

    # 衆院比例（未対応）
    shugi_hirei = find_excel_files(raw_dir, 'shugi', 'hirei')
    if shugi_hirei:
        print(f"衆院比例: {len(shugi_hirei)}件検出（パーサー未対応のためスキップ）", file=sys.stderr)

    if converted == 0:
        print("\nWarning: 変換可能なExcelファイルが見つかりませんでした。", file=sys.stderr)
        print("ファイル名に以下のキーワードを含めてください:", file=sys.stderr)
        print("  - 参院選挙区: sangi + senkyoku  (例: R7.7_sangi_senkyoku.xlsx)", file=sys.stderr)
        sys.exit(1)

    print(f"\nDone! {converted} file(s) converted.", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(
        description='選挙管理委員会 Excel → CSV 変換ツール',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  python3 tools/convert_excel.py prefectures/kanagawa

ディレクトリ構造:
  prefectures/kanagawa/
  ├── raw/                          ← 選管Excelをここに配置
  │   ├── R7.7_sangi_senkyoku.xlsx  ← 参院選挙区（候補者別開票区別得票数）
  │   ├── R7.7_sangi_hirei.xlsx     ← 参院比例（未対応）
  │   └── R8.2_shugi_hirei.xlsx     ← 衆院比例（未対応）
  └── data/                         ← CSVがここに自動生成される
      └── senate.csv

ファイル命名規則:
  ファイル名に以下のキーワードを含めてください（順不同・大文字小文字無視）:
  - sangi + senkyoku → 参院選挙区
  - sangi + hirei    → 参院比例
  - shugi + hirei    → 衆院比例
        """,
    )
    parser.add_argument(
        'prefecture_dir',
        help='都道府県ディレクトリ (例: prefectures/kanagawa)',
    )

    args = parser.parse_args()
    convert_prefecture(args.prefecture_dir)


if __name__ == '__main__':
    main()
