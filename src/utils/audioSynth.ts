/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API audio synthesizer for Okinawa Sanshin (沖縄三線)

class SanshinAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private volume: number = 0.8;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  // Pitch frequencies base mapping (C3 = 130.81Hz base for 4本本調子 C-F-C)
  private getNoteFrequency(note: string, basePitchOffsetSemitones: number = 0): number | null {
    const semitoneMap: Record<string, number> = {
      // 男弦 (1st string - Low)
      '合': 0,   // C3
      '乙': 2,   // D3
      '下老': 3, // Eb3
      '老': 4,   // E3

      // 中弦 (2nd string - Mid)
      '四': 5,   // F3
      '上': 6,   // F#3
      '工': 7,   // G3
      '五': 9,   // A3
      '六': 10,  // Bb3

      // 女弦 (3rd string - High)
      '七': 12,  // C4
      '八': 14,  // D4
      '九': 16,  // E4
      '屮': 17,  // F4
      '上六': 17,// F4
      '巾': 19,  // G4
    };

    if (note in semitoneMap) {
      const semitonesFromC3 = semitoneMap[note] + basePitchOffsetSemitones;
      // 130.81 Hz is C3
      return 130.81 * Math.pow(2, semitonesFromC3 / 12);
    }
    return null;
  }

  /**
   * Play a plucked Sanshin note sound
   */
  public playNote(note: string, pitchOffset: number = 0, duration: number = 0.6) {
    const freq = this.getNoteFrequency(note, pitchOffset);
    if (!freq) return;

    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Primary Pluck Oscillator (Sawtooth with snappy decay for snakeskin body resonance)
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      // Sub fundamental (Sine) for bass body resonance
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq, now);

      // Lowpass Filter for Sanshin warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 3.5, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 0.8, now + duration);

      // Gain Envelope (Snappy attack, initial pluck peak, natural decay)
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.4 * this.volume, now + 0.008); // Pluck attack
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Connect nodes
      osc.connect(filter);
      subOsc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + duration + 0.05);
      subOsc.stop(now + duration + 0.05);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  /**
   * Play metronome click
   */
  public playClick(isAccent: boolean = false) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isAccent ? 1200 : 800, now);

      gain.gain.setValueAtTime(0.2 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      console.warn('Metronome click failed:', e);
    }
  }
}

export const sanshinSynth = new SanshinAudioSynthesizer();
