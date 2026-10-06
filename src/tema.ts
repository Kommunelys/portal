import { defaultDarkTheme, defaultLightTheme, type RaThemeOptions } from 'react-admin';
import { deepmerge } from '@mui/utils';

// Fargene og skriften fra nettstedet (bygg/mal/stil.css i website-repoet),
// så portalen ser ut som resten av Kommunelys. Lys blå (#60A5FA) er pynt,
// aldri tekst (ADR-016); lenker og knapper bruker lenkefargen.
const FARGER = {
    lys: {
        bg: '#FAF9F6', surface: '#FFFFFF', ink: '#1F2937', muted: '#646B76', line: '#E5E7EB',
        soft: '#F1F4F8', lenke: '#1F5FAD', good: '#22704A', bad: '#A33A2C', warn: '#8A5F0E',
    },
    mork: {
        bg: '#111827', surface: '#1F2937', ink: '#E5E7EB', muted: '#9CA3AF', line: '#374151',
        soft: '#1A2230', lenke: '#60A5FA', good: '#6CC496', bad: '#EE8F80', warn: '#E2B660',
    },
};
const LYS_BLA = '#60A5FA';
const FONT = '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// Merket som bakgrunnsbilde over innloggingsskjemaene, i stedet for hengelåsen.
const merke = (blekk: string) =>
    `url("data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M10.5 9 L31 14.5 V49.5 L10.5 55 Z" fill="none" stroke="${blekk}" stroke-width="3.5" stroke-linejoin="round"/><path d="M35.5 12 L54.5 4 V60 L35.5 52 Z" fill="${LYS_BLA}" stroke="${LYS_BLA}" stroke-width="1.5" stroke-linejoin="round"/></svg>`
    )}")`;

const tema = (base: RaThemeOptions, mode: 'light' | 'dark', f: typeof FARGER.lys): RaThemeOptions => {
    // Innloggingssidene (ra-supabase og react-admin): papirhvit bakgrunn,
    // merket og navnet øverst i kortet.
    const innlogging = {
        styleOverrides: {
            root: {
                backgroundImage: 'none',
                backgroundColor: f.bg,
                '& .RaLogin-card, & .RaAuthLayout-card': {
                    boxShadow: 'none', border: `1px solid ${f.line}`, borderRadius: 14, maxWidth: 400,
                },
                '& .RaLogin-avatar, & .RaAuthLayout-avatar': {
                    margin: '1.5em 1em .5em', flexDirection: 'column', alignItems: 'center', gap: 8,
                    '&::after': {
                        content: '"Kommunelys"', fontWeight: 700, fontSize: 23, letterSpacing: '-.03em',
                        color: f.ink,
                    },
                },
                '& .RaLogin-icon, & .RaAuthLayout-icon': {
                    backgroundColor: 'transparent', backgroundImage: merke(f.ink),
                    backgroundSize: 'contain', backgroundRepeat: 'no-repeat', width: 44, height: 44,
                    '& svg': { display: 'none' },
                },
            },
        },
    };
    return deepmerge(base, {
        palette: {
            mode,
            primary: { main: f.lenke },
            secondary: { main: f.ink },
            background: { default: f.bg, paper: f.surface },
            text: { primary: f.ink, secondary: f.muted },
            divider: f.line,
            error: { main: f.bad },
            success: { main: f.good },
            warning: { main: f.warn },
        },
        typography: { fontFamily: FONT },
        shape: { borderRadius: 10 },
        sidebar: { width: 220 },
        components: {
            MuiAppBar: {
                styleOverrides: {
                    root: { backgroundColor: f.bg, color: f.ink, boxShadow: 'none', borderBottom: `1px solid ${f.line}` },
                },
            },
            MuiCard: { styleOverrides: { root: { boxShadow: 'none', border: `1px solid ${f.line}` } } },
            MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
            MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
            RaMenuItemLink: {
                styleOverrides: {
                    root: {
                        borderLeft: '3px solid transparent',
                        '&.RaMenuItemLink-active': { borderLeftColor: LYS_BLA, fontWeight: 700, color: f.ink },
                    },
                },
            },
            RaLogin: innlogging,
            RaAuthLayout: innlogging,
        } as any,
    } as RaThemeOptions);
};

export const lystTema = tema(defaultLightTheme, 'light', FARGER.lys);
export const morktTema = tema(defaultDarkTheme, 'dark', FARGER.mork);
