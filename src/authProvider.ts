import { supabaseAuthProvider } from 'ra-supabase';
import { PORTAL, supabase, type Meg } from './supabase';

const ingen: Meg = { er_prosjektadmin: false, admin_kommuner: [], vurderer_kommuner: [] };

const grunn = supabaseAuthProvider(supabase, {
    getIdentity: async (user) => ({ id: user.id, fullName: user.email }),
    // Styrer bare hvilke menyer som vises. Tilgangen håndheves av RLS og
    // edge-funksjonen.
    getPermissions: async () => {
        const { data, error } = await supabase.rpc('meg');
        return error ? ingen : (data as Meg);
    },
});

// Registreringssiden skal kunne vises uten innlogging, som siden for glemt passord.
export const authProvider = {
    ...grunn,
    // Lenken i e-posten skal tilbake til denne portalen, ikke til Site URL.
    resetPassword: (params: { email: string }) =>
        grunn.resetPassword({ ...params, redirectTo: `${PORTAL}/set-password` }),
    async checkAuth(params: any) {
        if (window.location.pathname === '/registrer') return;
        return grunn.checkAuth(params);
    },
};
