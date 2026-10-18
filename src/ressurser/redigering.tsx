import { useState } from 'react';
import {
    AutocompleteArrayInput, Datagrid, DateField, Form, FunctionField, List, ReferenceArrayInput,
    SelectInput, Show, SimpleShowLayout, TextField, TextInput, Title, maxLength, required, useCreate,
    useGetIdentity, useGetList, useNotify, useRecordContext, useRefresh,
} from 'react-admin';
import { Navigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Chip, Link, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Begrunnelse, KommuneFelt, KommuneFilter, SakLenke } from './felles';
import { useVurdertAv } from './kodeverk';

// Alle sammendrag, med redigering for prosjektadmin (portal.sammendrag, ADR-025).
// Prosjektadmin har siste ord: teksten kan redigeres, og et sammendrag kan
// publiseres uansett hva kontrollen fant. Den redigerte teksten vises på
// nettstedet merket «redigert av Kommunelys». Analysen fra modellen endres
// aldri; redigeringen er en ny rad, og den forrige står i historikken.

const STATUS: Record<string, { navn: string; farge: 'success' | 'warning' | 'info' | 'default' }> = {
    vist: { navn: 'Vises', farge: 'success' },
    redigert: { navn: 'Redigert', farge: 'info' },
    ny_analyse: { navn: 'Ny analyse etter redigering', farge: 'warning' },
    holdt: { navn: 'Holdt tilbake', farge: 'warning' },
    ikke_publiser: { navn: 'Ikke publisert', farge: 'default' },
    ikke_kontrollert: { navn: 'Ikke kontrollert ennå', farge: 'default' },
};

const StatusChip = (_: { label?: string }) => {
    const s = STATUS[useRecordContext()?.status ?? ''];
    return s ? <Chip size="small" color={s.farge} label={s.navn} /> : null;
};

export const AlleSammendragListe = () => (
    <List title="Alle sammendrag" sort={{ field: 'opprettet', order: 'DESC' }}
        filters={[
            <TextInput source="sak_tittel@ilike" label="Søk i sakstittelen" alwaysOn key="sok"
                parse={(v: string) => (v ? `%${v}%` : v)} format={(v?: string) => v?.replace(/^%|%$/g, '') ?? ''} />,
            <SelectInput source="status" label="Status" alwaysOn key="status"
                choices={Object.entries(STATUS).map(([id, s]) => ({ id, name: s.navn }))} />,
            KommuneFilter,
        ]}>
        <Datagrid rowClick="show" bulkActionButtons={false}>
            <KommuneFelt label="Kommune" />
            <FunctionField label="Sak" render={(r: any) => r.r_tittel_klarsprak ?? r.tittel_klarsprak} />
            <TextField source="sak_tittel" label="Sakstittel" />
            <FunctionField label="Status" render={() => <StatusChip />} />
            <DateField source="opprettet" label="Analysert" />
        </Datagrid>
    </List>
);

// Teksten slik den vises, eller ville vist.
const Tekst = ({ t }: { t: Record<string, any> }) => (
    <Stack spacing={1}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{t.tittel_klarsprak}</Typography>
        <Typography variant="body2">{t.sammendrag || <i>(tomt)</i>}</Typography>
        {t.betydning && <Typography variant="body2"><b>Hva betyr det?</b> {t.betydning}</Typography>}
        {t.uenighet && <Typography variant="body2"><b>Uenigheten:</b> {t.uenighet}</Typography>}
        <Box>{(t.tagger ?? []).map((g: string) => <Chip key={g} size="small" label={g} sx={{ mr: 0.5 }} />)}</Box>
    </Stack>
);

const ki = (r: any) => ({
    tittel_klarsprak: r.tittel_klarsprak, sammendrag: r.sammendrag, betydning: r.betydning,
    uenighet: r.uenighet, tagger: r.tagger,
});
const redigert = (r: any) => ({
    tittel_klarsprak: r.r_tittel_klarsprak, sammendrag: r.r_sammendrag, betydning: r.r_betydning,
    uenighet: r.r_uenighet, tagger: r.r_tagger,
});

const Redigering = () => {
    const r = useRecordContext();
    const notify = useNotify();
    const refresh = useRefresh();
    const [create, { isPending }] = useCreate();
    const [fra, settFra] = useState<'redigert' | 'ki'>('redigert');
    if (!r) return null;
    const harRedigering = r.redigering_id != null;
    const start = harRedigering && fra === 'redigert' ? redigert(r) : ki(r);

    const lagre = (v: Record<string, any>) =>
        create('sammendrag_redigering', {
            data: {
                kommune_id: r.kommune_id, analyse_id: r.id, aktiv: true,
                tittel_klarsprak: v.tittel_klarsprak.trim(), sammendrag: v.sammendrag.trim(),
                betydning: v.betydning?.trim() || null, uenighet: v.uenighet?.trim() || null,
                tagger: v.tagger, begrunnelse: v.begrunnelse,
            },
        }, {
            onSuccess: () => { notify('Teksten er lagret. Den vises på nettstedet etter neste kjøring.'); refresh(); },
            onError: (e) => notify((e as Error).message, { type: 'error' }),
        });

    return (
        <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
                <Typography variant="subtitle1" gutterBottom>Rediger teksten</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Teksten du lagrer, vises i stedet for modellens, uten ny kontroll, og merkes
                    «redigert av Kommunelys». Kildelenkene fra analysen følger med. Skriv ikke navn på
                    privatpersoner; folkevalgte omtales i rollen (CLAUDE.md regel 6).
                </Typography>
                {harRedigering && (
                    <ToggleButtonGroup size="small" exclusive value={fra} sx={{ mb: 2 }}
                        onChange={(_, v) => v && settFra(v)}>
                        <ToggleButton value="redigert">Start fra din tekst</ToggleButton>
                        <ToggleButton value="ki">Start fra KI-teksten</ToggleButton>
                    </ToggleButtonGroup>
                )}
                <Form key={fra} onSubmit={lagre} defaultValues={start}>
                    <TextInput source="tittel_klarsprak" label="Tittel i klarspråk" fullWidth
                        validate={[required(), maxLength(200)]} />
                    <TextInput source="sammendrag" label="Sammendrag" multiline minRows={4} fullWidth
                        validate={[required(), maxLength(3000)]} />
                    <TextInput source="betydning" label="Hva betyr det?" multiline fullWidth
                        validate={maxLength(1000)} />
                    <TextInput source="uenighet" label="Uenigheten" multiline fullWidth
                        validate={maxLength(1000)} helperText="Tom: avsnittet vises ikke." />
                    <ReferenceArrayInput source="tagger" reference="tagg">
                        <AutocompleteArrayInput label="Tema (1–3)" optionText="tagg" fullWidth
                            validate={[required(), (v?: string[]) => (v && v.length > 3 ? 'Høyst tre tema' : undefined)]} />
                    </ReferenceArrayInput>
                    <Begrunnelse />
                    <Button type="submit" variant="contained" disabled={isPending}>Lagre teksten</Button>
                </Form>
            </CardContent>
        </Card>
    );
};

// Tar KI-teksten tilbake: en ny rad uten tekst. Da gjelder kontrollen og
// vurderingene for analysen igjen.
const BrukKiTeksten = () => {
    const r = useRecordContext();
    const notify = useNotify();
    const refresh = useRefresh();
    const [create, { isPending }] = useCreate();
    if (!r || r.redigering_id == null) return null;
    const lagre = (v: Record<string, any>) =>
        create('sammendrag_redigering', {
            data: { kommune_id: r.kommune_id, analyse_id: r.id, aktiv: false, begrunnelse: v.begrunnelse },
        }, {
            onSuccess: () => { notify('KI-teksten gjelder igjen fra neste kjøring.'); refresh(); },
            onError: (e) => notify((e as Error).message, { type: 'error' }),
        });
    return (
        <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
                <Typography variant="subtitle1" gutterBottom>Bruk KI-teksten</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Fjerner redigeringen. Da vises analysen fra modellen om den består kontrollen eller
                    er godkjent.
                </Typography>
                <Form onSubmit={lagre}>
                    <Begrunnelse />
                    <Button type="submit" variant="outlined" disabled={isPending}>Bruk KI-teksten</Button>
                </Form>
            </CardContent>
        </Card>
    );
};

// Publiserer KI-teksten uendret, uansett hva kontrollen fant. Vurderingen
// merkes overstyrt i databasen.
const PubliserUendret = () => {
    const r = useRecordContext();
    const notify = useNotify();
    const refresh = useRefresh();
    const { identity } = useGetIdentity();
    const vurdertAv = useVurdertAv();
    const [create, { isPending }] = useCreate();
    if (!r || r.redigering_id != null || !['holdt', 'ikke_publiser'].includes(r.status)) return null;
    const tom = !r.sammendrag?.trim();
    const lagre = (v: Record<string, any>) =>
        create('sammendrag_vurdering', {
            data: {
                kommune_id: r.kommune_id, analyse_id: r.id, avgjorelse: 'publiser',
                begrunnelse: v.begrunnelse, merknad: null, vurdert_av: v.vurdert_av,
            },
        }, {
            onSuccess: () => { notify('Sammendraget publiseres ved neste kjøring.'); refresh(); },
            onError: (e) => notify((e as Error).message, { type: 'error' }),
        });
    return (
        <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
                <Typography variant="subtitle1" gutterBottom>Publiser KI-teksten uendret</Typography>
                {tom ? (
                    <Alert severity="info">Modellen var usikker og skrev ikke noe sammendrag. Skriv teksten selv over.</Alert>
                ) : (
                    <Form onSubmit={lagre} defaultValues={{ vurdert_av: vurdertAv }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Kontrollen fant: {(r.grunner ?? []).join('; ') || 'ingenting'}. Som
                            prosjektadmin kan du publisere likevel. Endres grunnene senere, holdes det
                            tilbake igjen.
                        </Typography>
                        <Begrunnelse />
                        <TextInput source="vurdert_av" label="Vurdert av" validate={required()}
                            helperText={identity?.fullName ? `Registreres på ${identity.fullName}` : undefined} />
                        <Button type="submit" variant="contained" disabled={isPending}>Publiser</Button>
                    </Form>
                )}
            </CardContent>
        </Card>
    );
};

const Visning = (_: { label?: string }) => {
    const r = useRecordContext();
    if (!r) return null;
    const harRedigering = r.redigering_id != null;
    return (
        <Stack spacing={2}>
            {r.status === 'ny_analyse' && (
                <Alert severity="warning">
                    Saken har fått en ny analyse etter at du redigerte teksten. Din tekst vises fortsatt.
                    Se på den nye KI-teksten, og rediger på nytt eller bruk KI-teksten.
                </Alert>
            )}
            {harRedigering && (
                <Box>
                    <Typography variant="overline">
                        Din tekst, lagret {new Date(r.redigert).toLocaleDateString('nb-NO')}
                    </Typography>
                    <Tekst t={redigert(r)} />
                    <Typography variant="caption" color="text.secondary">Begrunnelse: {r.r_begrunnelse}</Typography>
                </Box>
            )}
            <Box>
                <Typography variant="overline">
                    {r.status === 'ny_analyse' ? 'Den nye KI-teksten' : 'KI-teksten'} ({r.modell}
                    {r.usikker ? ', usikker' : ''})
                </Typography>
                <Tekst t={ki(r)} />
            </Box>
            {(r.grunner ?? []).length > 0 && (
                <Typography variant="body2" color="text.secondary">
                    Kontrollen fant: {r.grunner.join('; ')}
                    {r.overstyrt ? ' (overstyrt av prosjektadmin)' : ''}
                </Typography>
            )}
            <Stack spacing={0.5}>
                {(r.kilder ?? []).map((k: any) =>
                    <Link key={k.url} href={k.url} target="_blank" rel="noopener">{k.tittel}</Link>)}
            </Stack>
        </Stack>
    );
};

export const SammendragRediger = () => (
    <Show title="Sammendrag">
        <SimpleShowLayout>
            <FunctionField label="Sak" render={(r: any) =>
                <SakLenke kommune={r.kommune} sak={r.sak_id} tittel={r.sak_tittel} />} />
            <KommuneFelt label="Kommune" />
            <StatusChip label="Status" />
            <Visning label="Teksten" />
            <Redigering />
            <PubliserUendret />
            <BrukKiTeksten />
        </SimpleShowLayout>
    </Show>
);

// «Rediger sammendraget» på nettstedet går hit: /rediger?kommune=<slug>&sak=<id>.
export const Rediger = () => {
    const sok = new URLSearchParams(window.location.search);
    const { data, isPending } = useGetList('sammendrag', {
        filter: { kommune: sok.get('kommune') ?? '', sak_id: Number(sok.get('sak')) || 0 },
        pagination: { page: 1, perPage: 1 },
    });
    if (isPending) return null;
    if (data?.[0]) return <Navigate to={`/sammendrag/${data[0].id}/show`} replace />;
    return (
        <Card sx={{ mt: 2 }}>
            <Title title="Sammendrag" />
            <CardContent>
                <Alert severity="info">Saken har ikke noe sammendrag ennå. Det lages når saken analyseres.</Alert>
            </CardContent>
        </Card>
    );
};
Rediger.path = '/rediger';
