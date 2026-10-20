import {
    Datagrid, DateField, Form, FunctionField, List, ReferenceManyField, SelectInput, Show,
    SimpleShowLayout, TextField, TextInput, required, useCreate, useGetIdentity, useNotify,
    usePermissions, useRecordContext, useRefresh,
} from 'react-admin';
import { Alert, Button, Card, CardContent, Chip, Link, Stack, Typography } from '@mui/material';
import { Begrunnelse, KommuneFelt, KommuneFilter, Merknad, SakLenke, Status } from './felles';
import { useVurdertAv } from './kodeverk';
import type { Meg } from '../supabase';

// Sammendrag av debatten som ikke besto kontrollen mot tekstingen
// (portal.debatt_holdt, ADR-026). En vurderer kan slippe gjennom en debatt der
// kontrollen bare ikke fant partiet i tekstingen; tekstingen skriver ofte
// partier og navn feil. Navn og stemmetall kan bare prosjektadmin overstyre
// (ADR-025). En del eller en tid som ikke finnes i opptaket, kan ingen
// publisere: debatten må analyseres på nytt.

const AVGJORELSER = [
    { id: 'publiser', name: 'Publiser' },
    { id: 'ikke_publiser', name: 'Ikke publiser' },
];
const NAVN = Object.fromEntries(AVGJORELSER.map((a) => [a.id, a.name]));

const Avgjorelse = () => <Status verdi={useRecordContext()?.avgjorelse} navn={NAVN} />;

// «ca. 4:00 inn i saken», som på nettstedet.
const klokke = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const dato = (d?: string) => d ? new Date(d).toLocaleDateString('nb-NO') : '';

type Del = { del: number; tittel: string; url: string; start_s: number; varighet_s: number };

const Grunner = (_: { label?: string }) => {
    const r = useRecordContext();
    return (
        <Stack spacing={0.5}>
            {(r?.grunner ?? []).map((g: string) => <span key={g}>{g}</span>)}
        </Stack>
    );
};

const Opptaket = (_: { label?: string }) => {
    const r = useRecordContext();
    if (!r) return null;
    const deler: Del[] = r.deler ?? [];
    return (
        <Stack spacing={0.5}>
            {deler.map((d) => (
                <span key={d.del}>
                    <Link href={d.url} target="_blank" rel="noopener">
                        {deler.length > 1 ? `Del ${d.del}: ` : ''}{d.tittel}
                    </Link>{' '}
                    <Typography component="span" variant="body2" color="text.secondary">
                        ({klokke(d.varighet_s)})
                    </Typography>
                </span>
            ))}
            {!deler.length && <Link href={r.opptak_url} target="_blank" rel="noopener">Opptaket</Link>}
        </Stack>
    );
};

// Hvert punkt med partiene og lenke til starten av saken i opptaket. Spilleren
// hos kommunen kan ikke åpnes på et tidspunkt, så tiden står i teksten.
const Punkter = (_: { label?: string }) => {
    const r = useRecordContext();
    if (!r) return null;
    const deler: Del[] = r.deler ?? [];
    return (
        <Stack spacing={1} component="ol" sx={{ pl: 2.5, m: 0 }}>
            {(r.punkter ?? []).map((p: any, i: number) => {
                const d = deler.find((x) => x.del === p.del);
                return (
                    <li key={i}>
                        {p.tekst}{' '}
                        {(p.partier ?? []).map((pa: string) =>
                            <Chip key={pa} size="small" label={pa} sx={{ mr: 0.5 }} />)}
                        <Typography component="span" variant="body2" color="text.secondary">
                            {d ? (
                                <Link href={d.url} target="_blank" rel="noopener">
                                    ca. {klokke(p.tid_s)} inn i saken{deler.length > 1 ? `, del ${p.del}` : ''}
                                </Link>
                            ) : `del ${p.del} finnes ikke i opptaket`}
                        </Typography>
                    </li>
                );
            })}
        </Stack>
    );
};

export const DebattListe = () => (
    <List title="Debatter holdt tilbake" sort={{ field: 'opprettet', order: 'DESC' }}
        filterDefaultValues={{ avgjorelse: 'ikke_vurdert' }}
        filters={[
            <SelectInput source="avgjorelse" label="Vurdering" alwaysOn key="avgjorelse"
                choices={[{ id: 'ikke_vurdert', name: 'Ikke vurdert' }, ...AVGJORELSER]} />,
            KommuneFilter,
        ]}>
        <Datagrid rowClick="show" bulkActionButtons={false}>
            <KommuneFelt label="Kommune" />
            <TextField source="sak_tittel" label="Sak" />
            <FunctionField label="Møte" render={(r: any) => `${r.utvalg_navn ?? ''} ${dato(r.dato)}`} />
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
    const { permissions } = usePermissions<Meg>();
    const [create, { isPending }] = useCreate();
    if (!r) return null;
    const prosjektadmin = permissions?.er_prosjektadmin === true;
    const kanPublisere = !r.kan_aldri_publiseres && (r.kan_godkjennes || prosjektadmin);

    const lagre = (v: Record<string, any>) =>
        create('debatt_vurdering', {
            data: {
                kommune_id: r.kommune_id, debatt_id: r.id, avgjorelse: v.avgjorelse,
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
                {r.kan_aldri_publiseres ? (
                    <Alert severity="info" sx={{ mb: 1 }}>
                        Dette kan ikke publiseres: et punkt peker til en del eller et tidspunkt som ikke
                        finnes i opptaket, eller tekstingen mangler. Debatten må analyseres på nytt. Du kan
                        likevel registrere at den ikke skal publiseres.
                    </Alert>
                ) : r.kan_godkjennes ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Hør etter i opptaket at partiet faktisk hadde ordet ved tidspunktet. Vurderingen
                        endrer ikke sammendraget, bare om det vises. Endres grunnene senere, holdes det
                        tilbake igjen.
                    </Typography>
                ) : prosjektadmin ? (
                    <Alert severity="warning" sx={{ mb: 1 }}>
                        Kontrollen fant et mulig navn eller et stemmetall, som en vurderer ikke kan
                        overstyre. Som prosjektadmin kan du publisere likevel, for eksempel når «navnet» er
                        et stedsnavn. Stemmetall og utfall skal komme fra protokollen, ikke fra debatten.
                    </Alert>
                ) : (
                    <Alert severity="info" sx={{ mb: 1 }}>
                        Dette kan ikke godkjennes her: et mulig navn eller et stemmetall i teksten kan bare
                        prosjektadmin slippe gjennom. Du kan likevel registrere at det ikke skal publiseres.
                    </Alert>
                )}
                <Form onSubmit={lagre} defaultValues={{ vurdert_av: vurdertAv }}>
                    <SelectInput source="avgjorelse" label="Avgjørelse" validate={required()}
                        choices={kanPublisere ? AVGJORELSER : AVGJORELSER.filter((a) => a.id !== 'publiser')} />
                    <Begrunnelse />
                    <Merknad hva="vises under debatten" />
                    <TextInput source="vurdert_av" label="Vurdert av" validate={required()}
                        helperText={identity?.fullName ? `Registreres på ${identity.fullName}` : undefined} />
                    <Button type="submit" variant="contained" disabled={isPending}>Lagre vurdering</Button>
                </Form>
            </CardContent>
        </Card>
    );
};

const AlleVurderinger = (_: { label?: string }) => (
    <ReferenceManyField reference="debatt_vurdering" target="debatt_id"
        sort={{ field: 'registrert', order: 'DESC' }}>
        <Datagrid bulkActionButtons={false} rowClick={false} empty={<span>Ingen ennå</span>}>
            <DateField source="registrert" label="Dato" />
            <FunctionField label="Avgjørelse" render={(v: any) =>
                `${NAVN[v.avgjorelse]}${v.overstyrt ? ' (overstyrt)' : ''}`} />
            <TextField source="begrunnelse" label="Begrunnelse" />
            <TextField source="merknad" label="Merknad" emptyText="–" />
            <TextField source="vurdert_av" label="Vurdert av" />
        </Datagrid>
    </ReferenceManyField>
);

export const DebattVis = () => (
    <Show title="Debatt holdt tilbake">
        <SimpleShowLayout>
            <FunctionField label="Sak" render={(r: any) =>
                <SakLenke kommune={r.kommune} sak={r.sak_id} tittel={r.sak_tittel} />} />
            <KommuneFelt label="Kommune" />
            <FunctionField label="Møte" render={(r: any) =>
                `${r.utvalg_navn ?? ''} ${dato(r.dato)}, ${r.saksnr}`} />
            <Grunner label="Hvorfor det holdes tilbake" />
            <Opptaket label="Opptaket" />
            <TextField source="oppsummering" label="Oppsummering" />
            <TextField source="antall_innlegg" label="Innlegg" />
            <Punkter label="Punktene" />
            <TextField source="modell" label="Skrevet av" />
            <FunctionField label="Gjeldende vurdering" render={() => <Avgjorelse />} />
            <AlleVurderinger label="Alle vurderinger" />
            <NyVurdering />
        </SimpleShowLayout>
    </Show>
);
