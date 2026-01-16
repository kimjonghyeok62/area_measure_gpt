import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * 강의실 면적 자동 계산 (모바일 최적화 버전)
 */

const LS_KEY = "academy_room_area_rows_v10";

type Pair = { w: string; h: string };

type RoomRow = {
    main: Pair;
    post: Pair;
    extraMain: Pair;
    extraPost: Pair;
    expanded: boolean;
};

const EMPTY_PAIR: Pair = { w: "", h: "" };
const makeRow = (): RoomRow => ({
    main: { ...EMPTY_PAIR },
    post: { ...EMPTY_PAIR },
    extraMain: { ...EMPTY_PAIR },
    extraPost: { ...EMPTY_PAIR },
    expanded: false,
});

type Stored = { rows: RoomRow[] };

function toNum(v: unknown): number | null {
    if (v === "" || v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function round2(x: number): number {
    return Math.round(x * 100) / 100;
}

function pairArea(p: Pair): number {
    const w = toNum(p.w);
    const h = toNum(p.h);
    if (w == null || h == null) return 0;
    return w * h;
}

function rowArea(r: RoomRow): number {
    const a = pairArea(r.main) - pairArea(r.post);
    const b = pairArea(r.extraMain) - pairArea(r.extraPost);
    return round2(a + b);
}

const css = `
:root {
  --bg: #f8fafc;
  --card: #fff;
  --border: #e2e8f0;
  --muted: #64748b;
  --text: #0f172a;
  --primary: #0f172a;
  --primaryText: #fff;
  --soft: #f1f5f9;
  --accent: #3b82f6;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans KR, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.5;
  font-size: 18px;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
}

.header {
  margin-bottom: 20px;
}

.h1 {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  word-break: keep-all;
}

.p {
  margin: 8px 0 0 0;
  font-size: 1.125rem;
  color: var(--muted);
  line-height: 1.45;
  word-break: keep-all;
}

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 20px;
}

.summary-bar {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 640px) {
  .summary-bar {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

@media (max-width: 639px) {
  .container {
    padding: 8px;
  }
  .table {
    min-width: 600px;
  }
}

.total-box .label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
}

.total-box .value {
  font-size: 1.75rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 12px;
  padding: 10px 20px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
}

.btn:active { transform: scale(0.98); }

.btnPrimary {
  background: var(--primary);
  color: var(--primaryText);
  border-color: var(--primary);
}

.select {
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 1rem;
  font-weight: 600;
}

.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 550px; /* 테이블 최소 너비 설정으로 모바일 스크롤 유도 */
}

.th {
  position: sticky;
  top: 0;
  background: var(--soft);
  border-bottom: 1px solid var(--border);
  text-align: left;
  padding: 12px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--muted);
  white-space: nowrap;
}

.td {
  padding: 12px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.input {
  width: 100%;
  max-width: 60px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.readonly {
  width: 100%;
  min-width: 60px;
  text-align: right;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  background: var(--soft);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.chev-btn {
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.5rem;
}

/* 모바일 전용 행 스타일 */
.extra-row-bg {
  background-color: #fcfdfe;
}

.footer-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-top: 1px solid var(--border);
}

.footer-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--muted);
}

.footer-value {
  font-size: 1.5rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

/* Chrome, Safari, Edge, Opera 에서 스피너 제거 */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox 에서 스피너 제거 */
input[type=number] {
  -moz-appearance: textfield;
}
`;

export default function App() {
    const [rows, setRows] = useState<RoomRow[]>(() => {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw) as Stored;
                if (parsed && Array.isArray(parsed.rows) && parsed.rows.length > 0) {
                    return parsed.rows.map((r) => ({
                        main: r.main ?? { ...EMPTY_PAIR },
                        post: r.post ?? { ...EMPTY_PAIR },
                        extraMain: (r as any).extraMain ?? { ...EMPTY_PAIR },
                        extraPost: (r as any).extraPost ?? { ...EMPTY_PAIR },
                        expanded: !!r.expanded,
                    }));
                }
            } catch { }
        }
        return Array.from({ length: 10 }, () => makeRow());
    });

    const refs = useRef<Map<string, HTMLInputElement>>(new Map());
    const [addCount, setAddCount] = useState<number>(1);
    const [clearArmed, setClearArmed] = useState(false);
    const clearTimerRef = useRef<number | null>(null);
    const skipPersistRef = useRef(false);

    const areas = useMemo(() => rows.map((r) => rowArea(r)), [rows]);
    const total = useMemo(() => round2(areas.reduce((a, b) => a + b, 0)), [areas]);

    useEffect(() => {
        if (skipPersistRef.current) {
            skipPersistRef.current = false;
            return;
        }
        const t = window.setTimeout(() => {
            const payload: Stored = { rows };
            localStorage.setItem(LS_KEY, JSON.stringify(payload));
        }, 250);
        return () => window.clearTimeout(t);
    }, [rows]);

    const focus = (ri: number, key: string) => {
        const el = refs.current.get(`${ri}:${key}`);
        if (el) el.focus();
    };

    const ensureRows = (min: number) => {
        setRows((prev) => {
            if (prev.length >= min) return prev;
            return [...prev, ...Array.from({ length: min - prev.length }, () => makeRow())];
        });
    };

    const moveNext = (ri: number, key: string) => {
        const collapsed = ["main.w", "main.h", "post.w", "post.h"];
        const expanded = ["main.w", "main.h", "post.w", "post.h", "extraMain.w", "extraMain.h", "extraPost.w", "extraPost.h"];
        const order = rows[ri]?.expanded ? expanded : collapsed;

        const idx = order.indexOf(key);
        if (idx >= 0 && idx < order.length - 1) return focus(ri, order[idx + 1]);

        const endCollapsed = key === "post.h" && !rows[ri]?.expanded;
        const endExpanded = key === "extraPost.h" && !!rows[ri]?.expanded;
        if (endCollapsed || endExpanded) {
            const nr = ri + 1;
            ensureRows(nr + 1);
            setTimeout(() => focus(nr, "main.w"), 0);
        }
    };

    const setValue = (ri: number, which: keyof RoomRow, prop: "w" | "h", value: string) => {
        if (which === "expanded") return;
        setRows((prev) => {
            const next = [...prev];
            const row = { ...next[ri] };
            (row[which] as Pair) = { ...(row[which] as Pair), [prop]: value };
            next[ri] = row;
            return next;
        });
    };

    const onChangeNumeric = (e: React.ChangeEvent<HTMLInputElement>, ri: number, key: string) => {
        const v = e.target.value;
        if (v === "") {
            const [which, prop] = key.split(".") as [keyof RoomRow, "w" | "h"];
            setValue(ri, which, prop, "");
            return;
        }
        if (!/^[0-9]*(?:\.[0-9]{0,2})?$/.test(v)) return;
        const [which, prop] = key.split(".") as [keyof RoomRow, "w" | "h"];
        setValue(ri, which, prop, v);

        if (/^[0-9]+\.[0-9]{2}$/.test(v)) moveNext(ri, key);
    };

    const onBlurNumeric = (ri: number, key: string) => {
        const format = (raw: string) => {
            const num = toNum(raw);
            return num == null ? raw : round2(num).toFixed(2);
        };

        setRows((prev) => {
            const next = [...prev];
            const row = { ...next[ri] };
            const [which, prop] = key.split(".") as [keyof RoomRow, "w" | "h"];
            if (which !== "expanded") {
                const cur = row[which] as Pair;
                (row[which] as Pair) = { ...cur, [prop]: format(cur[prop]) };
            }
            next[ri] = row;
            return next;
        });
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, ri: number, key: string) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        onBlurNumeric(ri, key);
        moveNext(ri, key);
    };

    const toggleExpanded = (ri: number) => {
        setRows((prev) => {
            const next = [...prev];
            next[ri] = { ...next[ri], expanded: !next[ri].expanded };
            return next;
        });
    };

    const doClear = () => {
        if (clearTimerRef.current) {
            window.clearTimeout(clearTimerRef.current);
            clearTimerRef.current = null;
        }
        setClearArmed(false);
        skipPersistRef.current = true;
        localStorage.removeItem(LS_KEY);
        setRows(Array.from({ length: 10 }, () => makeRow()));
        setTimeout(() => {
            const firstInput = refs.current.get("0:main.w");
            if (firstInput) firstInput.focus();
        }, 0);
    };

    const clearAll = () => {
        if (!clearArmed) {
            setClearArmed(true);
            if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
            clearTimerRef.current = window.setTimeout(() => {
                setClearArmed(false);
                clearTimerRef.current = null;
            }, 3000);
            return;
        }
        doClear();
    };

    return (
        <>
            <style>{css}</style>
            <div className="container">
                <header className="header">
                    <h1 className="h1">강의실 면적 자동 계산</h1>
                    <p className="p">대부분은 한 행만 입력하시면 됩니다. 특이한 경우만 ▸ 로 2줄 입력을 펼치세요.</p>
                </header>

                <div className="card">
                    <div className="summary-bar">
                        <div className="total-box">
                            <div className="label">전체 합계(㎡)</div>
                            <div className="value">{total.toFixed(2)}</div>
                        </div>
                        <div className="controls">
                            <select className="select" value={addCount} onChange={(e) => setAddCount(Number(e.target.value))}>
                                {[1, 2, 3, 5, 10].map((k) => (
                                    <option key={k} value={k}>{k}행</option>
                                ))}
                            </select>
                            <button className="btn btnPrimary" onClick={() => setRows((prev) => [...prev, ...Array.from({ length: addCount }, () => makeRow())])}>행 추가</button>
                            <button className="btn" onClick={clearAll} style={clearArmed ? { borderColor: '#ef4444', color: '#ef4444' } : {}}>
                                {clearArmed ? "초기화 확인" : "초기화"}
                            </button>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="th" style={{ width: 40, textAlign: 'center' }}>#</th>
                                    <th className="th" style={{ width: 50, textAlign: 'center' }}>펼침</th>
                                    <th className="th">강의실 가로(m)</th>
                                    <th className="th">강의실 세로(m)</th>
                                    <th className="th">기둥 가로(m)</th>
                                    <th className="th">기둥 세로(m)</th>
                                    <th className="th" style={{ width: 120, textAlign: 'right' }}>합계(㎡)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, ri) => (
                                    <React.Fragment key={ri}>
                                        <tr>
                                            <td className="td" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>{ri + 1}</td>
                                            <td className="td" style={{ textAlign: 'center' }}>
                                                <button className="chev-btn" onClick={() => toggleExpanded(ri)} aria-label="행 펼치기/접기">
                                                    {r.expanded ? "▾" : "▸"}
                                                </button>
                                            </td>
                                            {(["main.w", "main.h", "post.w", "post.h"] as const).map((k) => (
                                                <td key={k} className="td">
                                                    <input
                                                        className="input"
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={(r[k.split(".")[0] as keyof RoomRow] as Pair)[k.split(".")[1] as "w" | "h"]}
                                                        onChange={(e) => onChangeNumeric(e, ri, k)}
                                                        onBlur={() => onBlurNumeric(ri, k)}
                                                        onKeyDown={(e) => onKeyDown(e, ri, k)}
                                                        ref={(el) => { if (el) refs.current.set(`${ri}:${k}`, el); }}
                                                        placeholder="0.00"
                                                    />
                                                </td>
                                            ))}
                                            <td className="td" style={{ textAlign: 'right' }}>
                                                <div className="readonly">{areas[ri].toFixed(2)}</div>
                                            </td>
                                        </tr>
                                        {r.expanded && (
                                            <tr className="extra-row-bg">
                                                <td className="td" />
                                                <td className="td" style={{ textAlign: 'center', color: 'var(--muted)' }}>+</td>
                                                {(["extraMain.w", "extraMain.h", "extraPost.w", "extraPost.h"] as const).map((k) => (
                                                    <td key={k} className="td">
                                                        <input
                                                            className="input"
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={(r[k.split(".")[0] as keyof RoomRow] as Pair)[k.split(".")[1] as "w" | "h"]}
                                                            onChange={(e) => onChangeNumeric(e, ri, k)}
                                                            onBlur={() => onBlurNumeric(ri, k)}
                                                            onKeyDown={(e) => onKeyDown(e, ri, k)}
                                                            ref={(el) => { if (el) refs.current.set(`${ri}:${k}`, el); }}
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="td" />
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="footer-bar">
                        <span className="footer-label">(전체) 합계(㎡)</span>
                        <span className="footer-value">{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </>
    );
}
