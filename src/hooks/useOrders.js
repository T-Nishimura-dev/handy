import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ref, set, get, remove, push, onValue, off } from 'firebase/database';
import { db } from '../firebase';
import { MENU_ITEMS, CATEGORIES } from '../config';

const OrderContext = createContext(null);
const IS_LOCAL = window.location.hostname === 'localhost';

const loadLocal = (key, def) => {
  try { return JSON.parse(localStorage.getItem(key)) || def; } catch { return def; }
};
const saveLocal = (key, val) => localStorage.setItem(key, JSON.stringify(val));

export function OrderProvider({ children }) {
  const [tableOrders, setTableOrders] = useState(() => loadLocal('handy_orders', {}));
  const [history, setHistory]         = useState(() => loadLocal('handy_history', []));
  const [menuItems, setMenuItems]     = useState(() => loadLocal('handy_menu', MENU_ITEMS));
  const [categories, setCategories]   = useState(() => loadLocal('handy_categories', CATEGORIES));
  const [loading, setLoading]         = useState(!IS_LOCAL);

  useEffect(() => {
    if (IS_LOCAL) return;

    const tablesRef   = ref(db, 'tables');
    const historyRef  = ref(db, 'history');
    const menuRef     = ref(db, 'menu');

    onValue(tablesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setTableOrders(data);
      saveLocal('handy_orders', data);
      setLoading(false);
    });

    onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.values(data).sort((a, b) => b.checkoutTime > a.checkoutTime ? 1 : -1);
        setHistory(arr);
        saveLocal('handy_history', arr);
      } else {
        setHistory([]);
      }
    });

    onValue(menuRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Array.isArray(data.items) ? data.items : Object.values(data.items || {});
        const cats  = Array.isArray(data.categories) ? data.categories : CATEGORIES;
        setMenuItems(items);
        setCategories(cats);
        saveLocal('handy_menu', items);
        saveLocal('handy_categories', cats);
      } else {
        // 初回：config.jsのデータをFirebaseに投入
        set(ref(db, 'menu'), { items: MENU_ITEMS, categories: CATEGORIES });
      }
    });

    return () => {
      off(tablesRef);
      off(historyRef);
      off(menuRef);
    };
  }, []);

  const fetchAll = useCallback(() => {}, []);

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

  const checkout = async (tableNum) => {
    if (IS_LOCAL) {
      const order = tableOrders[tableNum];
      if (!order) return;
      const total = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
      const record = {
        id: Date.now(), tableNum, pax: order.pax, items: order.items, total,
        startTime: order.startTime, checkoutTime: new Date().toISOString(),
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

    const tableRef = ref(db, `tables/${tableNum}`);
    const snapshot = await get(tableRef);
    const order = snapshot.val();
    if (!order) return;

    const total = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const checkoutTime = jst.toISOString().replace('Z', '+09:00');

    await push(ref(db, 'history'), {
      tableNum, pax: order.pax, items: order.items, total,
      startTime: order.startTime, checkoutTime,
    });
    await remove(tableRef);
  };

  // メニュー保存
  const saveMenu = async (items, cats) => {
    await set(ref(db, 'menu'), { items, categories: cats });
  };

  const getTotal = (tableNum) => {
    const order = tableOrders[tableNum];
    if (!order) return 0;
    return (order.items || []).reduce((sum, i) => sum + i.price * i.qty, 0);
  };

  return (
    <OrderContext.Provider value={{
      tableOrders, history, menuItems, categories,
      addOrder, checkout, getTotal, loading, fetchAll, saveMenu
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => useContext(OrderContext);
