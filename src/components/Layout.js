import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders';
import './Layout.css';

const tabs = [
  { path: '/',       icon: '📋', label: '注文入力' },
  { path: '/ticket', icon: '🧾', label: '伝票' },
  { path: '/sales',  icon: '📊', label: '売上' },
  { path: '/admin',  icon: '⚙️', label: '管理' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, fetchAll } = useOrders();

  return (
    <div className="layout">
      <div className="layout-header">
        <div>
          <div className="layout-title">居酒屋 なりちゃん</div>
          <div className="layout-sub">ORDER MANAGEMENT</div>
        </div>
        <div className="layout-right">
          <div className="layout-time">
            {new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div
            className={`sync-btn ${loading ? 'syncing' : ''}`}
            onClick={fetchAll}
            title="データを更新"
          >
            {loading ? '⟳' : '↺'}
          </div>
        </div>
      </div>

      {loading && <div className="loading-bar" />}

      <div className="layout-content">
        {children}
      </div>

      <div className="tab-nav">
        {tabs.map(tab => (
          <div
            key={tab.path}
            className={`tab ${location.pathname === tab.path ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </div>
        ))}
      </div>
    </div>
  );
}
