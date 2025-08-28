import './Settings.css'
import { useState, useContext, useEffect } from 'react'
import axios from "axios"
import AuthContext from '../AuthContext'

export const Settings = () => {
  const [businessName, setBusinessName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  
  const {accessToken} = useContext(AuthContext)

  const fetchSettings = async () => {
    try {
      const response = await axios.get("/setting", {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
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
    } finally {
      // Initial load complete
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleBusinessNameChange = (e) => {
    const value = e.target.value
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
    
    try {
      const res = await axios.put("/setting", 
        { name: businessName },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
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
    setErrors({})
    setSuccessMessage('')
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

          {/* Logo Upload Section Commented Out */}
          <div className="form-group">
            <label>Business Logo</label>
            <p className="field-description">Logo upload functionality coming soon</p>
            
            <div className="logo-upload-container">
              <div className="logo-upload-placeholder">
                <div className="upload-icon">📷</div>
                <p>Logo upload disabled</p>
                <p className="upload-subtext">Check back later for this feature</p>
              </div>
            </div>
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