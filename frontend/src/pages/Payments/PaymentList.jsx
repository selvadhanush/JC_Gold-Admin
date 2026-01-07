import React, { useEffect, useState } from 'react';
import PaymentService from '../../services/paymentService';
import { 
  CreditCard, 
  Search, 
  Calendar, 
  ArrowRightLeft, 
  RotateCcw,
  CheckCircle,
  FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import './PaymentList.css';

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await PaymentService.getPayments();
      setPayments(data.data);
    } catch (err) {
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (id) => {
    const reason = window.prompt('Enter reason for refund:');
    if (!reason) return;

    try {
      await PaymentService.processRefund(id, { reason });
      toast.success('Refund processed successfully');
      fetchPayments();
    } catch (err) {
      toast.error('Failed to process refund');
    }
  };

  return (
    <div className="payment-page">
      <div className="page-header">
        <h1>Payments & Transactions</h1>
        <p>Monitor all financial activities and processing refunds.</p>
      </div>

      <div className="filter-bar glass">
        <div className="search-group">
          <Search size={18} />
          <input type="text" placeholder="Transaction ID, customer name..." />
        </div>
        <div className="filters">
          <div className="date-filter">
            <Calendar size={18} />
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
            <span>to</span>
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="payment-grid">
        {loading ? (
          <div className="loading-spinner">Auditing transactions...</div>
        ) : (
          <div className="table-container glass">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td><span className="txn-id">{payment.transactionId || payment._id.toString().slice(-8).toUpperCase()}</span></td>
                    <td>
                      <div className="customer-info">
                        <span className="cust-name">{payment.user?.name}</span>
                        <span className="cust-date">{new Date(payment.createdAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td><span className="type-badge">{payment.paymentType}</span></td>
                    <td>{payment.paymentMethod}</td>
                    <td><span className="price-val">₹{payment.amount.toLocaleString()}</span></td>
                    <td>
                      <span className={`status-pill ${payment.status.toLowerCase()}`}>
                        {payment.status === 'COMPLETED' ? <CheckCircle size={14} /> : <RotateCcw size={14} />}
                        {payment.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="action-btns">
                        <button className="icon-btn" title="View Details"><FileText size={16} /></button>
                        {payment.status === 'COMPLETED' && (
                          <button 
                            className="icon-btn danger" 
                            title="Refund"
                            onClick={() => handleRefund(payment._id)}
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
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

export default PaymentList;
