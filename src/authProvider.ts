import { supabaseAuthProvider } from 'ra-supabase';
import { ADMIN, PORTAL, supabase, tilbakeTilNettstedet, type Meg } from './supabase';

const ingen: Meg = { er_prosjektadmin: false, admin_kommuner: [], vurderer_kommuner: [] };

const grunn = supabaseAuthProvider(supabase, {
    getIdentity: async (user) => ({ id: user.id, fullName: user.email }),
    // Styrer bare hvilke menyer som vises. Tilgangen håndheves av RLS og
    // edge-funksjonen.
    getPermissions: async () => {
        const { data, error } = await supabase.rpc('meg');
        const meg = error ? ingen : (data as Meg);
        if (meg.er_prosjektadmin) localStorage.setItem(ADMIN, '1');
        else localStorage.removeItem(ADMIN);
        return meg;
    },
});

export const authProvider = {
    ...grunn,
    // Kom brukeren fra nettstedet, går de tilbake dit etter innloggingen.
    async login(params: any) {
        await grunn.login(params);
        tilbakeTilNettstedet();
    },
    async logout(params: any) {
        localStorage.removeItem(ADMIN);
        return grunn.logout(params);
    },
    // Lenken i e-posten skal tilbake til denne portalen, ikke til Site URL.
    resetPassword: (params: { email: string }) =>
        grunn.resetPassword({ ...params, redirectTo: `${PORTAL}/set-password` }),
    // Registreringen skal kunne vises uten innlogging, som siden for glemt passord.
    async checkAuth(params: any) {
        if (window.location.pathname === '/registrer') return;
        return grunn.checkAuth(params);
    },
};
