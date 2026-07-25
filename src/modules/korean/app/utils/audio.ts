// Runtime audio: speechSynthesis with ko-KR voices (specs/04 §Tier 2).
// Local on-device synthesis — no network involved. The minimal-pair drill
// wants ≥3 distinct voices; we cycle whatever ko voices the OS provides and
// fall back gracefully to one (pregenerated clips arrive post-v0 via gen-audio).

let cachedVoices: SpeechSynthesisVoice[] = [];

function koVoices(): SpeechSynthesisVoice[] {
  if (typeof speechSynthesis === 'undefined') return [];
  const all = speechSynthesis.getVoices();
  if (all.length > 0) cachedVoices = all.filter((v) => v.lang.toLowerCase().startsWith('ko'));
  return cachedVoices;
}

// iOS populates voices asynchronously — warm the cache when they arrive.
if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.addEventListener?.('voiceschanged', () => koVoices());
  koVoices();
}

/** Speak Korean text. voiceIndex cycles the available ko voices (minimal pairs). */
export function speakKorean(text: string, opts?: { rate?: number; voiceIndex?: number }): void {
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  utterance.rate = opts?.rate ?? 1.0;
  const voices = koVoices();
  if (voices.length > 0) {
    const voice = voices[(opts?.voiceIndex ?? 0) % voices.length];
    if (voice) utterance.voice = voice;
  }
  speechSynthesis.speak(utterance);
}

export const koreanVoiceCount = (): number => koVoices().length;
