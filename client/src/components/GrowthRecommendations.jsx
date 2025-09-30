import { useState, useEffect } from 'react';
import api from '../services/api';
import './GrowthRecommendations.css';

const GrowthRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('http://localhost:5000/api/pro/recommendations');
        if (response.data.success) {
          setRecommendations(response.data.data);
        } else {
          // Fallback to static recommendations if endpoint not available
          setRecommendations([
            {
              title: "Improve delivery speed",
              description: "Partner with local courier services to reduce delivery times",
              impact: "High"
            },
            {
              title: "Offer loyalty rewards",
              description: "Implement a customer loyalty program to reduce complaints about pricing",
              impact: "Medium"
            },
            {
              title: "Train staff on customer service",
              description: "Provide additional training to improve friendliness scores",
              impact: "High"
            }
          ]);
        }
      } catch {
        // Fallback to static recommendations
        setRecommendations([
          {
            title: "Improve delivery speed",
            description: "Partner with local courier services to reduce delivery times",
            impact: "High"
          },
          {
            title: "Offer loyalty rewards",
            description: "Implement a customer loyalty program to reduce complaints about pricing",
            impact: "Medium"
          },
          {
            title: "Train staff on customer service",
            description: "Provide additional training to improve friendliness scores",
            impact: "High"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="growth-recommendations-loading">Loading AI recommendations...</div>;

  return (
    <div className="growth-recommendations-container">
      <h3 className="growth-recommendations-title">AI Growth Recommendations</h3>
      <div className="recommendations-list">
        {recommendations.map((rec, index) => (
          <div key={index} className="recommendation-item">
            <div className="recommendation-header">
              <h4>{rec.title}</h4>
              <span className={`impact-badge ${rec.impact.toLowerCase()}`}>
                {rec.impact} Impact
              </span>
            </div>
            <p className="recommendation-description">{rec.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GrowthRecommendations;