import {createContext, useEffect, useState } from "react";

// This creates a global "auth context" that any component can access
// Think of it like a shared storage for login/logout state and user information
const AuthContext = createContext();

// This component wraps your entire app and provides auth functionality
// It manages:
// 1. User authentication state (logged in/out)
// 2. Access token for API requests
// 3. Organization modal visibility for new users
export function AuthProvider({ children }) {
  // Store the logged-in user's information (username, email, etc.)
  const [user, setUser] = useState(null);
  // Store the access token (like a "key card" for accessing protected areas)
  // Initialize from localStorage so users stay logged in after refresh
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("accessToken") || "");
  
  // NEW: State to control the visibility of the organization modal.
  // This is set to true when a new user registers and needs to set up their organization.
  // When true, the Dashboard component will show the OrganizationModal instead of the regular dashboard.
  const [showOrgModal, setShowOrgModal] = useState(false);

  // This effect runs whenever accessToken changes
  // It keeps localStorage in sync with our state
  useEffect(() => {
    if (accessToken) {
      // Save token to browser storage so user stays logged in
      localStorage.setItem("accessToken", accessToken);
    } else {
      // Remove token when user logs out
      localStorage.removeItem("accessToken");
    }
  }, [accessToken]);

  // This function runs after successful login
  // NEW: It now accepts an `isNew` flag to handle new user registration.
  // When isNew is true, it shows the organization modal to new users.
  const login = (userData, token, isNew = false) => {
    setUser(userData);        // Save user info (username, email, etc.)
    setAccessToken(token);    // Save the access token
    // If the user is new, show the organization modal.
    if (isNew) {
      setShowOrgModal(true);
    }
  };

  // NEW: Function to close the organization modal.
  // This is called when the user completes or skips the organization setup.
  // After calling this, the Dashboard component will show the regular dashboard interface.
  const closeOrgModal = () => {
    setShowOrgModal(false);
  };

  // This function runs when user clicks "logout"
  const logout = () => {
    setUser(null);            // Clear user info
    setAccessToken("");       // Clear the token
    setShowOrgModal(false);   // Ensure modal is closed on logout
  };

  // Provide auth functions to all child components
  // NEW: `showOrgModal` and `closeOrgModal` are now provided to the context.
  // This allows the Dashboard component to:
  // 1. Check if it should show the OrganizationModal (showOrgModal)
  // 2. Close the modal when setup is complete (closeOrgModal)
  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, showOrgModal, closeOrgModal }}>
      {children}
    </AuthContext.Provider>
  );
}

// This is the actual context object that components will import
export default AuthContext;
