import React, { useEffect, useState } from "react";

// This creates a global "auth context" that any component can access
// Think of it like a shared storage for login/logout state
const AuthContext = React.createContext();

// This component wraps your entire app and provides auth functionality
export function AuthProvider({ children }) {
  // Store the logged-in user's information
  const [user, setUser] = useState(null);
  
  // Store the access token (like a "key card" for accessing protected areas)
  // Initialize from localStorage so users stay logged in after refresh
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("accessToken") || "");

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
  const login = (userData, token) => {
    setUser(userData);        // Save user info (username, email, etc.)
    setAccessToken(token);    // Save the access token
  };

  // This function runs when user clicks "logout"
  const logout = () => {
    setUser(null);            // Clear user info
    setAccessToken("");       // Clear the token
  };

  // Provide auth functions to all child components
  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// This is the actual context object that components will import
export default AuthContext;
