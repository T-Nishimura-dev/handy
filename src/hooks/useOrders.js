import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SHEET_CONFIG } from '../config';

const OrderContext = createContext(null);
const SCRIPT_URL = SHEET_CONFIG.SCRIPT_URL;

// JSONP リクエスト（CORSを回避）
function jsonp(params) {
  return new Promise((resolve, reject) => {
    const callbackName = 'cb_' + Math.random().toString(36).slice(2);
    const query = new URLSearchParams({ ...params, callback: callbackName }).toString();
    const script = document.createElement('script');

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('timeout'));
    }, 10000);

    function cleanup() {
      clearTimeout(timer);
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('script error'));
    };

    script.src = `${SCRIPT_URL}?${query}`;
    document.head.appendChild(script);
  });
}

export function OrderProvider({ children }) {
  const [tableOrders, setTableOrders] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [tables, hist] = await Promise.all([
        jsonp({ action: 'getTables' }),
        jsonp({ action: 'getHistory' }),
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

  // 注文追加
  const addOrder = async (tableNum, items, pax = 1) => {
    const startTime = tableOrders[tableNum]?.startTime || new Date().toISOString();
    await jsonp({
      action: 'addOrder',
      tableNum,
      pax,
      startTime,
      items: JSON.stringify(items),
    });
    await fetchAll();
  };

  // 会計
  const checkout = async (tableNum) => {
    await jsonp({ action: 'checkout', tableNum });
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
