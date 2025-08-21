import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from "./pages/AuthPage";
import Feedback from "./components/Feedback";
import HomePage from './pages/HomePage';
import Dashborad from "./pages/Dashborad"
import MainContent from './components/MainContent';
import AllFeedbacks from './components/AllFeedbacks';
import AiPage from './pages/AiPage';
import { Settings } from './pages/Settings';

function App() {
  return (
   <BrowserRouter>

    <Routes>
      <Route path='/' element={ <HomePage />}/>
      <Route path='/auth' element={ <AuthPage />}/>
      <Route path='/feedback' element={ <Feedback />}/>
      <Route path='/dashborad' element={ <Dashborad />}>
        <Route path='' element={<MainContent />}/>
        <Route path='feedbackes' element={<AllFeedbacks />}/>
        <Route path='categories' element={<MainContent />}/>
        <Route path='chat-ai' element={<AiPage />}/>
        <Route path='settings' element={<Settings />}/>
      </Route>
    </Routes>

    
   </BrowserRouter>
  );
}

export default App;
