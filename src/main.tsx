import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// StrictMode removed — it intentionally double-invokes renders/effects in dev
// which doubles CPU work. On weak ARM hardware this was causing visible lag
// even in the production build (some effects were still running twice).
createRoot(document.getElementById('root')!).render(<App />);
