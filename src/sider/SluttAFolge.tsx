import { useState } from 'react';
import { AuthLayout } from 'ra-supabase';
import { Button, CardContent, Link, Typography } from '@mui/material';
import { NETTSTED, supabase } from '../supabase';

// «Slutt å følge» fra e-posten med varsel (ADR-027). Virker uten innlogging:
// lenken har en nøkkel som edge-funksjonen varsel kontrollerer (website-repoet,
// supabase/functions/varsel). Uten f gjelder den alle sakene brukeren følger.
// Siden spør først, som Bekreft: skannere som åpner lenker i e-post (for
// eksempel Microsoft Safe Links), skal ikke kunne gjøre det for brukeren.
export const SluttAFolge = () => {
    const q = new URLSearchParams(window.location.search);
    const b = q.get('b') ?? '';
    const f = q.get('f');
    const n = q.get('n') ?? '';
    const [status, settStatus] = useState<'spor' | 'venter' | 'ferdig' | 'feil'>('spor');

    const slutt = async () => {
        settStatus('venter');
        const { error } = await supabase.functions.invoke('varsel', { body: { handling: 'slutt', b, f, n } });
        settStatus(error ? 'feil' : 'ferdig');
    };

    return (
        <AuthLayout>
            <CardContent sx={{ maxWidth: 360 }}>
                {!b || !n ? (
                    <Typography>Lenken er ufullstendig. Åpne den på nytt fra e-posten.</Typography>
                ) : status === 'ferdig' ? (
                    <>
                        <Typography variant="h6" gutterBottom>
                            {f ? 'Du følger ikke lenger saken' : 'Du følger ikke lenger noen saker'}
                        </Typography>
                        <Typography sx={{ mb: 2 }}>
                            {f ? 'Du får ikke flere e-poster om den.' : 'Du får ikke flere e-poster om sakene.'}
                        </Typography>
                        <Link href={NETTSTED}>Til kommunelys.no</Link>
                    </>
                ) : status === 'feil' ? (
                    <>
                        <Typography gutterBottom>Lenken virket ikke.</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Logg inn og gå til «Min konto» for å se og slutte å følge sakene dine.
                        </Typography>
                        <Link href="/min-konto" sx={{ display: 'inline-block', mt: 2 }}>Min konto</Link>
                    </>
                ) : (
                    <>
                        <Typography variant="h6" gutterBottom>
                            {f ? 'Slutt å følge saken?' : 'Slutt å følge alle sakene?'}
                        </Typography>
                        <Typography sx={{ mb: 2 }}>
                            {f ? 'Du får ikke flere e-poster om denne saken.'
                                : 'Du får ikke flere e-poster om sakene du følger.'}
                        </Typography>
                        <Button variant="contained" fullWidth onClick={slutt} disabled={status === 'venter'}>
                            Slutt å følge
                        </Button>
                    </>
                )}
            </CardContent>
        </AuthLayout>
    );
};

SluttAFolge.path = '/slutt-a-folge';
