import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SHEET_CONFIG } from '../config';

const OrderContext = createContext(null);
const IS_LOCAL = window.location.hostname === 'localhost';
const GAS_URL = SHEET_CONFIG.SCRIPT_URL;

// 読み込み用JSONP
function jsonpGet(params) {
  return new Promise((resolve, reject) => {
    const cbName = 'cb_' + Math.random().toString(36).slice(2);
    const query = new URLSearchParams({ ...params, callback: cbName }).toString();
    const script = document.createElement('script');
    const timer = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, 15000);

    function cleanup() {
      clearTimeout(timer);
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[cbName] = (data) => { cleanup(); resolve(data); };
    script.onerror = () => { cleanup(); reject(new Error('script error')); };
    script.src = `${GAS_URL}?${query}`;
    document.head.appendChild(script);
  });
}

// 書き込み用（no-corsでレスポンスは取れないが書き込みはできる）
async function gasWrite(params) {
  const query = new URLSearchParams({ ...params, callback: 'cb' }).toString();
  await fetch(`${GAS_URL}?${query}`, { mode: 'no-cors' });
  // レスポンスは取れないので少し待ってからfetchAllで反映確認
  await new Promise(r => setTimeout(r, 2000));
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
    if (IS_LOCAL) return;
    try {
      const [tables, hist] = await Promise.all([
        jsonpGet({ action: 'getTables' }),
        jsonpGet({ action: 'getHistory' }),
      ]);
      if (tables) { setTableOrders(tables); saveLocal('handy_orders', tables); }
      if (hist)   { setHistory(hist);       saveLocal('handy_history', hist); }
    } catch (e) {
      console.error('fetchAll error', e);
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
      await gasWrite({ action: 'addOrder', tableNum, pax, startTime, items: JSON.stringify(minItems) });
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
      await gasWrite({ action: 'checkout', tableNum });
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
