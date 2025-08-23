import { useContext } from 'react'
import { Navigate } from 'react-router-dom';
import AuthContext from '../AuthContext'

// ProtectedRoute Component
// This component acts as a "guard" for routes that require authentication
// It checks if the user is logged in and either:
// 1. Allows access to the requested page (if authenticated)
// 2. Redirects to the login page (if not authenticated)
const ProtectedRoute = ({children}) => {
    // Access the user object from AuthContext
    // This will be null if the user is not logged in
    const {user} = useContext(AuthContext)
    
    // If there's no user (not logged in), redirect to the authentication page
    if(!user){
        // Not logged in → redirect to login
      return  <Navigate to="/auth" replace />
    }

    // If there is a user (logged in), allow access to the requested page
    // The children prop contains the actual component/route that was requested
  return children  // Logged in → allow access
}

export default ProtectedRoute