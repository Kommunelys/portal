import {
    AutocompleteInput, Create, Datagrid, DateField, DateTimeInput, Edit, List,
    ReferenceField, ReferenceInput, SelectInput, SimpleForm, TextField, TextInput, required,
} from 'react-admin';

const ROLLER = [
    { id: 'admin', name: 'Admin for kommunen' },
    { id: 'vurderer', name: 'Vurderer avvik' },
];
const KILDER = [
    { id: 'manuell', name: 'Gitt for hånd' },
    { id: 'betaling', name: 'Betaling' },
];

const Bruker = () => (
    <ReferenceInput source="user_id" reference="brukere">
        <AutocompleteInput label="Bruker" optionText="email" validate={required()}
            filterToQuery={(q) => ({ q })} />
    </ReferenceInput>
);
const Kommune = () => (
    <ReferenceInput source="kommune_id" reference="kommune">
        <SelectInput label="Kommune" optionText="navn" validate={required()} />
    </ReferenceInput>
);

// Roller per kommune (tilgang.medlemskap). Brukes ikke på nettstedet ennå.
export const RolleListe = () => (
    <List title="Roller" sort={{ field: 'lagt_til', order: 'DESC' }}>
        <Datagrid rowClick={false}>
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

export const RolleNy = () => (
    <Create title="Gi rolle" redirect="list">
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
    <Create title="Gi abonnement" redirect="list"><AbonnementSkjema /></Create>
);
export const AbonnementEndre = () => (
    <Edit title="Endre abonnement" mutationMode="pessimistic"><AbonnementSkjema /></Edit>
);
