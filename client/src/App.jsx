import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from "./pages/AuthPage";
import Feedback from "./components/Feedback";
import HomePage from './pages/HomePage';
import Dashboard from "./pages/Dashboard"
import MainContent from './components/MainContent';
import AllFeedbacks from './components/AllFeedbacks';
import AiPage from './pages/AiPage';
import { Settings } from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import OrgSetup from './pages/OrgSetup';
import { useContext } from 'react';
import AuthContext from './AuthContext';


// Main App Component
// This is the root component that sets up all the routes for the application
// It defines the navigation structure and protects certain routes with authentication
function App() {
  const { user } = useContext(AuthContext);
  return (
   // BrowserRouter enables client-side routing
   <BrowserRouter>
    {/* Routes component defines all possible routes in the application */}
    <Routes>
      {/* Public route - Home page accessible to everyone */}
      <Route path='/' element={ <HomePage />}/>
      
      {/* Public route - Authentication page for login/registration */}
      <Route path='/auth' element={ <AuthPage />}/>
      
      {/* Public route - Feedback collection page */}
      <Route path='/feedback/:slug' element={ <Feedback />}/>

      {/* Protected route - Dashboard and all its sub-routes require authentication */}
      {/* The /* wildcard allows for nested routes like /dashboard/feedbackes */}
      <Route path='/dashboard/'
       element={ 
        // ProtectedRoute component checks if user is authenticated
        // If not, it redirects to /auth
        // If authenticated, it renders the Dashboard component
        <ProtectedRoute>
          {user?.hasOrganization ? <Dashboard /> : <OrgSetup />}
        </ProtectedRoute>
       }>
        {/* Nested routes inside the dashboard */}
        {/* Default dashboard view */}
        <Route path='' element={<MainContent />}/>
        {/* All feedback view */}
        <Route path='feedbackes' element={<AllFeedbacks />}/>
        {/* Categories view */}
        <Route path='categories' element={<MainContent />}/>
        {/* AI chat view */}
        <Route path='chat-ai' element={<AiPage />}/>
        {/* Settings view */}
        <Route path='settings' element={<Settings />}/>
      </Route>
    </Routes>
   </BrowserRouter>
  );
}

export default App;
