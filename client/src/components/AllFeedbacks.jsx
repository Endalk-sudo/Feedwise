import "./AllFeedbacks.css"
import FeedbackCard from "./FeedbackCard"
import { useEffect, useState } from "react"

// The AllFeedbacks component is responsible for fetching and displaying a list of all feedback entries.
// It includes a header with metadata and controls, and a grid of feedback cards.
const AllFeedbacks = () => {
  // State to store the array of feedback objects fetched from the API.
  const [feedbacks, setFeedbacks] = useState([]);
  // State to track the loading status of the API request.
  const [isLoading, setIsLoading] = useState(true);
  // State to store any potential error messages from the API request.
  const [error, setError] = useState(null);
  
  // The useEffect hook runs once when the component mounts to fetch the feedback data.
  useEffect(() => {
    // Defines the API endpoint for fetching feedback.
    const feedbackApiUrl = "http://localhost:5000/api/feedback/me/demo-cafe";

    // Fetches data from the API.
    fetch(feedbackApiUrl)
      .then((res) => {
        // If the response is not ok, it throws an error to be caught by the catch block.
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // On success, it updates the feedbacks state with the fetched data.
        setFeedbacks(data);
        setError(null);
      })
      .catch((err) => {
        // On failure, it logs the error and updates the error state.
        console.error("Error fetching feedbacks:", err);
        setError("Failed to load feedback. Please try again later.");
      })
      .finally(() => {
        // This block runs regardless of success or failure, ensuring the loading state is turned off.
        setIsLoading(false);
      });
  }, []); // The empty dependency array ensures this effect runs only once on mount.
 
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

          {/* These buttons are placeholders for future functionality like sorting and filtering. */}
          <div className="feedback-actions">
            <button className="feedback-action-btn" type="button" aria-label="Sort">
              ⏱ Sort
            </button>
            <button className="feedback-action-btn" type="button" aria-label="Filter">
              🔎 Filter
            </button>
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