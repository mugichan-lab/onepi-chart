// スニーカーダンク（スニダン）の取引相場を取得するスクリプト（snkrdunk.com のページ上で実行）
// 使い方:
//   対応表づくり（初回・新弾追加時）: (0,eval)(localStorage.getItem('__opsnk')); window.__snkMap()
//   毎日の取得:                      (0,eval)(localStorage.getItem('__opsnk')); window.__snkDaily()
// 進捗・結果は localStorage の __snkmapres / __snkres に保存される。
(function () {
  var RAW = "https://raw.githubusercontent.com/mugichan-lab/onepi-chart/main/";
  var GAP = 900; // 1リクエストごとの間隔(ms)
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function jst() { return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }
  function nz(s) { return String(s || "").normalize("NFKC").replace(/\s+/g, "").replace(/[＆&]/g, "&").toLowerCase(); }

  var PACKS = [
    ["prb02", /thebestvol\.?2|ザ・ベストvol\.?2/], ["prb01", /thebest|ザ・ベスト/],
    ["eb05", /ヒロインズエディションvol\.?2|heroinesedition.*vol\.?2/], ["eb03", /ヒロインズエディション|heroinesedition/],
    ["eb04", /エッグヘッドクライシス|eggheadcrisis/], ["eb02", /アニメ25周年|anime25th/], ["eb01", /メモリアルコレクション/],
    ["op17", /世界最強の戦士/], ["op16", /決戦の刻/], ["op15", /神の島の冒険/], ["op14", /蒼海の七傑/], ["op13", /受け継がれる意志/],
    ["op12", /師弟の絆/], ["op11", /神速の拳/], ["op10", /王族の血統/], ["op09", /新たなる皇帝/], ["op08", /二つの伝説/],
    ["op07", /500年後の未来/], ["op06", /双璧の覇者/], ["op05", /新時代の主役/], ["op04", /謀略の王国/], ["op03", /強大な敵/],
    ["op02", /頂上決戦/], ["op01", /ロマンスドーン|romancedawn/]
  ];
  var STNAMES = {st01:"麦わらの一味",st02:"最悪の世代",st03:"王下七武海",st04:"百獣海賊団",st05:"onepiecefilmedition",st06:"海軍",st07:"ビッグ・マム海賊団",st08:"sideモンキー・d・ルフィ",st09:"sideヤマト",st10:"三船長",st11:"sideウタ",st12:"ゾロ&サンジ",st13:"3兄弟の絆",st14:"3d2y",st21:"ギア5",st22:"エース&ニューゲート",st29:"egghead",st30:"ルフィ&エース"};
  var BAD = /英語版|アジア版|中国語|韓国語|フランス語|簡体|繁体|開封済|未開封|記念品|for japan|for asia|プロモーション|優勝|準優勝|ベスト\d|トップ\d|アニバーサリーセット|スタンダードバトル|フラッグシップ|チャンピオンシップ|トレジャー|ボックス|box/i;

  function packOf(product) {
    var p = nz(product);
    for (var i = 0; i < PACKS.length; i++) if (PACKS[i][1].test(p)) return PACKS[i][0];
    if (/スタートデッキ|アルティメットデッキ/.test(p)) for (var k in STNAMES) if (p.indexOf(STNAMES[k]) >= 0) return k;
    return null;
  }
  // 名前 → {id, pack, kind, author, foil}
  function parse(title) {
    var t = String(title).replace(/^\s*\d+/, "").replace(/(¥[\d,]+|出品待ち)\s*$/, "").trim();
    var m = t.match(/^(.*?)\s*\[([A-Z]{1,4}\d{0,2}-\d{3})\]\s*(.*)$/);
    if (!m || BAD.test(t)) return null;
    var pre = m[1], id = m[2], prod = m[3];
    var pack = packOf(prod); if (!pack) return null;
    var r = (pre.match(/\s([A-Z]{1,3})(?:-([A-Z]{1,4}))?(?=\s|$|:|\()/) || []);
    var v = r[2] || "";
    var kind;
    if (/サイン/.test(pre)) kind = "sign";
    else if (/金背景/.test(pre)) kind = "gold";
    else if (/銀背景/.test(pre)) kind = "silver";
    else if (v === "SPC") kind = "spc";
    else if (v === "RSP" || /レッドコミパラ/.test(pre)) kind = "rsp";
    else if (v === "KSP" || /海賊団/.test(pre)) kind = "ksp";
    else if (v === "SP") kind = "sp";
    else if (v === "RP") kind = "rp";
    else if (v === "P") kind = "p";
    else kind = "n";
    var author = /\((?!コミパラ|レッドコミパラ)[^)]*\)/.test(pre.split(/\s[A-Z]{1,3}(?:-|\s|$)/)[0]);
    var foil = /箔押し/.test(pre);
    return { id: id, pack: pack, kind: kind, author: author, foil: foil };
  }
  // 同じ型番・同じ弾の候補をまとめてサイトのキー(型番|仕様|弾)に割り当てる
  function assign(cands, own, KEYS) {
    var out = {}, taken = {};
    function key(id, tag, pack) { return id + "|" + tag + "|" + (pack && pack !== own ? pack : ""); }
    function put(c, tags) { for (var i = 0; i < tags.length; i++) { var k = key(c.id, tags[i], c.pack); if (KEYS[k] && !taken[k]) { taken[k] = 1; out[k] = c.aid; return; } } }
    var order = { sign: 0, gold: 0, silver: 0, spc: 0, rsp: 0, ksp: 0, sp: 0, rp: 1, foil: 2, p: 3, n: 4 };
    cands.sort(function (a, b) { var x = (order[a.kind] || 0) + (a.kind === "p" && a.author ? -0.5 : 0), y = (order[b.kind] || 0) + (b.kind === "p" && b.author ? -0.5 : 0); return x - y; });
    cands.forEach(function (c) {
      if (c.kind === "p" && c.foil) put(c, c.author ? ["drawnfoil", "foil"] : ["foil", "drawnfoil"]);
      else if (c.kind === "p" && c.author) put(c, ["drawn", "p"]);
      else if (c.kind === "rp") put(c, ["drawn", "sp"]);
      else if (c.kind === "n" && c.foil) put(c, ["foil"]);
      else put(c, [c.kind]);
    });
    return out;
  }
  function save(k, o) { localStorage.setItem(k, JSON.stringify(o)); return o; }

  // ---- 対応表づくり ----
  window.__snkMap = function () {
    var st = { state: "running", at: new Date().toISOString(), done: 0, map: {} };
    try { var old = JSON.parse(localStorage.getItem("__snkmapres") || "null"); if (old && old.state !== "done" && old.map) { st.map = old.map; st.done = old.done || 0; st.resumed = true; } } catch (e) {}
    save("__snkmapres", st);
    window.__snkP = (async function () {
      var KL = await fetch(RAW + "tools/masterkeys.json", { cache: "no-store" }).then(function (r) { return r.json(); });
      var KEYS = {}; KL.forEach(function (k) { KEYS[k] = 1; });
      var ids = []; KL.forEach(function (k) { var id = k.split("|")[0]; if (!/^P-/.test(id) && ids.indexOf(id) < 0) ids.push(id); });
      st.total = ids.length;
      for (var i = st.done; i < ids.length; i++) {
        var id = ids[i];
        try {
          var h = await fetch("/search?keywords=" + encodeURIComponent(id)).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); });
          var d = new DOMParser().parseFromString(h, "text/html"), seen = {}, byPack = {};
          d.querySelectorAll('a[href*="/apparels/"]').forEach(function (a) {
            var aid = (a.getAttribute("href").match(/apparels\/(\d+)/) || [])[1]; if (!aid || seen[aid]) return; seen[aid] = 1;
            var c = parse(a.textContent.replace(/\s+/g, " ")); if (!c || c.id !== id) return; c.aid = +aid;
            (byPack[c.pack] = byPack[c.pack] || []).push(c);
          });
          var own = id.slice(0, id.indexOf("-")).toLowerCase();
          Object.keys(byPack).forEach(function (p) { var m = assign(byPack[p], own, KEYS); Object.keys(m).forEach(function (k) { st.map[k] = [m[k], 0]; }); });
        } catch (e) { st.lastError = id + ": " + e.message; if (/HTTP 4(03|29)/.test(e.message)) { st.state = "error"; save("__snkmapres", st); return; } }
        st.done = i + 1; if (i % 10 === 0) save("__snkmapres", st);
        await sleep(GAP);
      }
      // 取引履歴APIに使う商品カタログIDを取得
      var keys = Object.keys(st.map); st.phase = "catalog"; st.cdone = 0;
      for (var j = 0; j < keys.length; j++) {
        var v = st.map[keys[j]]; if (v[1]) { st.cdone++; continue; }
        try { var a = await fetch("/v1/apparels/" + v[0]).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }); v[1] = a.productCatalogId || 0; }
        catch (e) { st.lastError = keys[j] + ": " + e.message; if (/HTTP 4(03|29)/.test(e.message)) { st.state = "error"; save("__snkmapres", st); return; } }
        st.cdone++; if (j % 10 === 0) save("__snkmapres", st);
        await sleep(GAP);
      }
      st.state = "done"; st.count = keys.length; st.at = new Date().toISOString(); save("__snkmapres", st);
    })().catch(function (e) { st.state = "error"; st.lastError = String(e); save("__snkmapres", st); });
    return "started snk map";
  };

  // ---- 毎日の取得（状態A と PSA10 の直近取引価格） ----
  function median(a) { if (!a.length) return null; a = a.slice().sort(function (x, y) { return x - y; }); var m = a.length >> 1; return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2); }
  async function hist(pc, cond) {
    var j = await fetch("/v3/products/" + pc + "/trading-history?range=all&condition_code=trading_card_single_" + cond).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
    var now = Date.now(), tr = (j.trades || []).filter(function (t) { return t.label === "1枚" || !t.label; });
    var recent = tr.filter(function (t) { return now - Date.parse(t.soldAt) < 90 * 864e5; }).slice(0, 3).map(function (t) { return t.price; });
    var n30 = tr.filter(function (t) { return now - Date.parse(t.soldAt) < 30 * 864e5; }).length;
    var pts = ((j.chart && j.chart.lines && j.chart.lines[0] && j.chart.lines[0].points) || []);
    return { p: median(recent), n: n30, last: tr[0] ? tr[0].soldAt : null, chart: pts };
  }
  window.__snkDaily = function (opts) {
    opts = opts || {};
    var st = { state: "running", date: jst(), at: new Date().toISOString(), done: 0, part: { sa: {}, sn: {}, sp: {}, si: {} } };
    // 途中で止まった同じ日の取得があれば続きから
    try { var old = JSON.parse(localStorage.getItem("__snkres") || "null"); if (old && old.state === "running" && old.date === st.date && old.part && !!old.backfill === !!opts.backfill) { st = old; st.resumed = (st.resumed || 0) + 1; } } catch (e) {}
    st.backfill = !!opts.backfill;
    var back = null;
    if (opts.backfill) { try { back = JSON.parse(localStorage.getItem("__snkback") || "{}"); } catch (e) { back = {}; } }
    save("__snkres", st);
    window.__snkP = (async function () {
      var KL = await fetch(RAW + "tools/masterkeys.json", { cache: "no-store" }).then(function (r) { return r.json(); });
      var MAP = await fetch(RAW + "tools/snkmap.json", { cache: "no-store" }).then(function (r) { return r.json(); });
      var keys = KL.filter(function (k) { return MAP[k] && MAP[k][1]; }), P = st.part;
      st.total = keys.length;
      function persist() { save("__snkres", st); if (back) { try { localStorage.setItem("__snkback", JSON.stringify(back)); } catch (e) { st.backErr = "storage full"; } } }
      for (var i = st.done; i < keys.length; i++) {
        var k = keys[i], ix = KL.indexOf(k), pc = MAP[k][1];
        P.si[ix] = MAP[k][0];
        try {
          var a = await hist(pc, "nearly_unused"); if (a.p != null) P.sa[ix] = a.p; P.sn[ix] = a.n;
          if (back) back[k] = a.chart.filter(function (p) { return Date.now() - p.timestamp < 400 * 864e5; }).map(function (p) { return [new Date(p.timestamp + 9 * 3600e3).toISOString().slice(0, 10), p.price]; });
          if ((a.p || 0) >= 2000 || opts.allPsa) { await sleep(GAP); var b = await hist(pc, "psa10"); if (b.p != null) P.sp[ix] = b.p; }
        } catch (e) { st.lastError = k + ": " + e.message; if (/HTTP 4(03|29)/.test(e.message)) { st.state = "error"; break; } }
        st.done = i + 1; if (i % 15 === 0) persist();
        await sleep(GAP);
      }
      function csv(o) { var a = []; for (var i = 0; i < KL.length; i++) a.push(o[i] == null ? "" : o[i]); return a.join(","); }
      st.sa = csv(P.sa); st.sn = csv(P.sn); st.sp = csv(P.sp); st.si = csv(P.si);
      st.snItems = Object.keys(P.sa).length;
      if (st.state !== "error") st.state = "done";
      st.at = new Date().toISOString(); persist();
      if (back) window.__snkBack = back;
    })().catch(function (e) { st.state = "error"; st.lastError = String(e); save("__snkres", st); });
    return st.resumed ? "resumed snk daily at " + st.done : "started snk daily";
  };
  // 結果を取り出す（大きな出力として保存させるため末尾を空白で埋める）
  window.__snkDump = function () { var r = JSON.parse(localStorage.getItem("__snkres") || "{}"); var o = { date: r.date, state: r.state, sa: r.sa, sn: r.sn, sp: r.sp, si: r.si, snItems: r.snItems }; var s = JSON.stringify(o); return "SNKDUMP" + s + "ENDDUMP" + " ".repeat(Math.max(0, 130000 - s.length)); };
  // 過去の取引相場（日次）をファイルとしてダウンロード
  window.__snkBackDownload = function () { if (!window.__snkBack) { try { window.__snkBack = JSON.parse(localStorage.getItem("__snkback") || "{}"); } catch (e) {} } var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(window.__snkBack || {})], { type: "application/json" })); a.download = "snk_hist.json"; document.body.appendChild(a); a.click(); return Object.keys(window.__snkBack || {}).length; };
  window.__snkParse = parse; window.__snkAssign = assign;
})();
