import { useState } from 'react';
import {
    Authenticated, Form, RadioButtonGroupInput, TextInput, Title, maxLength, minLength, required,
    useCreate, useGetList, useNotify,
} from 'react-admin';
import { Alert, Button, Card, CardContent, Link, Stack, Typography } from '@mui/material';
import { GJELDER, sakUrl } from '../ressurser/kodeverk';

// «Meld fra om feil» på nettstedet går hit: /meld?kommune=<slug>&sak=<id>&tittel=…
// Bare innloggede kan melde (ADR-023). Tittelen fra adressen vises bare her;
// meldingen lagres med kommunen og saken, og den som vurderer, ser tittelen
// fra databasen.
const Skjema = () => {
    const sok = new URLSearchParams(window.location.search);
    const slug = sok.get('kommune') ?? '';
    const sak = Number(sok.get('sak'));
    const tittel = sok.get('tittel') ?? '';
    const notify = useNotify();
    const [create, { isPending }] = useCreate();
    const [sendt, settSendt] = useState(false);
    const { data: kommuner, isPending: henter } = useGetList('kommune', {
        filter: { slug }, pagination: { page: 1, perPage: 1 },
    });
    const kommune = kommuner?.[0];

    if (henter) return null;
    if (!kommune || !Number.isInteger(sak) || sak <= 0) {
        return <Alert severity="warning">Fant ikke saken. Gå tilbake til saken på nettstedet og prøv igjen.</Alert>;
    }
    const tilbake = <Link href={sakUrl(slug, sak)}>Tilbake til saken</Link>;
    if (sendt) {
        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Takk</Typography>
                    <Typography sx={{ mb: 2 }}>
                        Meldingen vurderes av den som vurderer saker for {kommune.navn}. Svaret ser du
                        under <Link href="/min-konto">Min konto</Link>.
                    </Typography>
                    {tilbake}
                </CardContent>
            </Card>
        );
    }

    const send = (v: Record<string, any>) =>
        create('feilmelding', {
            data: { kommune_id: kommune.kommune_id, sak_id: sak, gjelder: v.gjelder, beskrivelse: v.beskrivelse.trim() },
        }, {
            onSuccess: () => settSendt(true),
            onError: (e) => notify((e as Error).message, { type: 'error' }),
        });

    return (
        <Card>
            <CardContent>
                <Typography variant="h6">Meld fra om feil</Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {kommune.navn}{tittel ? `: ${tittel}` : ''}
                </Typography>
                <Form onSubmit={send}>
                    <RadioButtonGroupInput source="gjelder" label="Hva gjelder det?" validate={required()}
                        choices={Object.entries(GJELDER).map(([id, name]) => ({ id, name }))} />
                    <TextInput source="beskrivelse" label="Hva er feil?" multiline minRows={4} fullWidth
                        validate={[required(), minLength(20, 'Skriv litt mer: minst 20 tegn'), maxLength(2000)]}
                        helperText="Skriv hva som er feil, og hvor det riktige står, for eksempel side og avsnitt i protokollen. Teksten publiseres ikke. Den som vurderer meldingen, ser e-postadressen din." />
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button type="submit" variant="contained" disabled={isPending}>Send</Button>
                        {tilbake}
                    </Stack>
                </Form>
            </CardContent>
        </Card>
    );
};

export const Meld = () => (
    <Authenticated>
        <Stack sx={{ mt: 2, maxWidth: 640 }}>
            <Title title="Meld fra om feil" />
            <Skjema />
        </Stack>
    </Authenticated>
);

Meld.path = '/meld';
