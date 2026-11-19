type MusicMode = 'off' | 'menu' | 'action' | 'paused' | 'victory';

class SoundFX {
  private ctx: AudioContext | null = null;
  private unlocked = false;
  public muted = false;

  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private musicMode: MusicMode = 'menu';
  private musicTimer: number | null = null;
  private nextNoteTime = 0;
  private stepIndex = 0;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return;
        if (document.hidden) {
          this.ctx.suspend().catch(() => {});
        } else if (!this.muted) {
          this.ctx.resume().catch(() => {});
          this.nextNoteTime = this.ctx.currentTime + 0.05;
        }
      });
    }
  }

  private ensureContext(allowWhenMuted = false): AudioContext | null {
    if (this.muted && !allowWhenMuted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.004, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.16, this.ctx.currentTime);
        this.compressor.connect(this.ctx.destination);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : 1;
        this.masterGain.connect(this.compressor);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.92;
        this.sfxGain.connect(this.masterGain);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value =
          this.musicMode === 'action'
            ? 0.13
            : this.musicMode === 'victory'
              ? 0.15
              : this.musicMode === 'menu'
                ? 0.085
                : 0.025;
        this.musicGain.connect(this.masterGain);

        // Reusable 0.5s white noise buffer for blaster transients, drums & impacts
        const sampleRate = this.ctx.sampleRate;
        const len = Math.floor(sampleRate * 0.5);
        const buf = this.ctx.createBuffer(1, len, sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buf;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended' && !this.muted) {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.unlocked) {
      try {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        this.unlocked = true;
      } catch {
        // Ignore if context is not yet ready
      }
    }
    this.ensureMusicLoop();
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.03);
    }
    if (!muted) {
      this.unlock();
    }
  }

  public setMusicMode(mode: MusicMode) {
    if ((mode === 'action' || mode === 'victory') && this.musicMode !== mode) {
      this.stepIndex = 0;
    }
    this.musicMode = mode;
    if (this.musicGain && this.ctx) {
      const target =
        mode === 'action'
          ? 0.13
          : mode === 'victory'
            ? 0.15
            : mode === 'menu'
              ? 0.085
              : 0.025;
      this.musicGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.14);
    }
    if (this.unlocked && !this.muted) {
      this.ensureMusicLoop();
    }
  }

  private ensureMusicLoop() {
    if (this.musicTimer !== null || typeof window === 'undefined') return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.nextNoteTime = ctx.currentTime + 0.06;
    this.musicTimer = window.setInterval(() => this.scheduleMusicSteps(), 70);
  }

  private scheduleMusicSteps() {
    if (this.muted || !this.ctx || !this.musicGain || this.musicMode === 'off') return;
    if (this.ctx.state !== 'running') return;
    if (this.musicMode === 'paused') {
      this.nextNoteTime = this.ctx.currentTime + 0.1;
      return;
    }

    const stepDur =
      this.musicMode === 'action' || this.musicMode === 'victory' ? 0.115 : 0.185;
    const lookahead = 0.22;

    if (this.nextNoteTime < this.ctx.currentTime - 0.3) {
      this.nextNoteTime = this.ctx.currentTime + 0.04;
    }

    // 8-bar E-minor cyber-heist progression: Em -> Em -> C -> C -> D -> D -> Bm -> C/D turnaround
    const chords: Array<{
      bass: number;
      triad: [number, number, number];
      arp: [number, number, number, number];
    }> = [
      { bass: 82.41, triad: [164.81, 196.0, 246.94], arp: [329.63, 392.0, 493.88, 659.25] }, // Bar 1: Em
      { bass: 82.41, triad: [164.81, 196.0, 246.94], arp: [329.63, 493.88, 587.33, 659.25] }, // Bar 2: Em7
      { bass: 65.41, triad: [130.81, 164.81, 196.0], arp: [261.63, 329.63, 392.0, 523.25] }, // Bar 3: C
      { bass: 65.41, triad: [130.81, 164.81, 196.0], arp: [261.63, 392.0, 493.88, 523.25] }, // Bar 4: Cmaj7
      { bass: 73.42, triad: [146.83, 185.0, 220.0], arp: [293.66, 369.99, 440.0, 587.33] }, // Bar 5: D
      { bass: 73.42, triad: [146.83, 185.0, 220.0], arp: [293.66, 440.0, 587.33, 659.25] }, // Bar 6: Dadd9
      { bass: 61.74, triad: [123.47, 146.83, 185.0], arp: [246.94, 293.66, 369.99, 493.88] }, // Bar 7: Bm
      { bass: 65.41, triad: [146.83, 185.0, 220.0], arp: [293.66, 369.99, 493.88, 587.33] }, // Bar 8: C -> D lift
    ];

    // Composed 8-bar heroic synthwave lead (0 = rest; Hz values in E natural minor)
    // Phrases build tension across bars 1-4 and soar on bars 5-8
    const leadMelody: number[][] = [
      [329.63, 0, 0, 392.0, 0, 0, 493.88, 0, 392.0, 0, 329.63, 0, 293.66, 0, 329.63, 0], // Bar 1
      [329.63, 0, 0, 493.88, 0, 0, 587.33, 0, 659.25, 0, 587.33, 0, 493.88, 0, 392.0, 0], // Bar 2
      [523.25, 0, 0, 493.88, 0, 0, 392.0, 0, 329.63, 0, 392.0, 0, 493.88, 0, 392.0, 0], // Bar 3
      [329.63, 0, 293.66, 0, 261.63, 0, 293.66, 0, 329.63, 0, 0, 0, 0, 0, 0, 0], // Bar 4
      [587.33, 0, 0, 659.25, 0, 0, 739.99, 0, 659.25, 0, 587.33, 0, 493.88, 0, 587.33, 0], // Bar 5
      [659.25, 0, 587.33, 0, 493.88, 0, 440.0, 0, 587.33, 0, 0, 659.25, 0, 739.99, 0, 0], // Bar 6
      [783.99, 0, 0, 739.99, 0, 0, 659.25, 0, 587.33, 0, 493.88, 0, 440.0, 0, 493.88, 0], // Bar 7
      [523.25, 0, 587.33, 0, 659.25, 0, 739.99, 0, 783.99, 0, 739.99, 0, 659.25, 0, 587.33, 0], // Bar 8
    ];

    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      const bar = Math.floor(this.stepIndex / 16) % chords.length;
      const step = this.stepIndex % 16;
      const t = this.nextNoteTime;
      const chord = chords[bar];
      const barBass = bar === 7 && step >= 8 ? 73.42 : chord.bass;

      if (this.musicMode === 'action') {
        // 1. SIDECHAINED SYNTHWAVE BASS (rolling 16ths with octave pop & kick ducking)
        const bassOsc = this.ctx.createOscillator();
        const subOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();

        const isOctave = step % 4 === 2 || step === 7 || step === 15;
        const isKickStep = step % 4 === 0;
        const bassFreq = isOctave ? barBass * 2 : barBass;

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, t);
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(barBass, t);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(isOctave ? 920 : 680, t);
        bassFilter.frequency.exponentialRampToValueAtTime(190, t + stepDur * 0.92);
        bassFilter.Q.setValueAtTime(2.4, t);

        const peak = isKickStep ? 0.14 : step % 2 === 0 ? 0.27 : 0.21;
        bassGain.gain.setValueAtTime(0.001, t);
        bassGain.gain.linearRampToValueAtTime(peak, t + (isKickStep ? 0.032 : 0.008));
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 0.95);

        bassOsc.connect(bassFilter);
        subOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.musicGain);

        bassOsc.start(t);
        subOsc.start(t);
        bassOsc.stop(t + stepDur * 1.02);
        subOsc.stop(t + stepDur * 1.02);

        // 2. WARM DETUNED CHORD PAD SWELL (bar start & mid-bar anchor)
        if (step === 0 || (bar === 7 && step === 8)) {
          const padDur = bar === 7 ? stepDur * 7.8 : stepDur * 15.5;
          const padFilter = this.ctx.createBiquadFilter();
          const padGain = this.ctx.createGain();
          padFilter.type = 'lowpass';
          padFilter.frequency.setValueAtTime(950, t);
          padFilter.frequency.linearRampToValueAtTime(1750, t + padDur * 0.45);
          padFilter.frequency.exponentialRampToValueAtTime(650, t + padDur);

          padGain.gain.setValueAtTime(0.001, t);
          padGain.gain.linearRampToValueAtTime(0.095, t + 0.08);
          padGain.gain.setValueAtTime(0.085, t + padDur * 0.7);
          padGain.gain.exponentialRampToValueAtTime(0.001, t + padDur);

          padFilter.connect(padGain);
          padGain.connect(this.musicGain);

          chord.triad.forEach((freq, idx) => {
            const o1 = this.ctx!.createOscillator();
            const o2 = this.ctx!.createOscillator();
            o1.type = 'sawtooth';
            o2.type = 'triangle';
            o1.frequency.setValueAtTime(freq, t);
            o2.frequency.setValueAtTime(freq * (idx % 2 === 0 ? 1.004 : 0.996), t);
            o1.connect(padFilter);
            o2.connect(padFilter);
            o1.start(t);
            o2.start(t);
            o1.stop(t + padDur + 0.04);
            o2.stop(t + padDur + 0.04);
          });
        }

        // 3. HEROIC CYBER-ACTION LEAD MELODY (detuned saw+triangle with singing sustain)
        const leadNote = leadMelody[bar][step];
        if (leadNote > 0) {
          // Determine how many empty steps follow for expressive note length
          let holdSteps = 1.6;
          if (step + 1 < 16 && leadMelody[bar][step + 1] === 0) {
            holdSteps = step + 2 < 16 && leadMelody[bar][step + 2] === 0 ? 3.2 : 2.1;
          }
          const noteDur = stepDur * holdSteps;

          const l1 = this.ctx.createOscillator();
          const l2 = this.ctx.createOscillator();
          const lFilter = this.ctx.createBiquadFilter();
          const lGain = this.ctx.createGain();

          l1.type = 'sawtooth';
          l2.type = 'sawtooth';
          l1.frequency.setValueAtTime(leadNote, t);
          l2.frequency.setValueAtTime(leadNote * 1.0055, t);

          lFilter.type = 'lowpass';
          lFilter.frequency.setValueAtTime(3400, t);
          lFilter.frequency.exponentialRampToValueAtTime(1150, t + noteDur);
          lFilter.Q.setValueAtTime(1.8, t);

          lGain.gain.setValueAtTime(0.001, t);
          lGain.gain.linearRampToValueAtTime(0.115, t + 0.014);
          lGain.gain.setValueAtTime(0.095, t + noteDur * 0.55);
          lGain.gain.exponentialRampToValueAtTime(0.001, t + noteDur);

          l1.connect(lFilter);
          l2.connect(lFilter);
          lFilter.connect(lGain);
          lGain.connect(this.musicGain);

          l1.start(t);
          l2.start(t);
          l1.stop(t + noteDur + 0.04);
          l2.stop(t + noteDur + 0.04);
        }

        // 4. SPARKLING OFF-BEAT CYBER ARPEGGIO (keeps futuristic pulse on non-melody 16ths)
        if (step % 2 === 1) {
          const arpFreq = chord.arp[(Math.floor(step / 2) + bar) % chord.arp.length];
          const arpOsc = this.ctx.createOscillator();
          const arpGain = this.ctx.createGain();
          arpOsc.type = 'triangle';
          arpOsc.frequency.setValueAtTime(arpFreq, t);
          arpGain.gain.setValueAtTime(0.001, t);
          arpGain.gain.linearRampToValueAtTime(0.055, t + 0.006);
          arpGain.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 1.15);
          arpOsc.connect(arpGain);
          arpGain.connect(this.musicGain);
          arpOsc.start(t);
          arpOsc.stop(t + stepDur * 1.2);
        }

        // 5. PUNCHY SYNTHWAVE DRUMS (Kick + Layered Snare + Open/Closed Hats + Bar Fill)
        if (step % 4 === 0 || (bar % 2 === 1 && step === 14)) {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(155, t);
          kickOsc.frequency.exponentialRampToValueAtTime(42, t + 0.095);
          kickGain.gain.setValueAtTime(step % 4 === 0 ? 0.5 : 0.34, t);
          kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          kickOsc.connect(kickGain);
          kickGain.connect(this.musicGain);
          kickOsc.start(t);
          kickOsc.stop(t + 0.13);
        }

        const isSnareFill = bar === 7 && (step === 13 || step === 15);
        if ((step === 4 || step === 12 || isSnareFill) && this.noiseBuffer) {
          const snareBody = this.ctx.createOscillator();
          const sbGain = this.ctx.createGain();
          snareBody.type = 'triangle';
          snareBody.frequency.setValueAtTime(195, t);
          snareBody.frequency.exponentialRampToValueAtTime(95, t + 0.07);
          sbGain.gain.setValueAtTime(isSnareFill ? 0.12 : 0.19, t);
          sbGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
          snareBody.connect(sbGain);
          sbGain.connect(this.musicGain);
          snareBody.start(t);
          snareBody.stop(t + 0.09);

          const snare = this.ctx.createBufferSource();
          snare.buffer = this.noiseBuffer;
          const bp = this.ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(2150, t);
          bp.Q.setValueAtTime(0.85, t);
          const sg = this.ctx.createGain();
          sg.gain.setValueAtTime(isSnareFill ? 0.14 : 0.24, t);
          sg.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          snare.connect(bp);
          bp.connect(sg);
          sg.connect(this.musicGain);
          snare.start(t);
          snare.stop(t + 0.13);
        }

        if (this.noiseBuffer && (step % 2 === 1 || step % 4 === 2)) {
          const isOpenHat = step % 4 === 2;
          const hat = this.ctx.createBufferSource();
          hat.buffer = this.noiseBuffer;
          const hp = this.ctx.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.setValueAtTime(isOpenHat ? 6600 : 8200, t);
          const hatGain = this.ctx.createGain();
          hatGain.gain.setValueAtTime(isOpenHat ? 0.075 : 0.045, t);
          hatGain.gain.exponentialRampToValueAtTime(0.001, t + (isOpenHat ? 0.07 : 0.025));
          hat.connect(hp);
          hp.connect(hatGain);
          hatGain.connect(this.musicGain);
          hat.start(t);
          hat.stop(t + (isOpenHat ? 0.075 : 0.03));
        }
      } else if (this.musicMode === 'victory') {
        // Intense 130 BPM Heroic E-Major Cyber-Synthwave Victory Anthem (matching gameplay intensity!)
        const vBar = bar % 4;
        const vChords: Array<{
          bass: number;
          triad: [number, number, number];
          arp: [number, number, number, number];
        }> = [
          { bass: 82.41, triad: [164.81, 207.65, 246.94], arp: [329.63, 415.3, 493.88, 659.25] }, // E
          { bass: 69.3, triad: [138.59, 164.81, 207.65], arp: [277.18, 329.63, 415.3, 554.37] }, // C#m
          { bass: 55.0, triad: [110.0, 138.59, 164.81], arp: [220.0, 277.18, 329.63, 440.0] }, // A
          { bass: 61.74, triad: [123.47, 155.56, 185.0], arp: [246.94, 311.13, 369.99, 493.88] }, // B
        ];
        const vc = vChords[vBar];

        // Triumphant heroic lead melody (4 bars x 16 steps)
        const victoryLead: number[][] = [
          [659.25, 0, 0, 739.99, 0, 0, 830.61, 0, 987.77, 0, 0, 830.61, 0, 739.99, 659.25, 0],
          [554.37, 0, 0, 659.25, 0, 0, 830.61, 0, 739.99, 0, 659.25, 0, 554.37, 0, 493.88, 0],
          [440.0, 0, 0, 554.37, 0, 0, 659.25, 0, 880.0, 0, 0, 830.61, 0, 739.99, 659.25, 0],
          [739.99, 0, 739.99, 0, 830.61, 0, 987.77, 0, 1108.73, 0, 987.77, 0, 830.61, 0, 739.99, 0],
        ];

        // 1. Driving sidechained 16th-note synthwave bassline
        const bassOsc = this.ctx.createOscillator();
        const subOsc = this.ctx.createOscillator();
        const bFilter = this.ctx.createBiquadFilter();
        const bGain = this.ctx.createGain();
        const isOct = step % 4 === 2 || step === 7 || step === 15;
        const isKick = step % 4 === 0;
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(isOct ? vc.bass * 2 : vc.bass, t);
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(vc.bass, t);
        bFilter.type = 'lowpass';
        bFilter.frequency.setValueAtTime(isOct ? 1050 : 760, t);
        bFilter.frequency.exponentialRampToValueAtTime(210, t + stepDur * 0.92);
        bFilter.Q.setValueAtTime(2.2, t);
        bGain.gain.setValueAtTime(0.001, t);
        bGain.gain.linearRampToValueAtTime(isKick ? 0.14 : 0.25, t + (isKick ? 0.03 : 0.008));
        bGain.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 0.95);
        bassOsc.connect(bFilter);
        subOsc.connect(bFilter);
        bFilter.connect(bGain);
        bGain.connect(this.musicGain);
        bassOsc.start(t);
        subOsc.start(t);
        bassOsc.stop(t + stepDur * 1.02);
        subOsc.stop(t + stepDur * 1.02);

        // 2. Soaring detuned power-chord pad
        if (step === 0) {
          const padDur = stepDur * 15.5;
          const pFilter = this.ctx.createBiquadFilter();
          const pGain = this.ctx.createGain();
          pFilter.type = 'lowpass';
          pFilter.frequency.setValueAtTime(1250, t);
          pFilter.frequency.linearRampToValueAtTime(2400, t + padDur * 0.5);
          pFilter.frequency.exponentialRampToValueAtTime(950, t + padDur);
          pGain.gain.setValueAtTime(0.001, t);
          pGain.gain.linearRampToValueAtTime(0.095, t + 0.06);
          pGain.gain.exponentialRampToValueAtTime(0.001, t + padDur);
          pFilter.connect(pGain);
          pGain.connect(this.musicGain);
          vc.triad.forEach((f, idx) => {
            const o1 = this.ctx!.createOscillator();
            const o2 = this.ctx!.createOscillator();
            o1.type = 'sawtooth';
            o2.type = 'triangle';
            o1.frequency.setValueAtTime(f, t);
            o2.frequency.setValueAtTime(f * (idx % 2 === 0 ? 1.004 : 0.996), t);
            o1.connect(pFilter);
            o2.connect(pFilter);
            o1.start(t);
            o2.start(t);
            o1.stop(t + padDur + 0.04);
            o2.stop(t + padDur + 0.04);
          });
        }

        // 3. Heroic soaring detuned lead melody
        const vLeadNote = victoryLead[vBar][step];
        if (vLeadNote > 0) {
          let holdSteps = 1.6;
          if (step + 1 < 16 && victoryLead[vBar][step + 1] === 0) {
            holdSteps = step + 2 < 16 && victoryLead[vBar][step + 2] === 0 ? 3.2 : 2.1;
          }
          const noteDur = stepDur * holdSteps;
          const l1 = this.ctx.createOscillator();
          const l2 = this.ctx.createOscillator();
          const lFilter = this.ctx.createBiquadFilter();
          const lGain = this.ctx.createGain();
          l1.type = 'sawtooth';
          l2.type = 'sawtooth';
          l1.frequency.setValueAtTime(vLeadNote, t);
          l2.frequency.setValueAtTime(vLeadNote * 1.005, t);
          lFilter.type = 'lowpass';
          lFilter.frequency.setValueAtTime(3600, t);
          lFilter.frequency.exponentialRampToValueAtTime(1300, t + noteDur);
          lFilter.Q.setValueAtTime(1.6, t);
          lGain.gain.setValueAtTime(0.001, t);
          lGain.gain.linearRampToValueAtTime(0.115, t + 0.012);
          lGain.gain.setValueAtTime(0.095, t + noteDur * 0.55);
          lGain.gain.exponentialRampToValueAtTime(0.001, t + noteDur);
          l1.connect(lFilter);
          l2.connect(lFilter);
          lFilter.connect(lGain);
          lGain.connect(this.musicGain);
          l1.start(t);
          l2.start(t);
          l1.stop(t + noteDur + 0.04);
          l2.stop(t + noteDur + 0.04);
        }

        // 4. Sparkling offbeat victory arpeggio
        if (step % 2 === 1) {
          const arpFreq = vc.arp[(Math.floor(step / 2) + vBar) % vc.arp.length];
          const aOsc = this.ctx.createOscillator();
          const aGain = this.ctx.createGain();
          aOsc.type = 'triangle';
          aOsc.frequency.setValueAtTime(arpFreq, t);
          aGain.gain.setValueAtTime(0.001, t);
          aGain.gain.linearRampToValueAtTime(0.06, t + 0.006);
          aGain.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 1.15);
          aOsc.connect(aGain);
          aGain.connect(this.musicGain);
          aOsc.start(t);
          aOsc.stop(t + stepDur * 1.2);
        }

        // 5. Punchy driving synthwave drums
        if (step % 4 === 0 || (vBar % 2 === 1 && step === 14)) {
          const kOsc = this.ctx.createOscillator();
          const kGain = this.ctx.createGain();
          kOsc.type = 'sine';
          kOsc.frequency.setValueAtTime(155, t);
          kOsc.frequency.exponentialRampToValueAtTime(42, t + 0.095);
          kGain.gain.setValueAtTime(step % 4 === 0 ? 0.46 : 0.32, t);
          kGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          kOsc.connect(kGain);
          kGain.connect(this.musicGain);
          kOsc.start(t);
          kOsc.stop(t + 0.13);
        }

        const isFill = vBar === 3 && (step === 13 || step === 15);
        if ((step === 4 || step === 12 || isFill) && this.noiseBuffer) {
          const sb = this.ctx.createOscillator();
          const sbg = this.ctx.createGain();
          sb.type = 'triangle';
          sb.frequency.setValueAtTime(195, t);
          sb.frequency.exponentialRampToValueAtTime(95, t + 0.07);
          sbg.gain.setValueAtTime(isFill ? 0.12 : 0.18, t);
          sbg.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
          sb.connect(sbg);
          sbg.connect(this.musicGain);
          sb.start(t);
          sb.stop(t + 0.09);

          const sn = this.ctx.createBufferSource();
          sn.buffer = this.noiseBuffer;
          const bp = this.ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(2150, t);
          bp.Q.setValueAtTime(0.85, t);
          const sg = this.ctx.createGain();
          sg.gain.setValueAtTime(isFill ? 0.14 : 0.22, t);
          sg.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          sn.connect(bp);
          bp.connect(sg);
          sg.connect(this.musicGain);
          sn.start(t);
          sn.stop(t + 0.13);
        }

        if (this.noiseBuffer && (step % 2 === 1 || step % 4 === 2)) {
          const open = step % 4 === 2;
          const ht = this.ctx.createBufferSource();
          ht.buffer = this.noiseBuffer;
          const hp = this.ctx.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.setValueAtTime(open ? 6600 : 8200, t);
          const hg = this.ctx.createGain();
          hg.gain.setValueAtTime(open ? 0.07 : 0.04, t);
          hg.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.07 : 0.025));
          ht.connect(hp);
          hp.connect(hg);
          hg.connect(this.musicGain);
          ht.start(t);
          ht.stop(t + (open ? 0.075 : 0.03));
        }
      } else {
        // Atmospheric menu pulse in matching E minor palette
        if (step % 4 === 0) {
          const osc = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(barBass, t);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(310, t);
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.2, t + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 1.9);
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.musicGain);
          osc.start(t);
          osc.stop(t + stepDur * 2);
        }
        if (step === 0 || step === 6 || step === 10 || step === 14) {
          const arpNote = chord.arp[step % chord.arp.length] * 0.5;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(arpNote, t);
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.11, t + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 1.8);
          osc.connect(gain);
          gain.connect(this.musicGain);
          osc.start(t);
          osc.stop(t + stepDur * 1.9);
        }
      }

      this.nextNoteTime += stepDur;
      this.stepIndex = (this.stepIndex + 1) % 128;
    }
  }

  private getSfxOut(ctx: AudioContext): AudioNode {
    return this.sfxGain || ctx.destination;
  }

  // PLAYER PULSE BLASTER: Kinetic chest punch + swept dual-osc plasma beam + crisp muzzle crack
  public playShoot() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);
    const pitchVar = 0.97 + Math.random() * 0.06;

    // 1. Tactile low-end recoil punch
    const punch = ctx.createOscillator();
    const punchGain = ctx.createGain();
    punch.type = 'sine';
    punch.frequency.setValueAtTime(195 * pitchVar, now);
    punch.frequency.exponentialRampToValueAtTime(46, now + 0.08);
    punchGain.gain.setValueAtTime(0.32, now);
    punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    punch.connect(punchGain);
    punchGain.connect(out);
    punch.start(now);
    punch.stop(now + 0.095);

    // 2. Dual-oscillator swept energy beam core through resonant filter
    const beamMain = ctx.createOscillator();
    const beamSub = ctx.createOscillator();
    const beamFilter = ctx.createBiquadFilter();
    const beamGain = ctx.createGain();

    beamMain.type = 'sawtooth';
    beamMain.frequency.setValueAtTime(760 * pitchVar, now);
    beamMain.frequency.exponentialRampToValueAtTime(140, now + 0.11);

    beamSub.type = 'square';
    beamSub.frequency.setValueAtTime(380 * pitchVar, now);
    beamSub.frequency.exponentialRampToValueAtTime(88, now + 0.11);

    beamFilter.type = 'lowpass';
    beamFilter.frequency.setValueAtTime(3600, now);
    beamFilter.frequency.exponentialRampToValueAtTime(420, now + 0.11);
    beamFilter.Q.setValueAtTime(2.6, now);

    beamGain.gain.setValueAtTime(0.001, now);
    beamGain.gain.linearRampToValueAtTime(0.18, now + 0.004);
    beamGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    beamMain.connect(beamFilter);
    beamSub.connect(beamFilter);
    beamFilter.connect(beamGain);
    beamGain.connect(out);

    beamMain.start(now);
    beamSub.start(now);
    beamMain.stop(now + 0.125);
    beamSub.stop(now + 0.125);

    // 3. High-tech chamber discharge shimmer
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(1520 * pitchVar, now);
    shimmer.frequency.exponentialRampToValueAtTime(640, now + 0.055);
    shimmerGain.gain.setValueAtTime(0.06, now);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(out);
    shimmer.start(now);
    shimmer.stop(now + 0.065);

    // 4. Crisp supersonic muzzle transient crack
    if (this.noiseBuffer) {
      const snap = ctx.createBufferSource();
      snap.buffer = this.noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(2500, now);
      bp.frequency.exponentialRampToValueAtTime(950, now + 0.035);
      bp.Q.setValueAtTime(1.1, now);
      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0.2, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.036);
      snap.connect(bp);
      bp.connect(snapGain);
      snapGain.connect(out);
      snap.start(now);
      snap.stop(now + 0.04);
    }
  }

  // APEX HEAVY RAILGUN: Deep electromagnetic kick + high-power dual plasma lance + crisp rail snap
  public playHeavyShoot() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);
    const pitchVar = 0.98 + Math.random() * 0.04;

    // 1. Heavy sub-bass electromagnetic thump
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(160 * pitchVar, now);
    sub.frequency.exponentialRampToValueAtTime(34, now + 0.13);
    subGain.gain.setValueAtTime(0.38, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    sub.connect(subGain);
    subGain.connect(out);
    sub.start(now);
    sub.stop(now + 0.15);

    // 2. High-energy harmonic rail discharge
    const main = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const beamGain = ctx.createGain();

    main.type = 'sawtooth';
    main.frequency.setValueAtTime(980 * pitchVar, now);
    main.frequency.exponentialRampToValueAtTime(115, now + 0.16);

    overtone.type = 'square';
    overtone.frequency.setValueAtTime(1480 * pitchVar, now);
    overtone.frequency.exponentialRampToValueAtTime(220, now + 0.14);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4800, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + 0.16);
    filter.Q.setValueAtTime(3.2, now);

    beamGain.gain.setValueAtTime(0.001, now);
    beamGain.gain.linearRampToValueAtTime(0.22, now + 0.005);
    beamGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    main.connect(filter);
    overtone.connect(filter);
    filter.connect(beamGain);
    beamGain.connect(out);

    main.start(now);
    overtone.start(now);
    main.stop(now + 0.18);
    overtone.stop(now + 0.18);

    // 3. Supersonic railgun crack
    if (this.noiseBuffer) {
      const crack = ctx.createBufferSource();
      crack.buffer = this.noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(2900, now);
      bp.frequency.exponentialRampToValueAtTime(800, now + 0.055);
      bp.Q.setValueAtTime(1.4, now);
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(0.26, now);
      cg.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      crack.connect(bp);
      bp.connect(cg);
      cg.connect(out);
      crack.start(now);
      crack.stop(now + 0.065);
    }
  }

  public playWeaponEquip() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);
    [440, 659.25, 880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 3 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.045);
      gain.gain.setValueAtTime(0.11, now + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.14);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.15);
    });
  }

  public playWeaponRevert() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);
    [520, 340].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      gain.gain.setValueAtTime(0.11, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.09);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.1);
    });
  }

  public playArmorDeflect() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(510, now + 0.065);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  // ROBOT CANNON: Tight mechanical rail-pulse punch (clean & menacing, distinct from player)
  public playEnemyFire() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);

    // Punchy low cannon kick body
    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    body.type = 'sine';
    body.frequency.setValueAtTime(360, now);
    body.frequency.exponentialRampToValueAtTime(72, now + 0.085);
    bodyGain.gain.setValueAtTime(0.16, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    body.connect(bodyGain);
    bodyGain.connect(out);
    body.start(now);
    body.stop(now + 0.095);

    // Tight metallic harmonic chirp
    const pulse = ctx.createOscillator();
    const bp = ctx.createBiquadFilter();
    const pulseGain = ctx.createGain();
    pulse.type = 'triangle';
    pulse.frequency.setValueAtTime(640, now);
    pulse.frequency.exponentialRampToValueAtTime(190, now + 0.065);
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(520, now);
    bp.Q.setValueAtTime(2.0, now);
    pulseGain.gain.setValueAtTime(0.11, now);
    pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    pulse.connect(bp);
    bp.connect(pulseGain);
    pulseGain.connect(out);
    pulse.start(now);
    pulse.stop(now + 0.075);

    // Crisp mechanical bolt click
    if (this.noiseBuffer) {
      const click = ctx.createBufferSource();
      click.buffer = this.noiseBuffer;
      const cbp = ctx.createBiquadFilter();
      cbp.type = 'bandpass';
      cbp.frequency.setValueAtTime(1350, now);
      cbp.Q.setValueAtTime(2.2, now);
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.09, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      click.connect(cbp);
      cbp.connect(clickGain);
      clickGain.connect(out);
      click.start(now);
      click.stop(now + 0.035);
    }
  }

  // PLAYER HIT: Clean punchy shield/armor impact thud (no human voice)
  public playPlayerHurt() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.14);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.16);

    if (this.noiseBuffer) {
      const crunch = ctx.createBufferSource();
      crunch.buffer = this.noiseBuffer;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(950, now);
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(0.14, now);
      cg.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
      crunch.connect(lp);
      lp.connect(cg);
      cg.connect(out);
      crunch.start(now);
      crunch.stop(now + 0.08);
    }
  }

  // PLAYER DEFEAT: Dramatic downward power-down tone during death fadeout
  public playPlayerDefeat() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);
    [293.66, 233.08, 174.61, 110.0].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.14);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.72, now + i * 0.14 + 0.25);
      gain.gain.setValueAtTime(0.16, now + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.28);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.3);
    });
  }

  public playReload() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);
    [320, 480, 720].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      gain.gain.setValueAtTime(0.12, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.08);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.09);
    });
  }

  public playEmptyClick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(190, now);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  public playEnemyHit() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.075);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  public playEnemyDefeat() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);
    [340, 480, 660].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.14, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.12);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.13);
    });
  }

  public playBotDoorOpen() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(290, now + 0.14);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playSwitchUnlock() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);
    [440, 587.33, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.16, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.18);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.19);
    });
  }

  public playCoin() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);
    [987.77, 1318.51].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      gain.gain.setValueAtTime(0.15, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.16);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.17);
    });
  }

  public playPickup() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      gain.gain.setValueAtTime(0.14, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.14);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.15);
    });
  }

  // HEALTH PACK: Bright ascending restorative chime + soft bio-recharge shimmer
  public playHealthPickup() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const t = now + i * 0.052;
      const osc = ctx.createOscillator();
      const shimmer = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      shimmer.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      shimmer.frequency.setValueAtTime(freq * 2, t);

      const shimmerGain = ctx.createGain();
      shimmerGain.gain.setValueAtTime(0.05, t);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

      osc.connect(gain);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(out);
      gain.connect(out);

      osc.start(t);
      shimmer.start(t);
      osc.stop(t + 0.25);
      shimmer.stop(t + 0.2);
    });

    // Warm upward bio-shield swell
    const swell = ctx.createOscillator();
    const swellGain = ctx.createGain();
    swell.type = 'sine';
    swell.frequency.setValueAtTime(220, now);
    swell.frequency.exponentialRampToValueAtTime(440, now + 0.22);
    swellGain.gain.setValueAtTime(0.001, now);
    swellGain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    swellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    swell.connect(swellGain);
    swellGain.connect(out);
    swell.start(now);
    swell.stop(now + 0.25);
  }

  public playWallHit() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.045);
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public playJewelleryBlocked() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);
    [330, 261.63].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      gain.gain.setValueAtTime(0.14, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.15);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.16);
    });
  }

  public playFootstep(stepParity: number) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);
    const pitch = stepParity % 2 === 0 ? 1.0 : 0.91;

    // Grounded boot thud
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(112 * pitch, now);
    thud.frequency.exponentialRampToValueAtTime(42, now + 0.065);
    thudGain.gain.setValueAtTime(0.14, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.072);
    thud.connect(thudGain);
    thudGain.connect(out);
    thud.start(now);
    thud.stop(now + 0.076);

    // Subtle stone-tile sole scuff
    if (this.noiseBuffer) {
      const scuff = ctx.createBufferSource();
      scuff.buffer = this.noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(760 * pitch, now);
      bp.Q.setValueAtTime(1.2, now);
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(0.065, now);
      sg.gain.exponentialRampToValueAtTime(0.001, now + 0.038);
      scuff.connect(bp);
      bp.connect(sg);
      sg.connect(out);
      scuff.start(now);
      scuff.stop(now + 0.042);
    }
  }

  public playTreasureVictory(isFinalVictory = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const out = this.getSfxOut(ctx);

    // Triumphant brassy level-complete fanfare melody + celebratory harmony
    const melody = isFinalVictory
      ? [
          { f: 523.25, t: 0, d: 0.14 },
          { f: 659.25, t: 0.12, d: 0.14 },
          { f: 783.99, t: 0.24, d: 0.16 },
          { f: 1046.5, t: 0.38, d: 0.34 },
          { f: 987.77, t: 0.72, d: 0.16 },
          { f: 1046.5, t: 0.88, d: 0.55 },
        ]
      : [
          { f: 523.25, t: 0, d: 0.13 },
          { f: 659.25, t: 0.11, d: 0.13 },
          { f: 783.99, t: 0.22, d: 0.16 },
          { f: 1046.5, t: 0.36, d: 0.48 },
        ];

    melody.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const harm = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      harm.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);
      harm.frequency.setValueAtTime(f * 0.5, now + t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now + t);
      filter.frequency.exponentialRampToValueAtTime(1400, now + t + d);

      gain.gain.setValueAtTime(0.001, now + t);
      gain.gain.linearRampToValueAtTime(0.16, now + t + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

      osc.connect(filter);
      harm.connect(filter);
      filter.connect(gain);
      gain.connect(out);

      osc.start(now + t);
      harm.start(now + t);
      osc.stop(now + t + d + 0.03);
      harm.stop(now + t + d + 0.03);
    });
  }
}

export const soundFX = new SoundFX();
