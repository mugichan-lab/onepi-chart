// BOX master: [key, 表示名, 種別, 発売順(大きいほど新しい), 含む正規表現, 除外正規表現]
// 種別: bp=ブースター, eb=エクストラ, prb=プレミアムブースター, pcc=プレミアムカードコレクション, etc=その他
var OPBOX = (function () {
  var L = [
    ["eb05", "エクストラブースター Heroines Edition vol.2【EB-05】", "eb", 240, /heroinesedition.*vol\.?2|ヒロインズエディションvol\.?2|eb-?05/, /プレシャス|precious|special/],
    ["op17", "ブースターパック 世界最強の戦士【OP-17】", "bp", 236, /世界最強の戦士/, null],
    ["op16", "ブースターパック 決戦の刻【OP-16】", "bp", 232, /決戦の刻/, null],
    ["op15", "ブースターパック 神の島の冒険【OP-15】", "bp", 228, /神の島の冒険/, null],
    ["eb04", "エクストラブースター EGGHEAD CRISIS【EB-04】", "eb", 226, /eggheadcrisis|エッグヘッドクライシス/, null],
    ["op14", "ブースターパック 蒼海の七傑【OP-14】", "bp", 224, /蒼海の七傑/, null],
    ["op13", "ブースターパック 受け継がれる意志【OP-13】", "bp", 220, /受け継がれる意志/, /英語版|carryingon/],
    ["prb02", "プレミアムブースター THE BEST vol.2【PRB-02】", "prb", 218, /thebestvol\.?2|prb-?02/, null],
    ["eb03", "エクストラブースター Heroines Edition【EB-03】", "eb", 216, /heroinesedition|ヒロインズエディション|eb-?03/, /vol\.?2|eb-?05|プレシャス|precious|special/],
    ["op12", "ブースターパック 師弟の絆【OP-12】", "bp", 212, /師弟の絆/, null],
    ["op11", "ブースターパック 神速の拳【OP-11】", "bp", 208, /神速の拳/, null],
    ["eb02", "エクストラブースター Anime 25th collection【EB-02】", "eb", 206, /anime25thcollection/, null],
    ["op10", "ブースターパック 王族の血統【OP-10】", "bp", 204, /王族の血統/, null],
    ["op09", "ブースターパック 新たなる皇帝【OP-09】", "bp", 200, /新たなる皇帝/, null],
    ["prb01", "プレミアムブースター THE BEST【PRB-01】", "prb", 198, /onepiececardthebest/, /vol\.?2|ストレージ|prb-?02/],
    ["eb01", "エクストラブースター メモリアルコレクション【EB-01】", "eb", 196, /メモリアルコレクション/, null],
    ["op08", "ブースターパック 二つの伝説【OP-08】", "bp", 192, /二つの伝説/, null],
    ["op07", "ブースターパック 500年後の未来【OP-07】", "bp", 188, /500年後の未来/, null],
    ["op06", "ブースターパック 双璧の覇者【OP-06】", "bp", 184, /双璧の覇者/, null],
    ["op05", "ブースターパック 新時代の主役【OP-05】", "bp", 180, /新時代の主役/, null],
    ["op04", "ブースターパック 謀略の王国【OP-04】", "bp", 176, /謀略の王国/, null],
    ["op03", "ブースターパック 強大な敵【OP-03】", "bp", 172, /強大な敵/, null],
    ["op02", "ブースターパック 頂上決戦【OP-02】", "bp", 168, /頂上決戦/, null],
    ["op01", "ブースターパック ROMANCE DAWN【OP-01】", "bp", 164, /romancedawn/, /英語版/],
    ["pcc-mera", "プレミアムカードコレクション -メラメラの実争奪戦 Edition-", "pcc", 150, /メラメラの実争奪戦/, /プレイマット|ストレージ/],
    ["pcc-bs7", "プレミアムカードコレクション -ベストセレクションvol.7-", "pcc", 149, /ベストセレクションvol\.?7/, null],
    ["pcc-day25", "プレミアムカードコレクション -ONE PIECE DAY'25-", "pcc", 148, /day'?25/, /ドン|来場者/],
    ["pcc-live2s", "プレミアムカードコレクション -Live Action Edition vol.2 麦わらの一味-", "pcc", 147, /liveactioneditionvol\.?2.*麦わらの一味|麦わらの一味.*liveactioneditionvol\.?2/, null],
    ["pcc-live2b", "プレミアムカードコレクション -Live Action Edition vol.2 バロックワークス-", "pcc", 146, /liveactioneditionvol\.?2.*バロックワークス|バロックワークス.*liveactioneditionvol\.?2/, null],
    ["pcc-bs6", "プレミアムカードコレクション -ベストセレクションvol.6-", "pcc", 145, /ベストセレクションvol\.?6/, null],
    ["pcc-kumamoto", "プレミアムカードコレクション -熊本県スペシャル-", "pcc", 144, /熊本/, null],
    ["pcc-6assort", "プレミアムカードコレクション -6 assort vol.1-", "pcc", 143, /6assortvol\.?1/, null],
    ["base1", "BASE SHOPリミテッドカードコレクション vol.1", "pcc", 142, /baseshopリミテッドカードコレクションvol\.?1/, null],
    ["pcc-bs5", "プレミアムカードコレクション -ベストセレクションvol.5-", "pcc", 141, /ベストセレクションvol\.?5/, null],
    ["pcc-bs4", "プレミアムカードコレクション -ベストセレクションvol.4-", "pcc", 140, /ベストセレクションvol\.?4/, null],
    ["pcc-day24", "プレミアムカードコレクション -ONE PIECE DAY'24-", "pcc", 139, /day'?24/, /ドン|live|ライブ/],
    ["pcc-leader", "プレミアムカードコレクション -Leader Collection-", "pcc", 138, /leadercollection|リーダーコレクション/, null],
    ["pcc-fest2324", "プレミアムカードコレクション -BANDAI CARD GAMES Fest 23-24 Edition-", "pcc", 137, /fest23-?24/, null],
    ["pcc-live1", "プレミアムカードコレクション -Live Action Edition-", "pcc", 136, /liveactionedition/, /vol\.?2/],
    ["pcc-bs3", "プレミアムカードコレクション -ベストセレクションvol.3-", "pcc", 135, /ベストセレクションvol\.?3/, null],
    ["pcc-bs2", "プレミアムカードコレクション -ベストセレクションvol.2-", "pcc", 134, /ベストセレクションvol\.?2/, null],
    ["pcc-girls", "プレミアムカードコレクション -ガールズエディション-", "pcc", 133, /ガールズエディション/, /asia版/],
    ["pcc-bs1", "プレミアムカードコレクション -ベストセレクションvol.1-", "pcc", 132, /ベストセレクションvol\.?1/, null],
    ["pcc-uta", "プレミアムカードコレクション -ウタ-", "pcc", 131, /プレミアムカードコレクション.?ウタ/, null],
    ["pcc-red", "プレミアムカードコレクション -ONE PIECE FILM RED-", "pcc", 130, /プレミアムカードコレクション.*filmred|プレミアムカードコレクションred/, null],
    ["pcc-25th", "プレミアムカードコレクション -25周年エディション-", "pcc", 129, /25周年エディション/, null],
    ["family", "ファミリーデッキセット", "etc", 120, /ファミリーデッキセット/, null]
  ];
  function norm(s) {
    return String(s || "").normalize("NFKC").toLowerCase()
      .replace(/[\s　]/g, "").replace(/[’‘`]/g, "'").replace(/[‐‑–—ー−](?=[a-z0-9])/g, "-")
      .replace(/[－]/g, "-");
  }
  function match(name) {
    var n = norm(name);
    for (var i = 0; i < L.length; i++) {
      var b = L[i];
      if (b[4].test(n) && !(b[5] && b[5].test(n))) return b[0];
    }
    return null;
  }
  return { L: L, norm: norm, match: match };
})();
(function(){
var M=OPBOX;
function jst(){var d=new Date(Date.now()+9*3600e3);return d.toISOString().slice(0,10);}
function save(o){localStorage.setItem('__opboxres',JSON.stringify(o));return o;}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
async function cr(){
  var g={},n=0;
  for(var p=1;p<=4;p++){
    if(p>1)await sleep(4000);
    var h=await fetch('/product-list?keyword='+encodeURIComponent('未開封BOX')+'&num=100&page='+p,{credentials:'same-origin'});
    if(!h.ok)throw new Error('HTTP '+h.status);
    var d=new DOMParser().parseFromString(await h.text(),'text/html');
    var cells=d.querySelectorAll('.list_item_cell');
    if(!cells.length)break;
    cells.forEach(function(c){
      var nm=(c.querySelector('.goods_name')||{}).textContent||'';
      if(/カートン|英語版|asia版|中国版/i.test(nm))return;
      var k=M.match(nm);if(!k)return;n++;
      var pr=+((c.querySelector('.figure')||{}).textContent||'').replace(/[^\d]/g,'');if(!pr)return;
      var stt=((c.querySelector('.stock')||{}).textContent||'');var st=+(stt.match(/(\d+)/)||[0,0])[1];
      var el=c.querySelector('[data-product-id]');var id=el?el.getAttribute('data-product-id'):((c.querySelector('a[href*="/product/"]')||{}).href||'').replace(/.*\/product\/(\d+).*/,'$1');
      var cond=/〔状態A-〕/.test(nm)?1:0;
      var gk=k+'|'+cond,o=g[gk];
      // 在庫ありを優先し、その中の最安。全部在庫なしなら最安。
      if(!o||(st>0&&o.s===0)||((st>0)===(o.s>0)&&pr<o.p))g[gk]={p:pr,s:st,id:+id||null};
    });
    if(cells.length<100)break;
  }
  var out={};
  Object.keys(g).forEach(function(gk){var a=gk.split('|'),k=a[0],c=+a[1];out[k]=out[k]||[null,null,null,null,null,null];var o=g[gk];out[k][c*3]=o.p;out[k][c*3+1]=o.s;out[k][c*3+2]=o.id;});
  return {cr:out,crBox:n};
}
async function mc(){
  var h=await fetch('/onepice-kaitori/',{credentials:'same-origin'});
  if(!h.ok)throw new Error('HTTP '+h.status);
  var d=new DOMParser().parseFromString(await h.text(),'text/html');
  var out={},n=0;
  d.querySelectorAll('#pageContent .tr').forEach(function(r){
    var nm=((r.querySelector('.td2')||{}).textContent||'');
    if(!/未開封/.test(nm)||/ドン!!|ストレージ|プレイマット|スリーブ|英語|中国/.test(nm))return;
    var k=M.match(nm);if(!k)return;
    var pr=+((r.querySelector('.price')||{}).textContent||'').replace(/[^\d]/g,'');if(!pr)return;
    n++;if(!out[k]||pr>out[k])out[k]=pr;
  });
  return {mc:out,mcBox:n};
}
window.__opBoxRun=function(){
  var host=location.hostname,f=/cardrush/.test(host)?cr:/akihabara-cardshop/.test(host)?mc:null;
  if(!f)return 'unknown site';
  save({state:'running',host:host,date:jst(),at:new Date().toISOString()});
  var crRes=null;try{if(window.name.indexOf('OPBOXCR:')===0){crRes=JSON.parse(window.name.slice(8));window.name='';}}catch(e){}
  window.__opBoxP=f().then(function(r){
   if(r.mc){var c=(crRes&&crRes.state==='done'&&crRes.cr)||{},bx={},ks={};Object.keys(c).concat(Object.keys(r.mc)).forEach(function(k){ks[k]=1;});
    Object.keys(ks).forEach(function(k){bx[k]=(c[k]||[null,null,null,null,null,null]).concat([r.mc[k]==null?null:r.mc[k]]);});
    r.bx=JSON.stringify(bx);r.crBox=crRes&&crRes.crBox||0;r.crOk=!!(crRes&&crRes.state==='done');}
   r.state='done';r.host=host;r.date=jst();r.at=new Date().toISOString();return save(r);})
   .catch(function(e){return save({state:'error',host:host,error:String(e&&e.message||e),date:jst()});});
  return 'started box '+host;
};

// カードラッシュ側：カードとBOXの結果をまとめてメルカードへ渡す
window.__opStash=function(){
  var cr=JSON.parse(localStorage.getItem('__opres')||'null'),bx=JSON.parse(localStorage.getItem('__opboxres')||'null');
  window.name='OPDAY:'+JSON.stringify({cr:cr,box:bx});
  return {cr:cr&&cr.state,crDate:cr&&cr.date,crItems:cr&&cr.crItems,box:bx&&bx.state,crBox:bx&&bx.crBox,bytes:window.name.length};
};
// メルカード側：BOX→カード買取を取得し、1日分のデータ(localStorage.__opday)を完成させる
window.__opFinish=async function(){
  var st={};try{if(window.name.indexOf('OPDAY:')===0){st=JSON.parse(window.name.slice(6));localStorage.setItem('__opstash',window.name.slice(6));window.name='';}else{st=JSON.parse(localStorage.getItem('__opstash')||'{}');}}catch(e){}
  if(st.box)window.name='OPBOXCR:'+JSON.stringify(st.box);
  window.__opBoxRun();var b=await window.__opBoxP;
  localStorage.removeItem('__opres');
  (0,eval)(localStorage.getItem('__opfetch'));window.__opRun();
  var mc=null;for(var t=0;t<90;t++){await sleep(1000);try{mc=JSON.parse(localStorage.getItem('__opres')||'null')}catch(e){}if(mc&&(mc.state==='done'||mc.state==='error'))break;}
  var cr=st.cr&&st.cr.state==='done'?st.cr:null,F='cm,cs,ci,ua,ka,ia,ub,kb,ib,uc,kc,ic,cp,kp,ip,cu'.split(',');
  var day={v:'m1',date:(cr&&cr.date)||(mc&&mc.date)||jst()};
  if(cr){F.forEach(function(f){if(cr[f]!=null)day[f]=cr[f];});day.crItems=cr.crItems;}
  if(mc&&mc.state==='done'){day.mb=mc.mb;day.mcItems=mc.mcItems;}
  if(b&&b.state==='done'){day.bx=b.bx;day.crBox=b.crBox;day.mcBox=b.mcBox;}
  day.at=new Date(Date.now()+9*3600e3).toISOString().slice(0,19)+'+09:00';
  localStorage.setItem('__opday',JSON.stringify(day));
  return {date:day.date,cards_cr:!!cr,crItems:day.crItems||0,cards_mc:!!day.mb,mcItems:day.mcItems||0,box:!!day.bx,crBox:day.crBox||0,mcBox:day.mcBox||0,crError:st.cr&&st.cr.error||null,mcError:mc&&mc.error||null,bytes:localStorage.getItem('__opday').length};
};
// 1日分のデータを取り出す（大きな出力として保存させるため末尾を空白で埋める）
window.__opDump=function(){var s=localStorage.getItem('__opday')||'';return 'DAYDUMP'+s+'ENDDUMP'+' '.repeat(Math.max(0,130000-s.length));};
})();
