import {
    Datagrid, DateField, Form, FunctionField, List, ReferenceManyField, SelectInput, Show,
    SimpleShowLayout, TextField, TextInput, required, useCreate, useGetIdentity, useNotify,
    useRecordContext, useRefresh,
} from 'react-admin';
import { Alert, Button, Card, CardContent, Chip, Link, Stack, Typography } from '@mui/material';
import { Begrunnelse, KommuneFelt, KommuneFilter, Merknad, SakLenke, Status } from './felles';
import { useVurdertAv } from './kodeverk';

// Sammendrag som ikke besto kontrollen mot kilden (portal.sammendrag_holdt).
// En vurderer kan slippe gjennom et sammendrag der kontrollen bare savner et
// tall eller en dato i kilden. Navn, manglende kilde og usikre svar kan ikke
// overstyres; der må sammendraget rettes ved kilden (ADR-023).

const AVGJORELSER = [
    { id: 'publiser', name: 'Publiser' },
    { id: 'ikke_publiser', name: 'Ikke publiser' },
];
const NAVN = Object.fromEntries(AVGJORELSER.map((a) => [a.id, a.name]));

const Avgjorelse = () => <Status verdi={useRecordContext()?.avgjorelse} navn={NAVN} />;

const Grunner = (_: { label?: string }) => {
    const r = useRecordContext();
    return (
        <Stack spacing={0.5}>
            {(r?.grunner ?? []).map((g: string) => <span key={g}>{g}</span>)}
        </Stack>
    );
};

export const SammendragListe = () => (
    <List title="Sammendrag holdt tilbake" sort={{ field: 'opprettet', order: 'DESC' }}
        filterDefaultValues={{ avgjorelse: 'ikke_vurdert' }}
        filters={[
            <SelectInput source="avgjorelse" label="Vurdering" alwaysOn key="avgjorelse"
                choices={[{ id: 'ikke_vurdert', name: 'Ikke vurdert' }, ...AVGJORELSER]} />,
            KommuneFilter,
        ]}>
        <Datagrid rowClick="show" bulkActionButtons={false}>
            <KommuneFelt label="Kommune" />
            <TextField source="sak_tittel" label="Sak" />
            <FunctionField label="Hvorfor" render={(r: any) => r.grunner?.join('; ')} />
            <FunctionField label="Kan godkjennes" render={(r: any) =>
                <Chip size="small" label={r.kan_godkjennes ? 'Ja' : 'Nei'} />} />
            <FunctionField label="Vurdering" render={() => <Avgjorelse />} />
        </Datagrid>
    </List>
);

const NyVurdering = () => {
    const r = useRecordContext();
    const notify = useNotify();
    const refresh = useRefresh();
    const { identity } = useGetIdentity();
    const vurdertAv = useVurdertAv();
    const [create, { isPending }] = useCreate();
    if (!r) return null;

    const lagre = (v: Record<string, any>) =>
        create('sammendrag_vurdering', {
            data: {
                kommune_id: r.kommune_id, analyse_id: r.id, avgjorelse: v.avgjorelse,
                begrunnelse: v.begrunnelse, merknad: v.merknad || null, vurdert_av: v.vurdert_av,
            },
        }, {
            onSuccess: () => { notify('Vurderingen er lagret. Den slår inn ved neste kjøring.'); refresh(); },
            onError: (e) => notify((e as Error).message, { type: 'error' }),
        });

    return (
        <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
                <Typography variant="subtitle1" gutterBottom>Ny vurdering</Typography>
                {r.kan_godkjennes ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Sjekk at tallene og datoene står i dokumentene. Vurderingen endrer ikke
                        sammendraget, bare om det vises. Endres grunnene senere, holdes det tilbake igjen.
                    </Typography>
                ) : (
                    <Alert severity="info" sx={{ mb: 1 }}>
                        Dette kan ikke godkjennes her: et navn fra sakstittelen må vurderes i
                        tillatte-navn.json, og et sammendrag uten kilde eller et usikkert svar må
                        analyseres på nytt. Du kan likevel registrere at det ikke skal publiseres.
                    </Alert>
                )}
                <Form onSubmit={lagre} defaultValues={{ vurdert_av: vurdertAv }}>
                    <SelectInput source="avgjorelse" label="Avgjørelse" validate={required()}
                        choices={r.kan_godkjennes ? AVGJORELSER : AVGJORELSER.filter((a) => a.id !== 'publiser')} />
                    <Begrunnelse />
                    <Merknad hva="vises under sammendraget" />
                    <TextInput source="vurdert_av" label="Vurdert av" validate={required()}
                        helperText={identity?.fullName ? `Registreres på ${identity.fullName}` : undefined} />
                    <Button type="submit" variant="contained" disabled={isPending}>Lagre vurdering</Button>
                </Form>
            </CardContent>
        </Card>
    );
};

const AlleVurderinger = (_: { label?: string }) => (
    <ReferenceManyField reference="sammendrag_vurdering" target="analyse_id"
        sort={{ field: 'registrert', order: 'DESC' }}>
        <Datagrid bulkActionButtons={false} rowClick={false} empty={<span>Ingen ennå</span>}>
            <DateField source="registrert" label="Dato" />
            <FunctionField label="Avgjørelse" render={(v: any) => NAVN[v.avgjorelse]} />
            <TextField source="begrunnelse" label="Begrunnelse" />
            <TextField source="merknad" label="Merknad" emptyText="–" />
            <TextField source="vurdert_av" label="Vurdert av" />
        </Datagrid>
    </ReferenceManyField>
);

export const SammendragVis = () => (
    <Show title="Sammendrag holdt tilbake">
        <SimpleShowLayout>
            <FunctionField label="Sak" render={(r: any) =>
                <SakLenke kommune={r.kommune} sak={r.sak_id} tittel={r.sak_tittel} />} />
            <KommuneFelt label="Kommune" />
            <Grunner label="Hvorfor det holdes tilbake" />
            <TextField source="tittel_klarsprak" label="Tittel i klarspråk" />
            <TextField source="sammendrag" label="Sammendrag" />
            <TextField source="betydning" label="Hva betyr det?" emptyText="–" />
            <TextField source="uenighet" label="Uenigheten" emptyText="–" />
            <FunctionField label="Kilder" render={(r: any) => (
                <Stack spacing={0.5}>
                    {(r.kilder ?? []).map((k: any) =>
                        <Link key={k.url} href={k.url} target="_blank" rel="noopener">{k.tittel}</Link>)}
                </Stack>
            )} />
            <TextField source="modell" label="Skrevet av" />
            <FunctionField label="Gjeldende vurdering" render={() => <Avgjorelse />} />
            <AlleVurderinger label="Alle vurderinger" />
            <NyVurdering />
        </SimpleShowLayout>
    </Show>
);
