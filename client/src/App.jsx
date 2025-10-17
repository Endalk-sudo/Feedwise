import { BrowserRouter, Routes, Route ,Navigate } from 'react-router-dom';
import { LoginPage } from "./auth/LoginPage";
import { RegisterPage } from "./auth/RegisterPage";
import Feedback from "./components/Feedback";
import HomePage from './pages/HomePage';
import Dashboard from "./pages/Dashboard";
import MainContent from './components/MainContent';
import AllFeedbacks from './components/AllFeedbacks';
import AiPage from './pages/AiPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { Settings } from './pages/Settings';
import OrgSetup from './pages/OrgSetup';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import SubscriptionPlans from "./components/Payments/SubscriptionPlans";
import PaymentCanceled from './components/Payments/PaymentCanceled';
import ReactivateSubscription from './components/Payments/ReactivateSubscription';
import PaymentSuccess from './components/Payments/PaymentSuccess';
import NotFound from './pages/NotFound';


const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();



  if (loading) {
    return <div>Loading...</div>;
  }


  return !user ? children : <Navigate to="/dashboard" />;
};


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


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<HomePage />}/>
          <Route path='/login' element={
            <PublicRoute >
              <LoginPage />
            </PublicRoute >
          } />

          <Route path='/register' element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } />

          <Route path="/payment" element={<SubscriptionPlans />}/>
          <Route path="/payment-success" element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
          />
          <Route path="/payment-canceled" element={
            <ProtectedRoute>
              <PaymentCanceled />
            </ProtectedRoute>
          }
          />
          <Route path="/reactivate" element={
            <ProtectedRoute>
              <ReactivateSubscription />
            </ProtectedRoute>
          }
          />

          <Route path='/feedback/:slug' element={<Feedback />}/>

          <Route path='/org-setup' element={<OrgSetup />}/>

          <Route path='/dashboard/*' element={
            <ProtectedRoute>
              <DashboardWrapper>
                  <Dashboard />
              </ DashboardWrapper>
            </ProtectedRoute>
          }>
            <Route path='' element={<MainContent />}/>
            <Route path='feedbackes' element={<AllFeedbacks />}/>
            <Route path='categories' element={<MainContent />}/>
            <Route path='chat-ai' element={<AiPage />}/>
            <Route path='settings' element={<Settings />}/>
            <Route path='pro-analysis' element={<AnalyticsPage />}/>
          </Route>
          <Route path='*' element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Wrapper component to handle the organization and subscription check
function DashboardWrapper({children}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if(!user?.currentPlan) return <Navigate to="/payment" />

  if(!user?.hasOrganization) return <Navigate to="/org-setup" />

  // Check subscription status
  if (user?.subscriptionStatus !== 'active') return <ReactivateSubscription />;

  
  return children;
}

export default App;