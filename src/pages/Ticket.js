import React, { useState } from 'react';
import { useOrders } from '../hooks/useOrders';
import './Ticket.css';

function elapsed(startTime) {
  const diff = Math.floor((Date.now() - new Date(startTime)) / 60000);
  if (diff < 60) return `${diff}分`;
  return `${Math.floor(diff / 60)}時間${diff % 60}分`;
}

export default function Ticket() {
  const { tableOrders, checkout, removeOrderItem, getTotal } = useOrders();
  const [checkingOut, setCheckingOut] = useState(null); // 会計処理中のテーブル番号
  const [editing, setEditing] = useState(null); // 取消編集中のテーブル番号

  const handleRemoveItem = (tableNum, item) => {
    if (!window.confirm(`「${item.name}」を1つ取り消しますか？`)) return;
    removeOrderItem(tableNum, item.id);
  };

  const tables = Object.keys(tableOrders).map(Number).sort((a, b) => a - b);
  const totalSales = Object.keys(tableOrders).reduce((sum, t) => sum + getTotal(Number(t)), 0);

  const handleCheckout = async (tableNum) => {
    if (checkingOut) return;
    setCheckingOut(tableNum);
    try {
      await checkout(tableNum);
    } finally {
      setCheckingOut(null);
    }
  };

  if (tables.length === 0) {
    return (
      <div className="ticket-empty">
        <div className="empty-icon">🍺</div>
        <div className="empty-text">営業中のテーブルはありません</div>
      </div>
    );
  }

  return (
    <div className="ticket-page">
      {tables.map(tableNum => {
        const order = tableOrders[tableNum];
        const total = getTotal(tableNum);
        const isProcessing = checkingOut === tableNum;
        const isEditing = editing === tableNum;

        return (
          <div key={tableNum} className="table-card">
            <div className="card-header">
              <div className="card-left">
                <div className="table-badge">{tableNum}</div>
                <div>
                  <div className="card-pax">{order.pax}名</div>
                  <div className="card-time">⏱ {elapsed(order.startTime)}</div>
                </div>
              </div>
              <div className="card-header-right">
                <div className="card-total">
                  <div className="card-total-num">¥{total.toLocaleString()}</div>
                  <div className="card-total-label">現在合計</div>
                </div>
                <div
                  className={`btn-edit ${isEditing ? 'active' : ''}`}
                  onClick={() => setEditing(isEditing ? null : tableNum)}
                >
                  {isEditing ? '完了' : '取消'}
                </div>
              </div>
            </div>

            <div className="card-body">
              {order.items.map(item => (
                <div key={item.id} className="order-row">
                  {isEditing && (
                    <button
                      className="btn-remove-item"
                      onClick={() => handleRemoveItem(tableNum, item)}
                    >
                      −
                    </button>
                  )}
                  <span className="order-name">{item.name}</span>
                  <span className="order-qty">×{item.qty}</span>
                  <span className="order-price">¥{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
              <div className="order-row total-row">
                <span style={{ color: '#9a9080', fontSize: 11 }}>税抜合計</span>
                <span style={{ flex: 1 }} />
                <span style={{ color: '#9a9080' }}>¥{Math.floor(total / 1.1).toLocaleString()}</span>
              </div>
              <div className="order-row total-row">
                <span style={{ color: '#9a9080', fontSize: 11 }}>消費税（10%）</span>
                <span style={{ flex: 1 }} />
                <span style={{ color: '#9a9080' }}>¥{(total - Math.floor(total / 1.1)).toLocaleString()}</span>
              </div>
              <div className="order-row total-row">
                <span style={{ color: '#9a9080', fontSize: 11 }}>税込合計</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontWeight: 700, color: '#f0ead8' }}>¥{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="card-actions">
              <div
                className={`btn-checkout ${isProcessing ? 'processing' : ''}`}
                onClick={() => !isProcessing && handleCheckout(tableNum)}
              >
                {isProcessing ? '⟳ 処理中...' : '✓ 会計する'}
              </div>
            </div>
          </div>
        );
      })}

      <div className="summary-bar">
        <div className="summary-item">
          <div className="summary-num">{tables.length}</div>
          <div className="summary-label">営業中</div>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <div className="summary-num">
            {Object.values(tableOrders).reduce((s, o) => s + o.pax, 0)}
          </div>
          <div className="summary-label">来客数</div>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <div className="summary-num">¥{totalSales.toLocaleString()}</div>
          <div className="summary-label">未会計合計</div>
        </div>
      </div>
    </div>
  );
}
