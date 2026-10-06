import { supabaseAuthProvider } from 'ra-supabase';
import { PORTAL, minKonto, supabase, tilbakeTilNettstedet, viaNettstedet, type Meg } from './supabase';

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

export const authProvider = {
    ...grunn,
    // Kom brukeren fra nettstedet, går de tilbake dit etter innloggingen.
    async login(params: any) {
        await grunn.login(params);
        tilbakeTilNettstedet(await minKonto());
    },
    // Kontomenyen på nettstedet skal også vite at brukeren er logget ut: via
    // /konto/ der, og tilbake til innloggingen her.
    async logout(params: any) {
        const varInnlogget = (await supabase.auth.getSession()).data.session != null;
        await grunn.logout(params);
        if (varInnlogget) window.location.assign(viaNettstedet(`${PORTAL}/login`, null));
    },
    // Lenken i e-posten skal tilbake til denne portalen, ikke til Site URL.
    resetPassword: (params: { email: string }) =>
        grunn.resetPassword({ ...params, redirectTo: `${PORTAL}/set-password` }),
    // Registreringen og bekreftelsen fra e-post skal kunne vises uten
    // innlogging, som siden for glemt passord.
    async checkAuth(params: any) {
        if (['/registrer', '/bekreft'].includes(window.location.pathname)) return;
        return grunn.checkAuth(params);
    },
};
