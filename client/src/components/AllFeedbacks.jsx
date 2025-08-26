import axios from "axios"
import "./AllFeedbacks.css"
import FeedbackCard from "./FeedbackCard"
import { useEffect, useState, useContext } from "react"
import AuthContext from "../AuthContext"

// The AllFeedbacks component is responsible for fetching and displaying a list of all feedback entries.
// It includes a header with metadata and controls, and a grid of feedback cards.
const AllFeedbacks = () => {
  // State to store the array of feedback objects fetched from the API.
  const [feedbacks, setFeedbacks] = useState([]);
  // State to track the loading status of the API request.
  const [isLoading, setIsLoading] = useState(true);
  // State to store any potential error messages from the API request.
  const [error, setError] = useState(null);

  const {accessToken} = useContext(AuthContext);
  
  // The useEffect hook runs once when the component mounts to fetch the feedback data.
  useEffect(() => {

    const fetchAllFeedback = async ()=>{

      try {
        const res = await axios.get("http://localhost:5000/api/feedback/me",{
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        // On success, it updates the feedbacks state with the fetched data.
        setFeedbacks(res.data);
        setError(null);
      } catch (error) {
         // On failure, it logs the error and updates the error state.
        console.error("Error fetching feedbacks:", error);
        setError("Failed to load feedback. Please try again later.");
      }finally{
        setIsLoading(false);
      }
    }

    fetchAllFeedback()

  }, [accessToken]); 
 
  // Renders a loading message while the data is being fetched.
  if (isLoading) {
    return <div className="feedback-container">Loading feedback...</div>;
  }

  // Renders an error message if the API call failed.
  if (error) {
    return <div className="feedback-container error-message">{error}</div>;
  }

  return (
    <div className="feedback-container">
        {/* The header provides context, displaying the total feedback count and action buttons. */}
        <div className="feedback-header">
          <div className="feedback-header-title">
            <div className="feedback-header-icon" aria-hidden="true">💬</div>
            <h1>All Feedback</h1>
            {/* The feedback count is dynamically updated based on the number of items fetched. */}
            <span className="feedback-count">{feedbacks.length}</span>
          </div>
        </div>

        {/* The main content area where feedback cards are rendered in a responsive grid. */}
        <div className="all-feedbacks">
          {feedbacks.map((fb) => (
            <FeedbackCard
              key={fb._id}
              feedbackText={fb.text}
              date={fb.createdAt}
              category={fb.category}
            />
          ))}
        </div>
    </div>
  )
}

export default AllFeedbacks