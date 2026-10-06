import { useState } from 'react';
import {
    Form, PasswordInput, TextInput, Title, email, minLength, required,
    useGetIdentity, useLogout, useNotify, usePermissions,
} from 'react-admin';
import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { PORTAL, brukeradmin, supabase, type Meg } from '../supabase';

export const MinKonto = () => {
    const notify = useNotify();
    const logout = useLogout();
    const { identity } = useGetIdentity();
    const { permissions } = usePermissions<Meg>();
    const [skjemaNr, settSkjemaNr] = useState(0);

    const byttPassord = async (v: Record<string, any>) => {
        if (v.password !== v.gjenta) return notify('Passordene er ikke like', { type: 'error' });
        const { error } = await supabase.auth.updateUser({ password: v.password });
        if (error) return notify(error.message, { type: 'error' });
        notify('Passordet er byttet');
        settSkjemaNr((n) => n + 1);
    };

    const byttEpost = async (v: Record<string, any>) => {
        const { error } = await supabase.auth.updateUser(
            { email: v.email },
            { emailRedirectTo: `${PORTAL}/min-konto` }
        );
        if (error) return notify(error.message, { type: 'error' });
        notify('Bekreft den nye adressen med lenken vi har sendt dit');
    };

    const slett = async () => {
        if (!window.confirm('Vil du slette kontoen din? Det kan ikke angres.')) return;
        try {
            await brukeradmin('slett_meg');
            await logout();
        } catch (e) {
            notify((e as Error).message, { type: 'error' });
        }
    };

    return (
        <Stack spacing={2} sx={{ mt: 2, maxWidth: 520 }}>
            <Title title="Min konto" />
            <Card>
                <CardContent>
                    <Typography variant="h6">{identity?.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {permissions?.er_prosjektadmin ? 'Prosjektadmin' : 'Bruker'}
                    </Typography>
                </CardContent>
            </Card>
            <Card>
                <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Bytt passord</Typography>
                    <Form key={skjemaNr} onSubmit={byttPassord}>
                        <PasswordInput source="password" label="Nytt passord (minst 10 tegn)" fullWidth
                            validate={[required(), minLength(10)]} autoComplete="new-password" />
                        <PasswordInput source="gjenta" label="Gjenta passordet" fullWidth
                            validate={required()} autoComplete="new-password" />
                        <Button type="submit" variant="contained">Bytt passord</Button>
                    </Form>
                </CardContent>
            </Card>
            <Card>
                <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Bytt e-postadresse</Typography>
                    <Form onSubmit={byttEpost}>
                        <TextInput source="email" label="Ny e-post" type="email" fullWidth
                            validate={[required(), email()]} />
                        <Button type="submit" variant="contained">Send bekreftelse</Button>
                    </Form>
                </CardContent>
            </Card>
            <Card>
                <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Slett kontoen</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        E-postadressen og innloggingstidene slettes. Det kan ikke angres.
                    </Typography>
                    <Button color="error" variant="outlined" onClick={slett}
                        disabled={permissions?.er_prosjektadmin}>
                        Slett kontoen min
                    </Button>
                    {permissions?.er_prosjektadmin && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Prosjektadmin må fjernes med SQL før kontoen kan slettes.
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </Stack>
    );
};

MinKonto.path = '/min-konto';
