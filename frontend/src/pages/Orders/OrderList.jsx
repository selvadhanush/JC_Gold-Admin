import React, { useEffect, useState } from 'react';
import OrderService from '../../services/orderService';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import './OrderList.css';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await OrderService.getOrders({ 
        orderStatus: statusFilter || undefined 
      });
      setOrders(data.data);
    } catch (err) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await OrderService.updateStatus(id, newStatus);
      toast.success(`Order set to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'DELIVERED': return <CheckCircle size={14} />;
      case 'CANCELLED': return <XCircle size={14} />;
      case 'SHIPPED': return <Truck size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="order-page">
      <div className="page-header">
        <h1>Order Management</h1>
        <p>Monitor and process customer purchases.</p>
      </div>

      <div className="filter-bar glass">
        <div className="search-group">
          <Search size={18} />
          <input type="text" placeholder="Search by Order ID or customer..." />
        </div>
        <div className="filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="order-grid">
        {loading ? (
          <div className="loading-spinner">Retrieving orders...</div>
        ) : (
          <div className="table-container glass">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td><span className="order-id">#{order._id.toString().slice(-6).toUpperCase()}</span></td>
                    <td>
                      <div className="customer-info">
                        <span className="cust-name">{order.user?.name}</span>
                        <span className="cust-email">{order.user?.email}</span>
                      </div>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td><span className="price-val">₹{order.totalAmount.toLocaleString()}</span></td>
                    <td>
                      <span className={`payment-status ${order.paymentStatus.toLowerCase()}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <div className={`status-pill ${order.orderStatus.toLowerCase()}`}>
                        {getStatusIcon(order.orderStatus)}
                        <span>{order.orderStatus}</span>
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="action-btns">
                        <select 
                          className="status-selector"
                          value={order.orderStatus}
                          onChange={(e) => updateStatus(order._id, e.target.value)}
                          disabled={['DELIVERED', 'CANCELLED'].includes(order.orderStatus)}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                        </select>
                        <button className="icon-btn" title="View Details"><ExternalLink size={16} /></button>
                        <button className="icon-btn" title="Invoice"><FileText size={16} /></button>
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

export default OrderList;
