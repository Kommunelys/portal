import { useRef, useState } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Box, useTheme } from '@mui/material';

// Offentlig, som nøkkelen i supabase.ts. Hemmeligheten ligger bare i Supabase
// (Authentication › Attack Protection). Hostnavnene som godtas, står hos hCaptcha:
// portal.kommunelys.no, og lokal.kommunelys.no for å prøve lokalt.
const SITEKEY = '337cee28-f138-4f2a-b7ce-89383072d10e';

// Supabase krever captcha ved registrering, innlogging og glemt passord.
// Svaret fra captchaen kan bare brukes én gang, så den nullstilles etter
// hvert forsøk.
export function useCaptcha() {
    const ref = useRef<HCaptcha>(null);
    const [token, settToken] = useState<string | null>(null);
    const tema = useTheme();

    const felt = (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <HCaptcha
                ref={ref}
                sitekey={SITEKEY}
                languageOverride="no"
                theme={tema.palette.mode}
                onVerify={settToken}
                onExpire={() => settToken(null)}
                onError={() => settToken(null)}
            />
        </Box>
    );

    const nullstill = () => {
        ref.current?.resetCaptcha();
        settToken(null);
    };

    return { token, felt, nullstill };
}

export const MANGLER_CAPTCHA = 'Kryss av i boksen «Jeg er et menneske» først.';

// Feilmeldingene fra Supabase er på engelsk. De vanligste på norsk.
export function feilmelding(e: unknown): string {
    const m = (e as { message?: string } | null)?.message ?? String(e);
    if (/captcha/i.test(m)) return 'Captchaen ble ikke godkjent. Prøv igjen.';
    if (/invalid login credentials/i.test(m)) return 'Feil e-post eller passord.';
    if (/email not confirmed/i.test(m)) {
        return 'E-postadressen er ikke bekreftet ennå. Trykk på lenken i e-posten fra oss.';
    }
    return m;
}
