import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import './SentimentOverviewChart.css';

const SentimentOverviewChart = ({startDate,endDate,range}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    
    const fetchData = async () => {
      try {
        const response = await api.get('/pro/sentiment-trends', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        });

        if (response.data.success) {
          const formattedData = response.data.data.map(({ date, sentiment }) => {
            const sentimentMap = {
              Positive: 100,
              Neutral: 75,
              Mixed: 50,
              Negative: 25
            };
            return {
              date: new Date(date).toLocaleDateString(),
              sentiment: sentimentMap[sentiment] || 0,
              sentimentLabel: sentiment
            };
          });

          setData(formattedData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [range,endDate,startDate]);

  if (loading) return <div className="sentiment-chart-loading">Loading sentiment trends...</div>;
  if (error) return <div className="sentiment-chart-error">Error: {error}</div>;

  return (
    <div className="sentiment-chart-container">
      <h3 className="sentiment-chart-title">Sentiment Overview (Trends)</h3>
      <ResponsiveContainer width="100%" height={300} >
        <LineChart 
        margin={{ top: 20, right: 30, bottom: 20 }}
        data={data}
          >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }}/>
          <YAxis
            width={80}
            domain={[0, 100]}
            tickFormatter={(value) => {
              switch (value) {
                case 100: return 'Positive';
                case 75: return 'Neutral';
                case 50: return 'Mixed';
                case 25: return 'Negative';
                default: return "";
              }
            }}
            tick={{ fontSize: 10 }}
          />
          <Tooltip
            formatter={(value, name, props) => [`${props.payload.sentimentLabel}`, 'Sentiment']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="sentiment"
            stroke="#10b981"
            strokeWidth={2}
            // dot={{ fill: '#10b981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SentimentOverviewChart;
