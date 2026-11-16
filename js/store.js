// Pokrok hráča v localStorage. Keď úložisko nefunguje, hra beží ďalej, len si nič nepamätá.
const KEY = 'impattozero.v1';
const fresh = () => ({ lesson: '6a', best: {}, stars: {}, read: {}, hard: [], streak: { day: '', n: 0 }, font: 2 });

let s = fresh();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) s = { ...fresh(), ...JSON.parse(raw) };
} catch { /* súkromné okno a pod. */ }

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* nič */ }
}

const dayStr = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

function touchStreak() {
  const today = dayStr(new Date());
  if (s.streak.day === today) return;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  s.streak = { day: today, n: s.streak.day === dayStr(y) ? s.streak.n + 1 : 1 };
}

export const store = {
  get lesson() { return s.lesson; },
  set lesson(id) { s.lesson = id; save(); },
  get font() { return s.font; },
  set font(n) { s.font = n; save(); },

  best: (k) => s.best[k] || 0,
  stars: (k) => s.stars[k] || 0,
  // Zapíše výsledok hry; vráti true, ak je to nový rekord.
  record(k, score, stars) {
    const isBest = score > (s.best[k] || 0);
    if (isBest) s.best[k] = score;
    if (stars > (s.stars[k] || 0)) s.stars[k] = stars;
    touchStreak();
    save();
    return isBest;
  },

  isRead: (k) => !!s.read[k],
  markRead(k) { s.read[k] = true; touchStreak(); save(); },

  streak() {
    const today = dayStr(new Date());
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return s.streak.day === today || s.streak.day === dayStr(y) ? s.streak.n : 0;
  },

  hard: () => s.hard,
  isHard: (id) => s.hard.some((w) => w.id === id),
  toggleHard(word) {
    const i = s.hard.findIndex((w) => w.id === word.id);
    if (i >= 0) s.hard.splice(i, 1);
    else s.hard.unshift(word);
    save();
    return i < 0;
  },
};
