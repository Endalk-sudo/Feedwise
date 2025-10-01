import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from "react"
import api from "../services/api.js"
import "./BasicSentimentSnapshot.css"



// Define a set of colors for the pie slices matching the index.css aurora palette
const COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6'];

const BasicSentimentSnapshot = ({startDate,range,endDate}) => {

     const [data,setData] =useState([])
     const [error,setError] = useState(null)
     const [loading,setLoading] = useState(true)

    useEffect(()=>{
        const fetchData = async () => {
       try {
         const response = await api.get('/basic/sentiment',{
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        });

         setData(response.data.data);
         setLoading(false);
       } catch (error) {
         console.error('Error fetching data:', error);
         setError(error.message);
       }
     };
     fetchData();
    },[startDate,range,endDate])

    if(error){
     return (
       <div className="sentiment-snapshot-container">
         <h2 className="sentiment-snapshot-title">Sentiment Snapshot</h2>
         <div className="sentiment-snapshot-error">Error fetching data: {error}</div>
       </div>
     );
    }

    if(loading){
     return (
       <div className="sentiment-snapshot-container">
         <h2 className="sentiment-snapshot-title">Sentiment Snapshot</h2>
         <div className="sentiment-snapshot-loading">Loading...</div>
       </div>
     );
    }

   return (
     <div className="sentiment-snapshot-container">
       <h2 className="sentiment-snapshot-title">Sentiment Snapshot</h2>
       <ResponsiveContainer width="100%" height={400}>
         <PieChart>
           <Pie
             data={data}
             dataKey="count"
             nameKey="sentiment"
             cx="50%"
             cy="50%"
             outerRadius={150}
             fill="#8884d8"
             label
           >
             {
               data.map((entry, index) => (
                 <Cell
                   key={`cell-${index}`}
                   fill={COLORS[index % COLORS.length]}
                 />
               ))
             }
           </Pie>
           <Tooltip />
           <Legend />
         </PieChart>
       </ResponsiveContainer>
     </div>
   );

};

export default BasicSentimentSnapshot