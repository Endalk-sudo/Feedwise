import React from 'react';
import ReactDOM from 'react-dom/client';
import { Router } from './app/router';
import { Toaster } from 'sonner';
import { startToastBridge } from './lib/toast-bridge';
import './styles/index.css';

startToastBridge();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router />
    <Toaster position="top-right" richColors closeButton />
  </React.StrictMode>
);