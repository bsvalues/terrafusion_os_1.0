// TerraFusion Sonic Codex — WebAudio implementation
export class TerraAudio {
  private ac!: AudioContext;
  private tokens: any;
  private heartbeatId?: number;

  async load(tokens: any) {
    this.tokens = tokens;
    this.ac = new AudioContext();
  }

  boot() {
    const { baseHz, bootChord } = this.tokens;
    bootChord.forEach((semi: number, i: number) => {
      const f = baseHz * Math.pow(2, semi / 12);
      this.playTone(f, this.ac.currentTime + i * 0.09, 0.5 + i * 0.1, i === 2 ? 'sine' : 'triangle', 0.18);
    });
  }

  notify() {
    const { baseHz, notifyChord } = this.tokens;
    notifyChord.forEach((semi: number, i: number) => {
      const f = baseHz * Math.pow(2, semi / 12);
      this.playTone(f, this.ac.currentTime + i * 0.05, 0.2, 'sine', 0.12);
    });
  }

  error() {
    const { baseHz, errorChord } = this.tokens;
    errorChord.forEach((semi: number, i: number) => {
      const f = baseHz * Math.pow(2, semi / 12);
      this.playTone(f, this.ac.currentTime + i * 0.04, 0.3, 'sawtooth', 0.15);
    });
  }

  heartbeat(enable: boolean) {
    if (this.heartbeatId) clearInterval(this.heartbeatId);
    if (enable) {
      this.heartbeatId = window.setInterval(() => {
        const f = this.tokens.baseHz;
        this.playTone(f, this.ac.currentTime, 0.08, 'sine', 0.06);
      }, 3000);
    }
  }

  private playTone(freq: number, t0: number, dur: number, type: OscillatorType = 'sine', gain = 0.15) {
    const osc = this.ac.createOscillator();
    const gainNode = this.ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gainNode.gain.value = gain;
    osc.connect(gainNode).connect(this.ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
    gainNode.gain.setTargetAtTime(0, t0 + dur * 0.8, 0.05);
  }
}

