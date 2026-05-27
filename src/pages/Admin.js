import React, { useState } from 'react';
import { ref, remove, set } from 'firebase/database';
import { db } from '../firebase';
import { useOrders } from '../hooks/useOrders';
import './Admin.css';

const ADMIN_PASSWORD = 'admin2024'; // ← 変更してください

export default function Admin() {
  const { tableOrders, history } = useOrders();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null); // 確認ダイアログ用

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('パスワードが違います');
      setPassword('');
    }
  };

  const deleteTable = async (tableNum) => {
    await remove(ref(db, `tables/${tableNum}`));
    setConfirm(null);
  };

  const deleteAllTables = async () => {
    await remove(ref(db, 'tables'));
    setConfirm(null);
  };

  const deleteHistory = async (id) => {
    // historyはpushで追加しているのでキーで削除
    const historyRef = ref(db, 'history');
    const snapshot = await import('firebase/database').then(({ get }) => get(historyRef));
    const data = snapshot.val();
    if (!data) return;
    const key = Object.keys(data).find(k => data[k].checkoutTime === id);
    if (key) await remove(ref(db, `history/${key}`));
    setConfirm(null);
  };

  const deleteAllHistory = async () => {
    await remove(ref(db, 'history'));
    setConfirm(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-login">
        <div className="admin-login-box">
          <div className="admin-title">管理者ページ</div>
          <input
            type="password"
            className="admin-input"
            placeholder="管理者パスワード"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          {error && <div className="admin-error">{error}</div>}
          <button className="admin-btn" onClick={handleLogin}>ログイン</button>
        </div>
      </div>
    );
  }

  const tables = Object.keys(tableOrders).map(Number).sort((a, b) => a - b);

  return (
    <div className="admin-page">
      {/* 確認ダイアログ */}
      {confirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-text">{confirm.message}</div>
            <div className="confirm-actions">
              <div className="confirm-btn cancel" onClick={() => setConfirm(null)}>キャンセル</div>
              <div className="confirm-btn danger" onClick={confirm.action}>削除する</div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-section">
        <div className="admin-section-header">
          <div className="admin-section-title">営業中テーブル</div>
          <div
            className="delete-all-btn"
            onClick={() => setConfirm({ message: '全テーブルのデータを削除しますか？', action: deleteAllTables })}
          >全削除</div>
        </div>

        {tables.length === 0 ? (
          <div className="admin-empty">データなし</div>
        ) : (
          tables.map(tableNum => {
            const order = tableOrders[tableNum];
            const total = (order.items || []).reduce((sum, i) => sum + i.price * i.qty, 0);
            return (
              <div key={tableNum} className="admin-item">
                <div className="admin-item-info">
                  <div className="admin-item-title">テーブル {tableNum}・{order.pax}名</div>
                  <div className="admin-item-sub">¥{total.toLocaleString()} · {(order.items || []).length}品</div>
                </div>
                <div
                  className="delete-btn"
                  onClick={() => setConfirm({ message: `テーブル${tableNum}のデータを削除しますか？`, action: () => deleteTable(tableNum) })}
                >削除</div>
              </div>
            );
          })
        )}
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <div className="admin-section-title">注文履歴</div>
          <div
            className="delete-all-btn"
            onClick={() => setConfirm({ message: '全履歴を削除しますか？', action: deleteAllHistory })}
          >全削除</div>
        </div>

        {history.length === 0 ? (
          <div className="admin-empty">データなし</div>
        ) : (
          history.map((h, idx) => (
            <div key={idx} className="admin-item">
              <div className="admin-item-info">
                <div className="admin-item-title">テーブル {h.tableNum}・{h.pax}名</div>
                <div className="admin-item-sub">¥{h.total?.toLocaleString()} · {h.checkoutTime?.slice(0, 16).replace('T', ' ')}</div>
              </div>
              <div
                className="delete-btn"
                onClick={() => setConfirm({ message: `この履歴を削除しますか？`, action: () => deleteHistory(h.checkoutTime) })}
              >削除</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
