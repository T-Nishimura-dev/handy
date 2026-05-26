import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { OrderProvider } from './hooks/useOrders';
import Layout from './components/Layout';
import Login from './pages/Login';
import Order from './pages/Order';
import Ticket from './pages/Ticket';
import Sales from './pages/Sales';

function AppRoutes() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) return <Login />;

  return (
    <OrderProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Order />} />
            <Route path="/ticket" element={<Ticket />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </HashRouter>
    </OrderProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
