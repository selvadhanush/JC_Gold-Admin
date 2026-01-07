import React, { useEffect, useState } from 'react';
import AuditService from '../../services/auditService';
import { 
  ShieldAlert, 
  Search, 
  Terminal, 
  Activity, 
  Hash, 
  User as UserIcon 
} from 'lucide-react';
import { toast } from 'react-toastify';
import './AuditLog.css';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await AuditService.getLogs();
      setLogs(data.data);
    } catch (err) {
      toast.error('Failed to fetch audit logs. Access denied?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="audit-page">
      <div className="page-header">
        <h1>Administrative Audit Logs</h1>
        <p>Immutable record of all sensitive actions performed by admins.</p>
      </div>

      <div className="audit-container">
        {loading ? (
          <div className="loading-spinner">Decrypting logs...</div>
        ) : (
          <div className="log-list glass">
            {logs.map((log) => (
              <div key={log._id} className="log-entry">
                <div className="log-icon-type">
                  <Activity size={18} className="activity-icon" />
                </div>
                <div className="log-main-info">
                  <div className="log-header-row">
                    <span className="log-action">{log.action.replace(/_/g, ' ')}</span>
                    <span className="log-date">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="log-details">
                    <UserIcon size={14} /> <strong>{log.admin?.name}</strong> performed action in module <strong>{log.module}</strong>
                  </p>
                  <div className="log-footer-row">
                    <span className="log-ip"><Terminal size={12} /> {log.ipAddress}</span>
                    <span className="log-id"><Hash size={12} /> {log._id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
