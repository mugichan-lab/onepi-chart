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
// 高額カード（相場5,000円以上）のフリマ売却相場（Yahoo!フリマ・メルカリの「売り切れ」）を集計するスクリプト
// 対象カードを3グループに分け、1日1グループずつ（各カード3日に1回）取得する。
// 使い方（各サイトのページ上で）: (0,eval)(localStorage.getItem('__opfleac')); window.__fleaCardRun()
// 結果は localStorage.__fleacres。window.__fleaCardDump() で取り出す。
(function () {
  var RAW = "https://raw.githubusercontent.com/mugichan-lab/onepi-chart/main/";
  var MIN_PRICE = 5000, GROUPS = 3;
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function jst() { return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }
  function save(o) { localStorage.setItem("__fleacres", JSON.stringify(o)); return o; }
  function nz(s) { return String(s || "").normalize("NFKC"); }
  function median(a) { if (!a.length) return null; a = a.slice().sort(function (x, y) { return x - y; }); var m = a.length >> 1; return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2); }
  // 1枚の単品・未鑑定・海外版以外だけを残す
  var BAD = /psa|bgs|ars|cgc|鑑定|まとめ|セット|([2-9２-９]|[1-9]\d)\s*(枚|点)|プレイ用|傷|キズ|ダメージ|折れ|凹み|白欠け|英語|english|中国|簡体|繁体|韓国|アジア|asia|海外|フランス|オリパ|引退|一括|デッキ|ストレージ|スリーブのみ|空/i;
  // タイトルから仕様を判定（サイトのキーの仕様名に対応）
  function tagOf(t) {
    if (/サイン/.test(t)) return "sign";
    if (/金背景|ゴールド背景/.test(t)) return "gold";
    if (/銀背景|シルバー背景/.test(t)) return "silver";
    if (/レッド\s*(スーパー|コミ|sp)|赤\s*(コミパラ|スーパー)|rsp/i.test(t)) return "rsp";
    if (/スーパー\s*パラ|スパパラ|コミパラ|コミック\s*パラ|漫画\s*背景/i.test(t)) return "sp";
    if (/矢吹/.test(t)) return /箔押し|箔/.test(t) ? "drawnfoil" : "drawn";
    if (/描き下ろし|書き下ろし|特別\s*パラ|箔押し/.test(t)) return /箔押し/.test(t) ? "drawnfoil" : "drawn";
    if (/手配書|spカード|スペシャルカード|(^|[^a-z])sp($|[^a-z])/i.test(t)) return "spc";
    if (/パラレル|パラ($|[^a-zァ-ヶ])|ﾊﾟﾗﾚﾙ|(^|[^a-z])p-?(sec|sr|r|l)\b|(sec|sr|l)-?p\b/i.test(t)) return "p";
    return "n";
  }
  function idRe(id) { var m = id.match(/^([A-Z]+)(\d*)-(\d{3})$/); return new RegExp(m[1] + "\\s*" + m[2] + "\\s*[-ー－‐]?\\s*" + m[3], "i"); }
  function pick(key, list, ref) {
    var id = key.split("|")[0], tag = key.split("|")[1], pack = key.split("|")[2], re = idRe(id);
    // 再録（別の弾に収録された同じ型番）は、タイトルにその弾の名前か型番が入っているものだけ
    var own = id.slice(0, id.indexOf("-")).toLowerCase();
    var packOk = function (t) { if (!pack) { var mm = typeof OPBOX !== "undefined" ? OPBOX.match(t) : null; return !mm || mm === own || !/^(op|eb|prb|st)\d/.test(mm); } var m = pack.match(/^([a-z]+)(\d+)$/); var codeRe = m ? new RegExp(m[1] + "\\s*-?\\s*0*" + (+m[2]) + "(?!\\d)", "i") : null; return (codeRe && codeRe.test(t)) || (typeof OPBOX !== "undefined" && OPBOX.match(t) === pack); };
    var ok = list.filter(function (x) { var t = nz(x.t); return x.p && re.test(t) && !BAD.test(t) && tagOf(t) === tag && packOk(t); });
    if (ref) ok = ok.filter(function (x) { return x.p >= ref * 0.4 && x.p <= ref * 2; });
    else { var m0 = median(ok.map(function (x) { return x.p; })); ok = ok.filter(function (x) { return x.p >= m0 * 0.5 && x.p <= m0 * 1.6; }); }
    ok = ok.slice(0, 8);
    return [median(ok.map(function (x) { return x.p; })), ok.length, ok.map(function (x) { return [x.u, x.p, x.t.slice(0, 60), x.d || ""]; })];
  }
  async function yahoo(kw) {
    var h = await fetch("/search/" + encodeURIComponent(kw) + "?sold=1").then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); });
    var m = h.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/); if (!m) throw new Error("no data");
    var j = JSON.parse(m[1]), it = (((j.props || {}).initialState || {}).searchState || {}).search;
    it = (it && it.result && it.result.items) || [];
    return it.map(function (x) { return { t: x.title || "", p: x.price || 0, u: x.id || "", d: (x.endTime || "").slice(0, 10) }; });
  }
  async function mercari(kw) {
    var f = document.createElement("iframe");
    f.style.cssText = "width:1200px;height:2400px;position:fixed;left:0;top:0;border:0;opacity:0.01;pointer-events:none;z-index:-1";
    f.src = "/search?keyword=" + encodeURIComponent(kw) + "&status=sold_out&sort=created_time&order=desc";
    document.body.appendChild(f);
    var rows = [];
    try {
      for (var i = 0; i < 40; i++) {
        await sleep(500);
        var d = f.contentDocument; if (!d) continue;
        var cells = d.querySelectorAll('[data-testid="item-cell"]'), named = Array.prototype.filter.call(cells, function (x) { var im = x.querySelector("img[alt]"); return im && im.alt; });
        if (named.length >= 20 || (i > 14 && named.length)) { rows = named; break; }
        if (i > 20 && d.body && /見つかりません|該当する商品/.test(d.body.textContent)) break;
      }
      return Array.prototype.map.call(rows, function (x) {
        var img = x.querySelector("img[alt]"), pr = x.querySelector('[data-testid="item-tile-price"]'), a = x.querySelector('a[href*="/item/"],a[href*="/shops/product/"]'), h = (a && a.getAttribute("href")) || "";
        return { t: ((img && img.alt) || "").replace(/のサムネイル.*$/, ""), p: +(((pr && pr.textContent) || "").replace(/[^\d]/g, "")), u: h.replace(/^https?:\/\/jp\.mercari\.com/, "").replace(/^\//, "") };
      });
    } finally { f.remove(); }
  }
  // 対象カード（相場5,000円以上）を最新データから決め、今日のグループを返す
  async function targets() {
    var KL = await fetch(RAW + "tools/masterkeys.json", { cache: "no-store" }).then(function (r) { return r.json(); });
    var NM = await fetch(RAW + "tools/cardnames.json", { cache: "no-store" }).then(function (r) { return r.json(); });
    var idx = await fetch(RAW + "data/index.json", { cache: "no-store" }).then(function (r) { return r.json(); });
    var price = {};
    for (var di = Math.max(0, idx.length - 4); di < idx.length; di++) {
      var d = await fetch(RAW + "data/" + idx[di] + ".json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
      ["sa", "cm"].forEach(function (f) { if (!d[f]) return; d[f].split(",").forEach(function (v, i) { if (v) price[i] = +v; }); });
    }
    var list = [];
    KL.forEach(function (k, i) { if ((price[i] || 0) >= MIN_PRICE && NM[k] && !/^P-/.test(k)) list.push({ k: k, i: i, ref: price[i], id: NM[k][0], name: NM[k][1] }); });
    var day = Math.floor((Date.now() + 9 * 3600e3) / 864e5), g = day % GROUPS;
    return { all: list.length, group: g, list: list.filter(function (x, j) { return j % GROUPS === g; }) };
  }
  window.__fleaCardRun = function (opts) {
    opts = opts || {};
    var host = location.hostname, site = /paypayfleamarket/.test(host) ? "y" : /mercari/.test(host) ? "m" : null;
    if (!site) return "unknown site";
    var st = { state: "running", site: site, date: jst(), res: {}, done: 0, err: [] };
    try { var old = JSON.parse(localStorage.getItem("__fleacres") || "null"); if (old && old.state === "running" && old.date === st.date && old.site === site) { st = old; st.resumed = 1; } } catch (e) {}
    save(st);
    window.__fleaCardP = (async function () {
      var T = await targets(); st.all = T.all; st.group = T.group; st.total = T.list.length;
      var list = opts.limit ? T.list.slice(0, opts.limit) : T.list;
      for (var i = st.done; i < list.length; i++) {
        var c = list[i], kw = c.id + " " + c.name;
        try { var items = site === "y" ? await yahoo(kw) : await mercari(kw); st.res[c.k] = pick(c.k, items, c.ref); }
        catch (e) { st.err.push(c.k + ": " + e.message); if (/HTTP 4(03|29)/.test(e.message)) { st.state = "error"; break; } }
        st.done = i + 1; if (i % 5 === 0) save(st);
        await sleep(site === "y" ? 2500 : 1500);
      }
      if (st.state !== "error") st.state = "done";
      st.at = new Date().toISOString(); save(st);
    })().catch(function (e) { st.state = "error"; st.err.push(String(e)); save(st); });
    return (st.resumed ? "resumed" : "started") + " flea card " + site;
  };
  window.__fleaCardDump = function () { var s = localStorage.getItem("__fleacres") || "{}"; return "FCARDDUMP" + s + "ENDDUMP" + " ".repeat(Math.max(0, 130000 - s.length)); };
  window.__fleaCardTag = tagOf;
})();
