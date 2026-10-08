import {
    Datagrid, DateField, Form, FunctionField, List, ReferenceManyField, SelectInput, Show,
    SimpleShowLayout, TextField, TextInput, maxLength, required, useCreate, useGetIdentity, useNotify,
    usePermissions, useRecordContext, useRefresh,
} from 'react-admin';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Button, Card, CardContent, Link, Stack, Typography } from '@mui/material';
import type { Meg } from '../supabase';
import { Begrunnelse, KommuneFelt, KommuneFilter, Merknad, SakLenke, Status } from './felles';
import { GJELDER, MELDING_AVGJORELSER as AVGJORELSER, MELDING_NAVN as NAVN, useVurdertAv } from './kodeverk';

// Meldinger om feil fra innloggede brukere (ADR-023). Den som vurderer, ser
// hvem som meldte og hvor mange meldinger brukeren har sendt i kommunen, for
// å hindre misbruk, men kan ikke vurdere sin egen melding.

const Avgjorelse = () => <Status verdi={useRecordContext()?.avgjorelse} navn={NAVN} />;

// Alle meldingene fra samme bruker, uansett vurdering.
const fraBruker = (bruker: string) =>
    `/feilmelding?${new URLSearchParams({ filter: JSON.stringify({ meldt_av: bruker }) })}`;

// Hvem som meldte. Prosjektadmin kan gå til brukeren og sperre den der.
const MeldtAv = ({ detaljer }: { label?: string; detaljer?: boolean }) => {
    const r = useRecordContext();
    const { permissions } = usePermissions<Meg>();
    if (!r) return null;
    if (!r.meldt_av) return <Typography variant="body2" color="text.secondary">Kontoen er slettet</Typography>;
    const epost = r.meldt_av_epost ?? 'ukjent';
    if (!detaljer) return <span>{epost}</span>;
    return (
        <Stack spacing={0.5}>
            <span>{epost}</span>
            <Link component={RouterLink} to={fraBruker(r.meldt_av)} variant="body2">
                {r.meldinger_fra_bruker === 1 ? 'Første melding fra brukeren i kommunen'
                    : `${r.meldinger_fra_bruker} meldinger fra brukeren i kommunen`}
            </Link>
            {permissions?.er_prosjektadmin && (
                <Link component={RouterLink} to={`/brukere/${r.meldt_av}/show`} variant="body2">
                    Se brukeren (sperre eller slette)
                </Link>
            )}
        </Stack>
    );
};

export const MeldingListe = () => (
    <List title="Meldinger om feil" sort={{ field: 'meldt', order: 'DESC' }}
        filterDefaultValues={{ avgjorelse: 'ikke_vurdert' }}
        filters={[
            <SelectInput source="avgjorelse" label="Vurdering" alwaysOn key="avgjorelse"
                choices={[{ id: 'ikke_vurdert', name: 'Ikke vurdert' }, ...AVGJORELSER]} />,
            KommuneFilter,
        ]}>
        <Datagrid rowClick="show" bulkActionButtons={false}>
            <DateField source="meldt" label="Meldt" />
            <KommuneFelt label="Kommune" />
            <TextField source="sak_tittel" label="Sak" />
            <FunctionField label="Gjelder" render={(r: any) => GJELDER[r.gjelder]} />
            <MeldtAv label="Meldt av" />
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
    if (r.egen) {
        return <Alert severity="info" sx={{ mt: 2 }}>Du meldte dette selv, så noen andre må vurdere det.</Alert>;
    }
    // Bare sammendrag og stemmer kan holdes tilbake; resten rettes ved kilden.
    const valg = ['sammendrag', 'stemmer'].includes(r.gjelder)
        ? AVGJORELSER : AVGJORELSER.filter((a) => a.id !== 'holdes_tilbake');

    const lagre = (v: Record<string, any>) =>
        create('feilmelding_vurdering', {
            data: {
                kommune_id: r.kommune_id, feilmelding_id: r.id, avgjorelse: v.avgjorelse,
                svar: v.svar || null, begrunnelse: v.begrunnelse, merknad: v.merknad || null,
                vurdert_av: v.vurdert_av,
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
                    Sjekk dokumentene på saken først. «Holdes tilbake» skjuler {r.gjelder === 'stemmer'
                        ? 'stemmene i saken' : 'sammendraget til saken får et nytt'}. Teksten på
                    nettstedet endres aldri for hånd; er noe galt, rettes det der feilen oppstod.
                </Typography>
                <Form onSubmit={lagre} defaultValues={{ vurdert_av: vurdertAv }}>
                    <SelectInput source="avgjorelse" label="Avgjørelse" choices={valg} validate={required()} />
                    <TextInput source="svar" label="Svar til den som meldte (vises under Min konto)"
                        multiline fullWidth validate={maxLength(2000)} />
                    <Begrunnelse />
                    <Merknad hva="vises på saken" />
                    <TextInput source="vurdert_av" label="Vurdert av" validate={required()}
                        helperText={identity?.fullName ? `Registreres på ${identity.fullName}` : undefined} />
                    <Button type="submit" variant="contained" disabled={isPending}>Lagre vurdering</Button>
                </Form>
            </CardContent>
        </Card>
    );
};

const AlleVurderinger = (_: { label?: string }) => (
    <ReferenceManyField reference="feilmelding_vurdering" target="feilmelding_id"
        sort={{ field: 'registrert', order: 'DESC' }}>
        <Datagrid bulkActionButtons={false} rowClick={false} empty={<span>Ingen ennå</span>}>
            <DateField source="registrert" label="Dato" />
            <FunctionField label="Avgjørelse" render={(v: any) => NAVN[v.avgjorelse]} />
            <TextField source="svar" label="Svar" emptyText="–" />
            <TextField source="begrunnelse" label="Begrunnelse" />
            <TextField source="merknad" label="Merknad" emptyText="–" />
            <TextField source="vurdert_av" label="Vurdert av" />
        </Datagrid>
    </ReferenceManyField>
);

export const MeldingVis = () => (
    <Show title="Melding om feil">
        <SimpleShowLayout>
            <FunctionField label="Sak" render={(r: any) =>
                <SakLenke kommune={r.kommune} sak={r.sak_id} tittel={r.sak_tittel} />} />
            <KommuneFelt label="Kommune" />
            <FunctionField label="Gjelder" render={(r: any) => GJELDER[r.gjelder]} />
            <TextField source="beskrivelse" label="Hva er feil" />
            <DateField source="meldt" label="Meldt" showTime />
            <MeldtAv label="Meldt av" detaljer />
            <FunctionField label="Gjeldende vurdering" render={() => <Avgjorelse />} />
            <AlleVurderinger label="Alle vurderinger" />
            <NyVurdering />
        </SimpleShowLayout>
    </Show>
);
