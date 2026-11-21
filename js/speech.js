import config from '../data/config.js';

// Výslovnosť cez hlas prehliadača. Keď nie je k dispozícii, ticho nerobí nič.
let voice = null;
let seq = 0; // číslo bežiacej sekvencie; nové prehrávanie ju zruší

function findVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  const base = config.speechLang.slice(0, 2).toLowerCase();
  voice = vs.find((v) => v.lang === config.speechLang) || vs.find((v) => v.lang && v.lang.toLowerCase().startsWith(base)) || null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  findVoice();
  speechSynthesis.addEventListener?.('voiceschanged', findVoice);
}

function say(text, rate, onend) {
  if (!('speechSynthesis' in window)) { onend?.(); return; }
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[«»]/g, ''));
    u.lang = config.speechLang;
    if (voice) u.voice = voice;
    u.rate = rate;
    if (onend) { u.onend = onend; u.onerror = onend; }
    speechSynthesis.speak(u);
  } catch { onend?.(); }
}

export function speak(text, { rate = 0.88, onend } = {}) {
  seq++;
  say(text, rate, onend);
}

// Prehrá za sebou texty a pauzy: ['Hello.', 400, 'B', 'R'] (číslo = pauza v ms).
export function speakSeq(parts, { rate = 0.88, onend } = {}) {
  const id = ++seq;
  let i = 0;
  const step = () => {
    if (id !== seq) return;
    if (i >= parts.length) { onend?.(); return; }
    const p = parts[i++];
    if (typeof p === 'number') setTimeout(step, p);
    else say(p, rate, step);
  };
  step();
}

// Rozpoznávanie reči (Chrome, Edge, Safari, Android). Vo Firefoxe nie je – hra vtedy ponúkne náhradu.
const Recognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
export const canListen = () => !!Recognition;

// Vypočuje jednu vetu. onresult dostane pole možností (najpravdepodobnejšia prvá).
// Vráti funkciu na zastavenie.
export function listen({ onresult, onerror, onend } = {}) {
  if (!Recognition) { onerror?.('unsupported'); onend?.(); return () => {}; }
  stopSpeech();
  const r = new Recognition();
  r.lang = config.speechLang;
  r.interimResults = false;
  r.maxAlternatives = 5;
  r.onresult = (e) => onresult?.([...e.results[0]].map((a) => a.transcript));
  r.onerror = (e) => onerror?.(e.error);
  r.onend = () => onend?.();
  try { r.start(); } catch { onerror?.('start'); onend?.(); }
  return () => { try { r.abort(); } catch { /* nič */ } };
}

export function stopSpeech() {
  seq++;
  try { speechSynthesis.cancel(); } catch { /* nič */ }
}
