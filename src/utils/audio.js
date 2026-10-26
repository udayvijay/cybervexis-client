class SoundSynth {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playDiceRoll() {
    this.init();
    const now = this.ctx.currentTime;
    
    // Play a sequence of rapid short clicks that slow down
    const clicksCount = 12;
    let delay = 0;
    
    for (let i = 0; i < clicksCount; i++) {
      // Exponentially increase interval between clicks to simulate slowing down
      delay += 0.04 + (i / clicksCount) * 0.08;
      const clickTime = now + delay;
      
      // Simple transient oscillator click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100 + Math.random() * 800, clickTime);
      osc.frequency.exponentialRampToValueAtTime(10, clickTime + 0.03);
      
      gain.gain.setValueAtTime(0.15, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.01, clickTime + 0.03);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(clickTime);
      osc.stop(clickTime + 0.04);
    }
  }

  playCorrectAnswer() {
    this.init();
    const now = this.ctx.currentTime;
    
    // Play an ascending major chord arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    
    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.08;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(noteTime);
      osc.stop(noteTime + 0.5);
    });
  }

  playWrongAnswer() {
    this.init();
    const now = this.ctx.currentTime;
    
    // Play a low, descending buzzing sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.4);
    
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.5);
  }

  playLevelUnlock() {
    this.init();
    const now = this.ctx.currentTime;
    
    // Triumphant futuristic chime melody
    const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6
    
    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.06;
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, noteTime);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 1.005, noteTime); // detune slightly for chorusing
      
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.15, noteTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.8);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc1.start(noteTime);
      osc2.start(noteTime);
      
      osc1.stop(noteTime + 0.9);
      osc2.stop(noteTime + 0.9);
    });
  }

  playSpinClick() {
    this.init();
    const now = this.ctx.currentTime;
    
    // Short tick sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.015);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.02);
  }

  playSpinWheel(durationMs) {
    this.init();
    const clicksCount = 15;
    const now = this.ctx.currentTime;
    
    // Space clicks out progressively slower over duration
    let delay = 0;
    for (let i = 0; i < clicksCount; i++) {
      const ratio = i / clicksCount;
      // Exponential growth curve for spacing
      delay = (durationMs / 1000) * Math.pow(ratio, 2.5);
      
      const tickTime = now + delay;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000 - ratio * 600, tickTime);
      osc.frequency.exponentialRampToValueAtTime(80, tickTime + 0.015);
      
      gain.gain.setValueAtTime(0.08, tickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, tickTime + 0.015);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(tickTime);
      osc.stop(tickTime + 0.02);
    }
  }
}

export const audioSynth = new SoundSynth();
