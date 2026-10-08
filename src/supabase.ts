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

export function huskTilbake(
    t: string | null = new URLSearchParams(window.location.search).get('tilbake'),
): void {
    if (t && NETTSTEDER.some((n) => t.startsWith(n))) sessionStorage.setItem(TILBAKE, t);
}

export function tilbake(): string | null {
    const t = sessionStorage.getItem(TILBAKE);
    return t && NETTSTEDER.some((n) => t.startsWith(n)) ? t : null;
}

// nokkel og utloper: tilgangsnøkkelen til innloggingen, med utløpstiden i
// sekunder. Nettstedet bruker den bare til å hente dataene for kommunene med
// begrenset innsyn (innsyn.js i website-repoet, ADR-024). Den gjelder i en
// time; nettstedet henter en ny her når den er gått ut.
export type Konto = { epost: string; admin: boolean; nokkel?: string; utloper?: number };

// Nettstedet som hører til denne portalen: kommunelys.no, eller lokalt :8765.
export const NETTSTED = window.location.origin.startsWith('http://localhost')
    ? 'http://localhost:8765/' : 'https://kommunelys.no/';

// Adressen til /konto/ på nettstedet. Den lagrer kontoen (eller fjerner den,
// når konto er null) for kontomenyen, og sender videre til til. Alt står
// etter #, så det sendes aldri til serveren.
export function viaNettstedet(til: string, konto: Konto | null): string {
    const h = new URLSearchParams();
    if (konto) {
        h.set('epost', konto.epost);
        if (konto.admin) h.set('admin', '1');
        if (konto.nokkel && konto.utloper) {
            h.set('nokkel', konto.nokkel);
            h.set('utloper', String(konto.utloper));
        }
    } else {
        h.set('ut', '');
    }
    h.set('til', til);
    return `${new URL(NETTSTED).origin}/konto/#${h}`;
}

// Kontoen til den som er logget inn, eller null.
export async function minKonto(): Promise<Konto | null> {
    let { data: { session } } = await supabase.auth.getSession();
    // Nettstedet skal få en nøkkel som gjelder en stund, ikke en som snart går ut.
    if (session?.expires_at && session.expires_at * 1000 - Date.now() < 10 * 60 * 1000) {
        session = (await supabase.auth.refreshSession()).data.session ?? session;
    }
    const epost = session?.user.email;
    if (!session || !epost) return null;
    const { data: meg } = await supabase.rpc('meg');
    // Kontomenyen på nettstedet viser «Portalen» for dem som har noe å gjøre der.
    return { epost, admin: erVurderer(meg as Meg | null), nokkel: session.access_token, utloper: session.expires_at };
}

// Sender brukeren tilbake til nettstedet, om de kom derfra, med kontoen til
// kontomenyen. Gir true da.
export function tilbakeTilNettstedet(konto: Konto | null): boolean {
    const t = tilbake();
    if (!t) return false;
    sessionStorage.removeItem(TILBAKE);
    window.location.replace(viaNettstedet(t, konto));
    return true;
}

export type Meg = {
    er_prosjektadmin: boolean;
    admin_kommuner: number[] | null;
    vurderer_kommuner: number[] | null;
};

// Vurderer for minst én kommune (rollen vurderer eller admin), eller prosjektadmin.
export const erVurderer = (meg?: Meg | null): boolean =>
    meg?.er_prosjektadmin === true || (meg?.vurderer_kommuner?.length ?? 0) > 0;

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
