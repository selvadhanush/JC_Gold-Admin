import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Gift, 
  CreditCard, 
  FileText, 
  Bell, 
  ShieldAlert, 
  LogOut, 
  ChevronLeft,
  Settings,
  Grid,
  Tags
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['ANY'] },
    { name: 'Products', path: '/products', icon: <Package size={20} />, roles: ['SUPER_ADMIN', 'PRODUCT_ADMIN'] },
    { name: 'Categories', path: '/categories', icon: <Grid size={20} />, roles: ['SUPER_ADMIN', 'PRODUCT_ADMIN'] },
    { name: 'Orders', path: '/orders', icon: <ShoppingCart size={20} />, roles: ['SUPER_ADMIN', 'ORDER_ADMIN'] },
    { name: 'Users', path: '/users', icon: <Users size={20} />, roles: ['SUPER_ADMIN'] },
    { name: 'Schemes', path: '/schemes', icon: <Gift size={20} />, roles: ['SUPER_ADMIN', 'FINANCE_ADMIN'] },
    { name: 'Payments', path: '/payments', icon: <CreditCard size={20} />, roles: ['SUPER_ADMIN', 'FINANCE_ADMIN'] },
    { name: 'CMS', path: '/cms', icon: <FileText size={20} />, roles: ['SUPER_ADMIN'] },
    { name: 'Audit Logs', path: '/audit', icon: <ShieldAlert size={20} />, roles: ['SUPER_ADMIN'] },
  ];

  const filteredItems = navItems.filter(item => 
    item.roles.includes('ANY') || (admin && item.roles.includes(admin.role.name)) || (admin && admin.role.name === 'SUPER_ADMIN')
  );

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'} glass`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-box gold-btn">TM</div>
          <span className="logo-text gold-gradient">THANGAMAYIL</span>
        </div>
        <button className="toggle-btn" onClick={toggleSidebar}>
          <ChevronLeft size={20} className={isOpen ? '' : 'rotate'} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {filteredItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label || item.name}</span>
            {item.name === 'Orders' && <span className="badge">12</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
