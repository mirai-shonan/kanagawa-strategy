#!/usr/bin/env python3
"""
選挙管理委員会 Excel → CSV 変換ツール

選挙管理委員会が公開するExcelファイルをダッシュボード用CSVに変換します。

使い方:
  python3 tools/convert_excel.py --senate-district data/sangi.xlsx --output prefectures/kanagawa/data/

必要パッケージ:
  pip install openpyxl
"""

import argparse
import csv
import os
import sys

try:
    import openpyxl
except ImportError:
    print("Error: openpyxl が必要です。 pip install openpyxl でインストールしてください。", file=sys.stderr)
    sys.exit(1)


def find_team_mirai_col(ws, header_row=7):
    """党名行から「チームみらい」の列インデックスを探す"""
    for col in range(1, ws.max_column + 1):
        val = ws.cell(row=header_row, column=col).value
        if val and 'チームみらい' in str(val):
            return col
    # 候補者名行(row 5)でも探す
    for col in range(1, ws.max_column + 1):
        val = ws.cell(row=5, column=col).value
        if val and 'チームみらい' in str(val):
            return col
    return None


def parse_senate_district(filepath):
    """
    参院比例の選挙区別Excel (g.xlsx形式) をパースする。

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

    # チームみらい列を探す
    team_col = find_team_mirai_col(ws)
    if team_col is None:
        print("Warning: 「チームみらい」列が見つかりませんでした。", file=sys.stderr)
        print("ヘッダー行の内容:", file=sys.stderr)
        for col in range(1, min(ws.max_column + 1, 30)):
            v5 = ws.cell(row=5, column=col).value
            v7 = ws.cell(row=7, column=col).value
            if v5 or v7:
                print(f"  列{col}: row5={v5}, row7={v7}", file=sys.stderr)
        return []

    # 合計列を探す（「合計」「計」などのヘッダー）
    total_col = None
    for col in range(1, ws.max_column + 1):
        for check_row in [5, 7, 8]:
            val = ws.cell(row=check_row, column=col).value
            if val and ('合計' in str(val) or str(val).strip() == '計'):
                total_col = col
                break
        if total_col:
            break

    print(f"チームみらい列: {team_col}, 合計列: {total_col or '未検出'}", file=sys.stderr)

    results = []
    parent_city = None
    data_start_row = 9

    for row in range(data_start_row, ws.max_row + 1):
        col_a = ws.cell(row=row, column=1).value
        col_b = ws.cell(row=row, column=2).value

        # 親市区名の更新（政令指定都市名）
        if col_a and str(col_a).strip():
            val = str(col_a).strip()
            # 「計」行はスキップ
            if val.endswith('計') or val == '合計':
                parent_city = None
                continue
            parent_city = val

        # 地域名の取得
        area = None
        if col_b and str(col_b).strip():
            val = str(col_b).strip()
            # 「計」行はスキップ
            if val.endswith('計') or val == '合計':
                continue
            # 政令指定都市の区の場合、親市名+区名
            if parent_city and ('区' in val):
                area = parent_city + val
            else:
                area = val
        elif col_a and str(col_a).strip():
            val = str(col_a).strip()
            if val.endswith('計') or val == '合計':
                continue
            # 政令指定都市でない一般市町村
            area = val

        if not area:
            continue

        # 得票数を取得
        team_votes = ws.cell(row=row, column=team_col).value
        if team_votes is None or not isinstance(team_votes, (int, float)):
            continue

        team_votes = int(team_votes)

        total_votes = None
        if total_col:
            tv = ws.cell(row=row, column=total_col).value
            if tv and isinstance(tv, (int, float)):
                total_votes = int(tv)

        # 得票率を計算
        rate = round(team_votes / total_votes * 100, 1) if total_votes and total_votes > 0 else 0

        results.append({
            '地域': area,
            '得票数': team_votes,
            '得票率': rate,
            '合計': total_votes,
        })

    return results


def write_csv(rows, filepath, fieldnames):
    """CSVファイルを書き出す"""
    os.makedirs(os.path.dirname(filepath) or '.', exist_ok=True)
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({k: row.get(k, '') for k in fieldnames})
    print(f"Wrote {len(rows)} rows to {filepath}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(
        description='選挙管理委員会 Excel → CSV 変換ツール',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  # 参院比例の選挙区別データを変換
  python3 tools/convert_excel.py --senate-district data/sangi.xlsx --output prefectures/kanagawa/data/

  # 出力ファイル:
  #   prefectures/kanagawa/data/senate.csv
        """,
    )
    parser.add_argument(
        '--senate-district',
        help='参院比例の選挙区別Excel (g.xlsx形式)',
    )
    parser.add_argument(
        '--output', '-o',
        default='.',
        help='出力ディレクトリ (default: current directory)',
    )

    args = parser.parse_args()

    if not args.senate_district:
        parser.print_help()
        print("\nError: 少なくとも1つの入力ファイルを指定してください。", file=sys.stderr)
        sys.exit(1)

    if args.senate_district:
        if not os.path.exists(args.senate_district):
            print(f"Error: ファイルが見つかりません: {args.senate_district}", file=sys.stderr)
            sys.exit(1)

        print(f"Parsing senate district: {args.senate_district}", file=sys.stderr)
        results = parse_senate_district(args.senate_district)

        if not results:
            print("Warning: データが取得できませんでした。Excel形式を確認してください。", file=sys.stderr)
            sys.exit(1)

        # senate.csv を出力（合計列なし）
        senate_path = os.path.join(args.output, 'senate.csv')
        write_csv(results, senate_path, ['地域', '得票数', '得票率'])

        # 合計データがあれば house.csv 相当も出力可能
        has_total = any(r.get('合計') for r in results)
        if has_total:
            print("Note: 合計列が検出されました。得票率は自動計算済みです。", file=sys.stderr)

        print(f"\nDone! {len(results)} municipalities extracted.", file=sys.stderr)


if __name__ == '__main__':
    main()
