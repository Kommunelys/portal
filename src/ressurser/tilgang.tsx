import {
    AutocompleteInput, Create, Datagrid, DateField, DateTimeInput, Edit, List,
    ReferenceField, ReferenceInput, SelectInput, SimpleForm, TextField, TextInput, required,
    type RedirectionSideEffect,
} from 'react-admin';

// Etter lagring: tilbake til brukeren rollen eller abonnementet gjelder.
const tilBrukeren: RedirectionSideEffect = (_resource, _id, data) =>
    data?.user_id ? `brukere/${data.user_id}/show` : 'list';

const ROLLER = [
    { id: 'admin', name: 'Admin for kommunen' },
    { id: 'vurderer', name: 'Vurderer for kommunen' },
];
const KILDER = [
    { id: 'manuell', name: 'Gitt for hånd' },
    { id: 'betaling', name: 'Betaling' },
];

const Bruker = ({ disabled }: { disabled?: boolean }) => (
    <ReferenceInput source="user_id" reference="brukere">
        <AutocompleteInput label="Bruker" optionText="email" validate={required()}
            filterToQuery={(q) => ({ q })} disabled={disabled} />
    </ReferenceInput>
);
const Kommune = ({ disabled }: { disabled?: boolean }) => (
    <ReferenceInput source="kommune_id" reference="kommune">
        <SelectInput label="Kommune" optionText="navn" validate={required()} disabled={disabled} />
    </ReferenceInput>
);

// Roller per kommune (tilgang.medlemskap). Brukes ikke på nettstedet ennå.
export const RolleListe = () => (
    <List title="Roller" sort={{ field: 'lagt_til', order: 'DESC' }}>
        <Datagrid rowClick="edit">
            <ReferenceField source="user_id" reference="brukere" label="Bruker">
                <TextField source="email" />
            </ReferenceField>
            <ReferenceField source="kommune_id" reference="kommune" label="Kommune">
                <TextField source="navn" />
            </ReferenceField>
            <TextField source="rolle" label="Rolle" />
            <DateField source="lagt_til" label="Lagt til" />
        </Datagrid>
    </List>
);

// Bruker og kommune er nøkkelen; skal de endres, slettes rollen og gis på nytt.
export const RolleEndre = () => (
    <Edit title="Endre rolle" mutationMode="pessimistic" redirect={tilBrukeren}>
        <SimpleForm>
            <Bruker disabled />
            <Kommune disabled />
            <SelectInput source="rolle" label="Rolle" choices={ROLLER} validate={required()} />
        </SimpleForm>
    </Edit>
);

export const RolleNy = () => (
    <Create title="Gi rolle" redirect={tilBrukeren}>
        <SimpleForm>
            <Bruker />
            <Kommune />
            <SelectInput source="rolle" label="Rolle" choices={ROLLER} validate={required()} />
        </SimpleForm>
    </Create>
);

// Tilgang til et produkt i en kommune for en periode (tilgang.abonnement).
// Det er dette pro-tilgang blir.
export const AbonnementListe = () => (
    <List title="Abonnement" sort={{ field: 'fra', order: 'DESC' }}>
        <Datagrid rowClick="edit">
            <ReferenceField source="user_id" reference="brukere" label="Bruker">
                <TextField source="email" />
            </ReferenceField>
            <ReferenceField source="kommune_id" reference="kommune" label="Kommune">
                <TextField source="navn" />
            </ReferenceField>
            <TextField source="produkt" label="Produkt" />
            <DateField source="fra" label="Fra" />
            <DateField source="til" label="Til" emptyText="Løpende" />
            <TextField source="kilde" label="Kilde" />
        </Datagrid>
    </List>
);

const AbonnementSkjema = () => (
    <SimpleForm>
        <Bruker />
        <Kommune />
        <ReferenceInput source="produkt" reference="produkt">
            <SelectInput label="Produkt" optionText="beskrivelse" validate={required()} />
        </ReferenceInput>
        <DateTimeInput source="fra" label="Fra (tom: nå)" />
        <DateTimeInput source="til" label="Til (tom: løpende)" />
        <SelectInput source="kilde" label="Kilde" choices={KILDER} defaultValue="manuell" />
        <TextInput source="ekstern_ref" label="Referanse" />
    </SimpleForm>
);

export const AbonnementNy = () => (
    <Create title="Gi abonnement" redirect={tilBrukeren}><AbonnementSkjema /></Create>
);
export const AbonnementEndre = () => (
    <Edit title="Endre abonnement" mutationMode="pessimistic" redirect={tilBrukeren}><AbonnementSkjema /></Edit>
);
