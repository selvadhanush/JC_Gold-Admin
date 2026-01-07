import React, { useEffect, useState } from 'react';
import UserService from '../../services/userService';
import { 
  Users, 
  Search, 
  UserCheck, 
  UserX, 
  ShoppingBag, 
  Gift, 
  MoreVertical,
  Mail,
  Phone
} from 'lucide-react';
import { toast } from 'react-toastify';
import './UserList.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await UserService.getUsers();
      setUsers(data.data);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      await UserService.updateStatus(id, !currentStatus);
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="user-page">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage and monitor {users.length} registered customers.</p>
      </div>

      <div className="filter-bar glass">
        <div className="search-group">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by name, email, or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="user-grid">
        {loading ? (
          <div className="loading-spinner">Auditing users...</div>
        ) : (
          <div className="table-container glass">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact Info</th>
                  <th>Joined Date</th>
                  <th>Account Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="customer-cell">
                        <div className="user-avatar-mini gold-btn">
                          {user.name.charAt(0)}
                        </div>
                        <span className="user-name-bold">{user.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="contact-details">
                        <div className="contact-item"><Mail size={12} /> {user.email}</div>
                        <div className="contact-item"><Phone size={12} /> {user.phone || 'N/A'}</div>
                      </div>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-pill ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? <UserCheck size={14} /> : <UserX size={14} />}
                        {user.isActive ? 'Verified' : 'Blocked'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="action-btns">
                        <button 
                          className={`icon-btn ${user.isActive ? 'danger' : 'success'}`}
                          title={user.isActive ? 'Block User' : 'Unblock User'}
                          onClick={() => toggleUserStatus(user._id, user.isActive)}
                        >
                          {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button className="icon-btn" title="Order History"><ShoppingBag size={16} /></button>
                        <button className="icon-btn" title="Scheme Participation"><Gift size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
