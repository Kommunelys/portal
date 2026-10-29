import { useState } from 'react';
import { Form, PasswordInput, TextInput, email, minLength, required, useNotify } from 'react-admin';
import { AuthLayout } from 'ra-supabase';
import { Button, CardContent, Link, Typography } from '@mui/material';
import { PORTAL, folgSak, supabase, tilbake } from '../supabase';
import { MANGLER_CAPTCHA, feilmelding, useCaptcha } from '../captcha';

const MINST = 10;

export const Registrer = () => {
    const notify = useNotify();
    const [sendt, settSendt] = useState<string | null>(null);
    const [venter, settVenter] = useState(false);
    const captcha = useCaptcha();
    // Fra «Følg saken» på nettstedet (ADR-027).
    const sak = folgSak();

    const send = async (verdier: Record<string, any>) => {
        if (verdier.password !== verdier.gjenta) {
            notify('Passordene er ikke like', { type: 'error' });
            return;
        }
        if (!captcha.token) {
            notify(MANGLER_CAPTCHA, { type: 'error' });
            return;
        }
        settVenter(true);
        const { error } = await supabase.auth.signUp({
            email: verdier.email,
            password: verdier.password,
            // Lenken i e-posten åpnes i en ny fane, så siden å gå tilbake til følger med.
            options: {
                captchaToken: captcha.token,
                emailRedirectTo: `${PORTAL}/login` +
                    (tilbake() ? `?tilbake=${encodeURIComponent(tilbake()!)}` : ''),
            },
        });
        settVenter(false);
        captcha.nullstill();
        if (error) notify(feilmelding(error), { type: 'error' });
        else settSendt(verdier.email);
    };

    return (
        <AuthLayout>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    {sak === null ? 'Ny bruker' : 'Følg saken'}
                </Typography>
                {sendt ? (
                    <Typography>
                        Vi har sendt en e-post til {sendt}. Trykk på lenken i den for å bekrefte
                        adressen. {sak === null ? 'Deretter logger du inn her.'
                            : 'Da kommer du tilbake til saken, og du følger den.'}
                    </Typography>
                ) : (
                    <Form onSubmit={send}>
                        {sak !== null && <FolgForklaring sak={sak} />}
                        <TextInput source="email" label="E-post" type="email" fullWidth
                            validate={[required(), email()]} autoComplete="email" />
                        <PasswordInput source="password" label={`Passord (minst ${MINST} tegn)`} fullWidth
                            validate={[required(), minLength(MINST)]} autoComplete="new-password" />
                        <PasswordInput source="gjenta" label="Gjenta passordet" fullWidth
                            validate={required()} autoComplete="new-password" />
                        {captcha.felt}
                        <Button type="submit" variant="contained" fullWidth disabled={venter}>
                            {sak === null ? 'Opprett bruker' : 'Opprett bruker og følg saken'}
                        </Button>
                    </Form>
                )}
                <Typography variant="body2" sx={{ mt: 2 }}>
                    {/* Innloggingen får de samme parameterne (grunn, sak, tilbake). */}
                    <Link href={`/login${window.location.search}`}>
                        {sak === null ? 'Tilbake til innlogging' : 'Har du en bruker? Logg inn'}
                    </Link>
                </Typography>
            </CardContent>
        </AuthLayout>
    );
};

Registrer.path = '/registrer';

// Hvorfor brukeren må registrere seg for å følge saken (ADR-027).
export const FolgForklaring = ({ sak }: { sak: string }) => (
    <Typography sx={{ mb: 2 }}>
        For å følge {sak ? <>saken «{sak}»</> : 'saken'} trenger du en bruker. Den er gratis. Når du har
        bekreftet e-postadressen, kommer du tilbake til saken, og vi sender deg e-post når den kommer videre.
    </Typography>
);
