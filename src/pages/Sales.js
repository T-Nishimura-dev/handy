import React from 'react';
import { useOrders } from '../hooks/useOrders';
import './Sales.css';

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

// 営業日の基準日を取得（午前6時区切り）
function getBusinessDay(date) {
  const d = new Date(date);
  if (d.getHours() < 6) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function Sales() {
  const { history } = useOrders();

  // 本日の履歴（午前6時区切り）
  const todayKey = getBusinessDay(new Date());
  const todayHistory = history.filter(h => getBusinessDay(h.checkoutTime) === todayKey);

  const todaySales = todayHistory.reduce((s, h) => s + h.total, 0);
  const todayPax = todayHistory.reduce((s, h) => s + h.pax, 0);
  const avgSpend = todayHistory.length > 0 ? Math.floor(todaySales / todayPax) : 0;

  // 商品別集計
  const itemSales = {};
  todayHistory.forEach(h => {
    h.items.forEach(item => {
      if (!itemSales[item.name]) {
        itemSales[item.name] = { name: item.name, qty: 0, total: 0 };
      }
      itemSales[item.name].qty += item.qty;
      itemSales[item.name].total += item.price * item.qty;
    });
  });
  const ranking = Object.values(itemSales).sort((a, b) => b.total - a.total).slice(0, 5);
  const maxTotal = ranking[0]?.total || 1;

  const rankMedal = ['🥇','🥈','🥉'];

  return (
    <div className="sales-page">

      {/* 本日サマリ */}
      <div className="today-card">
        <div className="today-label">📅 本日の売上</div>
        <div className="today-main">
          <span className="today-yen">¥</span>
          <span className="today-amount">{todaySales.toLocaleString()}</span>
        </div>
        <div className="today-stats">
          <div className="stat-box">
            <div className="stat-num">{todayPax}</div>
            <div className="stat-label">来客数</div>
          </div>
          <div className="stat-box">
            <div className="stat-num">{todayHistory.length}</div>
            <div className="stat-label">会計済み</div>
          </div>
          <div className="stat-box">
            <div className="stat-num">¥{avgSpend.toLocaleString()}</div>
            <div className="stat-label">客単価</div>
          </div>
        </div>
      </div>

      {/* 商品別ランキング */}
      {ranking.length > 0 && (
        <div className="ranking-section">
          <div className="section-title">商品別売上ランキング</div>
          {ranking.map((item, idx) => (
            <div key={item.name} className="rank-item">
              <div className="rank-medal">{rankMedal[idx] || idx + 1}</div>
              <div className="rank-bar-wrap">
                <div className="rank-name">{item.name}</div>
                <div className="rank-bar-bg">
                  <div
                    className="rank-bar-fill"
                    style={{ width: `${(item.total / maxTotal) * 100}%` }}
                  />
                </div>
              </div>
              <div className="rank-right">
                <div className="rank-sales">¥{item.total.toLocaleString()}</div>
                <div className="rank-count">{item.qty}点</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 会計履歴 */}
      <div className="history-section">
        <div className="section-title">会計履歴</div>
        {todayHistory.length === 0 ? (
          <div className="no-history">本日の会計はまだありません</div>
        ) : (
          todayHistory.map(h => (
            <div key={h.id} className="history-item">
              <div>
                <div className="history-table">テーブル {h.tableNum} · {h.pax}名</div>
                <div className="history-time">{formatDate(h.checkoutTime)} 会計</div>
              </div>
              <div className="history-right">
                <div className="history-amount">¥{h.total.toLocaleString()}</div>
                <div className="history-badge">会計済</div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
