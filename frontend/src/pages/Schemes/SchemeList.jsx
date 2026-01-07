import React, { useEffect, useState } from 'react';
import SchemeService from '../../services/schemeService';
import { 
  Gift, 
  Plus, 
  Calendar, 
  CreditCard, 
  UserPlus, 
  TrendingUp, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'react-toastify';
import './SchemeList.css';

const SchemeList = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const data = await SchemeService.getSchemes();
      setSchemes(data.data);
    } catch (err) {
      toast.error('Failed to fetch schemes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scheme-page">
      <div className="page-header-flex">
        <div className="page-header">
          <h1>Gold Saving Schemes</h1>
          <p>Create and manage customer investment programs.</p>
        </div>
        <button className="gold-btn add-btn">
          <Plus size={20} />
          <span>New Scheme</span>
        </button>
      </div>

      <div className="scheme-grid">
        {loading ? (
          <div className="loading-spinner">Loading schemes...</div>
        ) : (
          schemes.map((scheme) => (
            <div key={scheme._id} className="scheme-card glass">
              <div className="scheme-card-header">
                <div className="scheme-icon-box gold-btn">
                  <TrendingUp size={24} />
                </div>
                <div className="scheme-title-area">
                  <h3>{scheme.name}</h3>
                  <span className={`status-pill ${scheme.isActive ? 'active' : 'inactive'}`}>
                    {scheme.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="scheme-details">
                <div className="detail-row">
                  <Calendar size={16} />
                  <span>Duration: <strong>{scheme.durationMonths} Months</strong></span>
                </div>
                <div className="detail-row">
                  <CreditCard size={16} />
                  <span>Min. Installment: <strong>₹{scheme.minAmount || '500'}</strong></span>
                </div>
                <div className="detail-row">
                  <Gift size={16} />
                  <span>Bonus: <strong>{scheme.bonusMonths || 1} Month(s)</strong></span>
                </div>
              </div>

              <div className="scheme-description">
                <p>{scheme.description}</p>
              </div>

              <div className="scheme-actions">
                <button className="secondary-btn"><UserPlus size={18} /> Enroll User</button>
                <button className="icon-btn"><CheckCircle size={18} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SchemeList;
