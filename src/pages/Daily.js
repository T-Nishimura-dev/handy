import React, { useMemo, useState } from 'react';
import { useOrders } from '../hooks/useOrders';
import './Daily.css';

// 営業日キー "YYYY-M-D"（午前6時区切り）
function getBusinessDay(date) {
  const d = new Date(date);
  if (d.getHours() < 6) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatBusinessDayKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m, d);
  const w = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${y}/${m + 1}/${d}(${w})`;
}

// 営業日キー → "YYYY-MM-DD"（<input type="date"> 用）
function dayKeyToInputValue(key) {
  const [y, m, d] = key.split('-').map(Number);
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// "YYYY-MM-DD" → 営業日キー
function inputValueToDayKey(value) {
  const [y, m, d] = value.split('-').map(Number);
  return `${y}-${m - 1}-${d}`;
}

function todayDayKey() {
  return getBusinessDay(new Date());
}

export default function Daily() {
  const { history, manualDaily, saveManualDaily, deleteManualDaily } = useOrders();
  const [expanded, setExpanded] = useState({});
  const [modal, setModal] = useState(null); // { mode: 'new'|'edit', dayKey, record? }
  const [range, setRange] = useState('all'); // 'month' | 'year' | 'all'
  const [selectedMonth, setSelectedMonth] = useState(''); // "YYYY-M" or ''
  const [selectedDay, setSelectedDay] = useState(''); // "YYYY-M-D" or ''

  const dailyStats = useMemo(() => {
    const map = {};

    history.forEach(h => {
      const key = getBusinessDay(h.checkoutTime);
      if (!map[key]) {
        map[key] = { key, sales: 0, pax: 0, count: 0, items: {}, hasHistory: false };
      }
      map[key].hasHistory = true;
      map[key].sales += h.total;
      map[key].pax += h.pax;
      map[key].count += 1;
      (h.items || []).forEach(item => {
        if (!map[key].items[item.name]) {
          map[key].items[item.name] = { name: item.name, qty: 0, total: 0 };
        }
        map[key].items[item.name].qty += item.qty;
        map[key].items[item.name].total += item.price * item.qty;
      });
    });

    Object.entries(manualDaily || {}).forEach(([key, rec]) => {
      if (!map[key]) {
        map[key] = { key, sales: 0, pax: 0, count: 0, items: {}, hasHistory: false };
      }
      map[key].sales += Number(rec.sales) || 0;
      map[key].pax += Number(rec.pax) || 0;
      map[key].count += Number(rec.count) || 0;
      map[key].manual = rec;
    });

    return Object.values(map).sort((a, b) => {
      const [ay, am, ad] = a.key.split('-').map(Number);
      const [by, bm, bd] = b.key.split('-').map(Number);
      return new Date(by, bm, bd) - new Date(ay, am, ad);
    });
  }, [history, manualDaily]);

  // サマリ用に対象を絞り込み
  let summarySource = dailyStats;
  if (range === 'month' && selectedMonth) {
    summarySource = dailyStats.filter(d => {
      const [y, m] = d.key.split('-').map(Number);
      return `${y}-${m}` === selectedMonth;
    });
  } else if (range === 'all' && selectedDay) {
    summarySource = dailyStats.filter(d => d.key === selectedDay);
  }

  const grandTotal = summarySource.reduce((s, d) => s + d.sales, 0);
  const grandPax = summarySource.reduce((s, d) => s + d.pax, 0);
  const grandCount = summarySource.reduce((s, d) => s + d.count, 0);
  const grandAvg = grandPax > 0 ? Math.floor(grandTotal / grandPax) : 0;

  // 月ごと集計（key: "YYYY-M"、月は0始まり）
  const monthlyStats = useMemo(() => {
    const map = {};
    dailyStats.forEach(d => {
      const [y, m] = d.key.split('-').map(Number);
      const mk = `${y}-${m}`;
      if (!map[mk]) map[mk] = { key: mk, year: y, month: m, sales: 0, pax: 0, count: 0, days: [] };
      map[mk].sales += d.sales;
      map[mk].pax += d.pax;
      map[mk].count += d.count;
      map[mk].days.push(d);
    });
    return Object.values(map).sort((a, b) => (b.year - a.year) || (b.month - a.month));
  }, [dailyStats]);

  // 年ごと集計
  const yearlyStats = useMemo(() => {
    const map = {};
    monthlyStats.forEach(m => {
      if (!map[m.year]) map[m.year] = { key: String(m.year), year: m.year, sales: 0, pax: 0, count: 0, months: [] };
      map[m.year].sales += m.sales;
      map[m.year].pax += m.pax;
      map[m.year].count += m.count;
      map[m.year].months.push(m);
    });
    return Object.values(map).sort((a, b) => b.year - a.year);
  }, [monthlyStats]);

  let rangeLabel;
  if (range === 'year') {
    rangeLabel = '年ごと';
  } else if (range === 'month') {
    if (selectedMonth) {
      const [y, m] = selectedMonth.split('-').map(Number);
      rangeLabel = `${y}年${m + 1}月`;
    } else {
      rangeLabel = '月ごと（全期間）';
    }
  } else {
    rangeLabel = selectedDay ? formatBusinessDayKey(selectedDay) : '累計（全期間）';
  }

  return (
    <div className="daily-page">
      <div className="daily-range-tabs">
        {[
          { v: 'month', label: '月' },
          { v: 'year', label: '年' },
          { v: 'all', label: '累計' },
        ].map(t => (
          <div
            key={t.v}
            className={`daily-range-tab ${range === t.v ? 'active' : ''}`}
            onClick={() => setRange(t.v)}
          >
            {t.label}
          </div>
        ))}
      </div>

      <div className="daily-summary-card">
        <div className="daily-summary-label">📊 集計（{rangeLabel}）</div>
        <div className="daily-summary-main">
          <span className="daily-summary-yen">¥</span>
          <span className="daily-summary-amount">{grandTotal.toLocaleString()}</span>
        </div>
        <div className="daily-summary-stats">
          <div className="daily-stat-box">
            <div className="daily-stat-num">{summarySource.length}</div>
            <div className="daily-stat-label">営業日数</div>
          </div>
          <div className="daily-stat-box">
            <div className="daily-stat-num">{grandPax}</div>
            <div className="daily-stat-label">来客数</div>
          </div>
          <div className="daily-stat-box">
            <div className="daily-stat-num">{grandCount}</div>
            <div className="daily-stat-label">会計数</div>
          </div>
          <div className="daily-stat-box">
            <div className="daily-stat-num">¥{grandAvg.toLocaleString()}</div>
            <div className="daily-stat-label">客単価</div>
          </div>
        </div>
      </div>

      <div
        className="daily-add-btn"
        onClick={() => setModal({ mode: 'new', dayKey: todayDayKey() })}
      >
        ＋ 過去の売上を手動登録
      </div>

      {range === 'month' && (
        <>
          <div className="daily-picker">
            <span className="daily-picker-label">月を選択</span>
            <select
              className="daily-picker-select"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            >
              <option value="">すべて</option>
              {monthlyStats.map(m => (
                <option key={m.key} value={m.key}>{m.year}年{m.month + 1}月</option>
              ))}
            </select>
          </div>
          <div className="daily-list">
          {monthlyStats.length === 0 ? (
            <div className="daily-empty">履歴がありません</div>
          ) : (
            monthlyStats
              .filter(m => !selectedMonth || m.key === selectedMonth)
              .map(m => {
              const isOpen = !!expanded[`m:${m.key}`];
              const avg = m.pax > 0 ? Math.floor(m.sales / m.pax) : 0;
              return (
                <div key={m.key} className="daily-card">
                  <div
                    className="daily-card-header"
                    onClick={() => setExpanded(prev => ({ ...prev, [`m:${m.key}`]: !prev[`m:${m.key}`] }))}
                  >
                    <div className="daily-card-left">
                      <div className="daily-card-date">{m.year}年{m.month + 1}月</div>
                      <div className="daily-card-sub">
                        {m.days.length}営業日 · {m.pax}名 · {m.count}会計 · 客単価 ¥{avg.toLocaleString()}
                      </div>
                    </div>
                    <div className="daily-card-right">
                      <div className="daily-card-amount">¥{m.sales.toLocaleString()}</div>
                      <div className="daily-card-toggle">{isOpen ? '▲' : '▼'}</div>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="daily-card-body">
                      <div className="daily-card-section-title">日別内訳</div>
                      {m.days.map(d => {
                        const dAvg = d.pax > 0 ? Math.floor(d.sales / d.pax) : 0;
                        return (
                          <div key={d.key} className="daily-rank-row">
                            <span className="daily-rank-name">
                              {formatBusinessDayKey(d.key)}
                              {d.manual && <span className="daily-manual-badge">手動</span>}
                            </span>
                            <span className="daily-rank-qty">{d.pax}名 · ¥{dAvg.toLocaleString()}</span>
                            <span className="daily-rank-total">¥{d.sales.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
          </div>
        </>
      )}

      {range === 'year' && (
        <div className="daily-list">
          {yearlyStats.length === 0 ? (
            <div className="daily-empty">履歴がありません</div>
          ) : (
            yearlyStats.map(y => {
              const isOpen = !!expanded[`y:${y.key}`];
              const avg = y.pax > 0 ? Math.floor(y.sales / y.pax) : 0;
              return (
                <div key={y.key} className="daily-card">
                  <div
                    className="daily-card-header"
                    onClick={() => setExpanded(prev => ({ ...prev, [`y:${y.key}`]: !prev[`y:${y.key}`] }))}
                  >
                    <div className="daily-card-left">
                      <div className="daily-card-date">{y.year}年</div>
                      <div className="daily-card-sub">
                        {y.months.length}ヶ月 · {y.pax}名 · {y.count}会計 · 客単価 ¥{avg.toLocaleString()}
                      </div>
                    </div>
                    <div className="daily-card-right">
                      <div className="daily-card-amount">¥{y.sales.toLocaleString()}</div>
                      <div className="daily-card-toggle">{isOpen ? '▲' : '▼'}</div>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="daily-card-body">
                      <div className="daily-card-section-title">月別内訳</div>
                      {y.months.map(m => {
                        const mAvg = m.pax > 0 ? Math.floor(m.sales / m.pax) : 0;
                        return (
                          <div key={m.key} className="daily-rank-row">
                            <span className="daily-rank-name">{m.month + 1}月</span>
                            <span className="daily-rank-qty">{m.pax}名 · ¥{mAvg.toLocaleString()}</span>
                            <span className="daily-rank-total">¥{m.sales.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {range === 'all' && (
      <>
        <div className="daily-picker">
          <span className="daily-picker-label">日を選択</span>
          <input
            type="date"
            className="daily-picker-input"
            value={selectedDay ? dayKeyToInputValue(selectedDay) : ''}
            onChange={e => setSelectedDay(e.target.value ? inputValueToDayKey(e.target.value) : '')}
          />
          {selectedDay && (
            <span className="daily-picker-clear" onClick={() => setSelectedDay('')}>×</span>
          )}
        </div>
        <div className="daily-list">
        {dailyStats.length === 0 ? (
          <div className="daily-empty">履歴がありません</div>
        ) : (
          dailyStats
            .filter(d => !selectedDay || d.key === selectedDay)
            .map(d => {
            const isOpen = !!expanded[d.key];
            const avg = d.pax > 0 ? Math.floor(d.sales / d.pax) : 0;
            const ranking = Object.values(d.items)
              .sort((a, b) => b.total - a.total)
              .slice(0, 5);

            return (
              <div key={d.key} className="daily-card">
                <div
                  className="daily-card-header"
                  onClick={() => setExpanded(prev => ({ ...prev, [d.key]: !prev[d.key] }))}
                >
                  <div className="daily-card-left">
                    <div className="daily-card-date">
                      {formatBusinessDayKey(d.key)}
                      {d.manual && <span className="daily-manual-badge">手動</span>}
                    </div>
                    <div className="daily-card-sub">
                      {d.pax}名 · {d.count}会計 · 客単価 ¥{avg.toLocaleString()}
                    </div>
                  </div>
                  <div className="daily-card-right">
                    <div className="daily-card-amount">¥{d.sales.toLocaleString()}</div>
                    <div className="daily-card-toggle">{isOpen ? '▲' : '▼'}</div>
                  </div>
                </div>

                {isOpen && (
                  <div className="daily-card-body">
                    {d.manual && (
                      <div className="daily-manual-row">
                        <div>
                          <div className="daily-card-section-title" style={{ marginBottom: 4 }}>手動登録分</div>
                          <div className="daily-manual-detail">
                            ¥{Number(d.manual.sales).toLocaleString()} · {d.manual.pax}名 · {d.manual.count}会計
                          </div>
                        </div>
                        <div
                          className="daily-manual-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModal({ mode: 'edit', dayKey: d.key, record: d.manual });
                          }}
                        >
                          編集
                        </div>
                      </div>
                    )}
                    {ranking.length > 0 && (
                      <>
                        <div className="daily-card-section-title">商品別ランキング</div>
                        {ranking.map((item, idx) => (
                          <div key={item.name} className="daily-rank-row">
                            <span className="daily-rank-idx">{idx + 1}</span>
                            <span className="daily-rank-name">{item.name}</span>
                            <span className="daily-rank-qty">{item.qty}点</span>
                            <span className="daily-rank-total">¥{item.total.toLocaleString()}</span>
                          </div>
                        ))}
                      </>
                    )}
                    {!d.hasHistory && !d.manual && (
                      <div className="daily-no-detail">商品別の内訳はありません</div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        </div>
      </>
      )}

      {modal && (
        <ManualDailyModal
          modal={modal}
          onClose={() => setModal(null)}
          onSave={saveManualDaily}
          onDelete={deleteManualDaily}
        />
      )}
    </div>
  );
}

function ManualDailyModal({ modal, onClose, onSave, onDelete }) {
  const [dayKey, setDayKey] = useState(modal.dayKey);
  const [sales, setSales] = useState(modal.record?.sales ?? '');
  const [pax, setPax] = useState(modal.record?.pax ?? '');
  const [count, setCount] = useState(modal.record?.count ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(dayKey, { sales, pax, count });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!window.confirm('この日の手動登録を削除しますか？')) return;
    setSaving(true);
    try {
      await onDelete(modal.dayKey);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="daily-modal-backdrop" onClick={onClose}>
      <div className="daily-modal" onClick={e => e.stopPropagation()}>
        <div className="daily-modal-title">
          {modal.mode === 'edit' ? '手動登録を編集' : '過去の売上を登録'}
        </div>

        <label className="daily-field">
          <span>営業日</span>
          <input
            type="date"
            value={dayKeyToInputValue(dayKey)}
            onChange={e => e.target.value && setDayKey(inputValueToDayKey(e.target.value))}
            disabled={modal.mode === 'edit'}
          />
        </label>

        <label className="daily-field">
          <span>売上金額（円）</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={sales}
            onChange={e => setSales(e.target.value)}
            onFocus={e => e.target.select()}
            placeholder="0"
          />
        </label>

        <label className="daily-field">
          <span>来客数</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={pax}
            onChange={e => setPax(e.target.value)}
            onFocus={e => e.target.select()}
            placeholder="0"
          />
        </label>

        <label className="daily-field">
          <span>会計数</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={count}
            onChange={e => setCount(e.target.value)}
            onFocus={e => e.target.select()}
            placeholder="0"
          />
        </label>

        <div className="daily-modal-actions">
          {modal.mode === 'edit' && (
            <div className="btn-daily-delete" onClick={del}>削除</div>
          )}
          <div className="btn-daily-cancel" onClick={onClose}>キャンセル</div>
          <div className="btn-daily-save" onClick={save}>
            {saving ? '保存中...' : '保存'}
          </div>
        </div>
      </div>
    </div>
  );
}
