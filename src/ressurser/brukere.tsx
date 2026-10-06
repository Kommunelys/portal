import {
    Create, DateField, DeleteWithConfirmButton, FunctionField, List, ReferenceManyField,
    Show, SimpleForm, SimpleShowLayout, TextField, TextInput, TopToolbar, Datagrid,
    email, required, useNotify, useRecordContext, useRefresh, useUpdate, SearchInput,
    ReferenceField, CreateButton,
} from 'react-admin';
import { Button, Chip } from '@mui/material';
import { brukeradmin } from '../supabase';

const sperret = (r: any) => r?.sperret_til && new Date(r.sperret_til) > new Date();

const Status = () => {
    const r = useRecordContext();
    if (!r) return null;
    if (sperret(r)) return <Chip size="small" color="error" label="Sperret" />;
    if (!r.bekreftet) return <Chip size="small" label={r.invitert ? 'Invitert' : 'Ikke bekreftet'} />;
    return <Chip size="small" color="success" label="Aktiv" />;
};

export const BrukerListe = () => (
    <List filters={[<SearchInput source="q" alwaysOn placeholder="Søk på e-post" key="q" />]}
        actions={<BrukerListeHandlinger />} sort={{ field: 'opprettet', order: 'DESC' }} perPage={25}>
        <Datagrid rowClick="show" bulkActionButtons={false}>
            <TextField source="email" label="E-post" />
            <FunctionField label="Status" render={() => <Status />} />
            <DateField source="opprettet" label="Opprettet" />
            <DateField source="sist_innlogget" label="Sist innlogget" showTime />
        </Datagrid>
    </List>
);

const Handlinger = () => {
    const r = useRecordContext();
    const notify = useNotify();
    const refresh = useRefresh();
    const [update, { isPending }] = useUpdate();
    if (!r) return null;

    const sperr = () =>
        update('brukere', { id: r.id, data: { sperret: !sperret(r) }, previousData: r },
            {
                onSuccess: () => notify(sperret(r) ? 'Sperren er opphevet' : 'Brukeren er sperret'),
                onError: (e) => notify((e as Error).message, { type: 'error' }),
            });
    const nyttPassord = async () => {
        try {
            await brukeradmin('nytt_passord', { id: r.id });
            notify(`Lenke for nytt passord er sendt til ${r.email}`);
            refresh();
        } catch (e) {
            notify((e as Error).message, { type: 'error' });
        }
    };

    return (
        <TopToolbar>
            <Button onClick={nyttPassord}>Send lenke for nytt passord</Button>
            <Button onClick={sperr} disabled={isPending} color={sperret(r) ? 'primary' : 'warning'}>
                {sperret(r) ? 'Opphev sperren' : 'Sperr'}
            </Button>
            <DeleteWithConfirmButton
                confirmTitle={`Slette ${r.email}?`}
                confirmContent="Brukeren, rollene og abonnementene slettes. Det kan ikke angres." />
        </TopToolbar>
    );
};

export const BrukerVis = () => (
    <Show actions={<Handlinger />}>
        <SimpleShowLayout>
            <TextField source="email" label="E-post" />
            <FunctionField label="Status" render={() => <Status />} />
            <DateField source="opprettet" label="Opprettet" showTime />
            <DateField source="bekreftet" label="Bekreftet" showTime emptyText="–" />
            <DateField source="sist_innlogget" label="Sist innlogget" showTime emptyText="–" />
            <DateField source="sperret_til" label="Sperret til" emptyText="–" />
            <ReferenceManyField label="Roller" reference="medlemskap" target="user_id">
                <Datagrid bulkActionButtons={false} empty={<span>Ingen</span>}>
                    <ReferenceField source="kommune_id" reference="kommune" label="Kommune" />
                    <TextField source="rolle" label="Rolle" />
                </Datagrid>
            </ReferenceManyField>
            <ReferenceManyField label="Abonnement" reference="abonnement" target="user_id">
                <Datagrid bulkActionButtons={false} empty={<span>Ingen</span>}>
                    <ReferenceField source="kommune_id" reference="kommune" label="Kommune" />
                    <TextField source="produkt" label="Produkt" />
                    <DateField source="fra" label="Fra" />
                    <DateField source="til" label="Til" emptyText="–" />
                </Datagrid>
            </ReferenceManyField>
        </SimpleShowLayout>
    </Show>
);

export const BrukerInviter = () => (
    <Create title="Inviter bruker" redirect="show">
        <SimpleForm>
            <TextInput source="email" label="E-post" type="email" validate={[required(), email()]} />
            <p>Brukeren får en e-post med en lenke for å velge passord.</p>
        </SimpleForm>
    </Create>
);

export const BrukerListeHandlinger = () => (
    <TopToolbar>
        <CreateButton label="Inviter" />
    </TopToolbar>
);
