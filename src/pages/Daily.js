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

export default function Daily() {
  const { history } = useOrders();
  const [expanded, setExpanded] = useState({});

  const dailyStats = useMemo(() => {
    const map = {};
    history.forEach(h => {
      const key = getBusinessDay(h.checkoutTime);
      if (!map[key]) {
        map[key] = {
          key,
          sales: 0,
          pax: 0,
          count: 0,
          items: {},
        };
      }
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
    return Object.values(map).sort((a, b) => {
      const [ay, am, ad] = a.key.split('-').map(Number);
      const [by, bm, bd] = b.key.split('-').map(Number);
      return new Date(by, bm, bd) - new Date(ay, am, ad);
    });
  }, [history]);

  const grandTotal = dailyStats.reduce((s, d) => s + d.sales, 0);
  const grandPax = dailyStats.reduce((s, d) => s + d.pax, 0);
  const grandCount = dailyStats.reduce((s, d) => s + d.count, 0);
  const grandAvg = grandPax > 0 ? Math.floor(grandTotal / grandPax) : 0;

  return (
    <div className="daily-page">
      <div className="daily-summary-card">
        <div className="daily-summary-label">📊 集計（全期間）</div>
        <div className="daily-summary-main">
          <span className="daily-summary-yen">¥</span>
          <span className="daily-summary-amount">{grandTotal.toLocaleString()}</span>
        </div>
        <div className="daily-summary-stats">
          <div className="daily-stat-box">
            <div className="daily-stat-num">{dailyStats.length}</div>
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

      <div className="daily-list">
        {dailyStats.length === 0 ? (
          <div className="daily-empty">履歴がありません</div>
        ) : (
          dailyStats.map(d => {
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
                    <div className="daily-card-date">{formatBusinessDayKey(d.key)}</div>
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
                    <div className="daily-card-section-title">商品別ランキング</div>
                    {ranking.map((item, idx) => (
                      <div key={item.name} className="daily-rank-row">
                        <span className="daily-rank-idx">{idx + 1}</span>
                        <span className="daily-rank-name">{item.name}</span>
                        <span className="daily-rank-qty">{item.qty}点</span>
                        <span className="daily-rank-total">¥{item.total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
