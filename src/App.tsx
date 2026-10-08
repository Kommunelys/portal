import {
    Admin, AppBar, CustomRoutes, Layout, Menu, Resource, Title, TitlePortal, useGetList, usePermissions,
    type LayoutProps,
} from 'react-admin';
import { Route } from 'react-router-dom';
import { LoginPage, SetPasswordPage } from 'ra-supabase';
import { Box, Card, CardContent, Link, List, ListItem, Typography } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SummarizeIcon from '@mui/icons-material/Summarize';
import FeedbackIcon from '@mui/icons-material/Feedback';

import { authProvider } from './authProvider';
import { dataProvider } from './dataProvider';
import { i18nProvider } from './i18n';
import { lystTema, morktTema } from './tema';
import { NETTSTED, erVurderer, minKonto, tilbake, viaNettstedet, type Meg } from './supabase';
import { Registrer } from './sider/Registrer';
import { GlemtPassord, InnloggingSkjema } from './sider/Innlogging';
import { Bekreft } from './sider/Bekreft';
import { MinKonto } from './sider/MinKonto';
import { Drift } from './sider/Drift';
import { Meld } from './sider/Meld';
import { BrukerInviter, BrukerListe, BrukerVis } from './ressurser/brukere';
import { AbonnementEndre, AbonnementListe, AbonnementNy, RolleEndre, RolleListe, RolleNy } from './ressurser/tilgang';
import { AvvikListe, AvvikVis } from './ressurser/avvik';
import { SammendragListe, SammendragVis } from './ressurser/sammendrag';
import { MeldingListe, MeldingVis } from './ressurser/feilmeldinger';

// Menyene styres av portal.meg(). Tilgangen håndheves i databasen.
const Meny = () => {
    const { permissions } = usePermissions<Meg>();
    const admin = permissions?.er_prosjektadmin;
    const vurderer = erVurderer(permissions);
    return (
        <Menu>
            <Menu.DashboardItem primaryText="Oversikt" />
            {vurderer && <Menu.ResourceItem name="feilmelding" />}
            {vurderer && <Menu.ResourceItem name="sammendrag_holdt" />}
            {vurderer && <Menu.ResourceItem name="avvik" />}
            {admin && <Menu.ResourceItem name="brukere" />}
            {admin && <Menu.ResourceItem name="medlemskap" />}
            {admin && <Menu.ResourceItem name="abonnement" />}
            {admin && <Menu.Item to={Drift.path} primaryText="Drift" leftIcon={<MonitorHeartIcon />} />}
            <Menu.Item to={MinKonto.path} primaryText="Min konto" leftIcon={<AccountCircleIcon />} />
        </Menu>
    );
};

// Toppen som på nettstedet: merket og navnet, som lenker dit, og «Portal».
const Merke = () => (
    <Box component="a" href={NETTSTED} title="Til kommunelys.no"
        onClick={async (e: React.MouseEvent) => {
            e.preventDefault();
            window.location.assign(viaNettstedet(NETTSTED, await minKonto()));
        }}
        sx={{ display: 'inline-flex', alignItems: 'center', gap: '9px', color: 'inherit', textDecoration: 'none', mr: 2 }}>
        <svg viewBox="0 0 64 64" width="30" height="30" aria-hidden="true" focusable="false">
            <path d="M10.5 9 L31 14.5 V49.5 L10.5 55 Z" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M35.5 12 L54.5 4 V60 L35.5 52 Z" fill="#60A5FA" stroke="#60A5FA" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <Typography component="span" sx={{ fontSize: 21, fontWeight: 700, letterSpacing: '-.03em' }}>
            Kommunelys
        </Typography>
        <Typography component="span" sx={{
            fontSize: 13, fontWeight: 600, border: 1, borderColor: 'divider', borderRadius: 999,
            px: 1.2, py: 0.2, ml: 0.5,
        }}>
            Portal
        </Typography>
    </Box>
);

const Topp = () => (
    <AppBar color="inherit">
        <Merke />
        <TitlePortal variant="body1" sx={{ color: 'text.secondary' }} />
    </AppBar>
);

const Oppsett = (props: LayoutProps) => <Layout {...props} menu={Meny} appBar={Topp} />;

// Hvor mange som venter på vurdering i kommunene brukeren vurderer.
const Venter = ({ ressurs, filter, tekst }: { ressurs: string; filter: object; tekst: string }) => {
    const { total } = useGetList(ressurs, { filter, pagination: { page: 1, perPage: 1 } });
    return (
        <ListItem disablePadding>
            <Link href={`/${ressurs}`}>{tekst}: {total ?? '…'}</Link>
        </ListItem>
    );
};

const TilVurdering = () => (
    <>
        <Typography sx={{ mt: 2 }}>Venter på vurdering:</Typography>
        <List dense>
            <Venter ressurs="feilmelding" filter={{ avgjorelse: 'ikke_vurdert' }} tekst="Meldinger om feil" />
            <Venter ressurs="sammendrag_holdt" filter={{ avgjorelse: 'ikke_vurdert' }} tekst="Sammendrag" />
            <Venter ressurs="avvik" filter={{ aktiv: true, 'avgjorelse@is': null }} tekst="Avvik i stemmene" />
        </List>
        <Typography variant="body2" color="text.secondary">
            Vurderingene slår inn på nettstedet ved neste kjøring, hverdager tidlig om morgenen.
        </Typography>
    </>
);

const Oversikt = () => {
    const { permissions } = usePermissions<Meg>();
    return (
        <Card sx={{ mt: 2 }}>
            <Title title="Kommunelys" />
            <CardContent>
                <Typography variant="h5" gutterBottom>Kommunelys-portalen</Typography>
                {permissions?.er_prosjektadmin ? (
                    <Typography>
                        Her administrerer du brukere, roller og abonnement, vurderer det som venter og
                        ser driften. Kommunene med begrenset innsyn ser bare de som har en rolle for
                        kommunen (også leser) og prosjektadmin.
                    </Typography>
                ) : erVurderer(permissions) ? (
                    <Typography>
                        Du vurderer saker for kommunen: meldinger om feil, sammendrag som er holdt
                        tilbake, og avvik i stemmene. Innholdet endres aldri for hånd; du avgjør om noe
                        vises, og kan skrive en kort merknad.
                    </Typography>
                ) : (
                    <Typography>
                        Du er logget inn. Det meste på <Link href="https://kommunelys.no/">kommunelys.no</Link> er
                        åpent for alle. Noen kommuner har begrenset innsyn mens vi prøver dem ut; dem ser du
                        om du har fått tilgang. Under «Min konto» kan du bytte passord og e-post eller slette
                        kontoen.
                    </Typography>
                )}
                {erVurderer(permissions) && <TilVurdering />}
            </CardContent>
        </Card>
    );
};

const Innlogging = () => (
    <LoginPage>
        <InnloggingSkjema />
        <Typography variant="body2" align="center" sx={{ pb: 1 }}>
            <Link href={Registrer.path}>Ny bruker? Registrer deg</Link>
        </Typography>
        <Typography variant="body2" align="center" sx={{ pb: 2 }}>
            <Link href={tilbake() ?? 'https://kommunelys.no/'}>Tilbake til kommunelys.no</Link>
        </Typography>
    </LoginPage>
);

export const App = () => (
    <Admin
        title="Kommunelys"
        theme={lystTema}
        darkTheme={morktTema}
        dataProvider={dataProvider}
        authProvider={authProvider}
        i18nProvider={i18nProvider}
        loginPage={Innlogging}
        layout={Oppsett}
        dashboard={Oversikt}
        disableTelemetry
    >
        {(permissions: Meg) => (
            <>
                {permissions?.er_prosjektadmin && (
                    <>
                        <Resource name="brukere" options={{ label: 'Brukere' }} icon={PeopleIcon}
                            list={BrukerListe} show={BrukerVis} create={BrukerInviter}
                            recordRepresentation="email" />
                        <Resource name="medlemskap" options={{ label: 'Roller' }} icon={BadgeIcon}
                            list={RolleListe} create={RolleNy} edit={RolleEndre} />
                        <Resource name="abonnement" options={{ label: 'Abonnement' }} icon={CardMembershipIcon}
                            list={AbonnementListe} create={AbonnementNy} edit={AbonnementEndre} />
                        <Resource name="drift_side" />
                        <CustomRoutes>
                            <Route path={Drift.path} element={<Drift />} />
                        </CustomRoutes>
                    </>
                )}
                {erVurderer(permissions) && (
                    <>
                        <Resource name="sammendrag_holdt" options={{ label: 'Sammendrag' }} icon={SummarizeIcon}
                            list={SammendragListe} show={SammendragVis} recordRepresentation="sak_tittel" />
                        <Resource name="avvik" options={{ label: 'Avvik i stemmene' }} icon={ReportProblemIcon}
                            list={AvvikListe} show={AvvikVis} recordRepresentation="beskrivelse" />
                        <Resource name="vurdering" />
                        <Resource name="sammendrag_vurdering" />
                        <Resource name="feilmelding_vurdering" />
                    </>
                )}
                {/* Alle kan melde om feil og se sine egne meldinger; vurderere ser alle i kommunen. */}
                <Resource name="feilmelding" options={{ label: 'Meldinger om feil' }} icon={FeedbackIcon}
                    {...(erVurderer(permissions) ? { list: MeldingListe, show: MeldingVis } : {})}
                    recordRepresentation="sak_tittel" />
                <Resource name="kommune" recordRepresentation="navn" />
                <Resource name="produkt" recordRepresentation="beskrivelse" />
                <CustomRoutes>
                    <Route path={MinKonto.path} element={<MinKonto />} />
                    <Route path={Meld.path} element={<Meld />} />
                </CustomRoutes>
                <CustomRoutes noLayout>
                    <Route path={SetPasswordPage.path} element={<SetPasswordPage />} />
                    <Route path={GlemtPassord.path} element={<GlemtPassord />} />
                    <Route path={Registrer.path} element={<Registrer />} />
                    <Route path={Bekreft.path} element={<Bekreft />} />
                </CustomRoutes>
            </>
        )}
    </Admin>
);
