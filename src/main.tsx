import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

registerSW({
  immediate: true,
  onNeedRefresh() {
    // Allow skipWaiting + clientsClaim to activate cleanly on next visit without forced reload loops
  },
});

createRoot(document.getElementById('root')!).render(<App />);
