import React, { useState } from 'react';
import { ref, remove, get } from 'firebase/database';
import { db } from '../firebase';
import { useOrders } from '../hooks/useOrders';
import { CATEGORIES } from '../config';
import './Admin.css';

const ADMIN_PASSWORD = 'admin2024';

export default function Admin() {
  const { tableOrders, history, menuItems, categories, saveMenu } = useOrders();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [tab, setTab] = useState('menu'); // menu / tables / history

  // メニュー編集用
  const [editItem, setEditItem] = useState(null); // 編集中のアイテム
  const [newItem, setNewItem] = useState({ name: '', category: categories[1] || '', price: '', tag: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) { setIsLoggedIn(true); setError(''); }
    else { setError('パスワードが違います'); setPassword(''); }
  };

  const deleteTable = async (tableNum) => {
    await remove(ref(db, `tables/${tableNum}`));
    setConfirm(null);
  };

  const deleteAllTables = async () => {
    await remove(ref(db, 'tables'));
    setConfirm(null);
  };

  const deleteHistory = async (checkoutTime) => {
    const snapshot = await get(ref(db, 'history'));
    const data = snapshot.val();
    if (!data) return;
    const key = Object.keys(data).find(k => data[k].checkoutTime === checkoutTime);
    if (key) await remove(ref(db, `history/${key}`));
    setConfirm(null);
  };

  const deleteAllHistory = async () => {
    await remove(ref(db, 'history'));
    setConfirm(null);
  };

  // メニュー追加
  const handleAddMenu = async () => {
    if (!newItem.name || !newItem.price || !newItem.category) return;
    const maxId = Math.max(...menuItems.map(m => Number(m.id) || 0), 0);
    const item = { id: maxId + 1, name: newItem.name, category: newItem.category, price: parseInt(newItem.price), tag: newItem.tag || '' };
    const updated = [...menuItems, item];
    // カテゴリに新カテゴリが含まれていれば追加
    const updatedCats = categories.includes(item.category)
      ? categories
      : [...categories, item.category];
    await saveMenu(updated, updatedCats);
    setNewItem({ name: '', category: categories[1] || '', price: '', tag: '' });
    setShowAddForm(false);
  };

  // メニュー編集保存
  const handleEditSave = async () => {
    if (!editItem.name || !editItem.price) return;
    const updated = menuItems.map(m => m.id === editItem.id ? { ...editItem, price: parseInt(editItem.price) } : m);
    await saveMenu(updated, categories);
    setEditItem(null);
  };

  // メニュー削除
  const handleDeleteMenu = async (id) => {
    const updated = menuItems.filter(m => m.id !== id);
    await saveMenu(updated, categories);
    setConfirm(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-login">
        <div className="admin-login-box">
          <div className="admin-title">管理者ページ</div>
          <input type="password" className="admin-input" placeholder="管理者パスワード"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {error && <div className="admin-error">{error}</div>}
          <button className="admin-btn" onClick={handleLogin}>ログイン</button>
        </div>
      </div>
    );
  }

  const tables = Object.keys(tableOrders).map(Number).sort((a, b) => a - b);

  return (
    <div className="admin-page">
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

      {/* 編集ダイアログ */}
      {editItem && (
        <div className="confirm-overlay">
          <div className="confirm-box" style={{width:300}}>
            <div className="admin-section-title" style={{marginBottom:12}}>メニュー編集</div>
            <input className="admin-input" placeholder="品名" value={editItem.name}
              onChange={e => setEditItem({...editItem, name: e.target.value})} />
            <input className="admin-input" placeholder="カテゴリ" value={editItem.category}
              onChange={e => setEditItem({...editItem, category: e.target.value})} />
            <input className="admin-input" type="number" placeholder="価格" value={editItem.price}
              onChange={e => setEditItem({...editItem, price: e.target.value})} />
            <input className="admin-input" placeholder="タグ（任意）" value={editItem.tag || ''}
              onChange={e => setEditItem({...editItem, tag: e.target.value})} />
            <div className="confirm-actions" style={{marginTop:8}}>
              <div className="confirm-btn cancel" onClick={() => setEditItem(null)}>キャンセル</div>
              <div className="confirm-btn" style={{background:'#d4922a',color:'#0f0e0c'}} onClick={handleEditSave}>保存</div>
            </div>
          </div>
        </div>
      )}

      {/* タブ切り替え */}
      <div className="admin-tabs">
        <div className={`admin-tab ${tab === 'menu' ? 'active' : ''}`} onClick={() => setTab('menu')}>メニュー</div>
        <div className={`admin-tab ${tab === 'tables' ? 'active' : ''}`} onClick={() => setTab('tables')}>テーブル</div>
        <div className={`admin-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>履歴</div>
      </div>

      {/* メニュー管理 */}
      {tab === 'menu' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <div className="admin-section-title">メニュー管理</div>
            <div className="add-btn" onClick={() => setShowAddForm(v => !v)}>＋ 追加</div>
          </div>

          {showAddForm && (
            <div className="add-form">
              <input className="admin-input" placeholder="品名" value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})} />
              <select className="admin-select" value={newItem.category}
                onChange={e => setNewItem({...newItem, category: e.target.value})}>
                {categories.filter(c => c !== 'すべて').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__new__">＋ 新カテゴリを入力</option>
              </select>
              {newItem.category === '__new__' && (
                <input className="admin-input" placeholder="新カテゴリ名"
                  onChange={e => setNewItem({...newItem, category: e.target.value})} />
              )}
              <input className="admin-input" type="number" placeholder="価格" value={newItem.price}
                onChange={e => setNewItem({...newItem, price: e.target.value})} />
              <input className="admin-input" placeholder="タグ（任意：人気・本日など）" value={newItem.tag}
                onChange={e => setNewItem({...newItem, tag: e.target.value})} />
              <button className="admin-btn" onClick={handleAddMenu}>追加する</button>
            </div>
          )}

          {menuItems.map(item => (
            <div key={item.id} className="admin-item">
              <div className="admin-item-info">
                <div className="admin-item-title">
                  {item.name}
                  {item.tag ? <span className="menu-tag-small"> {item.tag}</span> : null}
                </div>
                <div className="admin-item-sub">{item.category} · ¥{item.price?.toLocaleString()}</div>
              </div>
              <div className="admin-item-actions">
                <div className="edit-btn" onClick={() => setEditItem({...item})}>編集</div>
                <div className="delete-btn" onClick={() => setConfirm({
                  message: `「${item.name}」を削除しますか？`,
                  action: () => handleDeleteMenu(item.id)
                })}>削除</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* テーブル管理 */}
      {tab === 'tables' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <div className="admin-section-title">営業中テーブル</div>
            <div className="delete-all-btn" onClick={() => setConfirm({ message: '全テーブルのデータを削除しますか？', action: deleteAllTables })}>全削除</div>
          </div>
          {tables.length === 0 ? <div className="admin-empty">データなし</div> : tables.map(tableNum => {
            const order = tableOrders[tableNum];
            const total = (order.items || []).reduce((sum, i) => sum + i.price * i.qty, 0);
            return (
              <div key={tableNum} className="admin-item">
                <div className="admin-item-info">
                  <div className="admin-item-title">テーブル {tableNum}・{order.pax}名</div>
                  <div className="admin-item-sub">¥{total.toLocaleString()} · {(order.items || []).length}品</div>
                </div>
                <div className="delete-btn" onClick={() => setConfirm({ message: `テーブル${tableNum}のデータを削除しますか？`, action: () => deleteTable(tableNum) })}>削除</div>
              </div>
            );
          })}
        </div>
      )}

      {/* 履歴管理 */}
      {tab === 'history' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <div className="admin-section-title">注文履歴</div>
            <div className="delete-all-btn" onClick={() => setConfirm({ message: '全履歴を削除しますか？', action: deleteAllHistory })}>全削除</div>
          </div>
          {history.length === 0 ? <div className="admin-empty">データなし</div> : history.map((h, idx) => (
            <div key={idx} className="admin-item">
              <div className="admin-item-info">
                <div className="admin-item-title">テーブル {h.tableNum}・{h.pax}名</div>
                <div className="admin-item-sub">¥{h.total?.toLocaleString()} · {h.checkoutTime?.slice(0, 16).replace('T', ' ')}</div>
              </div>
              <div className="delete-btn" onClick={() => setConfirm({ message: 'この履歴を削除しますか？', action: () => deleteHistory(h.checkoutTime) })}>削除</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
