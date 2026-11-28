
import { createClient } from
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

import { auth } from "./firebase-config.js";

const SUPABASE_URL =
    "https://zhrjpdahqesjlzkovggq.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_u5_rM0D-XmM_LFYYO_jHow_CDy7ELC6";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
        accessToken: async () => {
            const usuario = auth.currentUser;

            if (!usuario) return null;

            return await usuario.getIdToken();
        }
    }
);

export { supabase, SUPABASE_URL, SUPABASE_KEY };
