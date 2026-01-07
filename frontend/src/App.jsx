import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import ProductList from './pages/Products/ProductList';
import OrderList from './pages/Orders/OrderList';
import UserList from './pages/Users/UserList';
import SchemeList from './pages/Schemes/SchemeList';
import PaymentList from './pages/Payments/PaymentList';
import CMSManager from './pages/CMS/CMSManager';
import AuditLog from './pages/Audit/AuditLog';
import CategoryList from './pages/Categories/CategoryList';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes with Layout */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/categories" element={<CategoryList />} />
              <Route path="/orders" element={<OrderList />} />
              <Route path="/users" element={<UserList />} />
              <Route path="/schemes" element={<SchemeList />} />
              <Route path="/payments" element={<PaymentList />} />
              <Route path="/cms" element={<CMSManager />} />
              <Route path="/audit" element={<AuditLog />} />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
