import { useContext } from 'react'
import { Navigate } from 'react-router-dom';
import AuthContext from '../AuthContext'

// ProtectedRoute Component
// This component wraps around routes that require authentication
// If the user is not authenticated (no accessToken), they are redirected to the /auth route
const ProtectedRoute = ({children}) => {
    // This will be null if the user is not logged in
    const {accessToken} = useContext(AuthContext)
  
  // If accessToken exists, user is authenticated and can access the requested route
  return accessToken ?  children : <Navigate to="/auth" replace />
}

export default ProtectedRoute