import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (login(password)) {
      setError('');
    } else {
      setError('パスワードが違います');
      setPassword('');
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-title">炉端 さくら</div>
        <div className="login-sub">ORDER MANAGEMENT</div>
        <div className="login-form">
          <input
            type="password"
            className="login-input"
            placeholder="パスワードを入力"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          {error && <div className="login-error">{error}</div>}
          <button className="login-btn" onClick={handleSubmit}>
            ログイン
          </button>
        </div>
      </div>
    </div>
  );
}
