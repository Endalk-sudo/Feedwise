import { useState, useEffect } from 'react';
import api from '../services/api.js';
import { formatTimeAgo } from '../utils/timeUtils.js';
import './PriorityAlerts.css';

const PriorityAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/pro/priority-alerts');
        if (response.data.success) {
          setAlerts(response.data.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'High': return '🚨';
      case 'Medium': return '⚠️';
      default: return 'ℹ️';
    }
  };

  if (loading) return <div className="priority-alerts-loading">Loading priority alerts...</div>;
  if (error) return <div className="priority-alerts-error">Error: {error}</div>;

  return (
    <div className="priority-alerts-container">
      <h3 className="priority-alerts-title">Priority Alerts</h3>
      <div className="alerts-list">
        {alerts.length === 0 ? (
          <div className="no-alerts">No priority alerts at this time.</div>
        ) : (
          alerts.map((alert, index) => (
            <div key={index} className={`alert-item ${alert.urgency.toLowerCase()}`}>
              <div className="alert-header">
                <span className="alert-icon">{getUrgencyIcon(alert.urgency)}</span>
                <span className="alert-urgency">{alert.urgency} Priority</span>
                <span className="alert-time">{formatTimeAgo(alert.createdAt)}</span>
              </div>
              <div className="alert-content">
                <p className="alert-text">{alert.text}</p>
                <span className="alert-category">{alert.category}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PriorityAlerts;