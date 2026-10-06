import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        {/* Vanlige adresser, ikke #: lenkene i e-postene fra Supabase krever det. */}
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>
);
