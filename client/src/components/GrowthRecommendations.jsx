import { useState, useEffect } from 'react';
import api from '../services/api.js';
import './GrowthRecommendations.css';

const GrowthRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,setError] =useState(null)
  const [message,setMessage] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/pro/recommendations');
        if (response.data.success) {
          setRecommendations(response.data.data);
        } else{
          setMessage(response.data.message)
        }
      } catch(error) {
       console.log("Error: ",error.message)
       setError(error.message)
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="growth-recommendations-loading">Loading AI recommendations...</div>;
  if (error) return <div className='recommendation-error'>Error fetching growth-recommendation: {error}</div>

  return (
    <div className="growth-recommendations-container">
      <h3 className="growth-recommendations-title">AI Growth Recommendations</h3>
      <div className="recommendations-list">
        {recommendations.length === 0 ?
         <p>{message}</p>
         : (recommendations.map((rec, index) => (
          <div key={index} className="recommendation-item">
            <div className="recommendation-header">
              <h4>{rec.title}</h4>
            </div>
            <p className="recommendation-reason">{rec.reason}</p>
            <p className="recommendation-action">{rec.action}</p>
          </div>
        )))
        }
      </div>
    </div>
  );
};

export default GrowthRecommendations;