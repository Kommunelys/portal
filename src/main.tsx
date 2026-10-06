import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ADMIN, huskTilbake, supabase, tilbakeTilNettstedet } from './supabase';

huskTilbake();

// Utlogging fra kontomenyen på nettstedet: skjer før appen starter, og
// brukeren sendes tilbake dit.
if (window.location.pathname === '/logg-ut') {
    supabase.auth.signOut({ scope: 'local' }).finally(() => {
        localStorage.removeItem(ADMIN);
        if (!tilbakeTilNettstedet()) window.location.replace('/login');
    });
} else {
    // Kom brukeren fra nettstedet for å logge inn, men er allerede logget
    // inn, går de rett tilbake.
    if (window.location.pathname === '/login') {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) tilbakeTilNettstedet();
        });
    }
    start();
}

function start() {
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            {/* Vanlige adresser, ikke #: lenkene i e-postene fra Supabase krever det. */}
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </StrictMode>
    );
}
