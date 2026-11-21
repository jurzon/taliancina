// Hodnotenie písania cez AI. Kľúč nie je v prehliadači: požiadavka ide na vlastný server
// (Cloudflare Worker v priečinku ai-proxy/), ktorého adresa je v config.ai.url.
// Keď adresa chýba alebo server neodpovie, vráti null a hra ponúkne sebahodnotenie.
import config from '../data/config.js';

export const canAssess = () => !!config.ai?.url;

async function post(path, payload, ms) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(config.ai.url.replace(/\/assess$/, path), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lang: config.ai.lang, ...payload }),
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

// Je odpoveď správna, aj keď sa líši od vzoru? → { ok, note, better } | { error } | null
// sk: zadanie po slovensky, t: vzorová veta, alt: iné vzorové znenia, answer: čo hráč napísal.
export async function checkAnswer({ sk, t, alt, answer }) {
  if (!canAssess()) return null;
  const res = await post('/check', { sk, t, alt, answer }, 20000);
  return res && !res.error && typeof res.ok === 'boolean' ? res : null;
}

// → { score, summary, corrections: [{ wrong, right, why }], used: [], better } | { error } | null
export async function assessWriting({ task, must, text }) {
  if (!canAssess()) return null;
  return post('/assess', { task, must, text }, 60000);
}
