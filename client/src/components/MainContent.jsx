import qrCode from "../assets/qr code.png"
import { useState } from "react"
import "./MainContent.css"
import FeedbackCard from "./FeedbackCard"
import { formatTimeAgo, sortFeedbackByTime } from "../utils/timeUtils";

// The MainContent component serves as the landing page of the dashboard.
// It provides a summary of feedback activity and tools for sharing the feedback link.
function MainContent() {
    // A hardcoded array of feedback objects. In a real application, this data would be fetched from an API.
  const [feedbacks ,setFeedbacks] = useState([])
  
   // State to manage the "Copied!" confirmation message visibility.
  const [copied, setCopied] = useState(false)
  const [error ,setError] = useState("")

   // Copies the feedback link to the user's clipboard and shows a confirmation message.
  const copyLink = () => {
    navigator.clipboard.writeText('http://localhost:5173/feedback')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

   // Triggers a download of the QR code image.
  const downloadQR = () => {
    const link = document.createElement('a')
    link.href = qrCode
    link.download = 'feedback-qr-code.png'
    link.click()
  }

   // Calculates the total number of feedback entries.
  const totalFeedbacks = feedbacks.length

  useState(()=>{
    fetch("http://localhost:5000/api/feedback/me/demo-cafe")
    .then((res)=> res.json())
    .then((data)=>{
      const sortedFeedbacks = sortFeedbackByTime(data);
      setFeedbacks(sortedFeedbacks)
    })
    .catch((err)=>{
      console.log("error",err.message);
      setError(err.message)
    })
  },[])

  return (
    // The main container uses a grid layout to organize its sections.
    <main className="content">
        {/* The header displays the main title and a summary of total feedback. */}
      <div className="dashboard-header card">
        <h1 className="main-heading">Dashboard</h1>
        {/* <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-value">{totalFeedbacks}</span>
            <span className="stat-label">Total Feedback</span>
          </div>
        </div> */}
      </div>

       {/* This section provides tools for sharing the feedback link via QR code or a direct link. */}
      <div className="qr-container card">
        <div className="qr-content">
          <h2 className="qr-heading">Share your feedback link</h2>
          <p>Scan this QR code or share the link with your customers to collect feedback.</p>
          <div className="btn-container">
            <button className="btn btn-one" onClick={copyLink}>
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
            <button className="btn btn-two" onClick={downloadQR}>
              Download QR
            </button>
          </div>
        </div>

        <div className="qr-code">
          <img src={qrCode} alt="feedback qr code" />
        </div>
      </div>

      {/* A prominent display of the total feedback received. */}
      <div className="feedback-overview card">
        <div className="total-feedback">
          <div className="feedback-icon">📊</div>
          <div className="feedback-content">
            <p>Total Feedback Received</p>
            <h1>{totalFeedbacks}</h1>
          </div>
        </div>
      </div>

       {/* This section displays a preview of the most recent feedback entries. */}
      <div className="latest-feedback card">
        <div className="feedback-section-header">
          <h3>Latest Feedback</h3>
           {/* A button to navigate to the full list of feedback. */}
          <button className="view-all-btn">View All</button>
        </div>
        
         {/* The list renders the first three feedback items using the FeedbackCard component. */}
        <div className="feedback-list">
          {error && (
              <p role="alert" className="feedback-helper" style={{ color: "var(--color-error)" }}>
                {error}
              </p>
            )}
          {feedbacks.slice(0, 3).map((feedback) => (
            <FeedbackCard
              key={feedback._id}
              feedbackText={feedback.text}
              date={formatTimeAgo(feedback.createdAt)}
              category={feedback.category}
            />
          ))}
        </div>
      </div>
    </main>
  )
}

export default MainContent