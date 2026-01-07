import React from 'react';
import { useAuth } from '../../store/AuthContext';
import { Search, Bell, Menu, User as UserIcon, Settings } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
  const { admin } = useAuth();

  return (
    <header className="navbar glass">
      <div className="navbar-left">
        <button className="mobile-toggle" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search for products, orders, or users..." />
        </div>
      </div>

      <div className="navbar-right">
        <button className="nav-action-btn">
          <Bell size={20} />
          <span className="notification-badge"></span>
        </button>
        <button className="nav-action-btn">
          <Settings size={20} />
        </button>
        
        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">{admin?.name || 'Admin'}</span>
            <span className="user-role">{admin?.role?.name.replace('_', ' ') || 'Management'}</span>
          </div>
          <div className="user-avatar gold-btn">
            <UserIcon size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
