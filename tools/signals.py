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

TAGL = {"n": "", "p": "パラレル", "sp": "スーパーパラレル", "spc": "SP", "foil": "箔押し", "drawn": "描き下ろし", "drawnfoil": "描き下ろし箔押し",
        "gold": "金SP", "silver": "銀SP", "ksp": "海賊団SP", "rsp": "レッドSP", "sign": "サイン"}
rows = []
for i, k in enumerate(KEYS):
    m = META.get(k)
    if not m: continue
    p, _ = cur(CM, i)
    if not p or p < 3000: continue
    b, _ = cur(MB, i)
    st, _ = cur(CS, i)
    ser = snk_daily(k, i)
    if not ser: continue
    # 発売直後（最初の取引から30日）の高値は除く
    first = dt.date.fromisoformat(ser[0][0])
    one = max(T - dt.timedelta(days=365), first + dt.timedelta(days=30)).isoformat()
    age = (T - first).days
    yr = [(d, v) for d, v in ser if d >= one]
    if len(yr) < 8: continue
    s_now = yr[-1][1]
    hi = max(v for _, v in yr); lo = min(v for _, v in yr)
    hi_d = max(yr, key=lambda x: x[1])[0]
    pos = (s_now - lo) / (hi - lo) if hi > lo else 0.5
    s30 = val_at(ser, (T - dt.timedelta(days=30)).isoformat())
    s90 = val_at(ser, (T - dt.timedelta(days=90)).isoformat())
    ch30 = s_now / s30 - 1 if s30 else None
    ch90 = s_now / s90 - 1 if s90 else None
    p7 = ago(CM, i, 7)
    ch7 = p / p7 - 1 if p7 else None
    br = b / p if b else None
    fh = s_now / hi - 1
    n90 = sum(1 for d, _ in ser if d >= (T - dt.timedelta(days=90)).isoformat())
    # 直近180日の週ごとの値（小さなグラフ用）
    spark = []
    for w in range(26, -1, -1):
        v = val_at(ser, (T - dt.timedelta(days=7 * w)).isoformat())
        spark.append(round(v) if v else None)
    name = m["name"]
    rows.append(dict(k=k, uid=m["uid"], name=name, id=m["id"], rar=m["rar"], pack=m["pack"], img=m["img"],
                     p=round(p), b=round(b) if b else None, st=int(st) if st is not None else None, s=round(s_now),
                     hi=round(hi), hi_d=hi_d, lo=round(lo), pos=round(pos, 3), fh=round(fh, 3),
                     ch7=round(ch7, 3) if ch7 is not None else None, ch30=round(ch30, 3) if ch30 is not None else None,
                     ch90=round(ch90, 3) if ch90 is not None else None, br=round(br, 3) if br else None, n90=n90, age=age, spark=spark))

def pct(x): return f"{x*100:+.0f}%"
buy, sell = [], []
for r in rows:
    if r["n90"] < 4: continue
    rs = []
    # 買い時の目安: 1年の高値から大きく下がり、直近の下落が落ち着いていて、買取価格（店の評価）が保たれている
    sb = 0
    if r["fh"] <= -0.3:
        sb += min(-r["fh"], 0.8) * 60; rs.append(f"1年の高値（{r['hi']:,}円）から{pct(r['fh'])}")
    if r["ch30"] is not None and r["fh"] <= -0.3:
        if r["ch30"] > -0.05: sb += 12; rs.append(f"直近30日は{pct(r['ch30'])}で下げ止まり気味")
        elif r["ch30"] < -0.2: sb -= 15
    if r["br"] and r["fh"] <= -0.3:
        if r["br"] >= 0.6: sb += 15; rs.append(f"買取率{r['br']*100:.0f}%（お店の評価は高いまま）")
        elif r["br"] < 0.4: sb -= 10
    if r["s"] and r["p"] and r["s"] <= r["p"] * 0.8 and r["fh"] <= -0.3:
        sb += 5; rs.append(f"スニダン取引は{r['s']:,}円（店頭より{(1-r['s']/r['p'])*100:.0f}%安い）")
    if sb >= 45 and r["age"] >= 90: buy.append(dict(r, score=round(sb, 1), why=rs))
    # 売り時の目安: 1年の中で高値圏、ここ90日で大きく上昇、買取率が高い（高く売れる）
    rs = []; ss = 0
    if r["pos"] >= 0.75 and r["hi"] > r["lo"] * 1.2:
        ss += r["pos"] * 35; rs.append("1年の最高値付近" if r["pos"] >= 0.97 else f"1年の値幅の上から{(1 - r['pos']) * 100:.0f}%の位置（高値圏）")
    if r["ch90"] is not None and r["ch90"] >= 0.2:
        ss += min(r["ch90"], 2) * 20; rs.append(f"90日で{pct(r['ch90'])}上昇")
    if r["br"] and r["br"] >= 0.65:
        ss += r["br"] * 20; rs.append(f"買取率{r['br']*100:.0f}%（メルカード{r['b']:,}円）")
    if r["ch7"] is not None and r["ch7"] < -0.03 and r["pos"] >= 0.7:
        ss += 8; rs.append(f"店頭価格が7日で{pct(r['ch7'])}（天井からの反落に注意）")
    if ss >= 40 and r["pos"] >= 0.7: sell.append(dict(r, score=round(ss, 1), why=rs))

buy.sort(key=lambda x: -x["score"]); sell.sort(key=lambda x: -x["score"])
res = dict(built=dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).strftime("%Y-%m-%d %H:%M"), date=today,
           n=len(rows), buy=buy[:30], sell=sell[:30])
json.dump(res, open(os.path.join(OUT, "signals.json"), "w"), ensure_ascii=False, separators=(",", ":"))
print("cards", len(rows), "buy", len(buy), "sell", len(sell))
for x in buy[:8]: print("BUY ", x["score"], x["name"], x["id"], x["p"], x["why"])
for x in sell[:8]: print("SELL", x["score"], x["name"], x["id"], x["p"], x["why"])
