import "./OrgSetup.css"
import { useContext, useState } from "react";
import axios from "axios";
import AuthContext from "../AuthContext";
import { useNavigate } from "react-router-dom";


// OrganizationModal Component
// This component is shown to new users after registration to set up their organization
// It collects organization name and slug, then sends this data to the backend
const OrgSetup = () => {
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");

  // State for tracking form submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State for displaying server errors
  const [error, setError] = useState('');
  const { token,login } = useContext(AuthContext);

  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Set submitting state and clear previous errors
    setIsSubmitting(true);
    setError('');

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/organization",
        { orgName, orgSlug },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // backend should return updated user (with hasOrganization = true)
      login(res.data.user, token);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create organization. Please try again.');

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
            onChange={(e) => setOrgName(e.target.value)}
            required
          />

          {/* Organization slug input */}
          <label htmlFor="orgSlug">URL Slug</label>
          <input 
            id="orgSlug" 
            type="text" 
            placeholder="acme-corp" 
            onChange={(e) => setOrgSlug(e.target.value)}
            required
          />
          <div className="hint">Letters, numbers, hyphens only. Example: <code>my-store</code></div>
          
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
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
          {error && <div style={erroStyle} className="error">{error}</div>}
          {/* Loading indicator */}
          {isSubmitting && <div style={{color: 'green', padding: '10px', textAlign: 'center'}} className="loading">Creating organization...</div>}
        </form>
      </div>
    </section>
  );
};

export default OrgSetup;