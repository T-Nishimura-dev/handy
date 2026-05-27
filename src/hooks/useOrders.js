import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ref, set, get, remove, push, onValue, off } from 'firebase/database';
import { db } from '../firebase';

const OrderContext = createContext(null);
const IS_LOCAL = window.location.hostname === 'localhost';

// localStorage操作（ローカル開発用）
const loadLocal = (key, def) => {
  try { return JSON.parse(localStorage.getItem(key)) || def; } catch { return def; }
};
const saveLocal = (key, val) => localStorage.setItem(key, JSON.stringify(val));

export function OrderProvider({ children }) {
  const [tableOrders, setTableOrders] = useState(() => loadLocal('handy_orders', {}));
  const [history, setHistory]         = useState(() => loadLocal('handy_history', []));
  const [loading, setLoading]         = useState(!IS_LOCAL);

  // Firebase リアルタイム同期
  useEffect(() => {
    if (IS_LOCAL) return;

    const tablesRef = ref(db, 'tables');
    const historyRef = ref(db, 'history');

    const unsubTables = onValue(tablesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setTableOrders(data);
      saveLocal('handy_orders', data);
      setLoading(false);
    });

    const unsubHistory = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.values(data).sort((a, b) => b.checkoutTime > a.checkoutTime ? 1 : -1);
        setHistory(arr);
        saveLocal('handy_history', arr);
      } else {
        setHistory([]);
      }
    });

    return () => {
      off(tablesRef);
      off(historyRef);
    };
  }, []);

  const fetchAll = useCallback(() => {}, []); // Firebase は onValue で自動同期

  // 注文追加
  const addOrder = async (tableNum, items, pax = 1) => {
    const minItems = items.map(({ id, name, price, qty }) => ({ id, name, price, qty }));

    if (IS_LOCAL) {
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
        const next = { ...prev, [tableNum]: { items: merged, pax, startTime: existing?.startTime || new Date().toISOString() } };
        saveLocal('handy_orders', next);
        return next;
      });
      return;
    }

    // Firebase
    const tableRef = ref(db, `tables/${tableNum}`);
    const snapshot = await get(tableRef);
    const existing = snapshot.val();

    let merged = minItems;
    if (existing) {
      merged = [...existing.items];
      minItems.forEach(ni => {
        const idx = merged.findIndex(i => i.id === ni.id);
        if (idx >= 0) merged[idx] = { ...merged[idx], qty: merged[idx].qty + ni.qty };
        else merged.push(ni);
      });
    }

    await set(tableRef, {
      items: merged,
      pax: existing?.pax || pax,
      startTime: existing?.startTime || new Date().toISOString(),
    });
  };

  // 会計
  const checkout = async (tableNum) => {
    if (IS_LOCAL) {
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
      setHistory(prev => { const next = [record, ...prev]; saveLocal('handy_history', next); return next; });
      setTableOrders(prev => {
        const next = { ...prev };
        delete next[tableNum];
        saveLocal('handy_orders', next);
        return next;
      });
      return;
    }

    // Firebase
    const tableRef = ref(db, `tables/${tableNum}`);
    const snapshot = await get(tableRef);
    const order = snapshot.val();
    if (!order) return;

    const total = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const checkoutTime = jst.toISOString().replace('Z', '+09:00');

    const historyRef = ref(db, 'history');
    await push(historyRef, {
      tableNum,
      pax: order.pax,
      items: order.items,
      total,
      startTime: order.startTime,
      checkoutTime,
    });

    await remove(tableRef);
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
