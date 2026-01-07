import React, { useEffect, useState } from 'react';
import CMSService from '../../services/cmsService';
import { 
  FileText, 
  Image as ImageIcon, 
  Plus, 
  Bell, 
  Send, 
  Trash2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-toastify';
import './CMSManager.css';

const CMSManager = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('banners');

  useEffect(() => {
    if (tab === 'banners') fetchBanners();
  }, [tab]);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await CMSService.getBanners();
      setBanners(data.data);
    } catch (err) {
      toast.error('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cms-page">
      <div className="page-header">
        <h1>Content Management System</h1>
        <p>Dynamic control over banners, notifications, and site content.</p>
      </div>

      <div className="cms-tabs">
        <button className={tab === 'banners' ? 'active' : ''} onClick={() => setTab('banners')}>Banners</button>
        <button className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')}>Site Content</button>
        <button className={tab === 'notify' ? 'active' : ''} onClick={() => setTab('notify')}>Global Notifications</button>
      </div>

      <div className="cms-content-area">
        {tab === 'banners' && (
          <div className="banners-section">
            <div className="section-header">
              <h3>Active Promotional Banners</h3>
              <button className="gold-btn add-btn"><Plus size={18} /> Add Banner</button>
            </div>
            
            <div className="banner-grid">
              {loading ? (
                <div className="loading-spinner">Loading layouts...</div>
              ) : (
                banners.map((banner) => (
                  <div key={banner._id} className="banner-card glass">
                    <img src={banner.image} alt={banner.title} className="banner-img" />
                    <div className="banner-info">
                      <h4>{banner.title}</h4>
                      <div className="banner-meta">
                        <span>Order: {banner.order}</span>
                        <span>Type: {banner.type || 'HERO'}</span>
                      </div>
                      <div className="banner-actions">
                        <button className="icon-btn"><Trash2 size={16} /></button>
                        <button className="icon-btn"><ExternalLink size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'notify' && <NotificationTrigger />}
        {tab === 'content' && <ContentEditor />}
      </div>
    </div>
  );
};

const NotificationTrigger = () => {
  const [notifyData, setNotifyData] = useState({ userId: '', title: '', message: '', type: 'INFO' });

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await CMSService.triggerNotification(notifyData);
      toast.success('Notification sent successfully');
      setNotifyData({ userId: '', title: '', message: '', type: 'INFO' });
    } catch (err) {
      toast.error('Failed to trigger notification');
    }
  };

  return (
    <div className="notification-form glass">
      <h3>Broadcast Notification</h3>
      <form onSubmit={handleSend}>
        <div className="form-group">
          <label>Target User ID (Enter 'ALL' for broadcast)</label>
          <input 
            type="text" 
            value={notifyData.userId} 
            onChange={(e) => setNotifyData({...notifyData, userId: e.target.value})}
            placeholder="User unique identifier"
            required
          />
        </div>
        <div className="form-group">
          <label>Notification Title</label>
          <input 
            type="text" 
            value={notifyData.title} 
            onChange={(e) => setNotifyData({...notifyData, title: e.target.value})}
            placeholder="Flash Sale / New Arrival"
            required
          />
        </div>
        <div className="form-group">
          <label>Message Body</label>
          <textarea 
            value={notifyData.message} 
            onChange={(e) => setNotifyData({...notifyData, message: e.target.value})}
            rows="4"
            placeholder="Details of the notification..."
            required
          />
        </div>
        <button type="submit" className="gold-btn send-btn">
          <Send size={18} />
          <span>Send Notification</span>
        </button>
      </form>
    </div>
  );
};

const ContentEditor = () => (
  <div className="content-editor glass">
    <h3>Page Specific Content</h3>
    <p>Select a page type from the list to edit its dynamic content (FAQs, Terms, etc.)</p>
    <div className="type-list">
      {['FAQ', 'TERMS', 'PRIVACY', 'ABOUT'].map(type => (
        <button key={type} className="type-item">
          <FileText size={20} />
          <span>{type} PAGE</span>
          <Edit2 size={14} className="edit-icon" />
        </button>
      ))}
    </div>
  </div>
);

const Edit2 = ({ size, className }) => <FileText size={size} className={className} />;

export default CMSManager;
