import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Layout.css';

const tabs = [
  { path: '/',       icon: '📋', label: '注文入力' },
  { path: '/ticket', icon: '🧾', label: '伝票' },
  { path: '/sales',  icon: '📊', label: '売上' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="layout">
      <div className="layout-header">
        <div>
          <div className="layout-title">炉端 さくら</div>
          <div className="layout-sub">ORDER MANAGEMENT</div>
        </div>
        <div className="layout-time">
          {new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

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
