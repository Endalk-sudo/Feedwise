import './Settings.css'
import { useState, useEffect, useRef } from 'react'
import api from '../services/api.js'

export const Settings = () => {
  const [businessName, setBusinessName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)
  

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    // Reset errors on new file selection
    setErrors({});

    if(!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors({file: "Please select a valid image file (e.g., PNG, JPG)."});
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if(file.size > MAX_SIZE){
      setErrors({file: "File is too large. Please select an image under 5MB."})
      return
    }

    setLogoFile(file)
    
    const reader = new FileReader()

    reader.onloadend = () => {
      setPreview(reader.result)
    }

    reader.readAsDataURL(file)
  } 

  const fetchSettings = async () => {
    try {
      const response = await api.get("/setting")
      
      if (response.data.success && response.data.data) {
        const { name } = response.data.data
        setBusinessName(name || '')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      if (error.response?.status === 404) {
        // Organization doesn't exist yet, which is fine for new users
        setBusinessName('')
      } else {
        setErrors(prev => ({ ...prev, fetch: 'Failed to load settings. Please refresh the page.' }))
      }
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleBusinessNameChange = (e) => {
    const value = e.target.value
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    setBusinessName(value)
    
    if (value.trim() === '') {
      setErrors(prev => ({ ...prev, businessName: 'Business name is required' }))
    } else if (value.length < 2) {
      setErrors(prev => ({ ...prev, businessName: 'Business name must be at least 2 characters' }))
    } else if (value.length > 100) {
      setErrors(prev => ({ ...prev, businessName: 'Business name must be less than 100 characters' }))
    } else {
      setErrors(prev => ({ ...prev, businessName: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const newErrors = {}
    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    setSuccessMessage('')

    const formData = new FormData();
    formData.append("name", businessName)

    // Append the logo file to the form data if it exists
    if(logoFile){
      formData.append("logo", logoFile)
    }
    
    try {
      const res = await api.put("/setting", 
        formData, 
      )

      if (res.data.success) {
        setSuccessMessage('Settings saved successfully!')
        setErrors({})
        
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setErrors(prev => ({
          ...prev,
          submit: res.data.error || 'Failed to save settings. Please try again.'
        }))
      }

    } catch (error) {
      if (error.response?.data?.error) {
        setErrors(prev => ({ ...prev, submit: error.response.data.error }))
      } else {
        setErrors(prev => ({ ...prev, submit: 'Failed to save settings. Please try again.' }))
      }
      console.error('Settings save error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setBusinessName('')
    setLogoFile(null)
    setPreview(null)
    setErrors({})
    setSuccessMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <section className='setting'>
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your business profile and preferences</p>
      </div>

      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="settings-section">
          <div className="section-header">
            <h2>Business Details</h2>
            <p className="section-description">Update your company information and branding</p>
          </div>

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
            {errors.businessName && (
              <span className="error-message">{errors.businessName}</span>
            )}
            <span className="char-count">{businessName.length}/100</span>
          </div>

          <div className="form-group">
            <label>Business Logo</label>

            {preview && 
            <div className="logo-preview update-logo-preview">
              <img src={preview} alt={`Business logo`} />
            </div>
            }

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
              aria-hidden="true"
            />

            <div className="logo-upload-container" onClick={() => fileInputRef.current.click()}>
              <div className="logo-upload-placeholder">
                <div className="upload-icon">📷</div>
                <p>Upload your Business Logo </p>
                <p className="upload-subtext">Please select an image under 5MB.</p>
              </div>
            </div>
            
            {errors.file && (
              <span className="error-message">{errors.file}</span>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>

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