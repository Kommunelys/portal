import { combineDataProviders, type DataProvider } from 'react-admin';
import { supabaseDataProvider } from 'ra-supabase';
import { SUPABASE_NOKKEL, SUPABASE_URL, brukeradmin, supabase } from './supabase';

// Skjemaet portal i databasen. Views uten id-kolonne får primærnøklene sine her.
const portal = supabaseDataProvider({
    instanceUrl: SUPABASE_URL,
    apiKey: SUPABASE_NOKKEL,
    supabaseClient: supabase,
    schema: () => 'portal',
    primaryKeys: new Map([
        ['kommune', ['kommune_id']],
        ['produkt', ['produkt']],
        ['prosjektadmin', ['user_id']],
        ['medlemskap', ['user_id', 'kommune_id']],
        ['avvik', ['kommune_id', 'avvik']],
    ]),
});

// Brukerne ligger i Supabase Auth og hentes gjennom edge-funksjonen.
const brukere: DataProvider = {
    async getList(_resource, { pagination, sort, filter }) {
        const svar = await brukeradmin('liste', {
            side: pagination?.page ?? 1,
            per_side: pagination?.perPage ?? 25,
            sorter: sort?.field,
            retning: sort?.order,
            sok: filter?.q,
        });
        return { data: svar.data, total: svar.total };
    },
    async getOne(_resource, { id }) {
        return { data: (await brukeradmin('hent', { id })).data };
    },
    async getMany(_resource, { ids }) {
        return { data: (await brukeradmin('hent_flere', { ider: ids })).data };
    },
    async getManyReference() {
        return { data: [], total: 0 };
    },
    async create(_resource, { data }) {
        return { data: (await brukeradmin('inviter', { email: data.email })).data };
    },
    async update(_resource, { id, data }) {
        // Sperring er den eneste endringen som gjøres som update.
        const handling = data.sperret ? 'sperr' : 'aapne';
        return { data: (await brukeradmin(handling, { id })).data };
    },
    async updateMany() {
        throw new Error('Ikke støttet');
    },
    async delete(_resource, { id }) {
        return { data: (await brukeradmin('slett', { id })).data };
    },
    async deleteMany(_resource, { ids }) {
        for (const id of ids) await brukeradmin('slett', { id });
        return { data: ids };
    },
};

export const dataProvider = combineDataProviders((resource) =>
    resource === 'brukere' ? brukere : portal
);
