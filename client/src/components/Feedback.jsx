import { useState } from "react";
import submitFeedback from "../services/api.js"

// This is the main feedback form component where users can submit their feedback
const Feedback = () => {
  // Track whether feedback has been submitted to show thank you message
  const [isSubmited, setIsSubmited] = useState(false)

  // This function runs when user clicks "Submit Feedback" button
  const handleSubmit = async (formData) => {
    console.log("hello endalk");
    
    // Get the feedback text from the form
    const feedbackText = formData.get("feedback");
    
    // Send the feedback to the server using our API service
    const message = await submitFeedback(feedbackText);

    console.log(message);
    
    // Show thank you message after successful submission
    setIsSubmited(true);
  }

  // Styling for the thank you message
  const style = {
    color: "#ffff",
    padding: "2rem",
    backgroundColor: "rgba(33, 40, 52, 1)",
    borderRadius: "1rem",
    boxShadow: "0px 0px 16px #ffff"
  }

  return (
    <section className="feedback-page-container">
      
      {/* Show either thank you message OR feedback form */}
      {isSubmited ? 
        // Thank you message shown after submission
        <p style={style}>Thank you for your feedback</p>
        : 
        // Feedback form shown initially
        <div className="feedback-Surface">
            <div className="feedback-content-container">
                <h1>Share Your Experience</h1>
                <p>Your anonymous feedback helps us improve.</p>
            </div>
            
            {/* This form sends data to handleSubmit function */}
            <form action={handleSubmit} className="feedback-input-container">
                <label htmlFor="feedback-input">Any comments?</label>
                
                {/* Text area where users type their feedback */}
                <textarea 
                  name="feedback" 
                  id="feedback-input" 
                  placeholder="Tell us about the food, the service, the atmosphere..."
                />
                
                <p>Please enter at least 10 characters.</p>
                <button className="feedback-btn">Submit Feedback</button>
            </form>
        </div>
      }
        
    </section>
  )
}

export default Feedback;