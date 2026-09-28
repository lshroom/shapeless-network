// Shared audio engine. Effects subscribe by reading the same exported `audio` object.
// No idle synth — if there's no source connected, freq/time are zeros (effects show flat).

const AC = new (window.AudioContext || window.webkitAudioContext)();
const master = AC.createGain(); master.gain.value = 0.85; master.connect(AC.destination);
const analyser = AC.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.8;
const freq = new Uint8Array(analyser.frequencyBinCount);
const time = new Uint8Array(analyser.frequencyBinCount);

let audioEl = null, sourceNode = null, micStream = null, micSource = null;
let prevBass = 0;

export const audio = {
  ctx: AC,
  analyser, freq, time,
  bass: 0, mid: 0, high: 0, kick: 0, rms: 0,
  hasSource() { return !!(sourceNode || micSource); },
  setMasterVolume(v) { master.gain.value = v; },
  async loadFile(file) {
    if (AC.state === 'suspended') await AC.resume();
    if (audioEl) { audioEl.pause(); audioEl.remove(); }
    this.detachMic();
    audioEl = new Audio(URL.createObjectURL(file));
    audioEl.loop = true; audioEl.crossOrigin = 'anonymous';
    await new Promise(r => audioEl.addEventListener('canplay', r, { once: true }));
    if (sourceNode) try { sourceNode.disconnect(); } catch (_) {}
    sourceNode = AC.createMediaElementSource(audioEl);
    sourceNode.connect(analyser); analyser.connect(master);
    return audioEl;
  },
  play() { audioEl?.play(); },
  pause() { audioEl?.pause(); },
  isPaused() { return audioEl ? audioEl.paused : true; },
  hasFile() { return !!audioEl; },
  async attachMic() {
    if (AC.state === 'suspended') await AC.resume();
    if (micSource) return false;
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micSource = AC.createMediaStreamSource(micStream);
    micSource.connect(analyser); // not to master — avoid feedback
    return true;
  },
  detachMic() {
    if (micSource) try { micSource.disconnect(); } catch (_) {}
    if (micStream) micStream.getTracks().forEach(t => t.stop());
    micSource = null; micStream = null;
  },
  read() {
    analyser.getByteFrequencyData(freq);
    analyser.getByteTimeDomainData(time);
    const avg = (lo, hi) => {
      let s = 0, n = 0;
      for (let i = lo; i <= hi && i < freq.length; i++) { s += freq[i]; n++; }
      return n ? s / n / 255 : 0;
    };
    prevBass = this.bass;
    this.bass = avg(2, 8);
    this.mid  = avg(40, 120);
    this.high = avg(200, 500);
    this.kick = Math.max(0, this.bass - prevBass) * 4;
    let s = 0;
    for (let i = 0; i < time.length; i++) { const v = (time[i] - 128) / 128; s += v * v; }
    this.rms = Math.sqrt(s / time.length);
  },
};
