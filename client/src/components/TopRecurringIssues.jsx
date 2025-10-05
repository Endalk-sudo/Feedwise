import { useState, useEffect } from 'react';
import api from '../services/api.js';
import './TopRecurringIssues.css';

const TopRecurringIssues = ({startDate,endDate,range}) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/pro/recurring-issues',{
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        });

        if (response.data.success) {
          setIssues(response.data.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [range,endDate,startDate]);

  if (loading) return <div className="issues-loading">Loading recurring issues...</div>;
  if (error) return <div className="issues-error">Error: {error}</div>;

  return (
    <div className="issues-table-container">
      <h3 className="issues-table-title">Top Recurring Issues</h3>
      <table className="issues-table">
        <thead>
          <tr>
            <th>Issue</th>
            <th>Frequency</th>
          </tr>
        </thead>
        <tbody>
          {issues.length === 0 ? (
            <tr>
              <td colSpan="2" className="no-issues">No recurring issues found.</td>
            </tr>
          ) : (
            issues.map((issue, index) => (
              <tr key={index}>
                <td className="issue-text">"{issue.issue}"</td>
                <td className="issue-count">{issue.mentions}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TopRecurringIssues;