import { usePermissions } from 'react-admin';
import { NETTSTED, type Meg } from '../supabase';

// Felles for det som vurderes i portalen (ADR-023). Ligger utenfor
// komponentfilene, så Vite kan laste dem på nytt mens appen kjører.

// Hva en melding om feil gjelder (kjerne.feilmelding.gjelder).
export const GJELDER: Record<string, string> = {
    sammendrag: 'Sammendraget',
    stemmer: 'Stemmene',
    saksgang: 'Saksgangen',
    annet: 'Noe annet',
};

// Avgjørelsene for en melding (kjerne.feilmelding_vurdering.avgjorelse).
export const MELDING_AVGJORELSER = [
    { id: 'ikke_feil', name: 'Ikke feil' },
    { id: 'rettet', name: 'Rettet' },
    { id: 'holdes_tilbake', name: 'Holdes tilbake' },
];
export const MELDING_NAVN: Record<string, string> = Object.fromEntries(
    MELDING_AVGJORELSER.map((a) => [a.id, a.name]));

// Saken på nettstedet.
export const sakUrl = (kommune: string, sak: number) => `${NETTSTED}${kommune}/#sak/${sak}`;

// Hvem som vurderte, slik det står i historikken. Hvem som registrerte det,
// lagres i tillegg (registrert_av).
export const useVurdertAv = () => {
    const { permissions } = usePermissions<Meg>();
    return permissions?.er_prosjektadmin ? 'Prosjekteier' : 'Vurderer';
};
