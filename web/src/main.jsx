import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { I18nProvider } from './i18n/index.jsx';
import App from './App';
import './index.css';
import './i18n';
import useThemeStore from './store/themeStore';

const saved = localStorage.getItem('savdo-theme');
let isDark = true;
if (saved) {
  try {
    const parsed = JSON.parse(saved);
    if ('theme' in (parsed?.state || {})) {
      localStorage.removeItem('savdo-theme');
    } else if (parsed?.state) {
      isDark = parsed.state.isDark ?? true;
    }
  } catch (_) {}
}

document.documentElement.classList.toggle('dark', isDark);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </I18nProvider>
  </React.StrictMode>
);
