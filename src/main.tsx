
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Mount the app to the root element
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(<App />);
