import './Settings.css'
import { useState, useRef } from 'react'

/**
 * Settings Component - Main settings page for user preferences and business configuration
 *
 * This component provides a comprehensive settings interface with the following features:
 * - Business details form with name and logo upload
 * - Real-time logo preview functionality
 * - Comprehensive form validation with error handling
 * - Loading states for async operations
 * - Responsive design for all screen sizes
 * - Additional settings sections for future expansion
 *
 * Architecture:
 * - Uses React hooks for state management (useState, useRef)
 * - Implements real-time validation for form inputs
 * - Handles file uploads with preview generation
 * - Provides user feedback through loading states and messages
 * - Follows modern React best practices with proper component structure
 */
export const Settings = () => {
  // === STATE MANAGEMENT ===
  // These state variables manage the form data and UI interactions
  
  const [businessName, setBusinessName] = useState('') // Stores the business name input value
  const [logoFile, setLogoFile] = useState(null) // Stores the selected logo file object
  const [logoPreview, setLogoPreview] = useState('') // Stores the data URL for logo preview
  const [isLoading, setIsLoading] = useState(false) // Controls loading state during API calls
  const [errors, setErrors] = useState({}) // Stores validation errors for each field
  const [successMessage, setSuccessMessage] = useState('') // Stores success notification message
  
  // Reference for file input to trigger click programmatically
  const fileInputRef = useRef(null)

  // === EVENT HANDLERS ===
  // These functions handle user interactions and form events

  /**
   * Handle business name input changes with real-time validation
   *
   * This function is called whenever the user types in the business name field.
   * It performs validation and updates the state accordingly.
   *
   * @param {Event} e - Input change event object
   *
   * Validation Rules:
   * - Business name is required (cannot be empty or whitespace only)
   * - Minimum 2 characters (reasonable business name length)
   * - Maximum 100 characters (database constraint consideration)
   */
  const handleBusinessNameChange = (e) => {
    const value = e.target.value
    setBusinessName(value)
    
    // Validate business name in real-time and update error state
    if (value.trim() === '') {
      setErrors(prev => ({ ...prev, businessName: 'Business name is required' }))
    } else if (value.length < 2) {
      setErrors(prev => ({ ...prev, businessName: 'Business name must be at least 2 characters' }))
    } else if (value.length > 100) {
      setErrors(prev => ({ ...prev, businessName: 'Business name must be less than 100 characters' }))
    } else {
      // Clear error if validation passes
      setErrors(prev => ({ ...prev, businessName: '' }))
    }
  }

  /**
   * Handle logo file selection and preview generation
   *
   * This function processes file uploads, validates the selected file,
   * and generates a preview image for user feedback.
   *
   * @param {Event} e - File input change event object
   *
   * File Validation:
   * - Must be an image file (starts with 'image/')
   * - Maximum file size: 5MB (reasonable for logos)
   * - Generates data URL for immediate preview
   */
  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type - must be an image
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, logo: 'Please select a valid image file' }))
        return
      }
      
      // Validate file size - 5MB limit (5 * 1024 * 1024 bytes)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logo: 'Logo size must be less than 5MB' }))
        return
      }

      // Clear any previous logo errors and store the file
      setLogoFile(file)
      setErrors(prev => ({ ...prev, logo: '' }))
      
      // Generate preview URL using FileReader API
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target.result) // Set data URL for preview
      }
      reader.readAsDataURL(file) // Read file as data URL
    }
  }

  /**
   * Trigger file input click for logo upload
   *
   * This function programmatically clicks the hidden file input element
   * to open the file selection dialog. This provides a better user experience
   * than having a visible file input button.
   */
  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  /**
   * Handle form submission with validation and API call
   *
   * This function orchestrates the form submission process:
   * 1. Validates all form fields
   * 2. Shows loading state
   * 3. Makes API call (currently simulated)
   * 4. Handles success/error responses
   * 5. Updates UI accordingly
   *
   * @param {Event} e - Form submit event object (prevented from default behavior)
   */
  const handleSubmit = async (e) => {
    e.preventDefault() // Prevent default form submission
    
    // Validate all fields before submission
    const newErrors = {}
    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required'
    }
    
    // If there are validation errors, update state and return early
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Set loading state and clear previous messages
    setIsLoading(true)
    setSuccessMessage('')
    
    try {
      // TODO: Implement actual API call to save settings
      // This is where you would make a fetch request to your backend API
      console.log('Saving settings:', {
        businessName,
        logo: logoFile
      })
      
      // Simulate API call with setTimeout (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Show success message and clear errors
      setSuccessMessage('Settings saved successfully!')
      setErrors({})
      
      // Clear success message after 3 seconds for better UX
      setTimeout(() => setSuccessMessage(''), 3000)
      
    } catch (error) {
      // Handle API errors
      setErrors(prev => ({ ...prev, submit: 'Failed to save settings. Please try again.' }))
      console.error('Settings save error:', error)
    } finally {
      // Always turn off loading state, regardless of success or failure
      setIsLoading(false)
    }
  }

  /**
   * Reset form to initial state
   *
   * This function clears all form data, resets state variables,
   * and removes any error messages or success notifications.
   * This provides users with a way to start fresh.
   */
  const handleReset = () => {
    setBusinessName('') // Clear business name
    setLogoFile(null) // Clear selected file
    setLogoPreview('') // Clear preview image
    setErrors({}) // Clear all errors
    setSuccessMessage('') // Clear success message
  }

  // === JSX RENDERING ===
  // The component returns JSX that defines the UI structure

  return (
    <section className='setting'>
      {/* Settings Header Section */}
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your business profile and preferences</p>
      </div>

      {/* Main Settings Form */}
      <form className="settings-form" onSubmit={handleSubmit}>
        {/* Business Details Section */}
        <div className="settings-section">
          <div className="section-header">
            <h2>Business Details</h2>
            <p className="section-description">Update your company information and branding</p>
          </div>

          {/* Business Name Input Field */}
          <div className="form-group">
            <label htmlFor='bizName'>Business Name *</label>
            <input
              id="bizName"
              type="text"
              placeholder="Acme Inc."
              name="business-name"
              value={businessName}
              onChange={handleBusinessNameChange}
              className={errors.businessName ? 'error' : ''}
            />
            {/* Display error message if validation fails */}
            {errors.businessName && (
              <span className="error-message">{errors.businessName}</span>
            )}
            {/* Character counter showing current length and maximum allowed */}
            <span className="char-count">{businessName.length}/100</span>
          </div>

          {/* Logo Upload Section */}
          <div className="form-group">
            <label>Business Logo</label>
            <p className="field-description">Upload your company logo (max 5MB, PNG/JPG)</p>
            
            <div className="logo-upload-container">
              {/* Show logo preview if image is selected */}
              {logoPreview ? (
                <div className="logo-preview-container">
                  <img
                    src={logoPreview}
                    alt="Business logo preview"
                    className="logo-preview"
                  />
                  {/* Remove button to clear the selected logo */}
                  <button
                    type="button"
                    className="remove-logo-btn"
                    onClick={() => {
                      setLogoPreview('') // Clear preview
                      setLogoFile(null) // Clear file
                      setErrors(prev => ({ ...prev, logo: '' })) // Clear logo errors
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  {/* Upload placeholder area */}
                  <div className="logo-upload-placeholder" onClick={triggerFileInput}>
                    <div className="upload-icon">📷</div>
                    <p>Click to upload logo</p>
                    <p className="upload-subtext">or drag and drop</p>
                  </div>
                </>
              )}
              
              {/* Hidden file input that's triggered by the placeholder click */}
              <input
                ref={fileInputRef}
                id="logoFile"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              
              {/* Display file validation error if any */}
              {errors.logo && (
                <span className="error-message">{errors.logo}</span>
              )}
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="form-actions">
            {/* Reset button to clear all form data */}
            <button
              type="button"
              className="btn-secondary"
              onClick={handleReset}
              disabled={isLoading} // Disable during loading
            >
              Reset
            </button>
            {/* Submit button with loading state */}
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading} // Disable during loading
            >
              {isLoading ? (
                // Show loading spinner and text when saving
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                // Normal button text when not loading
                'Save Changes'
              )}
            </button>
          </div>

          {/* Success/Error Message Display */}
          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}
          
          {errors.submit && (
            <div className="error-message">
              {errors.submit}
            </div>
          )}
        </div>

        {/* Additional Settings Sections - Future Features */}
        <div className="settings-section">
          <div className="section-header">
            <h2>Account Settings</h2>
            <p className="section-description">Manage your account preferences</p>
          </div>
          
          <div className="coming-soon">
            <p>🚀 Account settings coming soon!</p>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <h2>Notification Preferences</h2>
            <p className="section-description">Configure how you receive notifications</p>
          </div>
          
          <div className="coming-soon">
            <p>🔔 Notification preferences coming soon!</p>
          </div>
        </div>
      </form>
    </section>
  )
}
