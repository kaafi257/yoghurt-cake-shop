import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyTheme, getInitialTheme } from './lib/theme.ts';

applyTheme(getInitialTheme());

createRoot(document.getElementById('root')!).render(<App />);
