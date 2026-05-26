import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SHEET_CONFIG } from '../config';

const OrderContext = createContext(null);
const SCRIPT_URL = SHEET_CONFIG.SCRIPT_URL;

// GETリクエスト（パラメータをURLに乗せる）
async function apiGet(params) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${SCRIPT_URL}?${query}`);
  return res.json();
}

export function OrderProvider({ children }) {
  const [tableOrders, setTableOrders] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [tables, hist] = await Promise.all([
        apiGet({ action: 'getTables' }),
        apiGet({ action: 'getHistory' }),
      ]);
      setTableOrders(tables || {});
      setHistory(Array.isArray(hist) ? hist : []);
    } catch (e) {
      console.error('fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const timer = setInterval(fetchAll, 30000);
    return () => clearInterval(timer);
  }, [fetchAll]);

  // 注文追加（GETで送信）
  const addOrder = async (tableNum, items, pax = 1) => {
    const startTime = tableOrders[tableNum]?.startTime || new Date().toISOString();
    await apiGet({
      action: 'addOrder',
      tableNum,
      pax,
      startTime,
      items: JSON.stringify(items),
    });
    await fetchAll();
  };

  // 会計（GETで送信）
  const checkout = async (tableNum) => {
    await apiGet({ action: 'checkout', tableNum });
    await fetchAll();
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
