import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const OrderContext = createContext(null);

// 本番はNetlifyプロキシ、ローカルはlocalStorage
const IS_LOCAL = window.location.hostname === 'localhost';
const PROXY_URL = '/api/gas-proxy';

// APIリクエスト
async function apiGet(params) {
  if (IS_LOCAL) return null;
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${PROXY_URL}?${query}`);
  return res.json();
}

// localStorage操作
const loadLocal = (key, def) => {
  try { return JSON.parse(localStorage.getItem(key)) || def; } catch { return def; }
};
const saveLocal = (key, val) => localStorage.setItem(key, JSON.stringify(val));

export function OrderProvider({ children }) {
  const [tableOrders, setTableOrders] = useState(() => loadLocal('handy_orders', {}));
  const [history, setHistory]         = useState(() => loadLocal('handy_history', []));
  const [loading, setLoading]         = useState(!IS_LOCAL);

  const fetchAll = useCallback(async () => {
    if (IS_LOCAL) return; // ローカルはfetchしない
    try {
      const [tables, hist] = await Promise.all([
        apiGet({ action: 'getTables' }),
        apiGet({ action: 'getHistory' }),
      ]);
      if (tables) { setTableOrders(tables); saveLocal('handy_orders', tables); }
      if (hist)   { setHistory(hist);       saveLocal('handy_history', hist); }
    } catch (e) {
      console.error('fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    if (!IS_LOCAL) {
      const timer = setInterval(fetchAll, 30000);
      return () => clearInterval(timer);
    }
  }, [fetchAll]);

  // 注文追加
  const addOrder = async (tableNum, items, pax = 1) => {
    const startTime = tableOrders[tableNum]?.startTime || new Date().toISOString();
    const minItems  = items.map(({ id, name, price, qty }) => ({ id, name, price, qty }));

    if (IS_LOCAL) {
      // ローカル：localStorageに保存
      setTableOrders(prev => {
        const existing = prev[tableNum];
        let merged = minItems;
        if (existing) {
          merged = [...existing.items];
          minItems.forEach(ni => {
            const idx = merged.findIndex(i => i.id === ni.id);
            if (idx >= 0) merged[idx] = { ...merged[idx], qty: merged[idx].qty + ni.qty };
            else merged.push(ni);
          });
        }
        const next = { ...prev, [tableNum]: { items: merged, pax, startTime } };
        saveLocal('handy_orders', next);
        return next;
      });
    } else {
      await apiGet({ action: 'addOrder', tableNum, pax, startTime, items: JSON.stringify(minItems) });
      await fetchAll();
    }
  };

  // 会計
  const checkout = async (tableNum) => {
    if (IS_LOCAL) {
      const order = tableOrders[tableNum];
      if (!order) return;
      const total = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
      const record = { id: Date.now(), tableNum, pax: order.pax, items: order.items, total,
        startTime: order.startTime, checkoutTime: new Date().toISOString() };
      setHistory(prev => { const next = [record, ...prev]; saveLocal('handy_history', next); return next; });
      setTableOrders(prev => {
        const next = { ...prev };
        delete next[tableNum];
        saveLocal('handy_orders', next);
        return next;
      });
    } else {
      await apiGet({ action: 'checkout', tableNum });
      await fetchAll();
    }
  };

  const getTotal = (tableNum) => {
    const order = tableOrders[tableNum];
    if (!order) return 0;
    return (order.items || []).reduce((sum, i) => sum + i.price * i.qty, 0);
  };

  return (
    <OrderContext.Provider value={{ tableOrders, history, addOrder, checkout, getTotal, loading, fetchAll }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => useContext(OrderContext);
