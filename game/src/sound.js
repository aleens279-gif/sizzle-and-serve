// Tiny WebAudio blips, synthesized in code (no audio files): a click when an ingredient
// lands, a chime when a dish is served, a low buzz when one is trashed or walks out.
// The context is created on the first user gesture, so it never fights autoplay rules.
export function createSound() {
  let ctx = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, seconds, type = 'sine', gain = 0.12, when = 0) {
    const audio = ensure();
    if (!audio) return;
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    const t0 = audio.currentTime + when;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    osc.connect(amp);
    amp.connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  return {
    /** Call from any user gesture so the context is allowed to start. */
    unlock() {
      ensure();
    },
    add() {
      tone(520, 0.07, 'triangle', 0.08);
    },
    serve() {
      tone(660, 0.1, 'sine', 0.12);
      tone(880, 0.14, 'sine', 0.12, 0.09);
    },
    bad() {
      tone(160, 0.22, 'sawtooth', 0.07);
    },
    fail() {
      tone(220, 0.16, 'sawtooth', 0.08);
      tone(180, 0.24, 'sawtooth', 0.08, 0.14);
    },
    spawn() {
      tone(740, 0.06, 'sine', 0.05);
    },
  };
}
