import React from 'react';
import ReactDOM from 'react-dom/client';
import { Router } from './app/router';
import { Toaster } from 'sonner';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router />
    <Toaster position="top-right" />
  </React.StrictMode>
);