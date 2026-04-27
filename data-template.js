// ===== 都道府県データ定義テンプレート =====
// このファイルをコピーして、各都道府県のデータを入力してください。

const CONFIG = {
  // 都道府県名（例: "東京", "大阪"）
  prefectureName: "",
  // 比例ブロック名（例: "東京ブロック", "近畿ブロック"）
  bloc: "",
  // 衆院選の選挙回次（例: "R8.2"）
  houseElection: "",
  // 参院選の選挙回次（例: "R7.7"）
  senateElection: "",
  // 衆院比例 チームみらい得票数
  teamVotesHouse: 0,
  // 衆院比例 チームみらい得票率（%）
  teamRateHouse: 0,
  // 衆院比例 順位の補足（例: "全11党中4位"）
  teamRateHouseRank: "",
  // 参院比例 チームみらい得票数
  teamVotesSenate: 0,
  // 参院比例 チームみらい得票率（%）
  teamRateSenate: 0,
  // 参院比例の補足（例: "→ 衆院で10.04%に倍増！"）
  teamRateSenateNote: "",
  // 県全体の総投票数
  totalVotes: 0,
  // 衆院比例 最高得票率のエリア名
  topRateArea: "",
  // 衆院比例 最高得票率（%）
  topRate: 0,
  // 当選者数
  electedCount: 0,
  // 当選の表示ラベル（例: "3名当選"）
  electedLabel: "",
  // 当選者名のサマリー（例: "河合みちお・山田えり R8.2"）
  electedSummary: "",
  // 当選ブロックのラベル（例: "衆院選 南関東ブロック"）
  electedBlocLabel: "",
  // データ出典元（例: "神奈川県選挙管理委員会"）
  dataSourceLabel: "",
  // データ出典URL
  dataSourceUrls: [
    // { label: "衆院比例 R8.2.8執行", url: "https://..." },
  ],
  // 政党別得票率（衆院比例）— 棒グラフ表示用
  // highlight: true のものに★マークが付きます
  partyBars: [
    // { name: "自由民主党", rate: 0, color: "#d02020" },
    // { name: "チームみらい", rate: 0, color: "#95e3cd", highlight: true },
  ],
  // 概況セクションの分析コメント（HTML可）
  overviewInsight: "",
};

// ===== フォールバックデータ =====
// 通常は data/*.csv から自動読み込みされるため、ここは空のままでOK。
// CSVが存在しない/読み込めない時にこのデータが使用される。
const FALLBACK_DATA = [
  // { "地域": "○○市", "チームみらい": 0, "チームみらい率": 0, "合計": 0, "チームみらい_参票数": 0, "チームみらい率_参": 0, "衆参差": 0 },
];

const FALLBACK_POSTING = [
  // { "地域": "○○市", "配布枚数": 0, "エリア数": 0, "得票率": 0, "得票数": 0 },
];

const FALLBACK_KAWAI = [
  // { "地域": "○○市", "得票": 0, "率": 0 },
];

// ===== CSV読み込み =====
// data/house.csv, data/senate.csv, data/posting.csv, data/candidate.csv を fetch して自動で DATA/POSTING/KAWAI に展開する。
// 実際のローダーは data.js (神奈川版) を参考にコピーしてください。
let DATA = [];
let POSTING = [];
let KAWAI = [];
