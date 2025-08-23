import "./OranizationModal.css"
import { useContext, useState } from "react";
import AuthContext from "../AuthContext";

// OrganizationModal Component
// This component is shown to new users after registration to set up their organization
// It collects organization name and slug, then sends this data to the backend
const OranizationModal = ({ onClose }) => {
  // State for tracking form submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State for displaying server errors
  const [serverError, setServerError] = useState('');
  // State for managing form input values
  const [formData, setFormData] = useState({
    orgName: '',
    orgSlug: ''
  });
  
  // Access user data and closeOrgModal function from AuthContext
  const { user, closeOrgModal } = useContext(AuthContext);

  // Handle form input changes
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    // Prevent default form submission behavior
    e.preventDefault();
    
    // Set submitting state and clear previous errors
    setIsSubmitting(true);
    setServerError('');
    
    try {
      // Send organization data to backend API
      // Note: You'll need to update this URL to match your actual API endpoint
      const response = await fetch('http://localhost:5000/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: formData.orgName, 
          slug: formData.orgSlug, 
          userId: user?.id 
        }),
      });

      const data = await response.json();
      
      // If successful, close the modal and navigate to dashboard
      if (response.ok) {
        // Close the modal after successful submission
        closeOrgModal();
        // Call the onClose prop if provided (this will navigate to dashboard)
        if (onClose) onClose();
      } else {
        // Display error message from server
        setServerError(data.message || 'Failed to create organization. Please try again.');
      }
    } catch (error) {
      // Handle network errors
      console.log("Error creating organization:", error);
      setServerError('Failed to create organization. Please try again.');
    } finally {
      // Reset submitting state
      setIsSubmitting(false);
    }
  };

  // Style for error messages
  const erroStyle = { 
    color: 'red' ,
    padding: '10px', 
    textAlign: 'center',
    border: '1px solid red',
    borderRadius: '5px',
    marginTop: '10px'
  };

  return (
    // Full-screen modal container
    <section className="orgModal-container">
      <div className="orgModal">
        <h2>Finish Setup</h2>
        <p>
          Choose your organization name and a short URL slug.
        </p> 
        {/* Organization setup form */}
        <form onSubmit={handleSubmit}>
          {/* Organization name input */}
          <label htmlFor="orgName">Organization Name</label>
          <input 
            id="orgName" 
            type="text" 
            placeholder="Acme Inc." 
            value={formData.orgName}
            onChange={handleChange}
            required
          />

          {/* Organization slug input */}
          <label htmlFor="orgSlug">URL Slug</label>
          <input 
            id="orgSlug" 
            type="text" 
            placeholder="acme-corp" 
            value={formData.orgSlug}
            onChange={handleChange}
            required
          />
          <div className="hint">Letters, numbers, hyphens only. Example: <code>my-store</code></div>
          
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            {/* Skip button - closes modal without saving */}
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={closeOrgModal}
              disabled={isSubmitting}
            >
              Skip for now
            </button>
            {/* Submit button - saves organization and closes modal */}
            <button 
              type="submit" 
              id="saveOrgBtn" 
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
          
          {/* Error message display */}
          {serverError && <div style={erroStyle} className="error">{serverError}</div>}
          {/* Loading indicator */}
          {isSubmitting && <div style={{color: 'green', padding: '10px', textAlign: 'center'}} className="loading">Creating organization...</div>}
        </form>
      </div>
    </section>
  );
};

export default OranizationModal;