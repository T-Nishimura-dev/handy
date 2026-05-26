import React, { useState } from 'react';
import { MENU_ITEMS, CATEGORIES, TABLE_COUNT } from '../config';
import { useOrders } from '../hooks/useOrders';
import './Order.css';

export default function Order() {
  const { tableOrders, addOrder } = useOrders();
  const [selectedTable, setSelectedTable] = useState(null);
  const [category, setCategory] = useState('すべて');
  const [cart, setCart] = useState({});
  const [pax, setPax] = useState(2);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const filteredMenu = category === 'すべて'
    ? MENU_ITEMS
    : MENU_ITEMS.filter(m => m.category === category);

  const updateCart = (item, delta) => {
    setCart(prev => {
      const qty = (prev[item.id]?.qty || 0) + delta;
      if (qty <= 0) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: { ...item, qty } };
    });
  };

  const cartTotal = Object.values(cart).reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = Object.values(cart).reduce((sum, i) => sum + i.qty, 0);

  const handleSend = async () => {
    if (!selectedTable || cartCount === 0 || sending) return;
    setSending(true);
    try {
      const items = Object.values(cart);
      await addOrder(selectedTable, items, pax);
      setCart({});
      setSent(true);
      setTimeout(() => setSent(false), 2000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="order-page">
      {/* テーブル選択 */}
      <div className="section-label">テーブル選択</div>
      <div className="table-grid">
        {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map(num => {
          const occupied = !!tableOrders[num];
          const active = selectedTable === num;
          return (
            <div
              key={num}
              className={`table-btn ${active ? 'active' : ''} ${occupied ? 'occupied' : ''}`}
              onClick={() => setSelectedTable(num)}
            >
              {occupied && <div className="table-dot" />}
              <div className="table-num">{num}</div>
              <div className="table-label">{active ? '選択中' : occupied ? '営業中' : '空席'}</div>
            </div>
          );
        })}
      </div>

      {selectedTable && !tableOrders[selectedTable] && (
        <div className="pax-row">
          <span className="pax-label">人数</span>
          {[1,2,3,4,5,6,7,8].map(n => (
            <div
              key={n}
              className={`pax-btn ${pax === n ? 'active' : ''}`}
              onClick={() => setPax(n)}
            >
              {n}
            </div>
          ))}
          <span className="pax-label">名</span>
        </div>
      )}

      <div className="divider" />

      {/* カテゴリ */}
      <div className="cat-tabs">
        {CATEGORIES.map(c => (
          <div
            key={c}
            className={`cat-tab ${category === c ? 'active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </div>
        ))}
      </div>

      {/* メニュー */}
      <div className="menu-list">
        {filteredMenu.map(item => (
          <div key={item.id} className="menu-item">
            <div className="menu-info">
              <div className="menu-name">
                {item.name}
                {item.tag && <span className="menu-tag">{item.tag}</span>}
              </div>
              <div className="menu-price">¥{item.price.toLocaleString()}</div>
            </div>
            <div className="qty-ctrl">
              <div className="qty-btn minus" onClick={() => updateCart(item, -1)}>−</div>
              <div className="qty-num">{cart[item.id]?.qty || 0}</div>
              <div className="qty-btn plus" onClick={() => updateCart(item, 1)}>＋</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 80 }} />

      {/* 送信ボタン */}
      <div className="order-bar">
        {sent ? (
          <div className="order-btn sent">✓ 注文を送信しました</div>
        ) : sending ? (
          <div className="order-btn disabled">⟳ 送信中...</div>
        ) : (
          <div
            className={`order-btn ${(!selectedTable || cartCount === 0) ? 'disabled' : ''}`}
            onClick={handleSend}
          >
            {selectedTable ? `テーブル ${selectedTable} に注文送信` : 'テーブルを選択してください'}
            {cartCount > 0 && <span className="order-badge">¥{cartTotal.toLocaleString()}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
