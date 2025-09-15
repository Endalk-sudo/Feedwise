import { Navigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext"; 

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;