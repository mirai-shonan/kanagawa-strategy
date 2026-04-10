// ============================================================
// app.js — チームみらい 活動戦略ダッシュボード ロジック
// DATA, POSTING, KAWAI, CONFIG は data.js で定義済み
// ============================================================

// ===== ヘッダー初期化 =====
function initHeader() {
  document.querySelector('.header-title').textContent = 'チームみらい ' + CONFIG.prefectureName + '活動戦略';
  document.querySelector('.header-sub').textContent = '衆院' + CONFIG.houseElection + ' ／ 参院' + CONFIG.senateElection + ' データ';
}

// ===== 概要カード =====
function renderOverview() {
  document.getElementById('overview-stats').innerHTML = `
  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-label">衆院比例<br>チームみらい（${CONFIG.prefectureName}）</div>
      <div class="stat-value">${CONFIG.teamVotesHouse.toLocaleString()}<span class="stat-unit">票</span></div>
      <div class="stat-sub">${CONFIG.teamRateHouse}% ${CONFIG.teamRateHouseRank}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">参院比例<br>チームみらい（${CONFIG.prefectureName}）</div>
      <div class="stat-value">${CONFIG.teamVotesSenate.toLocaleString()}<span class="stat-unit">票</span></div>
      <div class="stat-sub">${CONFIG.teamRateSenate}% ${CONFIG.teamRateSenateNote}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">衆院 最高得票率</div>
      <div class="stat-value">${CONFIG.topRate}<span class="stat-unit">%</span></div>
      <div class="stat-sub">${CONFIG.topRateArea}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">${CONFIG.electedBlocLabel}<br>チーム${CONFIG.prefectureName}</div>
      <div class="stat-value" style="font-size:15px;color:var(--green-mid);">${CONFIG.electedLabel}</div>
      <div class="stat-sub">${CONFIG.electedSummary}</div>
    </div>
  </div>`;
}

// ===== 政党バーチャート =====
function renderPartyBars() {
  const label = document.getElementById('party-bars-label');
  if (label) label.textContent = `衆院比例 県全体 党派別得票率（総票数${CONFIG.totalVotes.toLocaleString()}）`;
  const maxRate = Math.max(...CONFIG.partyBars.map(b => b.rate));
  document.getElementById('party-bars').innerHTML = CONFIG.partyBars.map(bar => `
    <div class="party-bar-row">
      <div class="party-bar-label">
        <span style="${bar.highlight ? 'color:#2aaa8a;font-weight:700;' : ''}">${bar.highlight ? bar.name + ' ★' : bar.name}</span>
        <span style="color:${bar.color};font-weight:700;">${bar.rate}%</span>
      </div>
      <div class="party-bar-bg">
        <div class="party-bar-fill" style="width:${bar.rate / maxRate * 100}%;background:${bar.color};"></div>
      </div>
    </div>`).join('');
  const insight = document.getElementById('overview-insight');
  if (insight && CONFIG.overviewInsight) {
    insight.innerHTML = '<strong>位置づけ：</strong>' + CONFIG.overviewInsight;
  }
}

// ===== フッター =====
function renderFooter() {
  const footer = document.getElementById('app-footer') || document.querySelector('.footer');
  if (!footer) return;
  footer.innerHTML =
    'データ出典：' + CONFIG.dataSourceLabel + '<br>' +
    CONFIG.dataSourceUrls.map(s => '<a href="' + s.url + '" style="color:var(--green-mid);">' + s.label + '</a>').join('／') + '<br>' +
    '——— チームみらい ' + CONFIG.prefectureName + '活動チーム用内部資料 ———';
}

// ===== ポスティング =====
function renderPosting() {
  // ランキング
  const sorted = [...POSTING].sort((a,b)=>b.配布枚数-a.配布枚数);
  const top15 = sorted.filter(d=>d.配布枚数>0).slice(0,15);
  const maxVal = top15[0]?.配布枚数||1;

  document.getElementById('posting-ranking').innerHTML = top15.map((d,i)=>`
    <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f0f4f1;">
      <div style="font-size:10px;color:var(--muted);width:18px;font-family:'DM Mono',monospace;">${String(i+1).padStart(2,'0')}</div>
      <div style="flex:1;font-size:12px;font-weight:700;">${d.地域}</div>
      <div style="width:60px;height:5px;background:#e8f5ec;border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:${Math.round(d.配布枚数/maxVal*100)}%;background:#95e3cd;border-radius:3px;"></div>
      </div>
      <div style="font-size:11px;font-weight:900;color:var(--green-mid);font-family:'DM Mono',monospace;min-width:50px;text-align:right;">${d.配布枚数.toLocaleString()}枚</div>
      <div style="font-size:11px;color:var(--muted);min-width:36px;text-align:right;">${d.得票率}%</div>
    </div>`).join('');

  // テーブル
  const tbody = document.getElementById('posting-tbody');
  tbody.innerHTML = sorted.map(d=>{
    const rateClass = d.得票率>=12?'high':d.得票率<=7?'low':'';
    return `<tr>
      <td>${d.地域}</td>
      <td style="font-weight:${d.配布枚数>0?'700':'400'};color:${d.配布枚数>0?'var(--green-mid)':'var(--muted)'};">${d.配布枚数>0?d.配布枚数.toLocaleString()+'枚':'—'}</td>
      <td class="${rateClass}">${d.得票率}%</td>
    </tr>`;
  }).join('');

  // 散布図
  setTimeout(renderScatter, 100);
}

function renderScatter() {
  const canvas = document.getElementById('scatter-chart');
  if(!canvas) return;
  const dpr = window.devicePixelRatio||1;
  const W = Math.max(canvas.parentElement.offsetWidth - 26, 300);
  const H = 280;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const pad = {l:40, r:20, t:20, b:44};
  const pw = W - pad.l - pad.r;
  const ph = H - pad.t - pad.b;

  const maxX = 7000;
  const maxY = 16;

  ctx.clearRect(0,0,W,H);

  // 背景
  ctx.fillStyle='#f9fafb';
  ctx.fillRect(pad.l, pad.t, pw, ph);

  // グリッド線・Y軸ラベル
  ctx.strokeStyle='#e5e7eb'; ctx.lineWidth=1;
  ctx.font=`${Math.round(9*dpr)/dpr}px 'DM Mono',monospace`;
  ctx.fillStyle='#9ca3af'; ctx.textAlign='right';
  [0,4,8,12,16].forEach(y=>{
    const cy = pad.t + ph - (y/maxY*ph);
    ctx.beginPath(); ctx.moveTo(pad.l,cy); ctx.lineTo(pad.l+pw,cy); ctx.stroke();
    ctx.fillText(y+'%', pad.l-6, cy+3);
  });

  // X軸ラベル
  ctx.textAlign='center';
  [0,1000,2000,3000,4000,5000,6000,7000].forEach(x=>{
    const cx = pad.l + (x/maxX*pw);
    ctx.beginPath(); ctx.strokeStyle='#e5e7eb';
    ctx.moveTo(cx, pad.t); ctx.lineTo(cx, pad.t+ph); ctx.stroke();
    ctx.fillStyle='#9ca3af';
    ctx.fillText(x===0?'0':(x/1000)+'k', cx, pad.t+ph+14);
  });

  // 軸線
  ctx.strokeStyle='#d1d5db'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(pad.l,pad.t); ctx.lineTo(pad.l,pad.t+ph); ctx.lineTo(pad.l+pw,pad.t+ph); ctx.stroke();

  // 軸ラベル
  ctx.fillStyle='#6b7b6e'; ctx.font=`10px 'Noto Sans JP',sans-serif`;
  ctx.textAlign='center';
  ctx.fillText('配布枚数（枚）', pad.l+pw/2, H-4);
  ctx.save(); ctx.translate(12, pad.t+ph/2); ctx.rotate(-Math.PI/2);
  ctx.fillText('得票率', 0, 0); ctx.restore();

  // トレンドライン
  const pts = POSTING.filter(d=>d.配布枚数>0);
  if(pts.length>1){
    const n=pts.length;
    const sx=pts.reduce((s,d)=>s+d.配布枚数,0);
    const sy=pts.reduce((s,d)=>s+d.得票率,0);
    const sxy=pts.reduce((s,d)=>s+d.配布枚数*d.得票率,0);
    const sx2=pts.reduce((s,d)=>s+d.配布枚数**2,0);
    const slope=(n*sxy-sx*sy)/(n*sx2-sx**2);
    const intercept=(sy-slope*sx)/n;
    ctx.beginPath();
    ctx.strokeStyle='rgba(15,169,104,0.35)'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
    ctx.moveTo(pad.l, pad.t+ph-Math.min(intercept/maxY*ph, ph));
    ctx.lineTo(pad.l+pw, pad.t+ph-Math.min((slope*maxX+intercept)/maxY*ph, ph));
    ctx.stroke(); ctx.setLineDash([]);
  }

  // 点を描画
  POSTING.forEach(d=>{
    const cx = pad.l + (d.配布枚数/maxX*pw);
    const cy = pad.t + ph - (d.得票率/maxY*ph);
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI*2);
    if(d.配布枚数>0){
      ctx.fillStyle='#0fa968';
      ctx.fill();
      ctx.strokeStyle='white'; ctx.lineWidth=1.5; ctx.stroke();
    } else {
      ctx.fillStyle='rgba(156,163,175,0.5)';
      ctx.fill();
      ctx.strokeStyle='rgba(156,163,175,0.8)'; ctx.lineWidth=1; ctx.stroke();
    }
  });

  // クリックイベント保存
  canvas._data = POSTING;
  canvas._pad = pad; canvas._pw = pw; canvas._ph = ph;
  canvas._maxX = maxX; canvas._maxY = maxY;
}

// タップで詳細表示（ポスティング散布図）
document.addEventListener('click', e=>{
  const canvas = document.getElementById('scatter-chart');
  if(!canvas || e.target!==canvas) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX-rect.left, my = e.clientY-rect.top;
  const {_data:data,_pad:pad,_pw:pw,_ph:ph,_maxX:maxX,_maxY:maxY} = canvas;
  if(!data) return;
  let nearest=null, minDist=30;
  data.forEach(d=>{
    const cx=pad.l+(d.配布枚数/maxX*pw), cy=pad.t+ph-(d.得票率/maxY*ph);
    const dist=Math.hypot(cx-mx,cy-my);
    if(dist<minDist){minDist=dist;nearest=d;}
  });
  if(nearest) alert(`${nearest.地域}\n配布枚数: ${nearest.配布枚数.toLocaleString()}枚\n得票率: ${nearest.得票率}%`);
});

// ===== 全自治体テーブル =====
// 注: filteredData は CSV 読み込み完了後 (buildAreaMaps内) で初期化される
let currentSort = {key:'チームみらい率', asc:false};
let filteredData = [];

function renderTable(data){
  const tbody = document.getElementById('all-tbody');
  tbody.innerHTML = data.map(d=>{
    const rateClass = d['チームみらい率']>=12?'high':d['チームみらい率']<=7?'low':'';
    const sanVotes = Math.round(d['チームみらい_参票数']||0);
    const diffClass = d['衆参差']>=6.5?'high':'';
    return `<tr>
      <td>${d['地域']}</td>
      <td class="${rateClass}">${d['チームみらい率']}%</td>
      <td>${d['チームみらい率_参']}%</td>
      <td>${d['チームみらい'].toLocaleString()}</td>
      <td>${sanVotes>0?sanVotes.toLocaleString():'—'}</td>
      <td class="${diffClass}">+${d['衆参差']}</td>
    </tr>`;
  }).join('');
}

function sortTable(key, desc, btn){
  currentSort = {key, asc:!desc};
  filteredData.sort((a,b)=> desc ? (b[key]||0)-(a[key]||0) : (a[key]||0)-(b[key]||0));
  renderTable(filteredData);
  document.querySelectorAll('.sort-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
}

function filterTable(){
  const q = document.getElementById('search-input').value;
  filteredData = DATA.filter(d=>d['地域'].includes(q));
  filteredData.sort((a,b)=> currentSort.asc ? (a[currentSort.key]||0)-(b[currentSort.key]||0) : (b[currentSort.key]||0)-(a[currentSort.key]||0));
  renderTable(filteredData);
}

// ===== TOP10 得票率 =====
function renderTop10(){
  const top10 = [...DATA].sort((a,b)=>b['チームみらい率']-a['チームみらい率']).slice(0,10);
  document.getElementById('top10-list').innerHTML = top10.map((d,i)=>`
    <div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid #f0f4f1;gap:8px;">
      <div style="font-size:10px;color:var(--muted);width:18px;font-family:'DM Mono',monospace;">${String(i+1).padStart(2,'0')}</div>
      <div style="flex:1;font-size:12px;font-weight:700;">${d['地域']}</div>
      <div style="width:80px;height:5px;background:#e8f2ea;border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:${d['チームみらい率']/15*100}%;background:#95e3cd;border-radius:3px;"></div>
      </div>
      <div style="font-size:14px;font-weight:900;color:var(--green-mid);font-family:'DM Mono',monospace;">${d['チームみらい率']}%</div>
    </div>`).join('');
}

// ===== 衆参比較リスト =====
function renderDiffLists(){
  const sorted = [...DATA].sort((a,b)=>b['衆参差']-a['衆参差']);
  const up = sorted.slice(0,10);
  const down = sorted.slice(-8).reverse();
  document.getElementById('diff-up-list').innerHTML = up.map((d,i)=>`
    <div class="compare-row">
      <div class="compare-rank">${String(i+1).padStart(2,'0')}</div>
      <div class="compare-name">${d['地域']}</div>
      <div class="compare-nums">
        <span style="font-size:10px;color:var(--muted);">参${d['チームみらい率_参']}% → 衆${d['チームみらい率']}%</span>
        <span class="diff-badge">+${d['衆参差']}pt</span>
      </div>
    </div>`).join('');
  document.getElementById('diff-down-list').innerHTML = down.map((d,i)=>`
    <div class="compare-row">
      <div class="compare-rank">${String(i+1).padStart(2,'0')}</div>
      <div class="compare-name">${d['地域']}</div>
      <div class="compare-nums">
        <span style="font-size:10px;color:var(--muted);">参${d['チームみらい率_参']}% → 衆${d['チームみらい率']}%</span>
        <span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:8px;background:#fee2e2;color:#991b1b;">+${d['衆参差']}pt</span>
      </div>
    </div>`).join('');
}

// ===== 河合データ =====
function renderKawai(){
  const sorted = [...KAWAI].sort((a,b)=>b.率-a.率);
  document.getElementById('kawai-list').innerHTML = sorted.map((d,i)=>`
    <div class="compare-row">
      <div class="compare-rank">${String(i+1).padStart(2,'0')}</div>
      <div class="compare-name">${d.地域}</div>
      <div class="compare-nums">
        <span style="font-size:10px;color:var(--muted);">${d.得票.toLocaleString()}票</span>
        <span style="font-size:13px;font-weight:900;color:#6b4fbb;font-family:'DM Mono',monospace;">${d.率}%</span>
      </div>
    </div>`).join('');
}

// ===== リサイズ（ポスティング散布図） =====
window.addEventListener('resize', ()=>{
  if(document.getElementById('sec-posting').classList.contains('active')) renderScatter();
});

// ===== タブ切り替え =====
function sw(t, updateHash = true){
  const sec = document.getElementById('sec-'+t);
  if (!sec) return;  // 不正なタブ名の場合は何もしない
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  sec.classList.add('active');
  // クリック以外（hashchange等）でも対応するため、onclick属性からタブボタンを探す
  const btn = [...document.querySelectorAll('.tab-btn')].find(b =>
    b.getAttribute('onclick')?.includes(`'${t}'`));
  if (btn) btn.classList.add('active');
  // URLハッシュを更新（hashchange由来の呼び出しでは更新しない）
  if (updateHash && location.hash.slice(1) !== t) {
    location.hash = t;
  }
  window.scrollTo({top:0,behavior:'smooth'});
  if(t==='posting') setTimeout(renderScatter, 50);
  if(t==='speech') {
    const d = document.getElementById('speech-scatter')?._data;
    if (d) setTimeout(()=>{ renderSpeechScatter(d.withSpeech, d.noSpeech); }, 50);
  }
}

// ブラウザの戻る/進む、外部リンクからのハッシュ変更に対応
window.addEventListener('hashchange', () => {
  const tab = location.hash.slice(1) || 'overview';
  sw(tab, false);
});

// ============================================================
// 演説セクション - Google Sheets連携版
// ============================================================

// AREA_RATE_MAP / AREA_NAMES は loadCSVData() 完了後に buildAreaMaps() で生成する
let AREA_RATE_MAP = {};
let AREA_NAMES = [];

function buildAreaMaps() {
  AREA_RATE_MAP = {};
  DATA.forEach(d => { AREA_RATE_MAP[d['地域']] = d['チームみらい率']; });
  AREA_NAMES = DATA.map(d => d['地域']).sort();
  filteredData = [...DATA];
}

const SPEECH_API_URL = 'https://script.google.com/macros/s/AKfycbz_zvHjY8VJBCoKI_7JFx-VifiGUr2bzUbqxTkHThJTPV3emYYYwmP-cAFXIoavLl5SIA/exec';

// 自動読み込みなし：ボタンを押すまで待機

async function loadSpeechData() {
  setStatus('yellow','読み込み中...','スプレッドシートからデータ取得中');
  const btn = document.getElementById('speech-reload-btn');
  btn.textContent = '読み込み中...'; btn.disabled = true;
  try {
    const res = await fetch(SPEECH_API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('データ形式が不正');
    if (data.length === 0) {
      setStatus('gray','データが0件です','スプレッドシートにデータを追加してください');
    } else {
      processSpeechData(data);
      setStatus('green',`${data.length}件 読み込み完了`,`最終更新: ${new Date().toLocaleTimeString('ja-JP')}`);
    }
  } catch(e) {
    setStatus('red','読み込み失敗: '+e.message,'再読込ボタンをお試しください');
  }
  btn.textContent = '最新データを読み込む'; btn.disabled = false;
}

function setStatus(color, text, sub) {
  const colors={green:'#4ade80',yellow:'#fbbf24',red:'#f87171',gray:'#6b7280'};
  const dot = document.getElementById('speech-status-dot');
  dot.style.background = colors[color]||colors.gray;
  dot.style.animation = color==='yellow' ? 'pulse 1.5s infinite' : 'none';
  document.getElementById('speech-status-text').textContent = text;
  document.getElementById('speech-status-sub').textContent = sub;
}

let _speechPlaces = [];
let _rawSpeechData = [];
let _currentTypeFilter = 'all';

// 種別カラー
const TYPE_COLORS = {
  '街頭演説':            '#ea580c',
  '街頭活動（チラシ配り等）': '#f97316',
  '街宣車遊説':          '#fb923c',
  '個人演説会':          '#7c3aed',
  'ももたろう':          '#0891b2',
  'その他':              '#6b7280',
};

function filterByType(type, btn) {
  _currentTypeFilter = type;
  document.querySelectorAll('#type-filter-btns .sort-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = type === 'all' ? _rawSpeechData : _rawSpeechData.filter(r=>r.type===type);
  const note = type === 'all' ? '' : `「${type}」のみ表示中（${filtered.length}件）`;
  document.getElementById('type-filter-note').textContent = note;
  buildResults(filtered);
}

function processSpeechData(rawData) {
  _rawSpeechData = rawData;
  _currentTypeFilter = 'all';
  document.querySelectorAll('#type-filter-btns .sort-btn').forEach((b,i)=>b.classList.toggle('active',i===0));
  document.getElementById('type-filter-note').textContent = '';

  // 使われている種別だけフィルターボタンを有効化
  const usedTypes = [...new Set(rawData.map(r=>r.type||'その他'))];
  document.querySelectorAll('#type-filter-btns .sort-btn').forEach(b=>{
    const t = b.textContent;
    if(t==='すべて') return;
    b.style.opacity = usedTypes.includes(t) ? '1' : '0.35';
  });

  buildResults(rawData);
  document.getElementById('speech-results').style.display='block';
  document.getElementById('speech-results').scrollIntoView({behavior:'smooth',block:'start'});
}

function buildResults(data) {
  // 場所×種別でキーを作って集計
  const placeMap = {};
  data.forEach(r => {
    if (!r.area) return;
    const type = r.type || 'その他';
    const key = `${r.place||''}__${r.area}__${type}`;
    if (!placeMap[key]) placeMap[key] = {place:r.place||'',area:r.area,type,count:0,vipCount:0,paxTotal:0,paxCount:0,dates:[]};
    placeMap[key].count++;
    if (r.vip) placeMap[key].vipCount++;
    if (r.pax!=null) { placeMap[key].paxTotal+=r.pax; placeMap[key].paxCount++; }
    if (r.date) placeMap[key].dates.push(r.date);
  });
  const places = Object.values(placeMap);
  _speechPlaces = places;

  // エリア集計
  const areaMap = {};
  places.forEach(p => {
    if (!areaMap[p.area]) areaMap[p.area]={area:p.area,count:0,vipCount:0,paxTotal:0,paxCount:0,places:[],types:[]};
    areaMap[p.area].count+=p.count; areaMap[p.area].vipCount+=p.vipCount;
    areaMap[p.area].paxTotal+=p.paxTotal; areaMap[p.area].paxCount+=p.paxCount;
    areaMap[p.area].places.push(p.place);
    areaMap[p.area].types.push(p.type);
  });
  const withSpeech = Object.values(areaMap).map(a=>({...a,rate:AREA_RATE_MAP[a.area]??null})).filter(a=>a.rate!==null);
  const noSpeech   = DATA.filter(d=>!areaMap[d['地域']]).map(d=>({area:d['地域'],rate:d['チームみらい率'],count:0}));

  // サマリー
  const totalCount = data.length;
  const vipCount   = data.filter(r=>r.vip).length;
  const uniqPlaces = places.length;
  const paxRows    = data.filter(r=>r.pax!=null);
  const paxTotal   = paxRows.reduce((s,r)=>s+r.pax,0);
  const paxAvg     = paxRows.length ? Math.round(paxTotal/paxRows.length) : null;

  document.getElementById('sp-total-count').innerHTML=`${totalCount}<span class="stat-unit">回</span>`;
  document.getElementById('sp-total-places').textContent=`${uniqPlaces}か所`;
  document.getElementById('sp-vip-count').innerHTML=`${vipCount}<span class="stat-unit">回</span>`;
  document.getElementById('sp-vip-pct').textContent=`全体の${Math.round(vipCount/Math.max(totalCount,1)*100)}%`;
  document.getElementById('sp-pax-total').innerHTML=paxTotal>0?`${paxTotal.toLocaleString()}<span class="stat-unit">人</span>`:'—';
  document.getElementById('sp-pax-avg').textContent=paxAvg!=null?`平均${paxAvg}人/回（記録あり${paxRows.length}件）`:'記録なし';

  const avgWith    = withSpeech.length?(withSpeech.reduce((s,a)=>s+a.rate,0)/withSpeech.length).toFixed(1):'—';
  const avgWithout = noSpeech.length?(noSpeech.reduce((s,a)=>s+a.rate,0)/noSpeech.length).toFixed(1):'—';
  const diff       = (avgWith!=='—'&&avgWithout!=='—')?(parseFloat(avgWith)-parseFloat(avgWithout)).toFixed(1):'—';
  document.getElementById('sp-avg-with').innerHTML=`${avgWith}<span class="stat-unit">%</span>`;
  document.getElementById('sp-avg-without').innerHTML=`${avgWithout}<span class="stat-unit">%</span>`;
  document.getElementById('sp-cnt-with').textContent=`${withSpeech.length}エリア`;
  document.getElementById('sp-cnt-without').textContent=`${noSpeech.length}エリア`;
  document.getElementById('sp-diff').innerHTML=diff!=='—'?`<span style="color:${parseFloat(diff)>=0?'var(--green-mid)':'var(--red)'}">${parseFloat(diff)>=0?'+':''}${diff}<span class="stat-unit">pt</span></span>`:'—';

  // 種別内訳
  const typeCounts = {};
  data.forEach(r=>{ const t=r.type||'その他'; typeCounts[t]=(typeCounts[t]||0)+1; });
  const maxTypeCount = Math.max(...Object.values(typeCounts),1);
  document.getElementById('sp-type-breakdown').innerHTML = Object.entries(typeCounts)
    .sort((a,b)=>b[1]-a[1])
    .map(([t,c])=>`
      <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f0f4f1;">
        <div style="width:8px;height:8px;border-radius:50%;background:${TYPE_COLORS[t]||'#6b7280'};flex-shrink:0;"></div>
        <div style="flex:1;font-size:12px;font-weight:700;">${t}</div>
        <div style="width:80px;height:5px;background:#f0f4f1;border-radius:3px;overflow:hidden;">
          <div style="height:100%;width:${Math.round(c/maxTypeCount*100)}%;background:${TYPE_COLORS[t]||'#6b7280'};border-radius:3px;"></div>
        </div>
        <div style="font-size:12px;font-weight:900;color:${TYPE_COLORS[t]||'#6b7280'};font-family:'DM Mono',monospace;width:32px;text-align:right;">${c}回</div>
      </div>`).join('');

  // マップバー
  const maxCount = Math.max(...withSpeech.map(a=>a.count),1);
  const sortedAreas = [...withSpeech].sort((a,b)=>b.count-a.count);
  document.getElementById('sp-map-bars').innerHTML=sortedAreas.map(a=>`
    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f0f4f1;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.area}</div>
        <div style="font-size:10px;color:var(--muted);">${[...new Set(a.places)].filter(Boolean).join('・')||'—'}</div>
      </div>
      <div style="width:70px;height:6px;background:#fef3c7;border-radius:3px;overflow:hidden;flex-shrink:0;">
        <div style="height:100%;width:${Math.round(a.count/maxCount*100)}%;background:#ea580c;border-radius:3px;"></div>
      </div>
      <div style="font-size:11px;font-weight:900;color:#ea580c;font-family:'DM Mono',monospace;width:28px;text-align:right;">${a.count}回</div>
      <div style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace;width:38px;text-align:right;">${a.rate}%</div>
    </div>`).join('');

  renderSpeechPlaceTable('count');
  setTimeout(()=>{ drawSpeechScatter(withSpeech,noSpeech); drawSpeechBar(withSpeech,noSpeech); },60);

  // インサイト
  if (withSpeech.length>0&&diff!=='—') {
    const sign=parseFloat(diff)>=0?'+':'';
    const topArea=sortedAreas[0];
    const topType=Object.entries(typeCounts).sort((a,b)=>b[1]-a[1])[0];
    const mostVip=[...withSpeech].sort((a,b)=>b.vipCount-a.vipCount)[0];
    document.getElementById('sp-insight').innerHTML=`
      <strong>分析：</strong>活動実施エリアの平均得票率は<strong>${avgWith}%</strong>で未実施（${avgWithout}%）より<strong>${sign}${diff}pt</strong>。
      最多活動エリアは<strong>${topArea?.area}（${topArea?.count}回）</strong>、最多種別は<strong>${topType?.[0]}（${topType?.[1]}回）</strong>。
      ${paxTotal>0?`延べ参加人数は<strong>${paxTotal.toLocaleString()}人</strong>（記録ありの${paxRows.length}件のみ）。`:''}
      <br>※もともと活動しやすいエリアへの集中バイアスがある点に注意が必要です。`;
  }
}

function renderSpeechPlaceTable(sortKey) {
  let sorted=[..._speechPlaces];
  if(sortKey==='count') sorted.sort((a,b)=>b.count-a.count);
  else if(sortKey==='area') sorted.sort((a,b)=>a.area.localeCompare(b.area,'ja'));
  else if(sortKey==='vip') sorted.sort((a,b)=>b.vipCount-a.vipCount);
  else if(sortKey==='pax') sorted.sort((a,b)=>(b.paxTotal||0)-(a.paxTotal||0));
  else if(sortKey==='rate') sorted.sort((a,b)=>(AREA_RATE_MAP[b.area]||0)-(AREA_RATE_MAP[a.area]||0));
  document.getElementById('sp-place-tbody').innerHTML=sorted.map(p=>{
    const rate=AREA_RATE_MAP[p.area];
    const rateClass=rate>=12?'high':rate<=7?'low':'';
    const lastDate=p.dates.length?[...p.dates].sort().reverse()[0]:'';
    const paxStr=p.paxTotal>0?`${p.paxTotal}人`:'—';
    const color=TYPE_COLORS[p.type]||'#6b7280';
    return `<tr>
      <td style="text-align:left;padding-left:8px;">
        <div style="font-weight:700;font-size:11px;">${p.place||'（場所名なし）'}</div>
        <div style="font-size:10px;color:var(--muted);">${p.area}</div>
        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
          <span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block;"></span>
          <span style="font-size:9px;color:${color};font-weight:700;">${p.type}</span>
          ${lastDate?`<span style="font-size:9px;color:var(--muted);font-family:'DM Mono',monospace;">　${lastDate}</span>`:''}
        </div>
      </td>
      <td style="color:#ea580c;font-weight:700;">${p.count}回</td>
      <td style="color:${p.vipCount>0?'#7c3aed':'var(--muted)'};">${p.vipCount>0?`⭐${p.vipCount}`:'—'}</td>
      <td style="font-family:'DM Mono',monospace;font-size:11px;">${paxStr}</td>
      <td class="${rateClass}">${rate!=null?rate+'%':'—'}</td>
    </tr>`;
  }).join('');
}

function sortSpeechTable(key,btn) {
  renderSpeechPlaceTable(key);
  document.querySelectorAll('#sec-speech .sort-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}

// 手動入力フォールバック
const SPEECH_TYPES = ['街頭演説','街頭活動（チラシ配り等）','街宣車遊説','個人演説会','ももたろう','その他'];
// ===== 演説散布図 =====
function drawSpeechScatter(withSpeech, noSpeech) {
  const canvas=document.getElementById('speech-scatter'); if(!canvas) return;
  const dpr=window.devicePixelRatio||1;
  const W=Math.max(canvas.parentElement.offsetWidth-26,300),H=280;
  canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  const pad={l:40,r:20,t:20,b:44},pw=W-pad.l-pad.r,ph=H-pad.t-pad.b;
  const maxX=Math.max(...withSpeech.map(d=>d.count),1)+1,maxY=16;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#f9fafb';ctx.fillRect(pad.l,pad.t,pw,ph);
  ctx.strokeStyle='#e5e7eb';ctx.lineWidth=1;ctx.font='9px DM Mono,monospace';
  ctx.fillStyle='#9ca3af';ctx.textAlign='right';
  [0,4,8,12,16].forEach(y=>{const cy=pad.t+ph-(y/maxY*ph);ctx.beginPath();ctx.moveTo(pad.l,cy);ctx.lineTo(pad.l+pw,cy);ctx.stroke();ctx.fillText(y+'%',pad.l-6,cy+3);});
  ctx.textAlign='center';
  for(let x=0;x<=maxX;x+=Math.max(1,Math.round(maxX/6))){
    const cx=pad.l+(x/maxX*pw);ctx.beginPath();ctx.strokeStyle='#e5e7eb';ctx.moveTo(cx,pad.t);ctx.lineTo(cx,pad.t+ph);ctx.stroke();
    ctx.fillStyle='#9ca3af';ctx.fillText(x,cx,pad.t+ph+14);
  }
  ctx.strokeStyle='#d1d5db';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(pad.l,pad.t);ctx.lineTo(pad.l,pad.t+ph);ctx.lineTo(pad.l+pw,pad.t+ph);ctx.stroke();
  ctx.fillStyle='#6b7b6e';ctx.font="10px 'Noto Sans JP',sans-serif";ctx.textAlign='center';
  ctx.fillText('演説回数（回）',pad.l+pw/2,H-4);
  ctx.save();ctx.translate(12,pad.t+ph/2);ctx.rotate(-Math.PI/2);ctx.fillText('得票率',0,0);ctx.restore();
  if(withSpeech.length>1){
    const n=withSpeech.length,sx=withSpeech.reduce((s,d)=>s+d.count,0),sy=withSpeech.reduce((s,d)=>s+d.rate,0);
    const sxy=withSpeech.reduce((s,d)=>s+d.count*d.rate,0),sx2=withSpeech.reduce((s,d)=>s+d.count**2,0);
    const den=n*sx2-sx**2;
    if(den!==0){const sl=(n*sxy-sx*sy)/den,ic=(sy-sl*sx)/n;ctx.beginPath();ctx.strokeStyle='rgba(234,88,12,0.35)';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.moveTo(pad.l,pad.t+ph-Math.min(Math.max(ic/maxY*ph,0),ph));ctx.lineTo(pad.l+pw,pad.t+ph-Math.min(Math.max((sl*maxX+ic)/maxY*ph,0),ph));ctx.stroke();ctx.setLineDash([]);}
  }
  noSpeech.forEach(d=>{const cx=pad.l+(Math.random()-0.5)*10+5,cy=pad.t+ph-(d.rate/maxY*ph);ctx.beginPath();ctx.arc(cx,cy,4,0,Math.PI*2);ctx.fillStyle='rgba(156,163,175,0.3)';ctx.fill();});
  withSpeech.forEach(d=>{
    const cx=pad.l+(d.count/maxX*pw),cy=pad.t+ph-(d.rate/maxY*ph);
    ctx.beginPath();ctx.arc(cx,cy,d.vipCount>0?7:5,0,Math.PI*2);
    ctx.fillStyle=d.vipCount>0?'#7c3aed':'#ea580c';ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=1.5;ctx.stroke();
    if(d.vipCount>0){ctx.font='8px serif';ctx.fillStyle='white';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('★',cx,cy);}
  });
  ctx.textBaseline='alphabetic';
  canvas._scatter={withSpeech,noSpeech,pad,pw,ph,maxX,maxY};
}

// タップで詳細表示（演説散布図）
document.addEventListener('click',e=>{
  const canvas=document.getElementById('speech-scatter');
  if(!canvas||e.target!==canvas||!canvas._scatter) return;
  const {withSpeech,pad,pw,ph,maxX,maxY}=canvas._scatter;
  const rect=canvas.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top;
  let nearest=null,minDist=28;
  withSpeech.forEach(d=>{const cx=pad.l+(d.count/maxX*pw),cy=pad.t+ph-(d.rate/maxY*ph);const dist=Math.hypot(cx-mx,cy-my);if(dist<minDist){minDist=dist;nearest=d;}});
  if(nearest) alert(`${nearest.area}\n演説: ${nearest.count}回（議員参加 ${nearest.vipCount}回）\n場所: ${[...new Set(nearest.places||[])].join('、')||'—'}\n得票率: ${nearest.rate}%`);
});

// ===== 演説棒グラフ =====
function drawSpeechBar(withSpeech, noSpeech) {
  const canvas=document.getElementById('speech-bar');if(!canvas) return;
  const dpr=window.devicePixelRatio||1,W=Math.max(canvas.parentElement.offsetWidth-26,300),H=200;
  canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  const pad={l:40,r:20,t:20,b:44},pw=W-pad.l-pad.r,ph=H-pad.t-pad.b,maxY=16;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#f9fafb';ctx.fillRect(pad.l,pad.t,pw,ph);
  const buckets=[
    {label:'未実施',data:noSpeech,color:'rgba(156,163,175,0.6)'},
    {label:'1〜2回',data:withSpeech.filter(d=>d.count<=2),color:'#fdba74'},
    {label:'3〜5回',data:withSpeech.filter(d=>d.count>=3&&d.count<=5),color:'#f97316'},
    {label:'6回以上',data:withSpeech.filter(d=>d.count>=6),color:'#ea580c'},
  ].filter(b=>b.data.length>0);
  ctx.strokeStyle='#e5e7eb';ctx.lineWidth=1;ctx.font='9px DM Mono,monospace';ctx.fillStyle='#9ca3af';ctx.textAlign='right';
  [0,4,8,12,16].forEach(y=>{const cy=pad.t+ph-(y/maxY*ph);ctx.beginPath();ctx.moveTo(pad.l,cy);ctx.lineTo(pad.l+pw,cy);ctx.stroke();ctx.fillText(y+'%',pad.l-6,cy+3);});
  ctx.strokeStyle='#d1d5db';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(pad.l,pad.t);ctx.lineTo(pad.l,pad.t+ph);ctx.lineTo(pad.l+pw,pad.t+ph);ctx.stroke();
  const bw=(pw/buckets.length)*0.6,gap=pw/buckets.length;
  buckets.forEach((b,i)=>{
    const avg=b.data.reduce((s,d)=>s+d.rate,0)/b.data.length,cx=pad.l+gap*i+gap/2,bh=(avg/maxY)*ph;
    ctx.fillStyle=b.color;ctx.fillRect(cx-bw/2,pad.t+ph-bh,bw,bh);
    ctx.fillStyle='#374151';ctx.font="10px 'Noto Sans JP',sans-serif";ctx.textAlign='center';ctx.fillText(b.label,cx,pad.t+ph+14);
    ctx.fillStyle='#1a1a1a';ctx.font="bold 10px 'DM Mono',monospace";ctx.fillText(avg.toFixed(1)+'%',cx,pad.t+ph-bh-5);
    ctx.fillStyle='#6b7b6e';ctx.font="9px 'Noto Sans JP',sans-serif";ctx.fillText(`n=${b.data.length}`,cx,pad.t+ph+26);
  });
}

// ===== リサイズ（演説散布図） =====
window.addEventListener('resize',()=>{
  if(document.getElementById('sec-speech')?.classList.contains('active')){
    const c=document.getElementById('speech-scatter');
    if(c?._scatter) drawSpeechScatter(c._scatter.withSpeech,c._scatter.noSpeech);
  }
});

// ============================================================
// 初期化（CSV読み込み → レンダリング）
// ============================================================
async function initApp() {
  if (typeof loadCSVData === 'function') {
    await loadCSVData();
  }
  buildAreaMaps();
  initHeader();
  renderOverview();
  renderPartyBars();
  renderFooter();
  renderTop10();
  renderPosting();
  sortTable('チームみらい率', true, null);
  renderDiffLists();
  renderKawai();
  // URL ハッシュに対応するタブがあれば、そのタブを開く（ロード時はURL書き換え不要）
  const initialTab = location.hash.slice(1);
  if (initialTab && document.getElementById('sec-' + initialTab)) {
    sw(initialTab, false);
  }
}
initApp();
