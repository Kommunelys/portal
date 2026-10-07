import {
    BooleanInput, Datagrid, DateField, Form, FunctionField, List, ReferenceManyField,
    SelectInput, Show, SimpleShowLayout, TextField, TextInput, UrlField, required,
    useCreate, useGetIdentity, useNotify, useRecordContext, useRefresh,
} from 'react-admin';
import { Button, Card, CardContent, Chip, Typography } from '@mui/material';

const AVGJORELSER = [
    { id: 'publiser', name: 'Publiser' },
    { id: 'ikke_publiser', name: 'Ikke publiser' },
];
const navn = (a?: string) => AVGJORELSER.find((x) => x.id === a)?.name;

const Avgjorelse = () => {
    const r = useRecordContext();
    if (!r?.avgjorelse) return <Chip size="small" color="warning" label="Ikke vurdert" />;
    return <Chip size="small" color={r.avgjorelse === 'publiser' ? 'success' : 'default'}
        label={navn(r.avgjorelse)} />;
};

export const AvvikListe = () => (
    <List title="Avvik" sort={{ field: 'dato', order: 'DESC' }} filterDefaultValues={{ aktiv: true }}
        filters={[<BooleanInput source="aktiv" label="Bare aktive" alwaysOn key="aktiv" />]}>
        <Datagrid rowClick="show" bulkActionButtons={false}>
            <DateField source="dato" label="Møte" />
            <TextField source="utvalg" label="Utvalg" />
            <TextField source="beskrivelse" label="Avvik" />
            <FunctionField label="Vurdering" render={() => <Avgjorelse />} />
        </Datagrid>
    </List>
);

// En ny vurdering er en ny rad; den forrige blir stående i historikken
// (ADR-015). Den slår inn på nettstedet ved neste kjøring.
const NyVurdering = () => {
    const r = useRecordContext();
    const notify = useNotify();
    const refresh = useRefresh();
    const { identity } = useGetIdentity();
    const [create, { isPending }] = useCreate();
    if (!r) return null;

    const lagre = (v: Record<string, any>) =>
        create('vurdering', {
            data: {
                kommune_id: r.kommune_id, avvik: r.avvik, avgjorelse: v.avgjorelse,
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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Sjekk protokollen først. Vurderingen endrer aldri navn eller tall, bare om
                    voteringen publiseres. Den kan ikke endres etterpå, bare erstattes av en ny.
                </Typography>
                <Form onSubmit={lagre} defaultValues={{ vurdert_av: 'Prosjekteier' }}>
                    <SelectInput source="avgjorelse" label="Avgjørelse" choices={AVGJORELSER}
                        validate={required()} />
                    <TextInput source="begrunnelse" label="Begrunnelse (vises ikke på nettstedet)"
                        multiline fullWidth validate={required()} />
                    <TextInput source="merknad" label="Merknad (vises ved voteringen på nettstedet)"
                        multiline fullWidth />
                    <TextInput source="vurdert_av" label="Vurdert av" validate={required()}
                        helperText={identity?.fullName ? `Registreres på ${identity.fullName}` : undefined} />
                    <Button type="submit" variant="contained" disabled={isPending}>Lagre vurdering</Button>
                </Form>
            </CardContent>
        </Card>
    );
};

// Historikken for dette avviket i denne kommunen, nyeste først.
const AlleVurderinger = (_: { label?: string }) => {
    const r = useRecordContext();
    if (!r) return null;
    return (
        <ReferenceManyField reference="vurdering" target="avvik" filter={{ kommune_id: r.kommune_id }}
            sort={{ field: 'registrert', order: 'DESC' }}>
            <Datagrid bulkActionButtons={false} rowClick={false} empty={<span>Ingen ennå</span>}>
                <DateField source="dato" label="Dato" />
                <FunctionField label="Avgjørelse" render={(v: any) => navn(v.avgjorelse)} />
                <TextField source="begrunnelse" label="Begrunnelse" />
                <TextField source="merknad" label="Merknad" emptyText="–" />
                <TextField source="vurdert_av" label="Vurdert av" />
            </Datagrid>
        </ReferenceManyField>
    );
};

export const AvvikVis = () => (
    <Show title="Avvik">
        <SimpleShowLayout>
            <TextField source="beskrivelse" label="Avvik" />
            <TextField source="saker" label="Saker" emptyText="–" />
            <TextField source="utvalg" label="Utvalg" />
            <DateField source="dato" label="Møte" />
            <UrlField source="kilde" label="Protokollen" target="_blank" emptyText="–" />
            <FunctionField label="Gjeldende vurdering" render={() => <Avgjorelse />} />
            <TextField source="merknad" label="Merknad" emptyText="–" />
            <TextField source="begrunnelse" label="Begrunnelse" emptyText="–" />
            <TextField source="vurdert_av" label="Vurdert av" emptyText="–" />
            <AlleVurderinger label="Alle vurderinger" />
            <NyVurdering />
        </SimpleShowLayout>
    </Show>
);
