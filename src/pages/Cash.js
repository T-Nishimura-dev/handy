import React, { useState, useEffect } from 'react';
import './Cash.css';

const STORAGE_KEY = 'handy_cash_counts';
const loadCounts = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
};

const DENOMINATIONS = [
  { value: 10000, label: '一万円札', type: 'bill' },
  { value: 5000,  label: '五千円札', type: 'bill' },
  { value: 2000,  label: '二千円札', type: 'bill' },
  { value: 1000,  label: '千円札',   type: 'bill' },
  { value: 500,   label: '五百円玉', type: 'coin' },
  { value: 100,   label: '百円玉',   type: 'coin' },
  { value: 50,    label: '五十円玉', type: 'coin' },
  { value: 10,    label: '十円玉',   type: 'coin' },
  { value: 5,     label: '五円玉',   type: 'coin' },
  { value: 1,     label: '一円玉',   type: 'coin' },
];

export default function Cash() {
  const [counts, setCounts] = useState(loadCounts);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  }, [counts]);

  const setCount = (value, raw) => {
    const n = parseInt(raw, 10);
    setCounts(prev => ({ ...prev, [value]: Number.isFinite(n) && n >= 0 ? n : 0 }));
  };

  const reset = () => {
    if (window.confirm('入力をすべてリセットしますか？')) setCounts({});
  };

  const total = DENOMINATIONS.reduce((sum, d) => sum + d.value * (counts[d.value] || 0), 0);
  const totalCount = DENOMINATIONS.reduce((sum, d) => sum + (counts[d.value] || 0), 0);

  return (
    <div className="cash-page">
      <div className="cash-total-card">
        <div className="cash-total-label">合計金額</div>
        <div className="cash-total-main">
          <span className="cash-total-yen">¥</span>
          <span className="cash-total-amount">{total.toLocaleString()}</span>
        </div>
        <div className="cash-total-sub">枚数合計 {totalCount} 枚</div>
      </div>

      <div className="cash-list">
        {DENOMINATIONS.map(d => {
          const count = counts[d.value] || 0;
          const subtotal = d.value * count;
          return (
            <div key={d.value} className={`cash-row ${d.type}`}>
              <div className="cash-row-left">
                <div className="cash-denom">¥{d.value.toLocaleString()}</div>
                <div className="cash-label">{d.label}</div>
              </div>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                className="cash-input"
                value={counts[d.value] ?? ''}
                onChange={e => setCount(d.value, e.target.value)}
                onFocus={e => e.target.select()}
                placeholder="0"
              />
              <div className="cash-unit">枚</div>
              <div className="cash-subtotal">¥{subtotal.toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      <div className="cash-actions">
        <div className="btn-reset" onClick={reset}>リセット</div>
      </div>
    </div>
  );
}
