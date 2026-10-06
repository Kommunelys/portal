import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Begge er offentlige: nøkkelen gir bare det RLS tillater (ADR-020).
export const SUPABASE_URL = 'https://lsxqodiqkjroihzoikje.supabase.co';
export const SUPABASE_NOKKEL = 'sb_publishable_IXC-qhq0BGYyqLjpk68BsQ_dqQxfsr1';

// Skjemaet portal er standard, også for rpc. Typen er den ra-supabase venter.
// detectSessionInUrl er av: lenkene for invitasjon og nytt passord leses av
// siden /set-password (ra-supabase), og skal ikke logge inn før passordet er satt.
// Etter bekreftelse av e-post logger brukeren inn selv.
export const supabase = createClient(SUPABASE_URL, SUPABASE_NOKKEL, {
    db: { schema: 'portal' },
    auth: { detectSessionInUrl: false },
}) as unknown as SupabaseClient;

// Hvor lenkene i e-postene skal peke: portalen selv, også lokalt.
export const PORTAL = window.location.origin;

// Kontomenyen på nettstedet (konto.js) sender folk hit med ?tilbake=<adresse>.
// Adressen huskes for fanen, så den overlever glemt passord og registrering,
// og brukes bare om den er på nettstedet.
const NETTSTEDER = ['https://kommunelys.no/', 'https://www.kommunelys.no/', 'http://localhost:8765/'];
const TILBAKE = 'kommunelys-tilbake';

export function huskTilbake(): void {
    const t = new URLSearchParams(window.location.search).get('tilbake');
    if (t && NETTSTEDER.some((n) => t.startsWith(n))) sessionStorage.setItem(TILBAKE, t);
}

export function tilbake(): string | null {
    const t = sessionStorage.getItem(TILBAKE);
    return t && NETTSTEDER.some((n) => t.startsWith(n)) ? t : null;
}

// Sender brukeren tilbake til nettstedet, om de kom derfra. Gir true da.
export function tilbakeTilNettstedet(): boolean {
    const t = tilbake();
    if (!t) return false;
    sessionStorage.removeItem(TILBAKE);
    window.location.assign(t);
    return true;
}

// Om brukeren er prosjektadmin, for kontomenyen på nettstedet (konto-status.html).
export const ADMIN = 'kommunelys-admin';

export type Meg = {
    er_prosjektadmin: boolean;
    admin_kommuner: number[] | null;
    vurderer_kommuner: number[] | null;
};

// Kaller edge-funksjonen for det portalen ikke kan gjøre med den
// publiserbare nøkkelen (supabase/functions/brukeradmin i website-repoet).
export async function brukeradmin<T = any>(handling: string, data: Record<string, unknown> = {}): Promise<T> {
    const { data: svar, error } = await supabase.functions.invoke('brukeradmin', {
        body: { handling, ...data },
    });
    if (error) {
        // Feilmeldingen fra funksjonen ligger i svaret.
        const tekst = await (error as any).context?.json?.().catch(() => null);
        throw new Error(tekst?.feil ?? error.message);
    }
    return svar as T;
}
