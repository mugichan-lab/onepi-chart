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
// 未開封BOXのフリマ売却相場（Yahoo!フリマ・メルカリの「売り切れ」商品）を集計するスクリプト
// 使い方（各サイトのページ上で）:
//   Yahoo!フリマ（https://paypayfleamarket.yahoo.co.jp/）: (0,eval)(localStorage.getItem('__opflea')); window.__fleaRun()
//   メルカリ（https://jp.mercari.com/）                  : (0,eval)(localStorage.getItem('__opflea')); window.__fleaRun()
// 結果は localStorage.__flearess に保存。window.__fleaDump() で取り出す。
(function () {
  var RAW = "https://raw.githubusercontent.com/mugichan-lab/onepi-chart/main/";
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function jst() { return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }
  function save(o) { localStorage.setItem("__flearess", JSON.stringify(o)); return o; }
  // 検索キーワード（BOXの種類ごと）
  var KW = {
    eb05: "ヒロインズエディション vol.2 BOX", op17: "世界最強の戦士 BOX", op16: "決戦の刻 BOX", op15: "神の島の冒険 BOX",
    eb04: "エッグヘッドクライシス BOX", op14: "蒼海の七傑 BOX", op13: "受け継がれる意志 BOX", prb02: "ワンピースカード THE BEST vol.2 BOX",
    eb03: "ヒロインズエディション BOX", op12: "師弟の絆 BOX", op11: "神速の拳 BOX", eb02: "Anime 25th collection BOX",
    op10: "王族の血統 BOX", op09: "新たなる皇帝 BOX", prb01: "ONE PIECE CARD THE BEST BOX", eb01: "メモリアルコレクション BOX",
    op08: "二つの伝説 BOX", op07: "500年後の未来 BOX", op06: "双璧の覇者 BOX", op05: "新時代の主役 BOX", op04: "謀略の王国 BOX",
    op03: "強大な敵 BOX", op02: "頂上決戦 BOX", op01: "ROMANCE DAWN BOX",
    "pcc-mera": "プレミアムカードコレクション メラメラの実争奪戦", "pcc-bs7": "ベストセレクション vol.7", "pcc-day25": "プレミアムカードコレクション ONE PIECE DAY'25",
    "pcc-live2s": "Live Action Edition vol.2 麦わらの一味", "pcc-live2b": "Live Action Edition vol.2 バロックワークス", "pcc-bs6": "ベストセレクション vol.6",
    "pcc-kumamoto": "プレミアムカードコレクション 熊本", "pcc-6assort": "プレミアムカードコレクション 6 assort vol.1", base1: "BASE SHOPリミテッドカードコレクション vol.1",
    "pcc-bs5": "ベストセレクション vol.5", "pcc-bs4": "ベストセレクション vol.4", "pcc-day24": "プレミアムカードコレクション ONE PIECE DAY'24",
    "pcc-leader": "プレミアムカードコレクション リーダーコレクション", "pcc-fest2324": "プレミアムカードコレクション Fest 23-24", "pcc-live1": "プレミアムカードコレクション Live Action Edition",
    "pcc-bs3": "ベストセレクション vol.3", "pcc-bs2": "ベストセレクション vol.2", "pcc-girls": "プレミアムカードコレクション ガールズエディション",
    "pcc-bs1": "ベストセレクション vol.1", "pcc-uta": "プレミアムカードコレクション ウタ", "pcc-red": "プレミアムカードコレクション FILM RED",
    "pcc-25th": "プレミアムカードコレクション 25周年エディション", family: "ファミリーデッキセット"
  };
  // 1BOX（1個）の未開封品だけを残すための除外条件
  var BAD = /([2-9２-９]|[1-9]\d)\s*(box|ボックス|個|点)|box\s*[×x*]\s*[2-9]|カートン|まとめ|空箱|空き箱|外箱のみ|開封済|開封品|バラ|シングル|1枚|カードのみ|パック\s*[1-9]|[1-9]\s*パック|スリーブ|プレイマット|ストレージ|中国|簡体|繁体|英語|english|韓国|アジア|asia|海外版|鑑定|psa|オリパ|プロモ|未開封パック|ジャンク|抜き|サーチ済/i;
  function median(a) { if (!a.length) return null; a = a.slice().sort(function (x, y) { return x - y; }); var m = a.length >> 1; return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2); }
  function pick(key, list, ref, M) {
    // list: [{t:タイトル, p:価格}]（新しい順）
    var ok = list.filter(function (x) {
      if (!x.p || BAD.test(x.t)) return false;
      if (M.match(x.t) !== key) return false;
      if (!/^pcc|base1|family/.test(key) && !/box|ボックス/i.test(x.t)) return false;
      return true;
    }).map(function (x) { return x.p; });
    if (ref) ok = ok.filter(function (p) { return p >= ref * 0.5 && p <= ref * 1.8; });
    else { var m0 = median(ok); ok = ok.filter(function (p) { return p >= m0 * 0.6 && p <= m0 * 1.6; }); }
    ok = ok.slice(0, 10);
    return [median(ok), ok.length];
  }
  async function loadBox() { return OPBOX; }
  async function refs() {
    try {
      var idx = await fetch(RAW + "data/index.json", { cache: "no-store" }).then(function (r) { return r.json(); });
      var d = await fetch(RAW + "data/" + idx[idx.length - 1] + ".json", { cache: "no-store" }).then(function (r) { return r.json(); });
      var bx = JSON.parse(d.bx || "{}"), o = {};
      Object.keys(bx).forEach(function (k) { var a = bx[k]; o[k] = a[0] || (a[6] ? Math.round(a[6] * 1.3) : null); });
      return o;
    } catch (e) { return {}; }
  }
  async function yahoo(key, kw) {
    var h = await fetch("/search/" + encodeURIComponent(kw) + "?sold=1").then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); });
    var m = h.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/); if (!m) throw new Error("no data");
    var j = JSON.parse(m[1]), it = (((j.props || {}).initialState || {}).searchState || {}).search;
    it = (it && it.result && it.result.items) || [];
    return it.map(function (x) { return { t: x.title || "", p: x.price || 0 }; });
  }
  async function mercari(key, kw) {
    var f = document.createElement("iframe");
    f.style.cssText = "width:1200px;height:2400px;position:fixed;left:0;top:0;border:0;opacity:0.01;pointer-events:none;z-index:-1";
    f.src = "/search?keyword=" + encodeURIComponent(kw) + "&status=sold_out&sort=created_time&order=desc";
    document.body.appendChild(f);
    var rows = [];
    try {
      for (var i = 0; i < 50; i++) {
        await sleep(500);
        var d = f.contentDocument; if (!d) continue;
        var cells = d.querySelectorAll('[data-testid="item-cell"]'), named = Array.prototype.filter.call(cells, function (x) { var im = x.querySelector("img[alt]"); return im && im.alt; });
        if (named.length >= 20 || (i > 16 && named.length)) { rows = named; break; }
        if (i > 24 && d.body && /見つかりません|該当する商品/.test(d.body.textContent)) break;
      }
      return Array.prototype.map.call(rows, function (x) {
        var img = x.querySelector("img[alt]"), pr = x.querySelector('[data-testid="item-tile-price"]');
        return { t: ((img && img.alt) || "").replace(/のサムネイル.*$/, ""), p: +(((pr && pr.textContent) || "").replace(/[^\d]/g, "")) };
      });
    } finally { f.remove(); }
  }
  window.__fleaRun = function (only) {
    var host = location.hostname, site = /paypayfleamarket/.test(host) ? "y" : /mercari/.test(host) ? "m" : null;
    if (!site) return "unknown site";
    var st = { state: "running", site: site, date: jst(), res: {}, done: 0, err: [] };
    save(st);
    window.__fleaP = (async function () {
      var M = await loadBox(), R = await refs();
      var keys = Object.keys(KW).filter(function (k) { return !only || only.indexOf(k) >= 0; });
      st.total = keys.length;
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        try { var list = site === "y" ? await yahoo(k, KW[k]) : await mercari(k, KW[k]); st.res[k] = pick(k, list, R[k], M); }
        catch (e) { st.err.push(k + ": " + e.message); if (/HTTP 4(03|29)/.test(e.message)) { st.state = "error"; break; } }
        st.done = i + 1; save(st);
        await sleep(site === "y" ? 2500 : 1500);
      }
      if (st.state !== "error") st.state = "done";
      st.at = new Date().toISOString(); save(st);
    })().catch(function (e) { st.state = "error"; st.err.push(String(e)); save(st); });
    return "started flea " + site;
  };
  window.__fleaDump = function () { var s = localStorage.getItem("__flearess") || "{}"; return "FLEADUMP" + s + "ENDDUMP" + " ".repeat(Math.max(0, 130000 - s.length)); };
})();
