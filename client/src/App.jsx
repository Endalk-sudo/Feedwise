import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from "./auth/LoginPage";
import { RegisterPage } from "./auth/RegisterPage";
import Feedback from "./components/Feedback";
import HomePage from './pages/HomePage';
import Dashboard from "./pages/Dashboard";
import MainContent from './components/MainContent';
import AllFeedbacks from './components/AllFeedbacks';
import AiPage from './pages/AiPage';
import { Settings } from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import OrgSetup from './pages/OrgSetup';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<HomePage />}/>
          <Route path='/login' element={<LoginPage />}/>
          <Route path='/register' element={<RegisterPage />}/>
          <Route path='/feedback/:slug' element={<Feedback />}/>
          <Route path='/dashboard/*' element={
            <ProtectedRoute>
              <DashboardWrapper />
            </ProtectedRoute>
          }>
            <Route path='' element={<MainContent />}/>
            <Route path='feedbackes' element={<AllFeedbacks />}/>
            <Route path='categories' element={<MainContent />}/>
            <Route path='chat-ai' element={<AiPage />}/>
            <Route path='settings' element={<Settings />}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Wrapper component to handle the organization check
function DashboardWrapper() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  return user?.hasOrganization ? <Dashboard /> : <OrgSetup />;
}

export default App;