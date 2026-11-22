# 買い時・売り時の目安（個人用ページ向け）を計算する
# 使い方: python3 tools/signals.py [出力先ディレクトリ]
# 入力: data/<日付>.json（毎日の記録）, tools/snkchart.json（スニダン取引チャート・過去分）,
#       data/snk_hist.json（スニダン日次）, tools/keymeta.json, tools/masterkeys.json
# 出力: <出力先>/signals.json
import json, os, sys, datetime as dt, statistics as stx

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "private")
os.makedirs(OUT, exist_ok=True)
J = lambda *p: json.load(open(os.path.join(ROOT, *p)))
KEYS = J("tools", "masterkeys.json")
META = J("tools", "keymeta.json")
CHART = J("tools", "snkchart.json")
try: SH = J("data", "snk_hist.json")
except Exception: SH = {}
dates = J("data", "index.json")
docs = {}
for d in dates:
    try: docs[d] = J("data", d + ".json")
    except Exception: pass
ds = sorted(d for d in docs if docs[d].get("cm"))
def col(d, f):
    s = docs[d].get(f) or ""
    return [(float(x) if x else None) for x in s.split(",")] if s else []
CM = {d: col(d, "cm") for d in ds}; MB = {d: col(d, "mb") for d in ds}
SA = {d: col(d, "sa") for d in ds}; CS = {d: col(d, "cs") for d in ds}
today = ds[-1]
T = dt.date.fromisoformat(today)

def cur(series, i):
    for d in reversed(ds):
        a = series[d]
        if i < len(a) and a[i] is not None: return a[i], d
    return None, None
def ago(series, i, days):
    lim = (T - dt.timedelta(days=days)).isoformat()
    v = None
    for d in ds:
        if d > lim: break
        a = series[d]
        if i < len(a) and a[i] is not None: v = a[i]
    return v

# スニダンの日次系列（チャート＋毎日の記録）
def snk_daily(k, i):
    by = {}
    for d, p in CHART.get(k, []): by.setdefault(d, []).append(p)
    for d, p in SH.get(k, []): by.setdefault(d, []).append(p)
    for d in ds:
        a = SA[d]
        if i < len(a) and a[i] is not None: by.setdefault(d, []).append(a[i])
    return sorted((d, stx.median(v)) for d, v in by.items())
def val_at(ser, day):
    v = None
    for d, p in ser:
        if d > day: break
        v = p
    return v

# 市場全体（スニダン取引から算出した指数・換算前）
IH = J("data", "index_hist.json")
IHS = list(zip(IH["dates"], IH["vals"]))
def idx_at(day):
    v = None
    for d, x in IHS:
        if d > day: break
        v = x
    return v
I_now = idx_at(T.isoformat())
I30 = idx_at((T - dt.timedelta(days=30)).isoformat()); I90 = idx_at((T - dt.timedelta(days=90)).isoformat())
M30 = I_now / I30 - 1 if I30 else 0; M90 = I_now / I90 - 1 if I90 else 0

def smooth_at(ser, day, win=14):
    # 1回だけの取引に引っ張られないよう、直近14日（足りなければ直近5件）の中央値
    lo = (dt.date.fromisoformat(day) - dt.timedelta(days=win)).isoformat()
    w = [p for d, p in ser if lo <= d <= day]
    if len(w) < 2:
        w = [p for d, p in ser if d <= day][-5:]
    return stx.median(w) if w else None

rows = []
for i, k in enumerate(KEYS):
    m = META.get(k)
    if not m: continue
    p, _ = cur(CM, i)
    if not p or p < 3000: continue
    b, _ = cur(MB, i)
    st, _ = cur(CS, i)
    ser = snk_daily(k, i)
    if len(ser) < 10: continue
    first = dt.date.fromisoformat(ser[0][0]); age = (T - first).days
    s_now = smooth_at(ser, T.isoformat())
    s30 = smooth_at(ser, (T - dt.timedelta(days=30)).isoformat()) if age >= 45 else None
    s90 = smooth_at(ser, (T - dt.timedelta(days=90)).isoformat()) if age >= 105 else None
    ch30 = s_now / s30 - 1 if s30 else None
    ch90 = s_now / s90 - 1 if s90 else None
    rel30 = (1 + ch30) / (1 + M30) - 1 if ch30 is not None else None
    rel90 = (1 + ch90) / (1 + M90) - 1 if ch90 is not None else None
    # 落ち着いた後の価格帯: 発売90日以降・直近1年の取引の中央値
    bs = max(first + dt.timedelta(days=90), T - dt.timedelta(days=365)).isoformat()
    settled = [v for d, v in ser if d >= bs]
    base = stx.median(settled) if len(settled) >= 6 else None
    vb = s_now / base - 1 if base else None
    # 直近60日の最安（ならした値）からの戻り
    lows = [smooth_at(ser, (T - dt.timedelta(days=x)).isoformat()) for x in range(0, 61, 5)]
    low60 = min(v for v in lows if v) if any(lows) else None
    off_low = s_now / low60 - 1 if low60 else None
    n30 = sum(1 for d, _ in ser if d >= (T - dt.timedelta(days=30)).isoformat())
    p7 = ago(CM, i, 7); ch7 = p / p7 - 1 if p7 else None
    br = b / p if b else None
    spark = []
    for w in range(26, -1, -1):
        v = smooth_at(ser, (T - dt.timedelta(days=7 * w)).isoformat())
        spark.append(round(v) if v else None)
    r3 = lambda x: round(x, 3) if x is not None else None
    rows.append(dict(k=k, uid=m["uid"], name=m["name"], id=m["id"], rar=m["rar"], pack=m["pack"], img=m["img"],
                     p=round(p), b=round(b) if b else None, st=int(st) if st is not None else None, s=round(s_now),
                     base=round(base) if base else None, vb=r3(vb), ch7=r3(ch7), ch30=r3(ch30), ch90=r3(ch90),
                     rel30=r3(rel30), rel90=r3(rel90), off=r3(off_low), br=r3(br), n30=n30, age=age, spark=spark))

def pct(x): return f"{x*100:+.0f}%"
buy, sell = [], []
mk = f"同じ期間の市場全体は{pct(M90)}"
for r in rows:
    if r["rel90"] is None or r["vb"] is None or r["n30"] < 3: continue
    # 買い時の目安: 発売から半年以上／市場全体より下げすぎ or 落ち着いた価格帯より安い／底を打って上向き
    if r["age"] >= 180:
        rs = []; sb = 0
        under = r["rel90"] <= -0.15; cheap = r["vb"] <= -0.2
        turned = (r["off"] or 0) >= 0.05 and (r["ch30"] or 0) >= -0.03
        if (under or cheap) and turned:
            if under: sb += min(-r["rel90"], 0.7) * 60; rs.append(f"90日で{pct(r['ch90'])}（{mk}。全体より{pct(r['rel90'])}下げすぎ）")
            if cheap: sb += min(-r["vb"], 0.7) * 40; rs.append(f"落ち着いた後の価格帯（{r['base']:,}円）より{pct(r['vb'])}安い")
            sb += min(r["off"], 0.5) * 30; rs.append(f"直近60日の安値から{pct(r['off'])}戻して上向き（30日{pct(r['ch30'])}）")
            if r["br"] and r["br"] >= 0.65: sb += 8; rs.append(f"買取率{r['br']*100:.0f}%（お店の評価は高いまま）")
            if sb >= 20: buy.append(dict(r, score=round(sb, 1), why=rs))
    # 売り時の目安: 市場全体より上げすぎ／落ち着いた価格帯より大幅に高い／勢いが鈍り始め
    rs = []; ss = 0
    over = r["rel90"] >= 0.15; rich = r["vb"] >= 0.2
    if (over and rich) or (r["vb"] >= 0.5 and r["rel90"] >= 0) or (r["rel90"] >= 0.4 and r["vb"] >= 0):
        ss += min(r["rel90"], 1.5) * 40; rs.append(f"90日で{pct(r['ch90'])}（{mk}。全体より{pct(r['rel90'])}上げ）")
        ss += min(r["vb"], 1.5) * 30
        if r["vb"] >= 0.1: rs.append(f"落ち着いた後の価格帯（{r['base']:,}円）より{pct(r['vb'])}高い")
        if r["rel30"] is not None and r["rel30"] < 0: ss += 10; rs.append(f"直近30日は全体より弱い（{pct(r['rel30'])}）＝勢いが鈍り始め")
        if r["ch7"] is not None and r["ch7"] < -0.03: ss += 6; rs.append(f"店頭価格が7日で{pct(r['ch7'])}")
        if r["br"] and r["br"] >= 0.65: ss += 8; rs.append(f"買取率{r['br']*100:.0f}%（メルカード{r['b']:,}円で売れる）")
        sell.append(dict(r, score=round(ss, 1), why=rs))

buy.sort(key=lambda x: -x["score"]); sell.sort(key=lambda x: -x["score"])
res = dict(built=dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).strftime("%Y-%m-%d %H:%M"), date=today,
           n=len(rows), m30=round(M30, 3), m90=round(M90, 3), buy=buy[:30], sell=sell[:30], nbuy=len(buy), nsell=len(sell))
json.dump(res, open(os.path.join(OUT, "signals.json"), "w"), ensure_ascii=False, separators=(",", ":"))
print("cards", len(rows), "buy", len(buy), "sell", len(sell), "M90", round(M90, 3), "M30", round(M30, 3))
for x in buy[:10]: print("BUY ", x["score"], x["name"], x["id"], x["p"], x["why"])
for x in sell[:10]: print("SELL", x["score"], x["name"], x["id"], x["p"], x["why"])
