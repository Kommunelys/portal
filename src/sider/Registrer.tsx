import { useState } from 'react';
import { Form, PasswordInput, TextInput, email, minLength, required, useNotify } from 'react-admin';
import { AuthLayout } from 'ra-supabase';
import { Button, CardContent, Link, Typography } from '@mui/material';
import { PORTAL, supabase, tilbake } from '../supabase';
import { MANGLER_CAPTCHA, feilmelding, useCaptcha } from '../captcha';

const MINST = 10;

export const Registrer = () => {
    const notify = useNotify();
    const [sendt, settSendt] = useState<string | null>(null);
    const [venter, settVenter] = useState(false);
    const captcha = useCaptcha();

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
                    Ny bruker
                </Typography>
                {sendt ? (
                    <Typography>
                        Vi har sendt en e-post til {sendt}. Trykk på lenken i den for å bekrefte
                        adressen. Deretter logger du inn her.
                    </Typography>
                ) : (
                    <Form onSubmit={send}>
                        <TextInput source="email" label="E-post" type="email" fullWidth
                            validate={[required(), email()]} autoComplete="email" />
                        <PasswordInput source="password" label={`Passord (minst ${MINST} tegn)`} fullWidth
                            validate={[required(), minLength(MINST)]} autoComplete="new-password" />
                        <PasswordInput source="gjenta" label="Gjenta passordet" fullWidth
                            validate={required()} autoComplete="new-password" />
                        {captcha.felt}
                        <Button type="submit" variant="contained" fullWidth disabled={venter}>
                            Opprett bruker
                        </Button>
                    </Form>
                )}
                <Typography variant="body2" sx={{ mt: 2 }}>
                    <Link href="/login">Tilbake til innlogging</Link>
                </Typography>
            </CardContent>
        </AuthLayout>
    );
};

Registrer.path = '/registrer';
