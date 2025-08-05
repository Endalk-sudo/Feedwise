import "./AllFeedbacks.css"
import FeedbackCard from "./FeedbackCard"

const AllFeedbacks = () => {
  return (
    <div className="feedback-container">
        <h1>All Feedback</h1>

        <div className="all-feedbacks">
            <FeedbackCard />
            <FeedbackCard />
            <FeedbackCard />
            <FeedbackCard />
            <FeedbackCard />
            <FeedbackCard />
            <FeedbackCard />
            <FeedbackCard />
            <FeedbackCard />
            <FeedbackCard />
        </div>
    </div>
  )
}

export default AllFeedbacks