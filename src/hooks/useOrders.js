import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SHEET_CONFIG } from '../config';

const OrderContext = createContext(null);

const SCRIPT_URL = SHEET_CONFIG.SCRIPT_URL;

async function apiGet(action) {
  const res = await fetch(`${SCRIPT_URL}?action=${action}`);
  return res.json();
}

async function apiPost(data) {
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export function OrderProvider({ children }) {
  const [tableOrders, setTableOrders] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // 初回・定期読み込み
  const fetchAll = useCallback(async () => {
    try {
      const [tables, hist] = await Promise.all([
        apiGet('getTables'),
        apiGet('getHistory'),
      ]);
      setTableOrders(tables);
      setHistory(Array.isArray(hist) ? hist : []);
    } catch (e) {
      console.error('fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // 30秒ごとに自動更新（複数端末同期）
    const timer = setInterval(fetchAll, 30000);
    return () => clearInterval(timer);
  }, [fetchAll]);

  // 注文追加
  const addOrder = async (tableNum, items, pax = 1) => {
    const startTime = tableOrders[tableNum]?.startTime || new Date().toISOString();
    await apiPost({ action: 'addOrder', tableNum, items, pax, startTime });
    await fetchAll();
  };

  // 会計
  const checkout = async (tableNum) => {
    await apiPost({ action: 'checkout', tableNum });
    await fetchAll();
  };

  // テーブル合計
  const getTotal = (tableNum) => {
    const order = tableOrders[tableNum];
    if (!order) return 0;
    return order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  };

  return (
    <OrderContext.Provider value={{ tableOrders, history, addOrder, checkout, getTotal, loading, fetchAll }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => useContext(OrderContext);
