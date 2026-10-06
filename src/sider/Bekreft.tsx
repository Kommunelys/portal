import { useState } from 'react';
import { AuthLayout } from 'ra-supabase';
import { Button, CardContent, Link, Typography } from '@mui/material';
import type { EmailOtpType } from '@supabase/supabase-js';
import { PORTAL, huskTilbake, minKonto, supabase, tilbakeTilNettstedet } from '../supabase';

// Lenkene i e-postene fra Supabase går hit (supabase/epostmaler/ i
// website-repoet), ikke til supabase.co. Bekreftelsen skjer først når
// mottakeren trykker på knappen: skannere som åpner lenker i e-post (for
// eksempel Microsoft Safe Links), bruker da ikke opp engangslenken.
const TEKST: Record<string, { tittel: string; knapp: string }> = {
    email: { tittel: 'Bekreft e-postadressen din', knapp: 'Bekreft' },
    invite: { tittel: 'Du er invitert til Kommunelys-portalen', knapp: 'Velg passord' },
    recovery: { tittel: 'Velg nytt passord', knapp: 'Fortsett' },
    email_change: { tittel: 'Bekreft ny e-postadresse', knapp: 'Bekreft' },
};

export const Bekreft = () => {
    const q = new URLSearchParams(window.location.search);
    const tokenHash = q.get('token_hash') ?? '';
    const type = (q.get('type') ?? '') as EmailOtpType;
    const til = q.get('til') ?? '';
    const tekst = TEKST[type];
    const [feil, settFeil] = useState<string | null>(null);
    const [venter, settVenter] = useState(false);

    const bekreft = async () => {
        settVenter(true);
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error || !data.session) {
            settVenter(false);
            settFeil(error?.message ?? 'Lenken virket ikke.');
            return;
        }
        // Nytt passord: til siden der passordet settes (ra-supabase).
        if (type === 'invite' || type === 'recovery') {
            const s = data.session;
            window.location.replace(
                `/set-password?access_token=${s.access_token}&refresh_token=${s.refresh_token}&type=${type}`);
            return;
        }
        if (type === 'email_change') {
            window.location.replace('/min-konto');
            return;
        }
        // Ny bruker: tilbake til nettstedet om de kom derfra, ellers til portalen.
        if (til.startsWith(`${PORTAL}/`)) {
            huskTilbake(new URL(til).searchParams.get('tilbake'));
            if (tilbakeTilNettstedet(await minKonto())) return;
        }
        window.location.replace('/');
    };

    return (
        <AuthLayout>
            <CardContent sx={{ maxWidth: 360 }}>
                {!tekst || !tokenHash ? (
                    <Typography>Lenken er ufullstendig. Åpne den på nytt fra e-posten.</Typography>
                ) : feil ? (
                    <>
                        <Typography gutterBottom>Lenken er brukt eller utløpt.</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{feil}</Typography>
                        <Link href="/forgot-password">Be om en ny lenke</Link>
                    </>
                ) : (
                    <>
                        <Typography variant="h6" gutterBottom>{tekst.tittel}</Typography>
                        <Button variant="contained" fullWidth onClick={bekreft} disabled={venter} sx={{ mt: 1 }}>
                            {tekst.knapp}
                        </Button>
                    </>
                )}
            </CardContent>
        </AuthLayout>
    );
};

Bekreft.path = '/bekreft';
