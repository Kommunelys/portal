import { useState } from 'react';
import { Form, PasswordInput, TextInput, email, required, useLogin, useNotify } from 'react-admin';
import { AuthLayout, ForgotPasswordPage, useResetPassword } from 'ra-supabase';
import { Box, Button, CardContent, Link, Typography } from '@mui/material';
import { MANGLER_CAPTCHA, feilmelding, useCaptcha } from '../captcha';

// Innlogging og glemt passord fra ra-supabase, med captcha. ra-supabase sine
// skjemaer kan ikke sende den med.

export const InnloggingSkjema = () => {
    const login = useLogin();
    const notify = useNotify();
    const captcha = useCaptcha();
    const [venter, settVenter] = useState(false);

    const send = async (verdier: Record<string, any>) => {
        if (!captcha.token) {
            notify(MANGLER_CAPTCHA, { type: 'error' });
            return;
        }
        settVenter(true);
        try {
            // Går rett videre til signInWithPassword (authProvider.ts).
            await login({
                email: verdier.email,
                password: verdier.password,
                options: { captchaToken: captcha.token },
            });
        } catch (e) {
            notify(feilmelding(e), { type: 'error' });
        } finally {
            settVenter(false);
            captcha.nullstill();
        }
    };

    return (
        <CardContent>
            <Form onSubmit={send}>
                <TextInput source="email" label="E-post" type="email" fullWidth autoFocus
                    validate={[required(), email()]} autoComplete="email" />
                <PasswordInput source="password" label="Passord" fullWidth
                    validate={required()} autoComplete="current-password" />
                {captcha.felt}
                <Button type="submit" variant="contained" fullWidth disabled={venter}>
                    Logg inn
                </Button>
            </Form>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link href={ForgotPasswordPage.path} variant="body2">Glemt passordet?</Link>
            </Box>
        </CardContent>
    );
};

export const GlemtPassord = () => {
    const notify = useNotify();
    const captcha = useCaptcha();
    // Når lenken er sendt, går den til innloggingen og sier fra der.
    const [, { mutateAsync: nyttPassord, isPending }] = useResetPassword({
        onError: (e) => notify(feilmelding(e), { type: 'error' }),
    });

    const send = async (verdier: Record<string, any>) => {
        if (!captcha.token) {
            notify(MANGLER_CAPTCHA, { type: 'error' });
            return;
        }
        await nyttPassord({ email: verdier.email, captchaToken: captcha.token }).catch(() => {});
        captcha.nullstill();
    };

    return (
        <AuthLayout>
            <CardContent>
                <Typography variant="h5" align="center" gutterBottom>Glemt passordet?</Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                    Skriv e-postadressen din, så sender vi en lenke.
                </Typography>
                <Form onSubmit={send}>
                    <TextInput source="email" label="E-post" type="email" fullWidth sx={{ mt: 2 }}
                        validate={[required(), email()]} autoComplete="email" />
                    {captcha.felt}
                    <Button type="submit" variant="contained" fullWidth disabled={isPending}>
                        Send lenke
                    </Button>
                </Form>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Link href="/login" variant="body2">Tilbake til innlogging</Link>
                </Box>
            </CardContent>
        </AuthLayout>
    );
};

GlemtPassord.path = ForgotPasswordPage.path;
