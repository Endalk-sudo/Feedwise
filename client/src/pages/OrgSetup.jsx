import "./OrgSetup.css";
import { useContext, useState, useRef } from "react";
import axios from "axios";
import AuthContext from "../AuthContext";
import { useNavigate } from "react-router-dom";

const OrgSetup = () => {
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const { accessToken, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    // Reset errors on new file selection
    setError('');

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (e.g., PNG, JPG).");
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      setError("File is too large. Please select an image under 5MB.");
      return;
    }

      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    const titleCasedName = name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    setOrgName(titleCasedName);
  };

  const handleSlugChange = (e) => {
    const sanitizedSlug = e.target.value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    setOrgSlug(sanitizedSlug);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData();
    formData.append('orgName', orgName);
    formData.append('orgSlug', orgSlug);
    if (logo) {
      formData.append('logo', logo);
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/organization",
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      login(res.data.user, accessToken);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create organization. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="org-setup-page">
      <div className="org-setup-card">
        <div className="org-setup-header">
          <h1>Welcome! Let's set up your organization.</h1>
          <p>This information will be used to create your team's workspace.</p>
        </div>

        <form onSubmit={handleSubmit} className="org-setup-form">
          <div className="logo-uploader">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
              aria-hidden="true"
            />
            <div
              className="logo-preview"
              onClick={() => fileInputRef.current.click()}
              role="button"
              tabIndex="0"
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current.click()}
            >
              {preview ? (
                <img src={preview} alt="Organization Logo Preview" />
              ) : (
                <div className="logo-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  <span>Upload Logo</span>
                </div>
              )}
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="orgName">Organization Name</label>
            <div className="input-field-wrapper">
              <span className="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </span>
              <input
                id="orgName"
                type="text"
                placeholder="e.g., Acme Inc."
                value={orgName}
                onChange={handleNameChange}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="orgSlug">URL Slug</label>
            <div className="input-field-wrapper">
              <span className="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/></svg>
              </span>
              <input
                id="orgSlug"
                type="text"
                placeholder="e.g., acme-inc"
                value={orgSlug}
                onChange={handleSlugChange}
                required
                className="input-field"
              />
            </div>
            <div className="hint">Your unique URL: <code>yourapp.com/acme-inc</code></div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Create Organization'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrgSetup;
