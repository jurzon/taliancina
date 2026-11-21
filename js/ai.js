// Hodnotenie písania cez AI. Kľúč nie je v prehliadači: požiadavka ide na vlastný server
// (Cloudflare Worker v priečinku ai-proxy/), ktorého adresa je v config.ai.url.
// Keď adresa chýba alebo server neodpovie, vráti null a hra ponúkne sebahodnotenie.
import config from '../data/config.js';

export const canAssess = () => !!config.ai?.url;

// → { score, summary, corrections: [{ wrong, right, why }], used: [], better } | { error } | null
export async function assessWriting({ task, must, text }) {
  if (!canAssess()) return null;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 60000);
  try {
    const r = await fetch(config.ai.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lang: config.ai.lang, task, must, text }),
      signal: ctl.signal,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { error: data.error || `Server odpovedal chybou ${r.status}.` };
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
