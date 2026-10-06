import { Title, useGetList } from 'react-admin';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';

// Driftssiden bygges av nettstedet ved hver kjøring og lagres i databasen
// (drift.side). Den vises uendret, i en sandkasse.
export const Drift = () => {
    const { data, isPending, error } = useGetList('drift_side', {
        pagination: { page: 1, perPage: 1 },
    });
    const side = data?.[0];

    return (
        <Box sx={{ mt: 2 }}>
            <Title title="Drift" />
            {isPending && <CircularProgress />}
            {error && <Alert severity="error">{String((error as Error).message)}</Alert>}
            {!isPending && !error && !side && (
                <Alert severity="info">Ingen driftsside er lagret ennå. Den lagres ved neste bygg.</Alert>
            )}
            {side && (
                <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Bygget {new Date(side.bygget).toLocaleString('nb-NO')}
                    </Typography>
                    <iframe
                        title="Driftssiden"
                        srcDoc={side.html}
                        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
                        style={{ width: '100%', height: 'calc(100vh - 160px)', border: 0, background: '#fff' }}
                    />
                </>
            )}
        </Box>
    );
};

Drift.path = '/drift';
