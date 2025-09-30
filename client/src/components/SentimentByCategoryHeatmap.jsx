import { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import api from '../services/api';
import './SentimentByCategoryHeatmap.css';

const SentimentByCategoryHeatmap = ({startDate,endDate,range}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('http://localhost:5000/api/pro/sentiment-by-category',{
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        });

        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [range,endDate,startDate]);

  
  if (loading) return <div className="sentiment-heatmap-loading">Loading sentiment by category...</div>;
  if (error) return <div className="sentiment-heatmap-error">Error: {error}</div>;

  return (
    <div className="sentiment-heatmap-container">
      <h3 className="sentiment-heatmap-title">Sentiment by Category Heatmap</h3>
      <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Positive" stackId="a" fill="#82ca9d" />
            <Bar dataKey="Negative" stackId="a" fill="#ff7c7c" />
            <Bar dataKey="Neutral" stackId="a" fill="#8884d8" />
            <Bar dataKey="Mixed" stackId="a" fill="#ffc658" />
          </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SentimentByCategoryHeatmap;