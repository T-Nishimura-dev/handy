import React, { createContext, useContext, useState, useEffect } from 'react';

const OrderContext = createContext(null);

// localStorage からデータを読み込む
const loadOrders = () => {
  try {
    const data = localStorage.getItem('handy_orders');
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
};

const loadHistory = () => {
  try {
    const data = localStorage.getItem('handy_history');
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export function OrderProvider({ children }) {
  // tableOrders: { [tableNum]: { items: [{id, name, price, qty}], startTime, pax } }
  const [tableOrders, setTableOrders] = useState(loadOrders);
  const [history, setHistory] = useState(loadHistory);

  // 変更のたびにlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('handy_orders', JSON.stringify(tableOrders));
  }, [tableOrders]);

  useEffect(() => {
    localStorage.setItem('handy_history', JSON.stringify(history));
  }, [history]);

  // 注文を追加・更新
  const addOrder = (tableNum, items, pax = 1) => {
    setTableOrders(prev => {
      const existing = prev[tableNum];
      if (existing) {
        // 既存テーブルへ追加
        const merged = [...existing.items];
        items.forEach(newItem => {
          const idx = merged.findIndex(i => i.id === newItem.id);
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], qty: merged[idx].qty + newItem.qty };
          } else {
            merged.push(newItem);
          }
        });
        return { ...prev, [tableNum]: { ...existing, items: merged } };
      } else {
        // 新規テーブル
        return {
          ...prev,
          [tableNum]: {
            items,
            pax,
            startTime: new Date().toISOString(),
          }
        };
      }
    });
  };

  // 会計処理
  const checkout = (tableNum) => {
    const order = tableOrders[tableNum];
    if (!order) return;
    const total = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const record = {
      id: Date.now(),
      tableNum,
      pax: order.pax,
      items: order.items,
      total,
      startTime: order.startTime,
      checkoutTime: new Date().toISOString(),
    };
    setHistory(prev => [record, ...prev]);
    setTableOrders(prev => {
      const next = { ...prev };
      delete next[tableNum];
      return next;
    });
  };

  // テーブルの合計金額
  const getTotal = (tableNum) => {
    const order = tableOrders[tableNum];
    if (!order) return 0;
    return order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  };

  return (
    <OrderContext.Provider value={{ tableOrders, history, addOrder, checkout, getTotal }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => useContext(OrderContext);
