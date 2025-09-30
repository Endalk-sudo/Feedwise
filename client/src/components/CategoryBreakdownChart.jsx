import { useState, useEffect } from 'react';
import { BarChart,Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../services/api';
import './CategoryBreakdownChart.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CategoryBreakdownChart = ({startDate,endDate,range}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('http://localhost:5000/api/pro/category-breakdown',{
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

  if (loading) return <div className="category-chart-loading">Loading category breakdown...</div>;
  if (error) return <div className="category-chart-error">Error: {error}</div>;

  return (
    <div className="category-chart-container">
      <h3 className="category-chart-title">Category Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
          <BarChart 
             data={data}
            >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="category" 
              tick={{ fontSize: 10 }}
              />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#007bff" />
          </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryBreakdownChart;