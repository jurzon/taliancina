import config from '../data/config.js';

// Výslovnosť cez hlas prehliadača. Keď nie je k dispozícii, ticho nerobí nič.
let voice = null;

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

export function speak(text) {
  if (!('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[«»]/g, ''));
    u.lang = config.speechLang;
    if (voice) u.voice = voice;
    u.rate = 0.88;
    speechSynthesis.speak(u);
  } catch { /* bez zvuku */ }
}
