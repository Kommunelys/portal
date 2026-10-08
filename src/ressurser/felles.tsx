import { ReferenceField, ReferenceInput, SelectInput, TextField, TextInput, maxLength, required } from 'react-admin';
import { Chip, Link } from '@mui/material';
import { sakUrl } from './kodeverk';

// Felles for det som vurderes i portalen: avvik i stemmene, sammendrag og
// meldinger om feil (ADR-023). Tilgangen per kommune håndheves av RLS.

// Merknaden vises på nettstedet uten at noen godkjenner teksten for hånd.
// Databasen stopper lange merknader og lenker; navn kontrolleres i bygget,
// som holder saken tilbake om merknaden nevner noen.
const ingenLenke = (v?: string) =>
    v && /https?:\/\/|www\./i.test(v) ? 'Merknaden kan ikke ha lenker' : undefined;

export const Merknad = ({ hva }: { hva: string }) => (
    <TextInput source="merknad" label={`Merknad (offentlig, ${hva})`} multiline fullWidth
        validate={[maxLength(300, 'Høyst 300 tegn'), ingenLenke]}
        helperText="Vises på nettstedet ved neste kjøring. Høyst 300 tegn, ingen lenker, ingen navn: folkevalgte omtales i rollen." />
);

export const Begrunnelse = () => (
    <TextInput source="begrunnelse" label="Begrunnelse (intern, vises bare her)" multiline fullWidth
        validate={required()} />
);

export const KommuneFilter = (
    <ReferenceInput source="kommune_id" reference="kommune" key="kommune_id" alwaysOn>
        <SelectInput label="Kommune" optionText="navn" />
    </ReferenceInput>
);

// label leses av Datagrid og SimpleShowLayout.
export const KommuneFelt = (_: { label?: string }) => (
    <ReferenceField source="kommune_id" reference="kommune" link={false}>
        <TextField source="navn" />
    </ReferenceField>
);

export const SakLenke = ({ kommune, sak, tittel }: { kommune: string; sak: number; tittel?: string }) => (
    <Link href={sakUrl(kommune, sak)} target="_blank" rel="noopener">{tittel || `Sak ${sak}`}</Link>
);

export const Status = ({ verdi, navn }: { verdi?: string; navn: Record<string, string> }) => {
    if (!verdi || verdi === 'ikke_vurdert') return <Chip size="small" color="warning" label="Ikke vurdert" />;
    const ok = verdi === 'publiser' || verdi === 'ikke_feil' || verdi === 'rettet';
    return <Chip size="small" color={ok ? 'success' : 'default'} label={navn[verdi] ?? verdi} />;
};
