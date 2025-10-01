import React, { useEffect, useState } from 'react'
import api from '../services/api.js';
import "./BasicCategoryCount.css"

const BasicCategoryCount = ({startDate,endDate,range}) => {
     const [data, setData] = useState([]);
     const [error, setError] = useState(null)
     const [loading, setLoading] = useState(true)
     useEffect(()=>{

         api.get("/basic/categories",{
          params: {
            startDate : startDate.toISOString(),
            endDate: endDate.toISOString()
          }
         })
         .then((response)=>{
             setData(response.data.data)
             setLoading(false)
         })
         .catch((error)=>{
             setError(error.message)
         })


     },[startDate,endDate,range])

     if(error){
         return (
           <div className="category-count-container">
             <h2 className="category-count-title">Category Count</h2>
             <div className="category-count-error">Error fetching category count: {error}</div>
           </div>
         );
     }

     if(loading){
         return (
           <div className="category-count-container">
             <h2 className="category-count-title">Category Count</h2>
             <div className="category-count-loading">Loading...</div>
           </div>
         );
     }

   return (
     <div className="category-count-container">
       <h2 className="category-count-title">Category Count</h2>
       <table className="category-count-table">
         <thead>
           <tr>
             <th>Category</th>
             <th>Count</th>
           </tr>
         </thead>
         <tbody>
             {data.length === 0 ? (
             <tr>
               <td colSpan="2" className="no-categories">No Feedback found.</td>
             </tr>
           ) : (
             data.map((cat, index) => (
               <tr key={index}>
                 <td className="category-text">{cat.category}</td>
                 <td className="category-count">{cat.count}</td>
               </tr>
             ))
           )}
         </tbody>
       </table>
     </div>
   )
}

export default BasicCategoryCount